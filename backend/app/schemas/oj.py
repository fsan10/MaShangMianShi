from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class OjProblemBase(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    knowledge_point_id: Optional[int] = None
    init_sql: str
    test_cases: List[Any] = []
    reference_solution: Optional[str] = None
    hints: List[str] = []


class OjProblemCreate(OjProblemBase):
    pass


class OjProblemOut(OjProblemBase):
    id: int
    submit_count: int = 0
    accept_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class OjSubmissionCreate(BaseModel):
    sql_code: str


class OjSubmissionOut(BaseModel):
    id: int
    user_id: int
    problem_id: int
    sql_code: str
    status: Optional[str] = None
    execute_result: Optional[Any] = None
    error_message: Optional[str] = None
    execution_time_ms: Optional[int] = None
    submitted_at: datetime

    class Config:
        from_attributes = True
