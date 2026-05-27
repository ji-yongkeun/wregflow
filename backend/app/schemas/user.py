from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class RoleEnum(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class UserCreate(BaseModel):
    email: str
    name: str
    role: RoleEnum = RoleEnum.VIEWER

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[RoleEnum] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    
    class Config:
        from_attributes = True

class PermissionResponse(BaseModel):
    permissions: dict  # {"upload": True, "analyze": True, ...}
    role: str

# 역할별 기본 권한
ROLE_PERMISSIONS = {
    "admin": {
        "upload": True,
        "analyze": True,
        "share": True,
        "download": True,
        "view_all": True,
        "manage_users": True,
        "manage_permissions": True
    },
    "editor": {
        "upload": True,
        "analyze": True,
        "share": True,
        "download": True,
        "view_all": False,
        "manage_users": False,
        "manage_permissions": False
    },
    "viewer": {
        "upload": False,
        "analyze": False,
        "share": False,
        "download": True,
        "view_all": False,
        "manage_users": False,
        "manage_permissions": False
    }
}
