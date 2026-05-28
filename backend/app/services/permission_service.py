"""권한 서비스 - 권한 체크 비활성화 (모든 요청 허용)"""
from sqlalchemy.orm import Session


def get_user_permissions(db: Session, user_id: str) -> dict:
    return {
        "upload": True, "analyze": True, "share": True, "download": True,
        "view_all": True, "manage_users": True, "manage_permissions": True,
    }

def check_permission(db: Session, user_id: str, permission: str) -> bool:
    return True

def can_upload(db: Session, user_id: str) -> bool:
    return True

def can_analyze(db: Session, user_id: str) -> bool:
    return True

def can_share(db: Session, user_id: str) -> bool:
    return True

def can_download(db: Session, user_id: str) -> bool:
    return True

def can_manage_users(db: Session, user_id: str) -> bool:
    return True

def create_user(db, email, name, role="viewer"):
    from app.models.user import User, RoleEnum
    import uuid
    user = User(id=str(uuid.uuid4()), email=email, name=name, role=RoleEnum(role))
    db.add(user); db.commit(); db.refresh(user)
    return user

def update_user_role(db, user_id, new_role):
    from app.models.user import User, RoleEnum
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.role = RoleEnum(new_role)
    db.commit(); db.refresh(user)
    return user

def list_users(db):
    from app.models.user import User
    return [u.to_dict() for u in db.query(User).all()]
