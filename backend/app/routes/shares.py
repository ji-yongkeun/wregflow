from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
import json
from app.db.database import get_db
from app.models.share import Share
from app.schemas.share import ShareCreate, ShareResponse, ShareDetail
from app.services.permission_service import can_share

router = APIRouter(prefix="/api/shares", tags=["shares"])

@router.post("/create")
async def create_share(
    payload: ShareCreate,
    x_user_id: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    분석 결과를 공유하기 위한 링크 생성
    
    Response:
    - share_id: 공유 ID (고유한 UUID)
    - share_url: 공유 링크
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="사용자 인증 필요")
    
    if not can_share(db, x_user_id):
        raise HTTPException(status_code=403, detail="공유 권한이 없습니다")

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
