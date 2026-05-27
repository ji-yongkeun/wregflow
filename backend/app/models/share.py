from sqlalchemy import Column, String, DateTime, Text
from app.db.database import Base
from datetime import datetime
import uuid

class Share(Base):
    __tablename__ = "shares"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_data = Column(Text, nullable=False)  # JSON 형식의 분석 데이터
    process_name = Column(String, nullable=False)  # 프로세스 이름
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, default="user")  # 공유한 사람
    
    def to_dict(self):
        return {
            'id': self.id,
            'process_name': self.process_name,
            'created_at': self.created_at.isoformat(),
            'created_by': self.created_by
        }
