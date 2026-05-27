from sqlalchemy import Column, String, Integer, DateTime, JSON
from app.db.database import Base
from datetime import datetime

class AnalysisVersion(Base):
    __tablename__ = "analysis_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, nullable=False)  # 업로드된 파일명
    version = Column(Integer, nullable=False, default=1)  # 버전 번호
    process_name = Column(String, nullable=False)
    analysis_data = Column(JSON, nullable=False)  # 분석 결과 (JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    hash_value = Column(String, nullable=False)  # 규정 내용의 hash (변경 감지)
    
    def to_dict(self):
        return {
            'id': self.id,
            'version': self.version,
            'process_name': self.process_name,
            'created_at': self.created_at.isoformat(),
            'file_id': self.file_id
        }
