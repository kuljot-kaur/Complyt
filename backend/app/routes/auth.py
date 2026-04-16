from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from starlette.requests import Request
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
import redis
import pyotp
import qrcode
import base64
from io import BytesIO

from app.models.db import User, get_db_session, Document
from app.models.schemas import (
	LoginRequest, RegisterRequest, TokenResponse, UserResponse, 
	UpdateProfileRequest, ChangePasswordRequest, MfaVerifyRequest
)
from app.services.email import EmailService # Keep for potential fallback


router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=True)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-only")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

# OAuth Configuration
oauth = OAuth()
oauth.register(
	name="google",
	client_id=os.getenv("GOOGLE_CLIENT_ID"),
	client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
	server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
	client_kwargs={"scope": "openid email profile"},
)

# Redis for OTP storage
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)


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


def _create_mfa_challenge(user_id: str, email: str) -> str:
	"""
	For TOTP, we don't need to generate a new secret or send an email here.
	We just issue a temporary MFA session token so the frontend can then
	ask for the 6-digit TOTP code.
	"""
	mfa_token = jwt.encode(
		{"sub": user_id, "type": "mfa_challenge", "exp": datetime.now(timezone.utc) + timedelta(minutes=10)},
		JWT_SECRET_KEY,
		algorithm=JWT_ALGORITHM
	)
	return mfa_token



def get_current_user(
	credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
	db: Session = Depends(get_db_session),
) -> User:
	token = credentials.credentials
	try:
		payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
		if payload.get("type") == "mfa_challenge":
			raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="MFA verification required")
		user_id = payload.get("sub")
		if not user_id:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
	except JWTError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
	return user


def get_mfa_user(
	credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
	db: Session = Depends(get_db_session),
) -> User:
	"""Dependency for routes accessible during the MFA phase (setup or verify)."""
	token = credentials.credentials
	try:
		payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
		if payload.get("type") != "mfa_challenge":
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA token required")
		user_id = payload.get("sub")
	except JWTError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
	return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
	if current_user.role != "admin":
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
	return current_user


@router.post("/mfa/setup")
def setup_mfa(current_user: User = Depends(get_mfa_user), db: Session = Depends(get_db_session)):
	"""Generates a new TOTP secret and returns a QR code for enrollment."""
	secret = pyotp.random_base32()
	
	# Store temporary secret until verified
	current_user.mfa_secret = secret
	db.commit()

	totp = pyotp.TOTP(secret)
	# provisioning_uri(name, issuer_name)
	uri = totp.provisioning_uri(name=current_user.email, issuer_name="Complyt AI")

	# Generate QR Code as Base64 PNG
	qr = qrcode.make(uri)
	buffer = BytesIO()
	qr.save(buffer, format="PNG")
	qr_base64 = base64.b64encode(buffer.getvalue()).decode()

	return {
		"qr_code_url": f"data:image/png;base64,{qr_base64}",
		"secret": secret
	}


@router.post("/mfa/enable")
def enable_mfa(payload: dict, current_user: User = Depends(get_mfa_user), db: Session = Depends(get_db_session)):
	"""Verifies the first TOTP code and activates MFA for the account."""
	otp = payload.get("otp")
	if not otp:
		raise HTTPException(status_code=400, detail="OTP code required")
	
	if not current_user.mfa_secret:
		raise HTTPException(status_code=400, detail="MFA setup not initiated")

	totp = pyotp.TOTP(current_user.mfa_secret)
	if not totp.verify(otp, valid_window=1):
		raise HTTPException(status_code=401, detail="Invalid OTP code")

	current_user.mfa_enabled = True
	db.commit()
	
	# Return a full access token now that MFA is enabled and verified
	token = _create_access_token(current_user.id)
	return {
		"message": "MFA enabled successfully",
		"access_token": token,
		"user": UserResponse.model_validate(current_user)
	}


@router.post("/mfa/disable")
def disable_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
	"""Disables MFA for the current user."""
	current_user.mfa_enabled = False
	current_user.mfa_secret = None
	db.commit()
	return {"message": "MFA disabled successfully"}


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

	# MFA Enforcement
	mfa_token = _create_mfa_challenge(user.id, user.email)
	if user.mfa_enabled:
		return TokenResponse(
			requires_mfa=True,
			mfa_token=mfa_token,
			user=UserResponse.model_validate(user)
		)
	else:
		return TokenResponse(
			requires_mfa_setup=True,
			mfa_token=mfa_token,
			user=UserResponse.model_validate(user)
		)


@router.post("/mfa/verify", response_model=TokenResponse)
def verify_mfa(payload: MfaVerifyRequest, db: Session = Depends(get_db_session)) -> TokenResponse:
	try:
		# Decode the temporary MFA token
		token_data = jwt.decode(payload.mfa_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
		if token_data.get("type") != "mfa_challenge":
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA token type")
		user_id = token_data.get("sub")
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired or invalid MFA token")

	# Check the TOTP code
	user = db.query(User).filter(User.id == user_id).first()
	if not user or not user.mfa_secret:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User lost during MFA or MFA not setup")

	totp = pyotp.TOTP(user.mfa_secret)
	if not totp.verify(payload.otp_code, valid_window=1):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP code")

	# Finalize authentication
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


@router.get("/google/login")
async def google_login(request: Request):
	redirect_uri = request.url_for("google_callback")
	return await oauth.google.authorize_redirect(request, str(redirect_uri))


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db_session)):
	try:
		token = await oauth.google.authorize_access_token(request)
	except OAuthError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"OAuth failed: {exc.error}")

	user_info = token.get("userinfo")
	if not user_info:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Failed to fetch user info from Google")

	email = user_info["email"].lower()
	google_id = user_info["sub"]
	full_name = user_info.get("name") or user_info.get("given_name") or email.split("@")[0]

	# Upsert User
	user = db.query(User).filter((User.google_id == google_id) | (User.email == email)).first()
	
	if not user:
		user = User(
			email=email,
			google_id=google_id,
			full_name=full_name,
			password_hash=None  # No password for Google-first users
		)
		db.add(user)
	else:
		# Update existing user with google_id if missing
		if not user.google_id:
			user.google_id = google_id
		# Ensure name is synced if missing
		if not user.full_name:
			user.full_name = full_name
	
	db.commit()
	db.refresh(user)

	frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

	# MFA Enforcement for Google OAuth
	mfa_token = _create_mfa_challenge(user.id, user.email)
	if user.mfa_enabled:
		return RedirectResponse(url=f"{frontend_url}/mfa-challenge?mfa_token={mfa_token}&email={user.email}")
	else:
		# Force setup for new/unconfigured Google users
		return RedirectResponse(url=f"{frontend_url}/mfa-setup?mfa_token={mfa_token}&email={user.email}")

