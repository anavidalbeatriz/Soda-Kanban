import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.db.models import BoardRole, BoardVisibility, NotificationEventType, WorkspaceRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    name: str
    created_at: datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1, max_length=255)
    invite_token: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class RefreshRequest(BaseModel):
    refresh_token: str


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class WorkspaceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    created_at: datetime


class WorkspaceMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    role: WorkspaceRole
    user: UserRead


class BoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    visibility: BoardVisibility = BoardVisibility.TEAM


class BoardUpdate(BaseModel):
    name: str | None = None
    visibility: BoardVisibility | None = None
    position: int | None = None


class BoardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    visibility: BoardVisibility
    position: int
    created_at: datetime


class BoardMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    role: BoardRole
    user: UserRead


class BoardMemberUpdate(BaseModel):
    role: BoardRole


class ListCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    position: int | None = None


class ListUpdate(BaseModel):
    name: str | None = None
    position: int | None = None


class ListRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    board_id: uuid.UUID
    name: str
    position: int


class CardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None
    position: int | None = None


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None
    list_id: uuid.UUID | None = None
    position: int | None = None


class CardMove(BaseModel):
    list_id: uuid.UUID
    position: int


class CardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    list_id: uuid.UUID
    title: str
    description: str | None
    assignee_id: uuid.UUID | None
    due_date: date | None
    position: int
    created_at: datetime
    updated_at: datetime


class CommentCreate(BaseModel):
    content: str = Field(min_length=1)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    card_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    created_at: datetime
    author: UserRead


class AttachmentCreate(BaseModel):
    filename: str
    content_type: str | None = None
    size_bytes: int | None = None


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    card_id: uuid.UUID
    filename: str
    content_type: str | None
    size_bytes: int | None
    created_at: datetime
    download_url: str | None = None


class PresignedUploadResponse(BaseModel):
    upload_url: str
    attachment_id: uuid.UUID
    s3_key: str


class InvitationCreate(BaseModel):
    email: EmailStr | None = None
    board_id: uuid.UUID | None = None


class InvitationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    token: str
    workspace_id: uuid.UUID
    email: str | None
    board_id: uuid.UUID | None
    expires_at: datetime
    invite_url: str


class NotificationPreferenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_type: NotificationEventType
    email_enabled: bool


class NotificationPreferenceUpdate(BaseModel):
    preferences: list[NotificationPreferenceRead]


class BoardDetailRead(BaseModel):
    board: BoardRead
    lists: list[ListRead]
    cards: list[CardRead]
