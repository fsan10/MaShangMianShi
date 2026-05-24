from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import StudyRecord, Checkin, Question, QuestionCompany
from app.schemas.study import (
    StudyRecordCreate, StudyRecordOut, ReviewSubmitRequest,
    ProgressOut, CheckinOut,
)

router = APIRouter(prefix="/study", tags=["学习巩固"])

EBBINGHAUS_INTERVALS = [1, 3, 7, 15]


@router.get("/records", response_model=list[StudyRecordOut])
async def get_study_records(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="请先登录")
    result = await db.execute(
        select(StudyRecord).where(StudyRecord.user_id == user_id)
    )
    return result.scalars().all()


@router.post("/record", response_model=StudyRecordOut)
async def create_study_record(
    data: StudyRecordCreate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="请先登录")
    result = await db.execute(
        select(StudyRecord).where(
            StudyRecord.user_id == user_id,
            StudyRecord.question_id == data.question_id,
        )
    )
    record = result.scalar_one_or_none()
    if record:
        record.last_study_at = func.now()
        record.review_count += 1
        if record.stage < len(EBBINGHAUS_INTERVALS):
            record.stage += 1
            record.next_review_at = date.today() + timedelta(days=EBBINGHAUS_INTERVALS[record.stage - 1])
        if record.stage >= len(EBBINGHAUS_INTERVALS):
            record.is_mastered = True
    else:
        record = StudyRecord(
            user_id=user_id,
            question_id=data.question_id,
            stage=0,
            review_count=0,
            next_review_at=date.today(),
            is_mastered=False,
            last_study_at=func.now(),
        )
        db.add(record)
    await db.flush()
    await db.refresh(record)

    checkin_result = await db.execute(
        select(Checkin).where(
            Checkin.user_id == user_id,
            Checkin.checkin_date == date.today(),
        )
    )
    checkin = checkin_result.scalar_one_or_none()
    if checkin:
        checkin.question_count += 1
    else:
        db.add(Checkin(user_id=user_id, checkin_date=date.today(), question_count=1))

    await db.commit()
    return record


@router.get("/review", response_model=list[StudyRecordOut])
async def get_review_list(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="请先登录")
    result = await db.execute(
        select(StudyRecord).where(
            StudyRecord.user_id == user_id,
            StudyRecord.is_mastered == False,
            StudyRecord.next_review_at <= date.today(),
        ).order_by(StudyRecord.next_review_at)
    )
    return result.scalars().all()


@router.post("/review/{record_id}", response_model=StudyRecordOut)
async def submit_review(
    record_id: int,
    data: ReviewSubmitRequest,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="请先登录")
    result = await db.execute(
        select(StudyRecord).where(StudyRecord.id == record_id, StudyRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="学习记录不存在")

    record.review_count += 1
    record.last_study_at = func.now()

    if data.correct:
        record.stage += 1
        if record.stage >= len(EBBINGHAUS_INTERVALS):
            record.is_mastered = True
            record.next_review_at = None
        else:
            record.next_review_at = date.today() + timedelta(days=EBBINGHAUS_INTERVALS[record.stage])
    else:
        record.stage = 0
        record.next_review_at = date.today() + timedelta(days=EBBINGHAUS_INTERVALS[0])

    await db.flush()
    await db.refresh(record)
    await db.commit()
    return record


@router.get("/progress", response_model=ProgressOut)
async def get_progress(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="请先登录")
    total = await db.scalar(select(func.count(StudyRecord.id)).where(StudyRecord.user_id == user_id))
    mastered = await db.scalar(
        select(func.count(StudyRecord.id)).where(StudyRecord.user_id == user_id, StudyRecord.is_mastered == True)
    )
    learning = await db.scalar(
        select(func.count(StudyRecord.id)).where(StudyRecord.user_id == user_id, StudyRecord.is_mastered == False)
    )
    today_review = await db.scalar(
        select(func.count(StudyRecord.id)).where(
            StudyRecord.user_id == user_id,
            StudyRecord.is_mastered == False,
            StudyRecord.next_review_at <= date.today(),
        )
    )
    streak = 0
    check_date = date.today()
    while True:
        result = await db.execute(
            select(Checkin).where(Checkin.user_id == user_id, Checkin.checkin_date == check_date)
        )
        if result.scalar_one_or_none():
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    return ProgressOut(
        total_studied=total or 0,
        mastered=mastered or 0,
        learning=learning or 0,
        today_review=today_review or 0,
        streak=streak,
    )


@router.get("/checkins", response_model=list[CheckinOut])
async def get_checkins(
    year: int = date.today().year,
    month: int = date.today().month,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="请先登录")
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)
    result = await db.execute(
        select(Checkin).where(
            Checkin.user_id == user_id,
            Checkin.checkin_date >= start,
            Checkin.checkin_date < end,
        )
    )
    return result.scalars().all()
