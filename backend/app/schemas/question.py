from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompanyItem(BaseModel):
    name: str
    count: int = 1


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


class QuestionListOut(BaseModel):
    total: int
    items: list[QuestionOut]
