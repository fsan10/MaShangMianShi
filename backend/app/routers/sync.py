from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, Any

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import User

router = APIRouter(prefix="/sync", tags=["云端同步"])


class SyncUploadRequest(BaseModel):
    data: dict


class SyncUploadResponse(BaseModel):
    code: int
    message: str


class SyncDownloadResponse(BaseModel):
    code: int
    data: Optional[dict] = None


@router.post("/upload", response_model=SyncUploadResponse)
async def upload_local_data(
    request: SyncUploadRequest,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.core.database import engine
    from sqlalchemy import text

    async with engine.begin() as conn:
        await conn.execute(
            text(
                "INSERT INTO user_sync_data (user_id, data, updated_at) "
                "VALUES (:uid, :data::jsonb, NOW()) "
                "ON CONFLICT (user_id) DO UPDATE SET data = :data::jsonb, updated_at = NOW()"
            ),
            {"uid": user_id, "data": __import__("json").dumps(request.data, ensure_ascii=False)},
        )

    return SyncUploadResponse(code=200, message="同步成功")


@router.get("/download", response_model=SyncDownloadResponse)
async def download_cloud_data(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    from app.core.database import engine
    from sqlalchemy import text

    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT data FROM user_sync_data WHERE user_id = :uid"),
            {"uid": user_id},
        )
        row = result.fetchone()

    if row:
        return SyncDownloadResponse(code=200, data=row[0])
    return SyncDownloadResponse(code=200, data=None)
