import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.models import BoardList, User
from app.db.session import get_db
from app.schemas import ListCreate, ListRead, ListUpdate
from app.services.board_events import publish_board_event
from app.services.permissions import require_board_write

router = APIRouter(prefix="/boards/{board_id}/lists", tags=["lists"])


@router.get("", response_model=list[ListRead])
async def list_lists(
    board_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BoardList]:
    await require_board_write(db, board_id, user)
    result = await db.execute(
        select(BoardList).where(BoardList.board_id == board_id).order_by(BoardList.position)
    )
    return list(result.scalars().all())


@router.post("", response_model=ListRead, status_code=status.HTTP_201_CREATED)
async def create_list(
    board_id: uuid.UUID,
    payload: ListCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BoardList:
    await require_board_write(db, board_id, user)
    if payload.position is None:
        count = await db.execute(
            select(func.count()).select_from(BoardList).where(BoardList.board_id == board_id)
        )
        position = count.scalar_one()
    else:
        position = payload.position
    board_list = BoardList(board_id=board_id, name=payload.name, position=position)
    db.add(board_list)
    await db.flush()
    await publish_board_event(
        str(board_id),
        {"type": "list.created", "list_id": str(board_list.id), "actor_id": str(user.id)},
    )
    return board_list


@router.patch("/{list_id}", response_model=ListRead)
async def update_list(
    board_id: uuid.UUID,
    list_id: uuid.UUID,
    payload: ListUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BoardList:
    await require_board_write(db, board_id, user)
    result = await db.execute(
        select(BoardList).where(BoardList.id == list_id, BoardList.board_id == board_id)
    )
    board_list = result.scalar_one_or_none()
    if not board_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    if payload.name is not None:
        board_list.name = payload.name
    if payload.position is not None:
        board_list.position = payload.position
    await publish_board_event(
        str(board_id),
        {"type": "list.updated", "list_id": str(list_id), "actor_id": str(user.id)},
    )
    return board_list


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(
    board_id: uuid.UUID,
    list_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await require_board_write(db, board_id, user)
    result = await db.execute(
        select(BoardList).where(BoardList.id == list_id, BoardList.board_id == board_id)
    )
    board_list = result.scalar_one_or_none()
    if not board_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    await db.delete(board_list)
    await publish_board_event(
        str(board_id),
        {"type": "list.deleted", "list_id": str(list_id), "actor_id": str(user.id)},
    )
