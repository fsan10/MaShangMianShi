from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import (
    KnowledgePoint, KnowledgeMastery, ReviewPlan, Category,
)
from app.schemas.learning import ReviewPlanOut, KnowledgeMasteryOut

router = APIRouter(prefix="/review", tags=["巩固功能"])


@router.get("/knowledge-points")
async def get_knowledge_points_for_review(
    category_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    query = select(KnowledgePoint)
    if category_id:
        query = query.where(KnowledgePoint.category_id == category_id)
    result = await db.execute(query.order_by(KnowledgePoint.question_count.desc()))
    knowledge_points = result.scalars().all()

    items = []
    for kp in knowledge_points:
        mastery_result = await db.execute(
            select(KnowledgeMastery).where(
                KnowledgeMastery.user_id == user_id,
                KnowledgeMastery.knowledge_point_id == kp.id,
            )
        )
        mastery = mastery_result.scalar_one_or_none()
        items.append({
            "id": kp.id,
            "name": kp.name,
            "tech_stack": kp.tech_stack or [],
            "question_count": kp.question_count,
            "difficulty_level": kp.difficulty_level,
            "mastery_status": mastery.status if mastery else "not_started",
            "correct_count": mastery.correct_count if mastery else 0,
            "total_count": mastery.total_count if mastery else 0,
            "percentage": round(mastery.correct_count / mastery.total_count * 100, 1)
            if mastery and mastery.total_count > 0
            else 0.0,
        })
    return items


@router.post("/start")
async def start_review(
    knowledge_point_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    plan = ReviewPlan(
        user_id=user_id,
        knowledge_point_id=knowledge_point_id,
        status="pending",
    )
    db.add(plan)
    await db.flush()
    return {"code": 200, "message": "Review started", "plan_id": plan.id}


@router.get("/weak-points", response_model=list[ReviewPlanOut])
async def get_weak_points(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(ReviewPlan)
        .where(ReviewPlan.user_id == user_id, ReviewPlan.status == "pending")
        .order_by(ReviewPlan.priority.desc())
    )
    return result.scalars().all()


@router.post("/complete")
async def complete_review(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(ReviewPlan).where(ReviewPlan.id == plan_id, ReviewPlan.user_id == user_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Review plan not found")
    plan.status = "completed"
    await db.flush()
    return {"code": 200, "message": "Review completed"}
