from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class CompanyItem(BaseModel):
    name: str
    count: int = 1


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    username: str


class QuestionCreate(BaseModel):
    content: str
    question_type: str = "interview"
    category_id: Optional[int] = None
    difficulty: Optional[str] = None
    frequency: Optional[int] = 0
    oral_answer: Optional[str] = None
    ref_answer: Optional[str] = None
    tags: Optional[list[str]] = None
    companies: Optional[list[CompanyItem]] = None
    knowledge_point_ids: Optional[list[int]] = None
    admin_id: Optional[int] = None


class QuestionUpdate(BaseModel):
    content: Optional[str] = None
    question_type: Optional[str] = None
    category_id: Optional[int] = None
    difficulty: Optional[str] = None
    frequency: Optional[int] = None
    oral_answer: Optional[str] = None
    ref_answer: Optional[str] = None
    tags: Optional[list[str]] = None
    companies: Optional[list[CompanyItem]] = None
    knowledge_point_ids: Optional[list[int]] = None


class QuestionOut(BaseModel):
    id: int
    content: str
    question_type: str
    category_id: Optional[int] = None
    difficulty: Optional[str] = None
    frequency: Optional[int] = 0
    oral_answer: Optional[str] = None
    ref_answer: Optional[str] = None
    tags: list[str] = []
    companies: list[dict] = []
    created_at: Optional[datetime] = None
