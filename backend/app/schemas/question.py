from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CategoryOut(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgePointOut(BaseModel):
    id: int
    name: str
    category_id: Optional[int] = None
    tech_stack: List[str] = []
    difficulty_level: Optional[str] = None
    question_count: int = 0
    company_tags: List[str] = []
    sort_order: int = 0
    has_explanation: bool = False
    has_oj_practice: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionBase(BaseModel):
    content: str
    question_type: str = "interview"
    category_id: Optional[int] = None
    difficulty: Optional[str] = None
    frequency: int = 0
    source: Optional[str] = None
    oral_answer: Optional[str] = None
    ref_answer: Optional[str] = None
    tags: List[str] = []


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    content: Optional[str] = None
    question_type: Optional[str] = None
    category_id: Optional[int] = None
    difficulty: Optional[str] = None
    frequency: Optional[int] = None
    source: Optional[str] = None
    oral_answer: Optional[str] = None
    ref_answer: Optional[str] = None
    tags: Optional[List[str]] = None


class QuestionOut(QuestionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
