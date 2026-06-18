import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import (
    Board,
    BoardMember,
    BoardRole,
    BoardVisibility,
    Card,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceRole,
)


async def get_workspace_member(
    db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID
) -> WorkspaceMember | None:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def require_workspace_member(
    db: AsyncSession, workspace_id: uuid.UUID, user: User
) -> WorkspaceMember:
    member = await get_workspace_member(db, workspace_id, user.id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a workspace member")
    return member


async def require_workspace_admin(
    db: AsyncSession, workspace_id: uuid.UUID, user: User
) -> WorkspaceMember:
    member = await require_workspace_member(db, workspace_id, user)
    if member.role not in (WorkspaceRole.OWNER, WorkspaceRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workspace admin required")
    return member


async def get_board(db: AsyncSession, board_id: uuid.UUID) -> Board | None:
    result = await db.execute(select(Board).where(Board.id == board_id))
    return result.scalar_one_or_none()


async def get_board_member(
    db: AsyncSession, board_id: uuid.UUID, user_id: uuid.UUID
) -> BoardMember | None:
    result = await db.execute(
        select(BoardMember).where(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def can_view_board(db: AsyncSession, board: Board, user: User) -> bool:
    if board.visibility == BoardVisibility.PUBLIC:
        return True
    if board.visibility == BoardVisibility.TEAM:
        ws_member = await get_workspace_member(db, board.workspace_id, user.id)
        if ws_member:
            return True
    board_member = await get_board_member(db, board.id, user.id)
    return board_member is not None


async def require_board_view(db: AsyncSession, board_id: uuid.UUID, user: User) -> Board:
    board = await get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    if not await can_view_board(db, board, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view board")
    return board


async def require_board_write(db: AsyncSession, board_id: uuid.UUID, user: User) -> Board:
    board = await require_board_view(db, board_id, user)
    board_member = await get_board_member(db, board_id, user.id)
    if board_member:
        return board
    if board.visibility == BoardVisibility.TEAM:
        await require_workspace_member(db, board.workspace_id, user)
        return board
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify board")


async def require_board_admin(db: AsyncSession, board_id: uuid.UUID, user: User) -> Board:
    board = await require_board_view(db, board_id, user)
    member = await get_board_member(db, board_id, user.id)
    if member and member.role == BoardRole.ADMIN:
        return board
    ws_member = await get_workspace_member(db, board.workspace_id, user.id)
    if ws_member and ws_member.role in (WorkspaceRole.OWNER, WorkspaceRole.ADMIN):
        return board
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Board admin required")


async def get_card_with_board(db: AsyncSession, card_id: uuid.UUID) -> Card | None:
    result = await db.execute(
        select(Card)
        .options(selectinload(Card.board_list))
        .where(Card.id == card_id)
    )
    return result.scalar_one_or_none()


async def get_workspace(db: AsyncSession, workspace_id: uuid.UUID) -> Workspace | None:
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    return result.scalar_one_or_none()
