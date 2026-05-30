from sqlalchemy import Column, String, Integer, DateTime, JSON, Text
from app.db.database import Base
from datetime import datetime
import uuid


class RegulationFile(Base):
    __tablename__ = "regulations_files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = Column(String, unique=True, index=True, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer)
    edition = Column(Integer)
    file_category = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'file_id': self.file_id,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'edition': self.edition,
            'file_category': self.file_category,
            'upload_date': self.upload_date.isoformat()
        }


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = Column(String, index=True, nullable=False)
    edition = Column(Integer)
    process_name = Column(String, nullable=False)
    description = Column(Text)
    swim_lanes = Column(JSON)
    raci = Column(JSON)
    decisions = Column(JSON)
    system_interfaces = Column(JSON, nullable=True)
    swim_lanes_count = Column(Integer, default=0)
    raci_count = Column(Integer, default=0)
    decisions_count = Column(Integer, default=0)
    institution = Column(String, default="기타") # deprecated
    category_main = Column(String, default="기타")
    category_mid = Column(String, default="")
    category_sub = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'file_id': self.file_id,
            'edition': self.edition,
            'process_name': self.process_name,
            'description': self.description,
            'institution': self.institution,
            'category_main': self.category_main,
            'category_mid': self.category_mid,
            'category_sub': self.category_sub,
            'swim_lanes_count': self.swim_lanes_count,
            'raci_count': self.raci_count,
            'decisions_count': self.decisions_count,
            'created_at': self.created_at.isoformat()
        }

    def to_dict_with_data(self):
        return {
            'id': self.id,
            'file_id': self.file_id,
            'edition': self.edition,
            'process_name': self.process_name,
            'description': self.description,
            'swim_lanes': self.swim_lanes,
            'raci': self.raci,
            'decisions': self.decisions,
            'system_interfaces': self.system_interfaces,
            'created_at': self.created_at.isoformat()
        }


class AnalysisGroup(Base):
    __tablename__ = "analysis_groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    group_name = Column(String, nullable=False)
    description = Column(Text)
    selected_analysis_ids = Column(JSON)
    integrated_data = Column(JSON)
    institution = Column(String, default="기타") # deprecated
    category_main = Column(String, default="기타")
    category_mid = Column(String, default="")
    category_sub = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'group_name': self.group_name,
            'description': self.description,
            'institution': self.institution,
            'category_main': self.category_main,
            'category_mid': self.category_mid,
            'category_sub': self.category_sub,
            'analysis_count': len(self.selected_analysis_ids) if self.selected_analysis_ids else 0,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
