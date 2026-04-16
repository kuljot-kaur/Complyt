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


class UserResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: str
	email: EmailStr
	full_name: str
	created_at: datetime


class TokenResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"
	user: UserResponse


class ErrorItem(BaseModel):
	code: str
	field: str | None = None
	message: str
	severity: Literal["error", "warning"]


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
	created_at: datetime


class DashboardStatsResponse(BaseModel):
	total_documents: int
	avg_compliance_score: int
	pending_documents: int
	flagged_documents: int

