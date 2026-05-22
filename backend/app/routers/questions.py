from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Question, Category, KnowledgePoint, KnowledgePointQuestion, Project, ProjectQuestion
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionOut, QuestionBatchImport, QuestionSearchResult

router = APIRouter(prefix="/questions", tags=["问题管理"])


@router.get("/", response_model=QuestionSearchResult)
async def list_questions(
    question_type: str | None = None,
    category_id: int | None = None,
    difficulty: str | None = None,
    source: str | None = None,
    project_id: int | None = None,
    keyword: str | None = None,
    tags: str | None = None,
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
    if source:
        query = query.where(Question.source == source)
        count_query = count_query.where(Question.source == source)
    if keyword:
        pattern = f"%{keyword}%"
        query = query.where(or_(Question.content.ilike(pattern), Question.oral_answer.ilike(pattern), Question.ref_answer.ilike(pattern)))
        count_query = count_query.where(or_(Question.content.ilike(pattern), Question.oral_answer.ilike(pattern), Question.ref_answer.ilike(pattern)))
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag in tag_list:
            query = query.where(Question.tags.contains([tag]))
            count_query = count_query.where(Question.tags.contains([tag]))
    if project_id:
        query = query.join(ProjectQuestion, ProjectQuestion.question_id == Question.id).where(ProjectQuestion.project_id == project_id)
        count_query = count_query.join(ProjectQuestion, ProjectQuestion.question_id == Question.id).where(ProjectQuestion.project_id == project_id)

    total = await db.scalar(count_query)
    query = query.order_by(Question.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return QuestionSearchResult(total=total or 0, items=items)


@router.get("/{question_id}", response_model=QuestionOut)
async def get_question(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("/", response_model=QuestionOut)
async def create_question(
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    question = Question(**data.model_dump())
    db.add(question)
    await db.flush()
    await db.refresh(question)
    return question


@router.put("/{question_id}", response_model=QuestionOut)
async def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(question, key, value)
    await db.flush()
    await db.refresh(question)
    return question


@router.delete("/{question_id}")
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(question)
    return {"code": 200, "message": "deleted"}


@router.post("/batch-import")
async def batch_import(
    data: QuestionBatchImport,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    created = []
    for item in data.questions:
        question = Question(**item.model_dump())
        db.add(question)
        created.append(question)
    await db.flush()
    return {"code": 200, "message": f"成功导入 {len(created)} 条", "count": len(created)}


@router.get("/categories/list")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.sort_order))
    return result.scalars().all()


@router.get("/sources/list")
async def list_sources(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question.source).distinct().where(Question.source.isnot(None)))
    return [r[0] for r in result.all()]


@router.get("/difficulties/list")
async def list_difficulties(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question.difficulty).distinct().where(Question.difficulty.isnot(None)))
    return [r[0] for r in result.all()]
