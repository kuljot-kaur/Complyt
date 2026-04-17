from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr


DocumentStatus = Literal["queued", "processing", "completed", "failed"]


class RegisterRequest(BaseModel):
	email: EmailStr
	full_name: str | None = None
	password: str


class LoginRequest(BaseModel):
	email: EmailStr
	password: str


class UpdateProfileRequest(BaseModel):
	full_name: str


class ChangePasswordRequest(BaseModel):
	current_password: str
	new_password: str


class UserResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: str
	email: EmailStr
	full_name: str
	role: str
	created_at: datetime


class TokenResponse(BaseModel):
	access_token: str | None = None
	requires_mfa: bool = False
	requires_mfa_setup: bool = False
	mfa_token: str | None = None # Short-lived token for MFA stage
	token_type: str = "bearer"
	user: UserResponse | None = None


class ErrorItem(BaseModel):
	code: str
	field: str | None = None
	message: str
	severity: Literal["error", "warning"]
	reason: str | None = None
	suggestion: str | None = None
	impact: str | None = None
	confidence: float | None = None


class UploadAcceptedResponse(BaseModel):
	document_id: str
	idempotency_key: str
	status: DocumentStatus
	task_id: str | None = None
	message: str


class TaskResultResponse(BaseModel):
	status: Literal["processing", "completed", "failed"]
	task_id: str
	document_id: str | None = None
	score: int | None = None
	data: dict[str, Any] | None = None
	errors: list[dict[str, Any]] = []
	warnings: list[dict[str, Any]] = []
	message: str | None = None
	risk_level: str | None = None
	llm_reasoning: str | None = None
	llm_overall_assessment: str | None = None
	llm_risks: list[str] = []
	llm_recommendations: list[str] = []


class DocumentStatusResponse(BaseModel):
	document_id: str
	status: DocumentStatus
	task_id: str | None = None
	message: str | None = None


class DocumentResultResponse(BaseModel):
	document_id: str
	filename: str
	status: DocumentStatus
	idempotency_key: str
	result: dict[str, Any] | None = None
	error_message: str | None = None
	created_at: datetime
	completed_at: datetime | None = None


class DocumentListItem(BaseModel):
	document_id: str
	filename: str
	status: DocumentStatus
	score: int | None
	error_count: int = 0
	created_at: datetime


class UpdateDocumentResultRequest(BaseModel):
	data: dict[str, Any]


class DashboardStatsResponse(BaseModel):
	total_documents: int
	avg_compliance_score: int
	pending_documents: int
	flagged_documents: int


class MfaVerifyRequest(BaseModel):
	mfa_token: str
	otp_code: str


class AdminUserStat(BaseModel):
	id: str
	email: str
	full_name: str
	role: str
	runs: int


class AdminAddUserPayload(BaseModel):
	email: EmailStr
	full_name: str
	password: str
	role: Literal["user", "admin"] = "user"
