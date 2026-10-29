from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.api.v1.router import api_router
from app.api.v1.endpoints.health import router as direct_health_router
from app.schemas.common import RootInfoResponse

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup centralized exception handling
setup_exception_handlers(app)

# Root endpoint
@app.get(
    "/",
    response_model=RootInfoResponse,
    summary="Root Information",
    tags=["Root"],
)
def root_info() -> RootInfoResponse:
    return RootInfoResponse(
        project=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        docs_url="/docs",
        redoc_url="/redoc",
        api_v1_prefix=settings.API_V1_STR,
    )


# Mount direct /health as well as versioned /api/v1/health
app.include_router(direct_health_router, tags=["Health"])

# Mount versioned API routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Ensure local media directories exist and mount static file serving
import os
from fastapi.staticfiles import StaticFiles

os.makedirs(os.path.join(settings.MEDIA_DIR, "avatars"), exist_ok=True)
os.makedirs(os.path.join(settings.MEDIA_DIR, "banners"), exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
