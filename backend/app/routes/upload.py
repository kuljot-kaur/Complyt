from __future__ import annotations

import os
from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.db import Document, get_db_session
from app.models.schemas import UploadAcceptedResponse
from app.routes.auth import get_current_user
from app.services.idempotency import find_existing_document, generate_idempotency_key
from app.workers.tasks import process_document_task


router = APIRouter(tags=["documents"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_BYTES", str(25 * 1024 * 1024)))
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}


@router.post("/upload", response_model=UploadAcceptedResponse, status_code=status.HTTP_202_ACCEPTED)
@router.post("/documents/upload", response_model=UploadAcceptedResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
	file: UploadFile = File(...),
	db: Session = Depends(get_db_session),
	current_user=Depends(get_current_user),
) -> UploadAcceptedResponse:
	ext = Path(file.filename or "").suffix.lower()
	if ext not in ALLOWED_EXTENSIONS:
		raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

	file_bytes = await file.read()
	if not file_bytes:
		raise HTTPException(status_code=400, detail="Empty file")
	if len(file_bytes) > MAX_FILE_SIZE:
		raise HTTPException(status_code=413, detail="File exceeds 25MB limit")

	idempotency_key = generate_idempotency_key(file_bytes)
	existing = find_existing_document(db, current_user.id, idempotency_key)
	if existing:
		if existing.status == "completed":
			return UploadAcceptedResponse(
				document_id=existing.id,
				idempotency_key=idempotency_key,
				status="completed",
				task_id=existing.task_id,
				message="Existing processed result returned (idempotent hit)",
			)
		return UploadAcceptedResponse(
			document_id=existing.id,
			idempotency_key=idempotency_key,
			status="processing",
			task_id=existing.task_id,
			message="Document already submitted and is still processing",
		)

	file_id = str(uuid.uuid4())
	stored_name = f"{file_id}{ext}"
	stored_path = UPLOAD_DIR / stored_name
	with stored_path.open("wb") as f:
		f.write(file_bytes)

	doc = Document(
		owner_id=current_user.id,
		filename=file.filename or stored_name,
		content_type=file.content_type or "application/octet-stream",
		file_size=len(file_bytes),
		storage_path=str(stored_path.resolve()),
		idempotency_key=idempotency_key,
		status="queued",
	)
	db.add(doc)
	db.commit()
	db.refresh(doc)

	task = process_document_task.delay(doc.id)
	doc.task_id = task.id
	db.commit()

	return UploadAcceptedResponse(
		document_id=doc.id,
		idempotency_key=idempotency_key,
		status="processing",
		task_id=task.id,
		message="Document uploaded successfully",
	)

