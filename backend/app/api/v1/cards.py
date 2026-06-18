import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.models import BoardList, Card, NotificationEventType, User
from app.db.session import get_db
from app.schemas import CardCreate, CardMove, CardRead, CardUpdate
from app.services.attachments import notify_user
from app.services.board_events import publish_board_event
from app.services.permissions import get_card_with_board, require_board_write

router = APIRouter(tags=["cards"])


async def _get_board_id_for_list(db: AsyncSession, list_id: uuid.UUID) -> uuid.UUID:
    result = await db.execute(select(BoardList).where(BoardList.id == list_id))
    board_list = result.scalar_one_or_none()
    if not board_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    return board_list.board_id


@router.post("/lists/{list_id}/cards", response_model=CardRead, status_code=status.HTTP_201_CREATED)
async def create_card(
    list_id: uuid.UUID,
    payload: CardCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Card:
    board_id = await _get_board_id_for_list(db, list_id)
    await require_board_write(db, board_id, user)
    if payload.position is None:
        count = await db.execute(
            select(func.count()).select_from(Card).where(Card.list_id == list_id)
        )
        position = count.scalar_one()
    else:
        position = payload.position
    card = Card(
        list_id=list_id,
        title=payload.title,
        description=payload.description,
        assignee_id=payload.assignee_id,
        due_date=payload.due_date,
        position=position,
    )
    db.add(card)
    await db.flush()
    await publish_board_event(
        str(board_id),
        {
            "type": "card.created",
            "card_id": str(card.id),
            "list_id": str(list_id),
            "actor_id": str(user.id),
        },
    )
    if card.assignee_id and card.assignee_id != user.id:
        assignee = await db.get(User, card.assignee_id)
        if assignee:
            await notify_user(
                db,
                assignee,
                NotificationEventType.CARD_ASSIGNED,
                "Card assigned to you",
                f'You were assigned to "{card.title}"',
            )
    return card


@router.get("/cards/{card_id}", response_model=CardRead)
async def get_card(
    card_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Card:
    card = await get_card_with_board(db, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    await require_board_write(db, card.board_list.board_id, user)
    return card


@router.patch("/cards/{card_id}", response_model=CardRead)
async def update_card(
    card_id: uuid.UUID,
    payload: CardUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Card:
    card = await get_card_with_board(db, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    board_id = card.board_list.board_id
    await require_board_write(db, board_id, user)

    previous_assignee = card.assignee_id
    if payload.title is not None:
        card.title = payload.title
    if payload.description is not None:
        card.description = payload.description
    if payload.assignee_id is not None:
        card.assignee_id = payload.assignee_id
    if payload.due_date is not None:
        card.due_date = payload.due_date
    if payload.list_id is not None:
        card.list_id = payload.list_id
    if payload.position is not None:
        card.position = payload.position

    await publish_board_event(
        str(board_id),
        {"type": "card.updated", "card_id": str(card_id), "actor_id": str(user.id)},
    )
    if payload.assignee_id and payload.assignee_id != previous_assignee:
        assignee = await db.get(User, payload.assignee_id)
        if assignee:
            await notify_user(
                db,
                assignee,
                NotificationEventType.CARD_ASSIGNED,
                "Card assigned to you",
                f'You were assigned to "{card.title}"',
            )
    return card


@router.patch("/cards/{card_id}/move", response_model=CardRead)
async def move_card(
    card_id: uuid.UUID,
    payload: CardMove,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Card:
    card = await get_card_with_board(db, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    board_id = card.board_list.board_id
    await require_board_write(db, board_id, user)

    target_list = await db.get(BoardList, payload.list_id)
    if not target_list or target_list.board_id != board_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid target list")

    card.list_id = payload.list_id
    card.position = payload.position
    await publish_board_event(
        str(board_id),
        {
            "type": "card.moved",
            "card_id": str(card_id),
            "list_id": str(payload.list_id),
            "position": payload.position,
            "actor_id": str(user.id),
            "ts": datetime.now(UTC).isoformat(),
        },
    )
    return card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(
    card_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    card = await get_card_with_board(db, card_id)
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    board_id = card.board_list.board_id
    await require_board_write(db, board_id, user)
    await db.delete(card)
    await publish_board_event(
        str(board_id),
        {"type": "card.deleted", "card_id": str(card_id), "actor_id": str(user.id)},
    )
