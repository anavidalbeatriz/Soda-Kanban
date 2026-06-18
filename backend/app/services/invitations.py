import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import (
    BoardMember,
    BoardRole,
    Invitation,
    User,
    WorkspaceMember,
    WorkspaceRole,
)
from app.services.attachments import send_email

logger = logging.getLogger(__name__)
settings = get_settings()


async def create_invitation(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    invited_by: User,
    email: str | None = None,
    board_id: uuid.UUID | None = None,
) -> Invitation:
    token = uuid.uuid4().hex
    invitation = Invitation(
        token=token,
        workspace_id=workspace_id,
        invited_by_id=invited_by.id,
        email=email,
        board_id=board_id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    db.add(invitation)
    await db.flush()

    if email:
        invite_url = f"{settings.frontend_url}/register?token={token}"
        await send_email(
            email,
            "You are invited to SODA KANBA",
            f"Join your team: {invite_url}",
        )

    return invitation


async def redeem_invitation(db: AsyncSession, token: str, user: User) -> Invitation | None:
    result = await db.execute(select(Invitation).where(Invitation.token == token))
    invitation = result.scalar_one_or_none()
    if not invitation or invitation.accepted_at or invitation.expires_at < datetime.now(UTC):
        return None

    existing = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == invitation.workspace_id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if not existing.scalar_one_or_none():
        db.add(
            WorkspaceMember(
                workspace_id=invitation.workspace_id,
                user_id=user.id,
                role=WorkspaceRole.MEMBER,
            )
        )

    if invitation.board_id:
        board_member = await db.execute(
            select(BoardMember).where(
                BoardMember.board_id == invitation.board_id,
                BoardMember.user_id == user.id,
            )
        )
        if not board_member.scalar_one_or_none():
            db.add(
                BoardMember(
                    board_id=invitation.board_id,
                    user_id=user.id,
                    role=BoardRole.COLLABORATOR,
                )
            )

    invitation.accepted_at = datetime.now(UTC)
    await db.flush()
    return invitation
