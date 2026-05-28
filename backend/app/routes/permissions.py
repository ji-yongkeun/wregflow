from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.permission_service import create_user, update_user_role, list_users
from app.schemas.user import UserCreate, ROLE_PERMISSIONS

router = APIRouter(prefix="/api/permissions", tags=["permissions"])

ALL_PERMISSIONS = {
    "upload": True, "analyze": True, "share": True, "download": True,
    "view_all": True, "manage_users": True, "manage_permissions": True,
}

@router.post("/create-user")
async def create_new_user(user_create: UserCreate, db: Session = Depends(get_db)):
    user = create_user(db=db, email=user_create.email, name=user_create.name, role=user_create.role)
    return {"status": "success", "message": f"{user.name} 사용자가 생성되었습니다", "user": user.to_dict()}

@router.get("/users")
async def get_all_users(db: Session = Depends(get_db)):
    users = list_users(db)
    return {"status": "success", "total_users": len(users), "users": users}

@router.put("/users/{user_id}/role")
async def change_user_role(user_id: str, new_role: str, db: Session = Depends(get_db)):
    user = update_user_role(db, user_id, new_role)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    return {"status": "success", "message": f"{user.name}의 역할이 {new_role}으로 변경되었습니다", "user": user.to_dict()}

@router.get("/my-permissions")
async def get_my_permissions():
    return {"status": "success", "permissions": ALL_PERMISSIONS}

@router.get("/roles")
async def get_all_roles():
    return {"status": "success", "roles": ROLE_PERMISSIONS}
