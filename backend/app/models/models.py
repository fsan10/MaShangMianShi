from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import ARRAY
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

    checkins = relationship("Checkin", back_populates="user")
    study_records = relationship("StudyRecord", back_populates="user")


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(20), default="admin")
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())


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
    created_at = Column(DateTime, server_default=func.now())

    category = relationship("Category", back_populates="knowledge_points")
    questions = relationship("KnowledgePointQuestion", back_populates="knowledge_point")
    company_stats = relationship("CompanyKnowledgeStat", back_populates="knowledge_point")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    question_type = Column(String(20), default="interview")
    category_id = Column(Integer, ForeignKey("categories.id"))
    difficulty = Column(String(20))
    frequency = Column(Integer, default=0)
    oral_answer = Column(Text)
    ref_answer = Column(Text)
    tags = Column(ARRAY(Text), default=list)
    created_by = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="questions")
    knowledge_point_links = relationship("KnowledgePointQuestion", back_populates="question")
    companies = relationship("QuestionCompany", back_populates="question")


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


class QuestionCompany(Base):
    __tablename__ = "question_companies"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    company_name = Column(String(100), nullable=False)
    count = Column(Integer, default=1)

    question = relationship("Question", back_populates="companies")

    __table_args__ = (
        UniqueConstraint("question_id", "company_name"),
        Index("idx_qc_company_name", "company_name"),
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


class StudyRecord(Base):
    __tablename__ = "study_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    stage = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    next_review_at = Column(Date)
    is_mastered = Column(Boolean, default=False)
    last_study_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="study_records")

    __table_args__ = (
        UniqueConstraint("user_id", "question_id"),
    )


class Checkin(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    checkin_date = Column(Date, nullable=False)
    question_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="checkins")

    __table_args__ = (
        UniqueConstraint("user_id", "checkin_date"),
    )


class ImportLog(Base):
    __tablename__ = "import_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    file_name = Column(String(500))
    file_type = Column(String(20))
    parse_type = Column(String(20))
    total_count = Column(Integer, default=0)
    status = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())
