from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import os

from app.models.db import User, Document, get_db_session
from app.models.schemas import AdminUserStat, AdminAddUserPayload, UserResponse
from app.routes.auth import require_admin, _hash_password

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=list[AdminUserStat])
def get_all_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    query = (
        db.query(
            User.id,
            User.email,
            User.full_name,
            User.role,
            func.count(Document.id).label("runs")
        )
        .outerjoin(Document, User.id == Document.owner_id)
        .group_by(User.id)
    )
    
    results = []
    for row in query.all():
        results.append(
            AdminUserStat(
                id=row.id,
                email=row.email,
                full_name=row.full_name,
                role=row.role,
                runs=row.runs
            )
        )
        
    return results

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def add_user(payload: AdminAddUserPayload, current_user: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    exists = db.query(User).filter(User.email == payload.email.lower()).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    new_user = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        password_hash=_hash_password(payload.password),
        role=payload.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserResponse.model_validate(new_user)

@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_user: User = Depends(require_admin), db: Session = Depends(get_db_session)):
    # Prevent self-deletion
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account")
        
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    # Manual cleanup of document files on filesystem
    for doc in user_to_delete.documents:
        try:
            if os.path.exists(doc.storage_path):
                os.remove(doc.storage_path)
        except Exception:
            pass
            
    db.delete(user_to_delete)
    db.commit()
    return {"message": "User and associated documents successfully deleted"}
