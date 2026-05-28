from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json
from app.db.database import get_db
from app.models.share import Share
from app.schemas.share import ShareCreate, ShareResponse, ShareDetail

router = APIRouter(prefix="/api/shares", tags=["shares"])

@router.post("/create")
async def create_share(
    payload: ShareCreate,
    db: Session = Depends(get_db)
):
    try:
        share = Share(
            process_name=payload.process_name,
            analysis_data=json.dumps(payload.analysis_data),
            created_by=payload.created_by or "user"
        )
        db.add(share)
        db.commit()
        db.refresh(share)
        
        return {
            "status": "success",
            "share_id": share.id,
            "share_url": f"/share/{share.id}",
            "message": "공유 링크가 생성되었습니다"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/view/{share_id}")
async def view_share(share_id: str, db: Session = Depends(get_db)):
    """
    공유된 분석 결과 조회
    
    Parameters:
    - share_id: 공유 ID
    
    Response:
    - 분석 데이터 (process_name, swim_lanes, raci, decisions 등)
    """
    try:
        share = db.query(Share).filter(Share.id == share_id).first()
        
        if not share:
            raise HTTPException(status_code=404, detail="공유를 찾을 수 없습니다")
        
        analysis_data = json.loads(share.analysis_data)
        
        return {
            "status": "success",
            "share_id": share.id,
            "process_name": share.process_name,
            "analysis": analysis_data,
            "created_at": share.created_at.isoformat(),
            "created_by": share.created_by
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list")
async def list_shares(db: Session = Depends(get_db)):
    """
    생성된 공유 목록 조회
    
    Response:
    - shares: 공유 목록 (최근순)
    """
    try:
        shares = db.query(Share).order_by(Share.created_at.desc()).all()
        
        return {
            "status": "success",
            "shares": [
                {
                    "id": share.id,
                    "process_name": share.process_name,
                    "created_at": share.created_at.isoformat(),
                    "created_by": share.created_by,
                    "share_url": f"/share/{share.id}"
                }
                for share in shares
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
