
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, create_refresh_token, revoke_refresh_token, verify_refresh_token
from app.auth.password import hash_password, verify_password
from app.db.models import User, Workspace, WorkspaceMember, WorkspaceRole
from app.db.session import get_db
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserRead
from app.services.attachments import ensure_default_notification_preferences
from app.services.invitations import redeem_invitation

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    await db.flush()
    await ensure_default_notification_preferences(db, user.id)

    if payload.invite_token:
        invitation = await redeem_invitation(db, payload.invite_token, user)
        if not invitation:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invite token")
    else:
        workspace = Workspace(name=f"{payload.name}'s Workspace", owner_id=user.id)
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

    if not user.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration requires a workspace invitation",
        )

    access_token = create_access_token(user.id)
    refresh_token = await create_refresh_token(db, user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(user.id)
    refresh_token = await create_refresh_token(db, user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = await verify_refresh_token(db, payload.refresh_token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    await revoke_refresh_token(db, payload.refresh_token)
    access_token = create_access_token(user.id)
    new_refresh = await create_refresh_token(db, user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=UserRead.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> None:
    await revoke_refresh_token(db, payload.refresh_token)
