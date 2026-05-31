from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.analysis import AnalysisResult, AnalysisGroup
from app.services.claude_analyzer import analyze_integration
from datetime import datetime
import json

router = APIRouter(prefix="/api/integration", tags=["integration"])

@router.post("/create")
async def create_integration(
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    여러 분석 결과를 통합 분석
    
    Request:
    {
        "integrated_name": "여신 신청~실행 통합",
        "description": "...",
        "selected_analysis_ids": ["id1", "id2", "id3"],
        "analyses": [...]
    }
    """
    try:
        integrated_name = payload.get("integrated_name")
        description = payload.get("description", "")
        selected_analysis_ids = payload.get("selected_analysis_ids", [])
        category_main = payload.get("category_main", "기타")
        category_mid = payload.get("category_mid", "")
        category_sub = payload.get("category_sub", "")
        
        if not integrated_name:
            raise HTTPException(status_code=400, detail="통합 분석 이름이 필요합니다")
        
        if len(selected_analysis_ids) < 2:
            raise HTTPException(status_code=400, detail="최소 2개 이상의 분석이 필요합니다")
        
        # 선택된 분석들 조회
        analyses = db.query(AnalysisResult).filter(
            AnalysisResult.id.in_(selected_analysis_ids)
        ).all()
        
        if len(analyses) != len(selected_analysis_ids):
            raise HTTPException(status_code=404, detail="일부 분석을 찾을 수 없습니다")
        
        # 분석 데이터 준비
        analyses_data = []
        for analysis in analyses:
            analyses_data.append({
                "edition": analysis.edition,
                "process_name": analysis.process_name,
                "description": analysis.description,
                "swim_lanes": analysis.swim_lanes,
                "raci": analysis.raci,
                "decisions": analysis.decisions
            })
        
        # Claude에 통합 분석 요청
        integrated_result = await analyze_integration(analyses_data, integrated_name)
        
        def replace_null_system_used(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k == 'system_used' and v in [None, 'null', 'None', '', '시스템&수기']:
                        obj[k] = '시스템/수기'
                    elif isinstance(v, (dict, list)):
                        replace_null_system_used(v)
            elif isinstance(obj, list):
                for item in obj:
                    replace_null_system_used(item)
                    
        replace_null_system_used(integrated_result)
        
        # 통합 분석 결과 저장
        analysis_group = AnalysisGroup(
            group_name=integrated_name,
            description=description,
            selected_analysis_ids=selected_analysis_ids,
            integrated_data=integrated_result,
            category_main=category_main,
            category_mid=category_mid,
            category_sub=category_sub
        )
        db.add(analysis_group)
        db.commit()
        
        return {
            "status": "success",
            "integration": {
                "id": analysis_group.id,
                "group_name": analysis_group.group_name,
                "description": analysis_group.description,
                "category_main": analysis_group.category_main,
                "category_mid": analysis_group.category_mid,
                "category_sub": analysis_group.category_sub,
                "analysis_count": len(selected_analysis_ids),
                "created_at": analysis_group.created_at.isoformat(),
                "integrated_data": integrated_result
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"통합 분석 실패: {str(e)}")

@router.get("/list")
async def get_integrations(db: Session = Depends(get_db)):
    """
    저장된 통합 분석 목록 조회
    """
    try:
        integrations = db.query(AnalysisGroup).order_by(
            AnalysisGroup.created_at.desc()
        ).all()
        
        return {
            "status": "success",
            "total": len(integrations),
            "integrations": [i.to_dict() for i in integrations]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/detail/{integration_id}")
async def get_integration_detail(integration_id: str, db: Session = Depends(get_db)):
    """
    통합 분석 상세 조회
    """
    try:
        integration = db.query(AnalysisGroup).filter(
            AnalysisGroup.id == integration_id
        ).first()
        
        if not integration:
            raise HTTPException(status_code=404, detail="통합 분석을 찾을 수 없습니다")
        
        return {
            "status": "success",
            "integration": {
                "id": integration.id,
                "group_name": integration.group_name,
                "description": integration.description,
                "category_main": integration.category_main,
                "category_mid": integration.category_mid,
                "category_sub": integration.category_sub,
                "analysis_count": len(integration.selected_analysis_ids),
                "created_at": integration.created_at.isoformat(),
                "integrated_data": integration.integrated_data
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/delete/{integration_id}")
async def delete_integration(integration_id: str, db: Session = Depends(get_db)):
    """
    통합 분석 삭제
    """
    try:
        integration = db.query(AnalysisGroup).filter(
            AnalysisGroup.id == integration_id
        ).first()
        
        if not integration:
            raise HTTPException(status_code=404, detail="통합 분석을 찾을 수 없습니다")
        
        db.delete(integration)
        db.commit()
        
        return {
            "status": "success",
            "message": "통합 분석이 삭제되었습니다"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
