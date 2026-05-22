from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class UserBase(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None

class UserOut(UserBase):
    id: int
    openid: str
    role: str
    status: str
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QRCodeResponse(BaseModel):
    session_id: str
    qrcode_url: str
    verify_code: str
    expires_in: int
    expires_at: Optional[datetime] = None

class LoginStatusResponse(BaseModel):
    status: str
    message: Optional[str] = None
    token: Optional[str] = None
    user: Optional[UserOut] = None

class TokenResponse(BaseModel):
    token: str
    user: UserOut
