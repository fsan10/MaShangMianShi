from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import MistakeRecord, Question
from app.schemas.learning import MistakeRecordOut

router = APIRouter(prefix="/mistakes", tags=["错题本"])


@router.get("/active", response_model=list[MistakeRecordOut])
async def get_active_mistakes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(MistakeRecord)
        .where(MistakeRecord.user_id == user_id, MistakeRecord.status == "active")
        .order_by(MistakeRecord.last_mistake_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/mastered", response_model=list[MistakeRecordOut])
async def get_mastered_mistakes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(MistakeRecord)
        .where(MistakeRecord.user_id == user_id, MistakeRecord.status == "mastered")
        .order_by(MistakeRecord.mastered_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/{mistake_id}/review")
async def review_mistake(
    mistake_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(MistakeRecord).where(MistakeRecord.id == mistake_id, MistakeRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Mistake record not found")
    return {"code": 200, "question_id": record.question_id}


@router.post("/{mistake_id}/remove")
async def remove_mistake(
    mistake_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(MistakeRecord).where(MistakeRecord.id == mistake_id, MistakeRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Mistake record not found")
    await db.delete(record)
    return {"code": 200, "message": "Mistake removed"}


@router.post("/{mistake_id}/favorite")
async def toggle_favorite(
    mistake_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(MistakeRecord).where(MistakeRecord.id == mistake_id, MistakeRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Mistake record not found")
    record.is_favorite = not record.is_favorite
    await db.flush()
    return {"code": 200, "is_favorite": record.is_favorite}


@router.post("/{mistake_id}/rejoin")
async def rejoin_mistake(
    mistake_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(MistakeRecord).where(MistakeRecord.id == mistake_id, MistakeRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Mistake record not found")
    record.status = "active"
    record.consecutive_correct = 0
    record.mastered_at = None
    await db.flush()
    return {"code": 200, "message": "Mistake rejoined"}
