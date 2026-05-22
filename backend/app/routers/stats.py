from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.models import (
    Question, KnowledgePoint, Category, CompanyKnowledgeStat,
)
from app.schemas.stats import DashboardResponse, KnowledgeRankingItem, TechStackItem

router = APIRouter(prefix="/stats", tags=["统计大盘"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    total_questions = await db.scalar(select(func.count(Question.id)))
    total_kp = await db.scalar(select(func.count(KnowledgePoint.id)))
    total_companies = await db.scalar(
        select(func.count(func.distinct(CompanyKnowledgeStat.company_name)))
    )

    ranking_result = await db.execute(
        select(KnowledgePoint).order_by(KnowledgePoint.question_count.desc()).limit(20)
    )
    knowledge_points = ranking_result.scalars().all()

    knowledge_ranking = []
    for idx, kp in enumerate(knowledge_points, 1):
        company_result = await db.execute(
            select(CompanyKnowledgeStat.company_name, CompanyKnowledgeStat.question_count)
            .where(CompanyKnowledgeStat.knowledge_point_id == kp.id)
            .order_by(CompanyKnowledgeStat.question_count.desc())
        )
        companies = company_result.all()
        knowledge_ranking.append(
            KnowledgeRankingItem(
                rank=idx,
                name=kp.name,
                tech_stack=kp.tech_stack or [],
                question_count=kp.question_count,
                difficulty_level=kp.difficulty_level or "未分级",
                company_distribution=[c[0] for c in companies],
                has_explanation=kp.has_explanation,
                has_oj_practice=kp.has_oj_practice,
            ).model_dump()
        )

    tech_result = await db.execute(
        select(KnowledgePoint.tech_stack, func.sum(KnowledgePoint.question_count))
        .group_by(KnowledgePoint.tech_stack)
    )
    tech_data = tech_result.all()
    tech_map: dict[str, int] = {}
    for row in tech_data:
        for ts in (row[0] or []):
            tech_map[ts] = tech_map.get(ts, 0) + (row[1] or 0)
    total_tech = sum(tech_map.values()) or 1
    tech_stack_distribution = [
        TechStackItem(name=k, count=v, percentage=round(v / total_tech * 100, 1)).model_dump()
        for k, v in sorted(tech_map.items(), key=lambda x: x[1], reverse=True)
    ]

    diff_result = await db.execute(
        select(KnowledgePoint.difficulty_level, func.sum(KnowledgePoint.question_count))
        .group_by(KnowledgePoint.difficulty_level)
    )
    diff_data = diff_result.all()
    total_diff = sum(r[1] or 0 for r in diff_data) or 1
    difficulty_distribution = {
        r[0] or "未分级": r[1] or 0 for r in diff_data
    }

    return DashboardResponse(
        total_questions=total_questions or 0,
        total_knowledge_points=total_kp or 0,
        total_companies=total_companies or 0,
        knowledge_ranking=knowledge_ranking,
        tech_stack_distribution=tech_stack_distribution,
        difficulty_distribution=difficulty_distribution,
    )


@router.get("/knowledge-points", response_model=list[KnowledgeRankingItem])
async def get_knowledge_ranking(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgePoint).order_by(KnowledgePoint.question_count.desc()).offset(skip).limit(limit)
    )
    knowledge_points = result.scalars().all()
    items = []
    for idx, kp in enumerate(knowledge_points, skip + 1):
        company_result = await db.execute(
            select(CompanyKnowledgeStat.company_name)
            .where(CompanyKnowledgeStat.knowledge_point_id == kp.id)
        )
        companies = [r[0] for r in company_result.all()]
        items.append(
            KnowledgeRankingItem(
                rank=idx,
                name=kp.name,
                tech_stack=kp.tech_stack or [],
                question_count=kp.question_count,
                difficulty_level=kp.difficulty_level or "未分级",
                company_distribution=companies,
                has_explanation=kp.has_explanation,
                has_oj_practice=kp.has_oj_practice,
            )
        )
    return items


@router.get("/tech-stack")
async def get_tech_stack_distribution(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(KnowledgePoint.tech_stack, func.sum(KnowledgePoint.question_count))
        .group_by(KnowledgePoint.tech_stack)
    )
    tech_map: dict[str, int] = {}
    for row in result.all():
        for ts in (row[0] or []):
            tech_map[ts] = tech_map.get(ts, 0) + (row[1] or 0)
    total = sum(tech_map.values()) or 1
    return [
        {"name": k, "count": v, "percentage": round(v / total * 100, 1)}
        for k, v in sorted(tech_map.items(), key=lambda x: x[1], reverse=True)
    ]


@router.get("/difficulty-levels")
async def get_difficulty_distribution(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(KnowledgePoint.difficulty_level, func.sum(KnowledgePoint.question_count))
        .group_by(KnowledgePoint.difficulty_level)
    )
    return {r[0] or "未分级": r[1] or 0 for r in result.all()}


@router.get("/company-distribution")
async def get_company_distribution(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            CompanyKnowledgeStat.company_name,
            func.sum(CompanyKnowledgeStat.question_count),
        )
        .group_by(CompanyKnowledgeStat.company_name)
        .order_by(func.sum(CompanyKnowledgeStat.question_count).desc())
    )
    return [{"company": r[0], "count": r[1]} for r in result.all()]
