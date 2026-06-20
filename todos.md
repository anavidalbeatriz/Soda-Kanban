# TODOs

Track feature work for SODA KANBAN. See [known_issues.md](known_issues.md) for bugs and production limitations.

**Status:** `Done` · `Partial` · `Not started`  
**Priority:** `High` · `Medium` · `Low`

## Feature backlog

| Issue | Status | Priority |
|-------|--------|----------|
| Allow invite via email | Partial — API + admin UI exist; delivery depends on SES config | High |
| Allow attach files to cards | Done | High |
| Allow edit board | Partial — visibility edit works; rename, list CRUD, and member management are backend-only | Medium |
| Allow edit workspace | Not started — no workspace update API; names are read-only in UI | Medium |
| Allow archiving workspaces, cards, and boards | Not started — no archive model or routes | Medium |
| Allow deleting workspaces, cards, and boards | Done | Medium |

## Suggested follow-ups

| Issue | Status | Priority |
|-------|--------|----------|
| Persist avatars to S3 instead of ECS local disk | Not started | High |
| SES production access + verified sender for outbound email | Partial | High |
| Board rename UI (wire existing `boardApi.update`) | Not started | Medium |
| List create / rename / delete UI (backend CRUD exists) | Not started | Medium |
| Workspace rename API + UI | Not started | Medium |
| Existing-user invite acceptance (API exists; no frontend) | Not started | Medium |
| Board-scoped invite links from UI (API supports `board_id`; UI does not pass it) | Not started | Low |
