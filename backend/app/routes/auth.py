from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.models.db import User, get_db_session, Document
from app.models.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse, UpdateProfileRequest, ChangePasswordRequest


router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=True)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-only")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


def _hash_password(password: str) -> str:
	hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
	return hashed.decode("utf-8")


def _verify_password(plain_password: str, password_hash: str) -> bool:
	try:
		return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
	except ValueError:
		return False


def _create_access_token(subject: str) -> str:
	expires = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
	payload = {"sub": subject, "exp": expires}
	return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
	credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
	db: Session = Depends(get_db_session),
) -> User:
	token = credentials.credentials
	try:
		payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
		user_id = payload.get("sub")
		if not user_id:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
	except JWTError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
	return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db_session)) -> UserResponse:
	exists = db.query(User).filter(User.email == payload.email.lower()).first()
	if exists:
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

	user = User(
		email=payload.email.lower(),
		full_name=(payload.full_name.strip() if payload.full_name else payload.email.split("@")[0]),
		password_hash=_hash_password(payload.password),
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db_session)) -> TokenResponse:
	user = db.query(User).filter(User.email == payload.email.lower()).first()
	if not user or not _verify_password(payload.password, user.password_hash):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

	token = _create_access_token(user.id)
	return TokenResponse(
		access_token=token,
		user=UserResponse.model_validate(user),
	)


@router.post("/logout")
def logout(_current_user: User = Depends(get_current_user)) -> dict[str, str]:
	# JWT is stateless; client discards token to complete logout.
	return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
	return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
	payload: UpdateProfileRequest,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db_session),
) -> UserResponse:
	current_user.full_name = payload.full_name.strip()
	db.commit()
	db.refresh(current_user)
	return UserResponse.model_validate(current_user)


@router.put("/change-password")
def change_password(
	payload: ChangePasswordRequest,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db_session),
) -> dict[str, str]:
	if not _verify_password(payload.current_password, current_user.password_hash):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect")

	current_user.password_hash = _hash_password(payload.new_password)
	db.commit()
	return {"message": "Password updated successfully"}


@router.delete("/me")
def delete_me(
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db_session),
) -> dict[str, str]:
	# Deleting from DB will trigger filesystem removal? 
	# No, the relationship cascade only handle DB. 
	# Manual cleanup of files is better for security/compliance.
	for doc in current_user.documents:
		try:
			if os.path.exists(doc.storage_path):
				os.remove(doc.storage_path)
		except Exception:
			pass
	
	db.delete(current_user)
	db.commit()
	return {"message": "Account and all associated documents permanently deleted"}

