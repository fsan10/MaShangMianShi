from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.models import Question, QuestionCompany, KnowledgePoint, KnowledgePointQuestion
from app.schemas.question import QuestionOut, QuestionListOut

router = APIRouter(prefix="/questions", tags=["题目"])


@router.get("/", response_model=QuestionListOut)
async def list_questions(
    question_type: str | None = None,
    category_id: int | None = None,
    difficulty: str | None = None,
    keyword: str | None = None,
    company: str | None = None,
    knowledge_point_id: int | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Question)
    count_query = select(func.count(Question.id))

    if question_type:
        query = query.where(Question.question_type == question_type)
        count_query = count_query.where(Question.question_type == question_type)
    if category_id:
        query = query.where(Question.category_id == category_id)
        count_query = count_query.where(Question.category_id == category_id)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
        count_query = count_query.where(Question.difficulty == difficulty)
    if keyword:
        query = query.where(Question.content.ilike(f"%{keyword}%"))
        count_query = count_query.where(Question.content.ilike(f"%{keyword}%"))
    if company:
        query = query.join(QuestionCompany).where(QuestionCompany.company_name.ilike(f"%{company}%"))
        count_query = count_query.join(QuestionCompany).where(QuestionCompany.company_name.ilike(f"%{company}%"))
    if knowledge_point_id:
        query = query.join(KnowledgePointQuestion).where(KnowledgePointQuestion.knowledge_point_id == knowledge_point_id)
        count_query = count_query.join(KnowledgePointQuestion).where(KnowledgePointQuestion.knowledge_point_id == knowledge_point_id)

    total = await db.scalar(count_query)
    query = query.offset(skip).limit(limit).order_by(Question.frequency.desc())
    result = await db.execute(query)
    questions = result.scalars().all()

    items = []
    for q in questions:
        company_result = await db.execute(
            select(QuestionCompany).where(QuestionCompany.question_id == q.id)
        )
        companies = [{"name": c.company_name, "count": c.count} for c in company_result.all()]
        company_count = sum(c["count"] for c in companies)
        items.append(QuestionOut(
            id=q.id,
            content=q.content,
            question_type=q.question_type,
            category_id=q.category_id,
            difficulty=q.difficulty,
            frequency=company_count,
            oral_answer=q.oral_answer,
            ref_answer=q.ref_answer,
            tags=q.tags or [],
            companies=companies,
            created_at=q.created_at,
        ))

    return QuestionListOut(total=total or 0, items=items)


@router.get("/{question_id}", response_model=QuestionOut)
async def get_question(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="题目不存在")

    company_result = await db.execute(
        select(QuestionCompany).where(QuestionCompany.question_id == q.id)
    )
    companies = [{"name": c.company_name, "count": c.count} for c in company_result.all()]
    company_count = sum(c["count"] for c in companies)

    return QuestionOut(
        id=q.id,
        content=q.content,
        question_type=q.question_type,
        category_id=q.category_id,
        difficulty=q.difficulty,
        frequency=company_count,
        oral_answer=q.oral_answer,
        ref_answer=q.ref_answer,
        tags=q.tags or [],
        companies=companies,
        created_at=q.created_at,
    )


@router.get("/categories/list")
async def list_categories(db: AsyncSession = Depends(get_db)):
    from app.models.models import Category
    result = await db.execute(select(Category).order_by(Category.sort_order))
    return [{"id": c.id, "name": c.name} for c in result.scalars().all()]


@router.get("/difficulties/list")
async def list_difficulties():
    return [{"value": "初阶", "label": "初阶"}, {"value": "中阶", "label": "中阶"}, {"value": "高阶", "label": "高阶"}]
