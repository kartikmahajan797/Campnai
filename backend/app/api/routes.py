from fastapi import APIRouter
from app.core.config import db
from app.api import chat

router = APIRouter()
router.include_router(chat.router)

@router.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Backend is running"}

@router.get("/health")
async def health_check():
    """Detailed health check, checking DB connection."""
    if db:
        return {"status": "ok", "database": "connected"}
    return {"status": "ok", "database": "disconnected (check credentials)"}
