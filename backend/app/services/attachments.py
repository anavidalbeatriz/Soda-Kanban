import logging
import uuid

import boto3
from botocore.exceptions import ClientError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import Attachment, NotificationEventType, NotificationPreference, User
from app.services.permissions import get_card_with_board, require_board_write

logger = logging.getLogger(__name__)
settings = get_settings()


def _s3_client():
    kwargs = {"region_name": settings.aws_region}
    if settings.s3_endpoint_url:
        kwargs["endpoint_url"] = settings.s3_endpoint_url
    return boto3.client("s3", **kwargs)


def _ses_client():
    return boto3.client("ses", region_name=settings.aws_region)


async def create_presigned_upload(
    db: AsyncSession, card_id: uuid.UUID, user: User, filename: str, content_type: str | None
) -> tuple[Attachment, str]:
    card = await get_card_with_board(db, card_id)
    if not card:
        raise ValueError("Card not found")
    await require_board_write(db, card.board_list.board_id, user)

    attachment_id = uuid.uuid4()
    s3_key = f"workspaces/cards/{card_id}/{attachment_id}-{filename}"
    attachment = Attachment(
        id=attachment_id,
        card_id=card_id,
        uploaded_by_id=user.id,
        filename=filename,
        s3_key=s3_key,
        content_type=content_type,
    )
    db.add(attachment)
    await db.flush()

    client = _s3_client()
    upload_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.s3_bucket,
            "Key": s3_key,
            "ContentType": content_type or "application/octet-stream",
        },
        ExpiresIn=settings.presigned_url_expire_seconds,
    )
    return attachment, upload_url


async def create_presigned_download(attachment: Attachment) -> str:
    client = _s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": attachment.s3_key},
        ExpiresIn=settings.presigned_url_expire_seconds,
    )


async def send_email(to_email: str, subject: str, body: str) -> None:
    try:
        _ses_client().send_email(
            Source=settings.ses_from_email,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Text": {"Data": body, "Charset": "UTF-8"}},
            },
        )
    except ClientError:
        logger.exception("Failed to send email to %s", to_email)


async def is_notification_enabled(
    db: AsyncSession, user_id: uuid.UUID, event_type: NotificationEventType
) -> bool:
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == user_id,
            NotificationPreference.event_type == event_type,
        )
    )
    pref = result.scalar_one_or_none()
    return pref.email_enabled if pref else True


async def notify_user(
    db: AsyncSession,
    user: User,
    event_type: NotificationEventType,
    subject: str,
    body: str,
) -> None:
    if await is_notification_enabled(db, user.id, event_type):
        await send_email(user.email, subject, body)


async def ensure_default_notification_preferences(db: AsyncSession, user_id: uuid.UUID) -> None:
    for event_type in NotificationEventType:
        result = await db.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == user_id,
                NotificationPreference.event_type == event_type,
            )
        )
        if not result.scalar_one_or_none():
            db.add(
                NotificationPreference(
                    user_id=user_id,
                    event_type=event_type,
                    email_enabled=True,
                )
            )
