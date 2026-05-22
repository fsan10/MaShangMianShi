import hashlib
import random
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import create_jwt_token, get_current_user_id
from app.models.models import User, LoginCode
from app.schemas.auth import QRCodeResponse, LoginStatusResponse, UserOut, TokenResponse
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["认证"])


async def _get_or_create_user(db: AsyncSession, openid: str) -> User:
    result = await db.execute(select(User).where(User.openid == openid))
    user = result.scalar_one_or_none()
    if not user:
        user = User(openid=openid, nickname="微信用户", role="user", status="active")
        db.add(user)
        await db.flush()
    user.last_login_at = datetime.utcnow()
    return user


@router.post("/login/qrcode", response_model=QRCodeResponse)
async def get_login_qrcode(db: AsyncSession = Depends(get_db)):
    code = "".join([str(random.randint(0, 9)) for _ in range(6)])
    session_id = hashlib.md5(f"{code}{datetime.utcnow().timestamp()}".encode()).hexdigest()

    qrcode_url = f"https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket={session_id}"

    expires_at = datetime.utcnow() + timedelta(minutes=5)
    login_code = LoginCode(
        code=code,
        session_id=session_id,
        status="pending",
        expires_at=expires_at,
    )
    db.add(login_code)

    return QRCodeResponse(
        session_id=session_id,
        qrcode_url=qrcode_url,
        verify_code=code,
        expires_in=300,
        expires_at=expires_at,
    )


@router.get("/login/status", response_model=LoginStatusResponse)
async def check_login_status(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LoginCode).where(LoginCode.session_id == session_id))
    login_code = result.scalar_one_or_none()

    if not login_code:
        return LoginStatusResponse(status="invalid", message="无效的会话")

    if login_code.status == "used" and login_code.openid:
        user = await _get_or_create_user(db, login_code.openid)
        token = create_jwt_token(user.id)
        return LoginStatusResponse(
            status="success",
            token=token,
            user=UserOut.model_validate(user),
        )

    if login_code.expires_at < datetime.utcnow():
        return LoginStatusResponse(status="expired", message="验证码已过期，请刷新")

    return LoginStatusResponse(status="pending", message="等待扫码...")


@router.post("/logout")
async def logout():
    return {"code": 200, "message": "success"}


@router.get("/me", response_model=UserOut)
async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)
