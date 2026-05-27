from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import engine, Base

# 애플리케이션 시작 시 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# FastAPI 앱 객체 생성
app = FastAPI(
    title="WRegFlow API",
    description="Regulation Process Mapping API",
    version="0.1.0"
)

# CORS 미들웨어 설정 (프론트엔드 포트 8081 허용 추가)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8090",  # React 개발 서버 포트 (8090)
        "http://localhost:8081",  # React 로컬 개발 서버 포트 (8081)
        "http://localhost:5173",  # React 기본 개발 서버 포트
        "http://49.50.132.167",   # 네이버 클라우드 운영 서버 IP
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 헬스 체크 엔드포인트
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "wregflow",
        "environment": settings.ENV
    }

# 루트 엔드포인트
@app.get("/")
def read_root():
    return {
        "message": "WRegFlow API",
        "version": "0.1.0",
        "docs": "/docs"
    }

# 직접 실행 시 uvicorn으로 백엔드 서버(포트 8001) 구동
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG
    )
