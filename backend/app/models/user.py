from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Boolean
from app.db.database import Base
from datetime import datetime
import enum

class RoleEnum(str, enum.Enum):
    ADMIN = "admin"      # 관리자 (모든 권한)
    EDITOR = "editor"    # 편집자 (분석, 공유, 다운로드)
    VIEWER = "viewer"    # 조회자 (조회, 다운로드만)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.VIEWER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role.value,
            'created_at': self.created_at.isoformat()
        }

class UserPermission(Base):
    __tablename__ = "user_permissions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    permission = Column(String, nullable=False)  # "upload", "analyze", "share", "download"
    granted = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
