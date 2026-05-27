from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
from app.db.database import get_db
from app.services.text_extractor import extract_text
from app.services.claude_analyzer import analyze_regulation
from app.services.version_service import save_version
from app.services.permission_service import can_upload, can_analyze

router = APIRouter(prefix="/api/regulations", tags=["regulations"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    x_user_id: str = Header(None),
    db: Session = Depends(get_db)
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="사용자 인증 필요")
    
    if not can_upload(db, x_user_id):
        raise HTTPException(status_code=403, detail="파일 업로드 권한이 없습니다")

    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="파일이 선택되지 않았습니다.")
        
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "status": "success",
            "message": "파일 업로드 성공",
            "filename": file.filename,
            "file_path": str(file_path)
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 저장 중 오류가 발생했습니다: {str(e)}")

@router.post("/analyze")
async def analyze_regulation_file(
    file_id: str,
    x_user_id: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    규정 파일 분석
    - 업로드된 파일의 텍스트 추출
    - Claude AI로 분석
    - Swim Lane, RACI, 의사결정 데이터 반환
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="사용자 인증 필요")
    
    if not can_analyze(db, x_user_id):
        raise HTTPException(status_code=403, detail="분석 권한이 없습니다")

    try:
        file_path = UPLOAD_DIR / file_id
        if not file_path.exists():
            raise FileNotFoundError()
            
        text = extract_text(str(file_path))
        analysis = analyze_regulation(text)
        
        # 버전으로 저장
        version = save_version(
            db=db,
            file_id=file_id,
            analysis_data=analysis,
            file_content=text
        )
        
        return {
            "status": "success",
            "file_id": file_id,
            "analysis": analysis,
            "version": version.version
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list")
def list_files():
    try:
        files = [f.name for f in UPLOAD_DIR.iterdir() if f.is_file()]
        return {
            "status": "success",
            "files": files
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 목록 조회 중 오류가 발생했습니다: {str(e)}")

