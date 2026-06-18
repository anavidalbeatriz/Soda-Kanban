import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.db.models import Comment, NotificationEventType, User
from app.db.session import get_db
from app.schemas import CommentCreate, CommentRead
from app.services.attachments import notify_user
from app.services.board_events import publish_board_event
from app.services.permissions import get_card_with_board, require_board_write

router = APIRouter(prefix="/cards/{card_id}/comments", tags=["comments"])


@router.get("", response_model=list[CommentRead])
async def list_comments(
    card_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Comment]:
    card = await get_card_with_board(db, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    await require_board_write(db, card.board_list.board_id, user)
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.card_id == card_id)
        .order_by(Comment.created_at)
    )
    return list(result.scalars().all())


@router.post("", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    card_id: uuid.UUID,
    payload: CommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Comment:
    card = await get_card_with_board(db, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    board_id = card.board_list.board_id
    await require_board_write(db, board_id, user)

    comment = Comment(card_id=card_id, author_id=user.id, content=payload.content)
    db.add(comment)
    await db.flush()
    await db.refresh(comment, ["author"])

    await publish_board_event(
        str(board_id),
        {"type": "comment.created", "card_id": str(card_id), "actor_id": str(user.id)},
    )

    if card.assignee_id and card.assignee_id != user.id:
        assignee = await db.get(User, card.assignee_id)
        if assignee:
            await notify_user(
                db,
                assignee,
                NotificationEventType.COMMENT_ADDED,
                "New comment on your card",
                f'New comment on "{card.title}": {payload.content[:100]}',
            )
    return comment
