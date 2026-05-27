from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.version import AnalysisVersion
from app.services.version_service import (
    get_file_versions,
    compare_versions
)

router = APIRouter(prefix="/api/versions", tags=["versions"])

@router.get("/file/{file_id}")
async def get_versions(file_id: str, db: Session = Depends(get_db)):
    """
    파일의 모든 분석 버전 조회
    
    Parameters:
    - file_id: 파일명
    
    Response:
    - versions: 버전 목록 (최신순)
    """
    try:
        versions = get_file_versions(db, file_id)
        
        return {
            "status": "success",
            "file_id": file_id,
            "versions": versions,
            "total_versions": len(versions)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/detail/{version_id}")
async def get_version_detail(version_id: int, db: Session = Depends(get_db)):
    """
    특정 버전의 상세 분석 결과 조회
    
    Parameters:
    - version_id: 버전 ID
    
    Response:
    - 분석 결과 전체
    """
    try:
        version = db.query(AnalysisVersion).filter(
            AnalysisVersion.id == version_id
        ).first()
        
        if not version:
            raise HTTPException(status_code=404, detail="버전을 찾을 수 없습니다")
        
        return {
            "status": "success",
            "version": version.version,
            "file_id": version.file_id,
            "process_name": version.process_name,
            "analysis": version.analysis_data,
            "created_at": version.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/compare")
async def compare_analysis_versions(
    version_id1: int,
    version_id2: int,
    db: Session = Depends(get_db)
):
    """
    두 버전 비교
    
    Parameters:
    - version_id1: 첫 번째 버전 ID
    - version_id2: 두 번째 버전 ID
    
    Response:
    - 변경사항 상세
    """
    try:
        comparison = compare_versions(db, version_id1, version_id2)
        
        return {
            "status": "success",
            "comparison": comparison
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
