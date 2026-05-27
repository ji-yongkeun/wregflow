import uuid
from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.schemas.user import ROLE_PERMISSIONS

def get_user_permissions(db: Session, user_id: str) -> dict:
    """사용자의 권한 조회"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return {}
    
    return ROLE_PERMISSIONS.get(user.role.value, {})

def check_permission(db: Session, user_id: str, permission: str) -> bool:
    """특정 권한 확인"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return False
    
    permissions = ROLE_PERMISSIONS.get(user.role.value, {})
    return permissions.get(permission, False)

def can_upload(db: Session, user_id: str) -> bool:
    """파일 업로드 권한 확인"""
    return check_permission(db, user_id, "upload")

def can_analyze(db: Session, user_id: str) -> bool:
    """분석 권한 확인"""
    return check_permission(db, user_id, "analyze")

def can_share(db: Session, user_id: str) -> bool:
    """공유 권한 확인"""
    return check_permission(db, user_id, "share")

def can_download(db: Session, user_id: str) -> bool:
    """다운로드 권한 확인"""
    return check_permission(db, user_id, "download")

def can_manage_users(db: Session, user_id: str) -> bool:
    """사용자 관리 권한 확인"""
    return check_permission(db, user_id, "manage_users")

def create_user(
    db: Session,
    email: str,
    name: str,
    role: str = "viewer"
) -> User:
    """사용자 생성"""
    user_id = str(uuid.uuid4())
    
    user = User(
        id=user_id,
        email=email,
        name=name,
        role=RoleEnum(role)
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def update_user_role(db: Session, user_id: str, new_role: str) -> User:
    """사용자 역할 변경"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        return None
    
    user.role = RoleEnum(new_role)
    db.commit()
    db.refresh(user)
    
    return user

def list_users(db: Session) -> list:
    """모든 사용자 조회"""
    users = db.query(User).all()
    return [user.to_dict() for user in users]
