from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import (
    User, UserLearningStats, StudyCheckin, KnowledgeMastery,
    KnowledgePoint, Category, ReviewPlan, MistakeRecord, Question,
)
from app.schemas.learning import (
    ProgressOverview, CheckinRecord, ChapterProgress, RadarData,
    KnowledgeMasteryOut, ReviewPlanOut, MistakeRecordOut,
)

router = APIRouter(prefix="/progress", tags=["学习进度"])


@router.get("/overview", response_model=ProgressOverview)
async def get_progress_overview(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(UserLearningStats).where(UserLearningStats.user_id == user_id)
    )
    stats = result.scalar_one_or_none()
    if not stats:
        return ProgressOverview(
            total_answered=0, total_correct=0, accuracy=0.0,
            streak_days=0, mastered_count=0,
        )
    accuracy = (stats.total_correct / stats.total_answered * 100) if stats.total_answered > 0 else 0.0
    return ProgressOverview(
        total_answered=stats.total_answered,
        total_correct=stats.total_correct,
        accuracy=round(accuracy, 1),
        streak_days=stats.streak_days,
        mastered_count=stats.mastered_count,
    )


@router.get("/checkins", response_model=list[CheckinRecord])
async def get_checkins(
    year: int = Query(default=date.today().year),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    start = date(year, 1, 1)
    end = date(year, 12, 31)
    result = await db.execute(
        select(StudyCheckin)
        .where(
            StudyCheckin.user_id == user_id,
            StudyCheckin.checkin_date >= start,
            StudyCheckin.checkin_date <= end,
        )
        .order_by(StudyCheckin.checkin_date)
    )
    return result.scalars().all()


@router.get("/chapters", response_model=list[ChapterProgress])
async def get_chapter_progress(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    cat_result = await db.execute(select(Category))
    categories = cat_result.scalars().all()

    chapters = []
    for cat in categories:
        total = await db.scalar(
            select(func.count(Question.id)).where(Question.category_id == cat.id)
        ) or 0
        if total == 0:
            continue
        mastered = await db.scalar(
            select(func.count(KnowledgeMastery.id))
            .where(
                KnowledgeMastery.user_id == user_id,
                KnowledgeMastery.status == "mastered",
                KnowledgeMastery.knowledge_point_id.in_(
                    select(KnowledgePoint.id).where(KnowledgePoint.category_id == cat.id)
                ),
            )
        ) or 0
        percentage = round(mastered / total * 100, 1) if total > 0 else 0.0
        chapters.append(
            ChapterProgress(
                category_name=cat.name,
                total_questions=total,
                answered_questions=mastered,
                percentage=percentage,
            )
        )
    return chapters


@router.get("/radar", response_model=list[RadarData])
async def get_radar_data(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    cat_result = await db.execute(select(Category))
    categories = cat_result.scalars().all()

    radar = []
    for cat in categories:
        kp_count = await db.scalar(
            select(func.count(KnowledgePoint.id)).where(KnowledgePoint.category_id == cat.id)
        ) or 0
        if kp_count == 0:
            continue
        mastered = await db.scalar(
            select(func.count(KnowledgeMastery.id))
            .where(
                KnowledgeMastery.user_id == user_id,
                KnowledgeMastery.status == "mastered",
                KnowledgeMastery.knowledge_point_id.in_(
                    select(KnowledgePoint.id).where(KnowledgePoint.category_id == cat.id)
                ),
            )
        ) or 0
        score = round(mastered / kp_count * 100, 1) if kp_count > 0 else 0.0
        radar.append(RadarData(category_name=cat.name, score=score))
    return radar
