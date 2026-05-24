from pydantic import BaseModel
from typing import Optional, List


class DashboardResponse(BaseModel):
    total_questions: int
    total_interview_questions: int
    total_written_questions: int
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
    company_count: int
    company_distribution: List[str]
