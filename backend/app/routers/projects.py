from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Project, ProjectQuestion, Question

router = APIRouter(prefix="/projects", tags=["项目管理"])


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tech_stack: List[str] = []
    duties: Optional[str] = None
    highlights: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    duties: Optional[str] = None
    highlights: Optional[List[str]] = None


class ProjectOut(ProjectCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectQuestionCreate(BaseModel):
    question_ids: List[int]


@router.get("/", response_model=list[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Project).where(Project.user_id == user_id).order_by(Project.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=ProjectOut)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    project = Project(user_id=user_id, **data.model_dump())
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    await db.flush()
    await db.refresh(project)
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    return {"code": 200, "message": "deleted"}


@router.post("/{project_id}/questions")
async def link_questions(
    project_id: int,
    data: ProjectQuestionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    added = 0
    for qid in data.question_ids:
        existing = await db.execute(
            select(ProjectQuestion).where(
                ProjectQuestion.project_id == project_id,
                ProjectQuestion.question_id == qid,
            )
        )
        if not existing.scalar_one_or_none():
            link = ProjectQuestion(project_id=project_id, question_id=qid)
            db.add(link)
            added += 1
    await db.flush()
    return {"code": 200, "message": f"关联 {added} 道题", "count": added}


@router.get("/{project_id}/questions")
async def get_project_questions(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Question)
        .join(ProjectQuestion, ProjectQuestion.question_id == Question.id)
        .where(ProjectQuestion.project_id == project_id)
    )
    return result.scalars().all()


@router.delete("/{project_id}/questions/{question_id}")
async def unlink_question(
    project_id: int,
    question_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(ProjectQuestion).where(
            ProjectQuestion.project_id == project_id,
            ProjectQuestion.question_id == question_id,
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    await db.delete(link)
    return {"code": 200, "message": "unlinked"}


@router.post("/{project_id}/auto-match")
async def auto_match_questions(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tech_stack = project.tech_stack or []
    if not tech_stack:
        return {"code": 200, "message": "项目无技术栈，无法匹配", "matched": 0}

    matched_questions = []
    for tech in tech_stack:
        q_result = await db.execute(
            select(Question).where(Question.tags.contains([tech])).limit(20)
        )
        matched_questions.extend(q_result.scalars().all())

    existing_result = await db.execute(
        select(ProjectQuestion.question_id).where(ProjectQuestion.project_id == project_id)
    )
    existing_ids = set(r[0] for r in existing_result.all())

    added = 0
    seen = set()
    for q in matched_questions:
        if q.id in existing_ids or q.id in seen:
            continue
        seen.add(q.id)
        link = ProjectQuestion(project_id=project_id, question_id=q.id)
        db.add(link)
        added += 1

    await db.flush()
    return {"code": 200, "message": f"自动匹配 {added} 道题", "matched": added}
