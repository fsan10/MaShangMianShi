import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import create_jwt_token, get_current_user_id
from app.models.models import User, LoginCode

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login/code")
async def request_login_code(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    code = "".join(random.choices(string.digits, k=6))
    login_code = LoginCode(
        code=code,
        session_id=session_id,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )
    db.add(login_code)
    await db.flush()
    return {"code": code, "expires_in": 300}


@router.get("/login/status")
async def check_login_status(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LoginCode).where(
            LoginCode.session_id == session_id,
        ).order_by(LoginCode.id.desc()).limit(1)
    )
    login_code = result.scalars().first()
    if not login_code:
        return {"status": "not_found"}
    if login_code.expires_at and login_code.expires_at < datetime.utcnow():
        return {"status": "expired"}
    if login_code.status == "used":
        return {"status": "expired"}
    if login_code.status == "scanned":
        return {"status": "scanned"}
    if login_code.status == "success" and login_code.openid:
        user_result = await db.execute(select(User).where(User.openid == login_code.openid))
        user = user_result.scalar_one_or_none()
        if not user:
            user = User(openid=login_code.openid, role="user", status="active")
            db.add(user)
            await db.flush()
            await db.refresh(user)
        user.last_login_at = datetime.utcnow()
        token = create_jwt_token({"sub": str(user.id), "role": "user"})
        return {"status": "success", "token": token, "user_id": user.id}
    return {"status": "scanning", "code": login_code.code}


@router.post("/login/verify")
async def verify_login_code(
    code: str,
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LoginCode).where(
            LoginCode.code == code,
            LoginCode.session_id == session_id,
            LoginCode.status == "pending",
        )
    )
    login_code = result.scalar_one_or_none()
    if not login_code:
        raise HTTPException(status_code=400, detail="验证码无效或已过期")
    if login_code.expires_at and login_code.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="验证码已过期")

    login_code.status = "used"
    openid = login_code.openid or f"temp_{login_code.id}"

    result = await db.execute(select(User).where(User.openid == openid))
    user = result.scalar_one_or_none()
    if not user:
        user = User(openid=openid, role="user", status="active")
        db.add(user)
        await db.flush()
        await db.refresh(user)

    user.last_login_at = datetime.utcnow()
    token = create_jwt_token({"sub": str(user.id), "role": "user"})
    return {"token": token, "user_id": user.id}


@router.post("/logout")
async def logout():
    return {"detail": "已退出登录"}


@router.get("/me")
async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="请先登录")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {
        "id": user.id,
        "nickname": user.nickname,
        "avatar_url": user.avatar_url,
        "role": user.role,
    }
