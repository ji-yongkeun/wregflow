from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # 데이터베이스 연결 URL
    DATABASE_URL: str
    
    # Claude API 키
    CLAUDE_API_KEY: str
    
    # JWT 및 보안 비밀키
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # 서버 실행 설정
    ENV: str = "development"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# 설정을 캐싱하여 싱글톤 패턴으로 제공
@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
