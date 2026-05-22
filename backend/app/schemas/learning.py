from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class ProgressOverview(BaseModel):
    total_answered: int
    total_correct: int
    accuracy: float
    streak_days: int
    mastered_count: int


class CheckinRecord(BaseModel):
    checkin_date: date
    question_count: int

    class Config:
        from_attributes = True


class ChapterProgress(BaseModel):
    category_name: str
    total_questions: int
    answered_questions: int
    percentage: float


class RadarData(BaseModel):
    category_name: str
    score: float


class KnowledgeMasteryOut(BaseModel):
    id: int
    knowledge_point_id: int
    status: str
    correct_count: int
    total_count: int
    last_study_at: Optional[datetime] = None
    mastered_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewPlanOut(BaseModel):
    id: int
    knowledge_point_id: int
    priority: int
    weak_reason: Optional[str] = None
    status: str
    scheduled_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MistakeRecordOut(BaseModel):
    id: int
    question_id: int
    mistake_count: int
    consecutive_correct: int
    last_mistake_at: Optional[datetime] = None
    last_answer_at: Optional[datetime] = None
    status: str
    is_favorite: bool
    note: Optional[str] = None

    class Config:
        from_attributes = True
