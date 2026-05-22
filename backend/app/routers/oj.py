from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import OjProblem, OjSubmission
from app.schemas.oj import OjProblemCreate, OjProblemOut, OjSubmissionCreate, OjSubmissionOut

router = APIRouter(prefix="/oj", tags=["在线OJ"])


@router.get("/problems", response_model=list[OjProblemOut])
async def list_problems(
    difficulty: str | None = None,
    knowledge_point_id: int | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(OjProblem)
    if difficulty:
        query = query.where(OjProblem.difficulty == difficulty)
    if knowledge_point_id:
        query = query.where(OjProblem.knowledge_point_id == knowledge_point_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/problems/{problem_id}", response_model=OjProblemOut)
async def get_problem(problem_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OjProblem).where(OjProblem.id == problem_id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem


@router.post("/problems", response_model=OjProblemOut)
async def create_problem(
    data: OjProblemCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    problem = OjProblem(**data.model_dump(), created_by=user_id)
    db.add(problem)
    await db.flush()
    await db.refresh(problem)
    return problem


@router.post("/problems/{problem_id}/submit", response_model=OjSubmissionOut)
async def submit_solution(
    problem_id: int,
    data: OjSubmissionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(select(OjProblem).where(OjProblem.id == problem_id))
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    submission = OjSubmission(
        user_id=user_id,
        problem_id=problem_id,
        sql_code=data.sql_code,
        status="pending",
    )
    db.add(submission)
    problem.submit_count = (problem.submit_count or 0) + 1
    await db.flush()
    await db.refresh(submission)
    return submission


@router.get("/problems/{problem_id}/submissions", response_model=list[OjSubmissionOut])
async def list_submissions(
    problem_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(OjSubmission)
        .where(OjSubmission.problem_id == problem_id, OjSubmission.user_id == user_id)
        .order_by(OjSubmission.submitted_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/submissions/{submission_id}", response_model=OjSubmissionOut)
async def get_submission(submission_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OjSubmission).where(OjSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission
