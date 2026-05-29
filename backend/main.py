from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import engine, Base
from app.models.share import Share
from app.models.version import AnalysisVersion
from app.models.user import User, UserPermission, RoleEnum
from app.routes.regulations import router as regulations_router
from app.routes.shares import router as shares_router
from app.routes.versions import router as versions_router
from app.routes.permissions import router as permissions_router
from app.routes.analysis import router as analysis_router
from app.routes.integration import router as integration_router
from app.routes.download import router as download_router

# 애플리케이션 시작 시 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# 테스트용 사용자 초기 시드 데이터 추가
from app.db.database import SessionLocal
db = SessionLocal()
try:
    test_users = [
        {"id": "user-admin-1", "email": "admin@wregflow.com", "name": "관리자 (Admin)", "role": RoleEnum.ADMIN},
        {"id": "user-editor-1", "email": "editor@wregflow.com", "name": "편집자 (Editor)", "role": RoleEnum.EDITOR},
        {"id": "user-viewer-1", "email": "viewer@wregflow.com", "name": "조회자 (Viewer)", "role": RoleEnum.VIEWER},
    ]
    for user_data in test_users:
        existing = db.query(User).filter(User.id == user_data["id"]).first()
        if not existing:
            new_user = User(**user_data)
            db.add(new_user)
    db.commit()
except Exception as e:
    print(f"사용자 초기 데이터 적재 중 오류: {str(e)}")
finally:
    db.close()

# FastAPI 앱 객체 생성
app = FastAPI(
    title="WRegFlow API",
    description="Regulation Process Mapping API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # 기존 분석 결과에서 edition 값이 NULL인 경우 업데이트
    from app.db.database import SessionLocal
    from app.models.analysis import AnalysisResult
    from app.routes.regulations import extract_edition_from_filename
    from sqlalchemy import text
    
    db = SessionLocal()
    try:
        # system_interfaces 컬럼 존재 여부 확인 및 추가 (PostgreSQL)
        try:
            db.execute(text("ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS system_interfaces JSON;"))
            db.commit()
            print("✅ analysis_results 테이블에 system_interfaces 컬럼 검사/추가 완료")
        except Exception as db_err:
            db.rollback()
            print(f"⚠️ system_interfaces 컬럼 추가 중 오류 (무시 가능): {db_err}")

        # edition이 NULL인 분석 결과 찾기
        null_editions = db.query(AnalysisResult).filter(
            AnalysisResult.edition == None
        ).all()
        
        for result in null_editions:
            edition, _ = extract_edition_from_filename(result.file_id)
            result.edition = edition
            db.add(result)
        
        if null_editions:
            db.commit()
            print(f"✅ {len(null_editions)}개 분석의 edition 값 업데이트 완료")
    except Exception as e:
        print(f"❌ Startup 이벤트 오류: {str(e)}")
    finally:
        db.close()


# 라우터 등록
app.include_router(regulations_router)
app.include_router(shares_router)
app.include_router(versions_router)
app.include_router(permissions_router)
app.include_router(analysis_router)
app.include_router(integration_router)
app.include_router(download_router)

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
