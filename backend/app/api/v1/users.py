from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.models import NotificationEventType, NotificationPreference, User
from app.db.session import get_db
from app.schemas import NotificationPreferenceRead, NotificationPreferenceUpdate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.get("/me/notification-preferences", response_model=list[NotificationPreferenceRead])
async def get_notification_preferences(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[NotificationPreferenceRead]:
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user.id)
    )
    prefs = {p.event_type: p for p in result.scalars().all()}
    return [
        NotificationPreferenceRead(
            event_type=event_type,
            email_enabled=prefs[event_type].email_enabled if event_type in prefs else True,
        )
        for event_type in NotificationEventType
    ]


@router.patch("/me/notification-preferences", response_model=list[NotificationPreferenceRead])
async def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[NotificationPreferenceRead]:
    for pref in payload.preferences:
        result = await db.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == user.id,
                NotificationPreference.event_type == pref.event_type,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.email_enabled = pref.email_enabled
        else:
            db.add(
                NotificationPreference(
                    user_id=user.id,
                    event_type=pref.event_type,
                    email_enabled=pref.email_enabled,
                )
            )
    await db.flush()
    return await get_notification_preferences(user, db)
