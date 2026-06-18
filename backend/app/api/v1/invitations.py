import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.db.models import User
from app.db.session import get_db
from app.schemas import InvitationCreate, InvitationRead
from app.services.invitations import create_invitation, redeem_invitation
from app.services.permissions import require_workspace_admin

router = APIRouter(prefix="/workspaces/{workspace_id}/invitations", tags=["invitations"])
settings = get_settings()


@router.post("", response_model=InvitationRead, status_code=status.HTTP_201_CREATED)
async def create_workspace_invitation(
    workspace_id: uuid.UUID,
    payload: InvitationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InvitationRead:
    await require_workspace_admin(db, workspace_id, user)
    invitation = await create_invitation(
        db,
        workspace_id=workspace_id,
        invited_by=user,
        email=str(payload.email) if payload.email else None,
        board_id=payload.board_id,
    )
    return InvitationRead(
        id=invitation.id,
        token=invitation.token,
        workspace_id=invitation.workspace_id,
        email=invitation.email,
        board_id=invitation.board_id,
        expires_at=invitation.expires_at,
        invite_url=f"{settings.frontend_url}/register?token={invitation.token}",
    )


@router.post("/accept/{token}", status_code=status.HTTP_204_NO_CONTENT)
async def accept_invitation(
    token: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    invitation = await redeem_invitation(db, token, user)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite token")
