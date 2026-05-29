from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
from typing import Optional

# backend/ 디렉토리 기준 .env 경로 (어디서 실행해도 올바르게 찾음)
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_PATH = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    # 데이터베이스 연결 URL
    DATABASE_URL: str
    
    # Gemini API 키 (없으면 None)
    GEMINI_API_KEY: Optional[str] = None
    
    # JWT 및 보안 비밀키
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # 서버 실행 설정
    ENV: str = "development"
    DEBUG: bool = True
    
    class Config:
        env_file = str(ENV_FILE_PATH)
        case_sensitive = False

# 설정을 캐싱하여 싱글톤 패턴으로 제공
@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
