from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.analysis import RegulationFile, AnalysisResult

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/list")
async def get_all_analyses(db: Session = Depends(get_db)):
    try:
        analyses = db.query(AnalysisResult).order_by(
            AnalysisResult.created_at.desc()
        ).all()
        return {
            "status": "success",
            "total": len(analyses),
            "analyses": [a.to_dict() for a in analyses]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/by-edition/{edition}")
async def get_analyses_by_edition(edition: int, db: Session = Depends(get_db)):
    try:
        analyses = db.query(AnalysisResult).filter(
            AnalysisResult.edition == edition
        ).order_by(AnalysisResult.created_at.desc()).all()
        return {
            "status": "success",
            "edition": edition,
            "total": len(analyses),
            "analyses": [a.to_dict() for a in analyses]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/detail/{analysis_id}")
async def get_analysis_detail(analysis_id: str, db: Session = Depends(get_db)):
    try:
        analysis = db.query(AnalysisResult).filter(
            AnalysisResult.id == analysis_id
        ).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다")
        return {
            "status": "success",
            "analysis": analysis.to_dict_with_data()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/file/{file_id:path}")
async def get_analysis_by_file_id(file_id: str, db: Session = Depends(get_db)):
    try:
        analysis = db.query(AnalysisResult).filter(
            AnalysisResult.file_id == file_id
        ).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다")
        file_info = db.query(RegulationFile).filter(
            RegulationFile.file_id == file_id
        ).first()
        return {
            "status": "success",
            "file": file_info.to_dict() if file_info else None,
            "analysis": analysis.to_dict_with_data()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete/{analysis_id}")
async def delete_analysis(analysis_id: str, db: Session = Depends(get_db)):
    try:
        analysis = db.query(AnalysisResult).filter(
            AnalysisResult.id == analysis_id
        ).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다")
        db.delete(analysis)
        db.commit()
        return {"status": "success", "message": "분석이 삭제되었습니다"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
