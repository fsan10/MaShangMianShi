from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class StudyRecordCreate(BaseModel):
    question_id: int


class StudyRecordOut(BaseModel):
    id: int
    user_id: int
    question_id: int
    stage: int
    review_count: int
    next_review_at: Optional[date] = None
    is_mastered: bool
    last_study_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class ReviewSubmitRequest(BaseModel):
    correct: bool


class ProgressOut(BaseModel):
    total_studied: int
    mastered: int
    learning: int
    today_review: int
    streak: int


class CheckinOut(BaseModel):
    id: int
    user_id: int
    checkin_date: date
    question_count: int
