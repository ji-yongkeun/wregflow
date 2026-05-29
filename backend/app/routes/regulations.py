from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
import os
from app.db.database import get_db
from app.services.text_extractor import extract_text
from app.services.claude_analyzer import analyze_regulation
from app.services.version_service import save_version
from app.models.analysis import RegulationFile, AnalysisResult

router = APIRouter(prefix="/api/regulations", tags=["regulations"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    edition: int = Form(None),
    edition_name: str = Form(None),
    db: Session = Depends(get_db)
):

    if not file.filename:
        raise HTTPException(status_code=400, detail="파일이 선택되지 않았습니다.")
        
    ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "txt"}
    file_ext = file.filename.rsplit(".", 1)[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다")

    try:
        # 파일명에 edition 정보 포함 (예: "1_여신공통업무_파일명.docx")
        if edition and edition_name:
            filename = f"{edition}_{edition_name}_{file.filename}"
        else:
            filename = file.filename
            
        file_path = UPLOAD_DIR / filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "status": "success",
            "message": "파일 업로드 성공",
            "filename": filename,
            "original_name": file.filename,
            "edition": edition,
            "edition_name": edition_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 저장 중 오류가 발생했습니다: {str(e)}")

def extract_edition_from_filename(file_id: str) -> tuple:
    """
    파일명에서 편(edition)과 카테고리 추출
    예: "01_여신공통업무.docx" → (1, "여신공통")
    """
    file_id_clean = file_id.replace(".docx", "").replace(".txt", "").replace(".pdf", "").replace(".doc", "")
    
    edition_map = {
        "01": (1, "여신공통"),
        "1편": (1, "여신공통"),
        "02": (2, "가계여신"),
        "2편": (2, "가계여신"),
        "1장": (2, "가계여신"),
        "2장": (2, "가계여신"),
        "3장": (2, "가계여신"),
        "4장": (2, "가계여신"),
        "5장": (2, "가계여신"),
        "6장": (2, "가계여신"),
        "03": (3, "가계여신_과목별"),
        "3편": (3, "가계여신_과목별"),
        "04": (4, "기업여신"),
        "4편": (4, "기업여신"),
        "05": (5, "기업여신_과목별"),
        "5편": (5, "기업여신_과목별"),
        "06": (6, "외환여신"),
        "6편": (6, "외환여신"),
        "07": (7, "여신정리"),
        "7편": (7, "여신정리"),
    }
    
    # 파일명 첫 2글자로 edition 확인
    prefix = file_id_clean[:2]
    
    if prefix in edition_map:
        return edition_map[prefix]
        
    # 기존 가계대출 관련 파일("1장 가계대출총칙" 등)을 위한 예외 매핑
    if any(keyword in file_id_clean for keyword in ["가계대출", "대출상담", "약정서"]):
        return (2, "가계여신")
    
    return (None, None)

@router.post("/analyze")
async def analyze_regulation_file(
    file_id: str,
    edition: int = Query(None),
    edition_name: str = Query(None),
    db: Session = Depends(get_db)
):
    """
    규정 파일 분석
    - 업로드된 파일의 텍스트 추출
    - Claude AI로 분석
    - Swim Lane, RACI, 의사결정 데이터 반환
    """
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

        # 안정적인 edition 추출
        if edition is None:
            edition, file_category = extract_edition_from_filename(file_id)
        else:
            file_category = edition_name

        saved = False
        try:
            existing_file = db.query(RegulationFile).filter(
                RegulationFile.file_id == file_id
            ).first()

            if not existing_file:
                file_size = 0
                try:
                    file_size = os.path.getsize(str(file_path))
                except Exception:
                    pass
                db.add(RegulationFile(
                    file_id=file_id,
                    file_name=file_id.replace("_", " "),
                    file_size=file_size,
                    edition=edition,
                    file_category=file_category
                ))
                db.commit()

            analysis_dict = analysis if isinstance(analysis, dict) else {}
            db.add(AnalysisResult(
                file_id=file_id,
                edition=edition,  # 중요: edition 반드시 저장
                process_name=analysis_dict.get("process_name", ""),
                description=analysis_dict.get("description", ""),
                swim_lanes=analysis_dict.get("swim_lanes", []),
                raci=analysis_dict.get("raci", []),
                decisions=analysis_dict.get("decisions", []),
                system_interfaces=analysis_dict.get("system_interfaces", []),
                swim_lanes_count=len(analysis_dict.get("swim_lanes", [])),
                raci_count=len(analysis_dict.get("raci", [])),
                decisions_count=len(analysis_dict.get("decisions", []))
            ))
            db.commit()
            saved = True
        except Exception as save_err:
            db.rollback()
            print(f"분석 결과 저장 실패: {save_err}")

        return {
            "status": "success",
            "file_id": file_id,
            "analysis": analysis,
            "version": version.version,
            "saved": saved,
            "edition": edition,  # 응답에 포함
            "edition_name": file_category
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

@router.get("/analysis/list")
def get_analysis_results(db: Session = Depends(get_db)):
    """
    저장된 분석 결과 목록 조회
    """
    try:
        # Join with RegulationFile to get file_name
        results = db.query(AnalysisResult, RegulationFile).outerjoin(
            RegulationFile, AnalysisResult.file_id == RegulationFile.file_id
        ).all()
        
        return {
            "status": "success",
            "analyses": [
                {
                    "id": r.AnalysisResult.id,
                    "file_id": r.AnalysisResult.file_id,
                    "file_name": r.RegulationFile.file_name if r.RegulationFile else r.AnalysisResult.file_id,
                    "edition": r.AnalysisResult.edition,
                    "process_name": r.AnalysisResult.process_name,
                    "swim_lanes_count": r.AnalysisResult.swim_lanes_count,
                    "raci_count": r.AnalysisResult.raci_count,
                    "decisions_count": r.AnalysisResult.decisions_count,
                    "created_at": r.AnalysisResult.created_at.isoformat() if hasattr(r.AnalysisResult, 'created_at') else None
                }
                for r in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 결과 조회 실패: {str(e)}")
