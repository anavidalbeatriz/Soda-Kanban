import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.db.models import User, Workspace, WorkspaceMember, WorkspaceRole
from app.db.session import get_db
from app.schemas import WorkspaceCreate, WorkspaceMemberRead, WorkspaceRead
from app.services.permissions import require_workspace_member

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=list[WorkspaceRead])
async def list_workspaces(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Workspace]:
    if not user.workspace_id:
        return []
    result = await db.execute(select(Workspace).where(Workspace.id == user.workspace_id))
    workspace = result.scalar_one_or_none()
    return [workspace] if workspace else []


@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workspace:
    if user.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User already belongs to a workspace",
        )

    workspace = Workspace(name=payload.name, owner_id=user.id)
    db.add(workspace)
    await db.flush()
    user.workspace_id = workspace.id
    db.add(
        WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role=WorkspaceRole.OWNER,
        )
    )
    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceRead)
async def get_workspace(
    workspace_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workspace:
    await require_workspace_member(db, workspace_id, user)
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return workspace


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberRead])
async def list_members(
    workspace_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[WorkspaceMember]:
    await require_workspace_member(db, workspace_id, user)
    result = await db.execute(
        select(WorkspaceMember)
        .options(selectinload(WorkspaceMember.user))
        .where(WorkspaceMember.workspace_id == workspace_id)
    )
    return list(result.scalars().all())
