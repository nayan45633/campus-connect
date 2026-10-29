from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    posts,
    comments,
    events,
    notices,
    communities,
    notifications,
    profiles,
    media,
)

api_router = APIRouter()

# Register endpoint routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(posts.router, prefix="/posts", tags=["Posts"])
api_router.include_router(comments.router, prefix="/comments", tags=["Comments"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(notices.router, prefix="/notices", tags=["Notices"])
api_router.include_router(communities.router, prefix="/communities", tags=["Communities"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
api_router.include_router(media.router, prefix="/media", tags=["Media"])
