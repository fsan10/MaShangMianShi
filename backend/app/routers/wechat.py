import xml.etree.ElementTree as ET
from datetime import datetime

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import LoginCode, User

router = APIRouter(prefix="/wechat", tags=["微信公众号"])


@router.post("/callback")
async def wechat_callback(request: Request, db: AsyncSession = Depends(get_db)):
    xml_data = await request.body()
    try:
        root = ET.fromstring(xml_data)
        openid = root.find("FromUserName").text
        content = root.find("Content").text.strip() if root.find("Content") is not None else ""
    except Exception:
        return Response(content="error", media_type="text/plain")

    if len(content) == 6 and content.isdigit():
        result = await db.execute(
            select(LoginCode).where(
                LoginCode.code == content,
                LoginCode.status == "pending",
                LoginCode.expires_at > datetime.utcnow(),
            )
        )
        login_code = result.scalar_one_or_none()

        if login_code:
            login_code.status = "used"
            login_code.openid = openid

            user_result = await db.execute(select(User).where(User.openid == openid))
            user = user_result.scalar_one_or_none()
            if not user:
                user = User(openid=openid, nickname="微信用户", role="user", status="active")
                db.add(user)

            await db.flush()
            return _make_text_response(openid, "登录成功！欢迎来到面试题库~")
        else:
            return _make_text_response(openid, "验证码无效或已过期，请重新获取")

    return _make_text_response(
        openid,
        "欢迎关注面试题库！\n请发送登录页面显示的 6 位验证码完成登录。",
    )


@router.get("/callback")
async def wechat_verify(
    signature: str,
    timestamp: str,
    nonce: str,
    echostr: str,
):
    return Response(content=echostr, media_type="text/plain")


def _make_text_response(to_user: str, content: str) -> Response:
    xml = f"""<xml>
<ToUserName><![CDATA[{to_user}]]></ToUserName>
<FromUserName><![CDATA[公众号]]></FromUserName>
<CreateTime>{int(datetime.utcnow().timestamp())}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[{content}]]></Content>
</xml>"""
    return Response(content=xml, media_type="application/xml")
