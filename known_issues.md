# Known issues

Verified bugs and production limitations in SODA KANBAN. Planned fixes are tracked in [todos.md](todos.md).

| Issue | Impact | Notes |
|-------|--------|-------|
| Avatar storage is ephemeral on ECS | Uploaded profile photos may disappear after redeploy or hit the wrong task | Avatars saved to local disk (`backend/app/services/avatars.py`); ECS Fargate has no persistent volume (`infra/terraform/modules/ecs/main.tf`) |
| Other users' avatars don't display | Assignee/member avatars show initials only | `frontend/src/components/UserAvatar.tsx` always fetches `/users/me/avatar`, not per-user |
| Email invites may silently fail | Invite API returns success even if SES fails | `send_email()` in `backend/app/services/attachments.py` logs errors but does not fail the request; SES sandbox blocks unverified recipients |
| Card attachments have no UI | Feature advertised in README but unusable in app | Backend-only; `frontend/src/components/CardDetailModal.tsx` has no attachment section |
| "Add list" button is non-functional | Users cannot create columns from the board | `frontend/src/components/KanbanBoard.tsx` — button with no handler |
| No archive support | Users can only hard-delete (where API exists) or keep items forever | No `archived` fields or archive routes |
| Attachment delete leaves S3 orphans | Storage leak over time | `delete_attachment` in `backend/app/services/attachments.py` removes DB record only |
| Browser extension console noise | Misleading errors in DevTools | `FrameDoesNotExistError` / message-port errors from extensions, not the app |
