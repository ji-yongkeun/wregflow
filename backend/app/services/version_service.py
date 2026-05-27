import hashlib
import json
from typing import Optional
from sqlalchemy.orm import Session
from app.models.version import AnalysisVersion

def calculate_hash(content: str) -> str:
    """파일 내용의 hash 값 계산"""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def save_version(
    db: Session,
    file_id: str,
    analysis_data: dict,
    file_content: str
) -> AnalysisVersion:
    """
    분석 결과를 버전으로 저장
    
    같은 파일이면 버전 증가
    다른 파일이면 버전 1부터 시작
    """
    
    # 파일의 hash 계산
    current_hash = calculate_hash(file_content)
    
    # 같은 파일의 마지막 버전 찾기
    last_version = db.query(AnalysisVersion).filter(
        AnalysisVersion.file_id == file_id
    ).order_by(AnalysisVersion.version.desc()).first()
    
    # 버전 번호 결정
    if last_version and last_version.hash_value == current_hash:
        # 같은 내용 → 새 버전 생성 안 함
        return last_version
    else:
        # 새로운 내용 → 새 버전 생성
        new_version = last_version.version + 1 if last_version else 1
    
    # 새 버전 저장
    version_record = AnalysisVersion(
        file_id=file_id,
        version=new_version,
        process_name=analysis_data.get('process_name', ''),
        analysis_data=analysis_data,
        hash_value=current_hash
    )
    
    db.add(version_record)
    db.commit()
    db.refresh(version_record)
    
    return version_record

def get_file_versions(db: Session, file_id: str) -> list:
    """파일의 모든 버전 조회"""
    versions = db.query(AnalysisVersion).filter(
        AnalysisVersion.file_id == file_id
    ).order_by(AnalysisVersion.version.desc()).all()
    
    return [v.to_dict() for v in versions]

def compare_versions(
    db: Session,
    version_id1: int,
    version_id2: int
) -> dict:
    """
    두 버전 비교
    
    변경사항:
    - Swim Lane 개수 변화
    - RACI 항목 변화
    - 의사결정 포인트 변화
    """
    
    v1 = db.query(AnalysisVersion).filter(
        AnalysisVersion.id == version_id1
    ).first()
    
    v2 = db.query(AnalysisVersion).filter(
        AnalysisVersion.id == version_id2
    ).first()
    
    if not v1 or not v2:
        return {'error': '버전을 찾을 수 없습니다'}
    
    # 변경사항 계산
    changes = {
        'swim_lanes_changed': len(v1.analysis_data.get('swim_lanes', [])) != len(v2.analysis_data.get('swim_lanes', [])),
        'swim_lanes_v1': len(v1.analysis_data.get('swim_lanes', [])),
        'swim_lanes_v2': len(v2.analysis_data.get('swim_lanes', [])),
        
        'raci_changed': len(v1.analysis_data.get('raci', [])) != len(v2.analysis_data.get('raci', [])),
        'raci_v1': len(v1.analysis_data.get('raci', [])),
        'raci_v2': len(v2.analysis_data.get('raci', [])),
        
        'decisions_changed': len(v1.analysis_data.get('decisions', [])) != len(v2.analysis_data.get('decisions', [])),
        'decisions_v1': len(v1.analysis_data.get('decisions', [])),
        'decisions_v2': len(v2.analysis_data.get('decisions', [])),
    }
    
    return {
        'version1': v1.version,
        'version2': v2.version,
        'created_at_v1': v1.created_at.isoformat(),
        'created_at_v2': v2.created_at.isoformat(),
        'changes': changes
    }
