from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.permission_service import (
    get_user_permissions,
    check_permission,
    create_user,
    update_user_role,
    list_users
)
from app.schemas.user import UserCreate, UserUpdate, UserResponse, ROLE_PERMISSIONS

router = APIRouter(prefix="/api/permissions", tags=["permissions"])

def get_current_user_id(x_user_id: str = Header(None)) -> str:
    """
    현재 로그인한 사용자 ID 가져오기
    헤더: X-User-Id
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="사용자 인증 필요")
    return x_user_id

@router.post("/create-user")
async def create_new_user(
    user_create: UserCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    새로운 사용자 생성
    관리자만 가능
    
    Parameters:
    - email: 사용자 이메일
    - name: 사용자 이름
    - role: 역할 (admin, editor, viewer)
    """
    try:
        # 현재 사용자가 관리자인지 확인
        if not check_permission(db, current_user_id, "manage_users"):
            raise HTTPException(status_code=403, detail="권한이 없습니다")
        
        user = create_user(
            db=db,
            email=user_create.email,
            name=user_create.name,
            role=user_create.role
        )
        
        return {
            "status": "success",
            "message": f"{user.name} 사용자가 생성되었습니다",
            "user": user.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users")
async def get_all_users(
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    모든 사용자 조회
    관리자만 가능
    """
    try:
        if not check_permission(db, current_user_id, "manage_users"):
            raise HTTPException(status_code=403, detail="권한이 없습니다")
        
        users = list_users(db)
        
        return {
            "status": "success",
            "total_users": len(users),
            "users": users
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    new_role: str,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    사용자 역할 변경
    관리자만 가능
    
    Parameters:
    - user_id: 대상 사용자 ID
    - new_role: 새로운 역할 (admin, editor, viewer)
    """
    try:
        if not check_permission(db, current_user_id, "manage_users"):
            raise HTTPException(status_code=403, detail="권한이 없습니다")
        
        user = update_user_role(db, user_id, new_role)
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
        
        return {
            "status": "success",
            "message": f"{user.name}의 역할이 {new_role}으로 변경되었습니다",
            "user": user.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/my-permissions")
async def get_my_permissions(
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    현재 사용자의 권한 조회
    """
    try:
        permissions = get_user_permissions(db, current_user_id)
        
        return {
            "status": "success",
            "user_id": current_user_id,
            "permissions": permissions
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/roles")
async def get_all_roles():
    """
    모든 역할과 권한 조회
    """
    return {
        "status": "success",
        "roles": ROLE_PERMISSIONS
    }
