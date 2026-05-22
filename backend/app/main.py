from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    auth_router,
    questions_router,
    stats_router,
    oj_router,
    progress_router,
    review_router,
    mistakes_router,
    wechat_router,
)
from app.routers.sync import router as sync_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(questions_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")
app.include_router(oj_router, prefix="/api/v1")
app.include_router(progress_router, prefix="/api/v1")
app.include_router(review_router, prefix="/api/v1")
app.include_router(mistakes_router, prefix="/api/v1")
app.include_router(wechat_router, prefix="/api/v1")
app.include_router(sync_router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
