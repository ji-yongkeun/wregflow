from pydantic import BaseModel
from typing import Optional

class ShareCreate(BaseModel):
    process_name: str
    analysis_data: dict  # 분석 데이터 (JSON)
    created_by: Optional[str] = "user"

class ShareResponse(BaseModel):
    id: str
    process_name: str
    created_at: str
    created_by: str
    
    class Config:
        from_attributes = True

class ShareDetail(BaseModel):
    id: str
    process_name: str
    analysis_data: dict
    created_at: str
    created_by: str
    
    class Config:
        from_attributes = True
