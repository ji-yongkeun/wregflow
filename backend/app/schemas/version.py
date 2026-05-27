from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VersionItem(BaseModel):
    id: int
    version: int
    process_name: str
    created_at: str
    file_id: str
    
    class Config:
        from_attributes = True

class VersionDetail(BaseModel):
    id: int
    version: int
    process_name: str
    analysis_data: dict
    created_at: str
    file_id: str
    
    class Config:
        from_attributes = True

class VersionComparison(BaseModel):
    version1: int
    version2: int
    process_name: str
    changes: dict  # 변경사항
    created_at_v1: str
    created_at_v2: str
