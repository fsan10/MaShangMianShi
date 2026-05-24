from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_jwt_token
from app.models.models import Admin
from app.schemas.admin import AdminLoginRequest, AdminLoginResponse, QuestionCreate, QuestionUpdate, QuestionOut
from app.models.models import Question, QuestionCompany, KnowledgePointQuestion
import bcrypt

router = APIRouter(prefix="/admin", tags=["后台管理"])


async def get_admin_id(token: str = Depends(verify_jwt_token)) -> int:
    if token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return token


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(data: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Admin).where(Admin.username == data.username))
    admin = result.scalar_one_or_none()
    if not admin or not bcrypt.checkpw(data.password.encode('utf-8'), admin.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    from app.core.security import create_jwt_token
    token = create_jwt_token({"sub": str(admin.id), "role": "admin"})
    return AdminLoginResponse(token=token, username=admin.username)


@router.get("/questions", response_model=list[QuestionOut])
async def list_questions(
    skip: int = 0,
    limit: int = 20,
    question_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Question)
    if question_type:
        query = query.where(Question.question_type == question_type)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    questions = result.scalars().all()
    items = []
    for q in questions:
        company_result = await db.execute(
            select(QuestionCompany).where(QuestionCompany.question_id == q.id)
        )
        companies = [{"name": c.company_name, "count": c.count} for c in company_result.all()]
        items.append(QuestionOut(
            id=q.id,
            content=q.content,
            question_type=q.question_type,
            category_id=q.category_id,
            difficulty=q.difficulty,
            frequency=q.frequency,
            oral_answer=q.oral_answer,
            ref_answer=q.ref_answer,
            tags=q.tags or [],
            companies=companies,
            created_at=q.created_at,
        ))
    return items


@router.post("/questions", response_model=QuestionOut)
async def create_question(
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
):
    q = Question(
        content=data.content,
        question_type=data.question_type,
        category_id=data.category_id,
        difficulty=data.difficulty,
        frequency=data.frequency,
        oral_answer=data.oral_answer,
        ref_answer=data.ref_answer,
        tags=data.tags,
        created_by=data.admin_id,
    )
    db.add(q)
    await db.flush()
    await db.refresh(q)
    companies = []
    for c in (data.companies or []):
        qc = QuestionCompany(question_id=q.id, company_name=c.name, count=c.count)
        db.add(qc)
        companies.append({"name": c.name, "count": c.count})
    if data.knowledge_point_ids:
        for kp_id in data.knowledge_point_ids:
            db.add(KnowledgePointQuestion(knowledge_point_id=kp_id, question_id=q.id))
    await db.commit()
    return QuestionOut(
        id=q.id,
        content=q.content,
        question_type=q.question_type,
        category_id=q.category_id,
        difficulty=q.difficulty,
        frequency=q.frequency,
        oral_answer=q.oral_answer,
        ref_answer=q.ref_answer,
        tags=q.tags or [],
        companies=companies,
        created_at=q.created_at,
    )


@router.put("/questions/{question_id}", response_model=QuestionOut)
async def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="题目不存在")
    for field, value in data.model_dump(exclude_unset=True, exclude={"companies", "knowledge_point_ids"}).items():
        setattr(q, field, value)
    if data.companies is not None:
        await db.execute(
            QuestionCompany.__table__.delete().where(QuestionCompany.question_id == question_id)
        )
        for c in data.companies:
            db.add(QuestionCompany(question_id=question_id, company_name=c.name, count=c.count))
    if data.knowledge_point_ids is not None:
        await db.execute(
            KnowledgePointQuestion.__table__.delete().where(KnowledgePointQuestion.question_id == question_id)
        )
        for kp_id in data.knowledge_point_ids:
            db.add(KnowledgePointQuestion(knowledge_point_id=kp_id, question_id=question_id))
    await db.flush()
    await db.refresh(q)
    company_result = await db.execute(
        select(QuestionCompany).where(QuestionCompany.question_id == q.id)
    )
    companies = [{"name": c.company_name, "count": c.count} for c in company_result.all()]
    return QuestionOut(
        id=q.id, content=q.content, question_type=q.question_type,
        category_id=q.category_id, difficulty=q.difficulty, frequency=q.frequency,
        oral_answer=q.oral_answer, ref_answer=q.ref_answer, tags=q.tags or [],
        companies=companies, created_at=q.created_at,
    )


@router.delete("/questions/{question_id}")
async def delete_question(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="题目不存在")
    await db.delete(q)
    await db.commit()
    return {"detail": "已删除"}
