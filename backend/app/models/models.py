from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    openid = Column(String(100), unique=True, nullable=False)
    unionid = Column(String(100))
    nickname = Column(String(100))
    avatar_url = Column(String(500))
    phone = Column(String(20))
    role = Column(String(20), default="user")
    status = Column(String(20), default="active")
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    learning_stats = relationship("UserLearningStats", back_populates="user", uselist=False)
    checkins = relationship("StudyCheckin", back_populates="user")
    mastery_records = relationship("KnowledgeMastery", back_populates="user")
    review_plans = relationship("ReviewPlan", back_populates="user")
    mistake_records = relationship("MistakeRecord", back_populates="user")
    oj_submissions = relationship("OjSubmission", back_populates="user")


class LoginCode(Base):
    __tablename__ = "login_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(6), nullable=False)
    session_id = Column(String(100), nullable=False)
    status = Column(String(20), default="pending")
    openid = Column(String(100))
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_login_codes_code", "code"),
        Index("idx_login_codes_session", "session_id"),
    )


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"))
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    children = relationship("Category", remote_side=[id])
    knowledge_points = relationship("KnowledgePoint", back_populates="category")
    questions = relationship("Question", back_populates="category")


class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    tech_stack = Column(ARRAY(Text), default=list)
    difficulty_level = Column(String(20))
    question_count = Column(Integer, default=0)
    company_tags = Column(ARRAY(Text), default=list)
    sort_order = Column(Integer, default=0)
    has_explanation = Column(Boolean, default=False)
    has_oj_practice = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    category = relationship("Category", back_populates="knowledge_points")
    questions = relationship("KnowledgePointQuestion", back_populates="knowledge_point")
    oj_problems = relationship("OjProblem", back_populates="knowledge_point")
    company_stats = relationship("CompanyKnowledgeStat", back_populates="knowledge_point")
    mastery_records = relationship("KnowledgeMastery", back_populates="knowledge_point")
    review_plans = relationship("ReviewPlan", back_populates="knowledge_point")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    question_type = Column(String(20), default="interview")
    category_id = Column(Integer, ForeignKey("categories.id"))
    difficulty = Column(String(20))
    frequency = Column(Integer, default=0)
    source = Column(String(100))
    oral_answer = Column(Text)
    ref_answer = Column(Text)
    tags = Column(ARRAY(Text), default=list)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="questions")
    knowledge_point_links = relationship("KnowledgePointQuestion", back_populates="question")
    project_links = relationship("ProjectQuestion", back_populates="question")
    mistake_records = relationship("MistakeRecord", back_populates="question")


class KnowledgePointQuestion(Base):
    __tablename__ = "knowledge_point_questions"

    id = Column(Integer, primary_key=True, index=True)
    knowledge_point_id = Column(Integer, ForeignKey("knowledge_points.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))

    knowledge_point = relationship("KnowledgePoint", back_populates="questions")
    question = relationship("Question", back_populates="knowledge_point_links")

    __table_args__ = (
        UniqueConstraint("knowledge_point_id", "question_id"),
    )


class CompanyKnowledgeStat(Base):
    __tablename__ = "company_knowledge_stats"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(100), nullable=False)
    knowledge_point_id = Column(Integer, ForeignKey("knowledge_points.id"))
    question_count = Column(Integer, default=0)
    frequency_score = Column(Integer, default=0)
    updated_at = Column(DateTime, server_default=func.now())

    knowledge_point = relationship("KnowledgePoint", back_populates="company_stats")

    __table_args__ = (
        UniqueConstraint("company_name", "knowledge_point_id"),
    )


class OjProblem(Base):
    __tablename__ = "oj_problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    difficulty = Column(String(20))
    knowledge_point_id = Column(Integer, ForeignKey("knowledge_points.id"))
    init_sql = Column(Text, nullable=False)
    test_cases = Column(JSONB, default=list)
    reference_solution = Column(Text)
    hints = Column(ARRAY(Text), default=list)
    submit_count = Column(Integer, default=0)
    accept_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    knowledge_point = relationship("KnowledgePoint", back_populates="oj_problems")
    submissions = relationship("OjSubmission", back_populates="problem")


class OjSubmission(Base):
    __tablename__ = "oj_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    problem_id = Column(Integer, ForeignKey("oj_problems.id"))
    sql_code = Column(Text, nullable=False)
    status = Column(String(20))
    execute_result = Column(JSONB)
    error_message = Column(Text)
    execution_time_ms = Column(Integer)
    submitted_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="oj_submissions")
    problem = relationship("OjProblem", back_populates="submissions")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    tech_stack = Column(ARRAY(Text), default=list)
    duties = Column(Text)
    highlights = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    question_links = relationship("ProjectQuestion", back_populates="project")


class ProjectQuestion(Base):
    __tablename__ = "project_questions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))

    project = relationship("Project", back_populates="question_links")
    question = relationship("Question", back_populates="project_links")


class AiConfig(Base):
    __tablename__ = "ai_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    model_name = Column(String(100))
    api_url = Column(String(500))
    api_key_enc = Column(Text)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class ImportLog(Base):
    __tablename__ = "import_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_name = Column(String(500))
    file_type = Column(String(20))
    parse_type = Column(String(20))
    total_count = Column(Integer, default=0)
    status = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())


class UserLearningStats(Base):
    __tablename__ = "user_learning_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    total_answered = Column(Integer, default=0)
    total_correct = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    last_study_date = Column(Date)
    mastered_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="learning_stats")


class StudyCheckin(Base):
    __tablename__ = "study_checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    checkin_date = Column(Date, nullable=False)
    question_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="checkins")

    __table_args__ = (
        UniqueConstraint("user_id", "checkin_date"),
    )


class KnowledgeMastery(Base):
    __tablename__ = "knowledge_mastery"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    knowledge_point_id = Column(Integer, ForeignKey("knowledge_points.id"))
    status = Column(String(20), default="learning")
    correct_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    last_study_at = Column(DateTime)
    mastered_at = Column(DateTime)

    user = relationship("User", back_populates="mastery_records")
    knowledge_point = relationship("KnowledgePoint", back_populates="mastery_records")

    __table_args__ = (
        UniqueConstraint("user_id", "knowledge_point_id"),
    )


class ReviewPlan(Base):
    __tablename__ = "review_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    knowledge_point_id = Column(Integer, ForeignKey("knowledge_points.id"))
    priority = Column(Integer, default=5)
    weak_reason = Column(Text)
    scheduled_at = Column(DateTime)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="review_plans")
    knowledge_point = relationship("KnowledgePoint", back_populates="review_plans")


class MistakeRecord(Base):
    __tablename__ = "mistake_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    mistake_count = Column(Integer, default=1)
    consecutive_correct = Column(Integer, default=0)
    last_mistake_at = Column(DateTime, server_default=func.now())
    last_answer_at = Column(DateTime)
    status = Column(String(20), default="active")
    mastered_at = Column(DateTime)
    is_favorite = Column(Boolean, default=False)
    note = Column(Text)

    user = relationship("User", back_populates="mistake_records")
    question = relationship("Question", back_populates="mistake_records")

    __table_args__ = (
        UniqueConstraint("user_id", "question_id"),
    )
