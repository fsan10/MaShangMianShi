from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class DashboardResponse(BaseModel):
    total_questions: int
    total_knowledge_points: int
    total_companies: int
    knowledge_ranking: List[dict]
    tech_stack_distribution: List[dict]
    difficulty_distribution: dict


class KnowledgeRankingItem(BaseModel):
    rank: int
    name: str
    tech_stack: List[str]
    question_count: int
    difficulty_level: str
    company_distribution: List[str]
    has_explanation: bool
    has_oj_practice: bool


class TechStackItem(BaseModel):
    name: str
    count: int
    percentage: float


class DifficultyItem(BaseModel):
    level: str
    count: int
    percentage: float
