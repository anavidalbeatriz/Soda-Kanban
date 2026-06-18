from fastapi import APIRouter

from app.api.v1 import attachments, auth, boards, cards, comments, invitations, lists, users, workspaces

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(workspaces.router)
api_router.include_router(boards.router)
api_router.include_router(lists.router)
api_router.include_router(cards.router)
api_router.include_router(comments.router)
api_router.include_router(attachments.router)
api_router.include_router(invitations.router)
