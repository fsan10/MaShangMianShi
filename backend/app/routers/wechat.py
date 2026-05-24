from fastapi import APIRouter

router = APIRouter(prefix="/wechat", tags=["微信"])


@router.get("/config")
async def get_wechat_config():
    return {"app_id": "", "enabled": False}
