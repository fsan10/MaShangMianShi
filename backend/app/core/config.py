from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "MaShangMianShi"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/mashangmianshi"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/mashangmianshi"

    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    WECHAT_APP_ID: str = ""
    WECHAT_APP_SECRET: str = ""
    WECHAT_TOKEN: str = ""
    WECHAT_ENCODING_AES_KEY: str = ""

    AI_API_URL: str = ""
    AI_API_KEY: str = ""
    AI_MODEL_NAME: str = ""

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
