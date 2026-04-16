from __future__ import annotations

import json
import os
import logging

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.db import Document, get_db_session
from app.models.schemas import (
	DashboardStatsResponse,
	DocumentListItem,
	DocumentResultResponse,
	DocumentStatusResponse,
	TaskResultResponse,
)
from app.routes.auth import get_current_user


router = APIRouter(tags=["documents"])


@router.get("/documents/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
	document_id: str,
	db: Session = Depends(get_db_session),
	current_user=Depends(get_current_user),
) -> DocumentStatusResponse:
	doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
	if not doc:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

	msg = None
	if doc.status == "completed":
		msg = "Processing completed"
	elif doc.status == "failed":
		msg = doc.error_message or "Processing failed"
	elif doc.status == "processing":
		msg = "Processing in progress"
	else:
		msg = "Queued"

	return DocumentStatusResponse(document_id=doc.id, status=doc.status, task_id=doc.task_id, message=msg)


@router.get("/documents", response_model=list[DocumentListItem])
def list_documents(
	db: Session = Depends(get_db_session),
	current_user=Depends(get_current_user),
) -> list[DocumentListItem]:
	docs = (
		db.query(Document)
		.filter(Document.owner_id == current_user.id)
		.order_by(Document.created_at.desc())
		.all()
	)

	items: list[DocumentListItem] = []
	for doc in docs:
		score = None
		if doc.result_json:
			try:
				payload = json.loads(doc.result_json)
				score = payload.get("score")
			except Exception:
				score = None

		items.append(
			DocumentListItem(
				document_id=doc.id,
				filename=doc.filename,
				status=doc.status,
				score=score,
				created_at=doc.created_at,
			)
		)
	return items


@router.get("/documents/stats", response_model=DashboardStatsResponse)
def stats(
	db: Session = Depends(get_db_session),
	current_user=Depends(get_current_user),
) -> DashboardStatsResponse:
	docs = db.query(Document).filter(Document.owner_id == current_user.id).all()
	total = len(docs)
	pending = len([d for d in docs if d.status in {"queued", "processing"}])

	scores: list[int] = []
	flagged = 0
	for doc in docs:
		if not doc.result_json:
			continue
		try:
			payload = json.loads(doc.result_json)
			score = payload.get("score")
			errors = payload.get("errors", [])
			if isinstance(score, int):
				scores.append(score)
			if errors:
				flagged += 1
		except Exception:
			continue

	avg = int(sum(scores) / len(scores)) if scores else 0
	return DashboardStatsResponse(
		total_documents=total,
		avg_compliance_score=avg,
		pending_documents=pending,
		flagged_documents=flagged,
	)


@router.get("/result/{task_id}", response_model=TaskResultResponse)
def get_result_by_task_id(
	task_id: str,
	db: Session = Depends(get_db_session),
	current_user=Depends(get_current_user),
) -> TaskResultResponse:
	doc = (
		db.query(Document)
		.filter(Document.task_id == task_id, Document.owner_id == current_user.id)
		.order_by(Document.created_at.desc())
		.first()
	)
	if not doc:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

	if doc.status in {"queued", "processing"}:
		return TaskResultResponse(
			status="processing",
			task_id=task_id,
			document_id=doc.id,
			message="Processing in progress",
		)

	if doc.status == "failed":
		result_payload = json.loads(doc.result_json) if doc.result_json else {}
		return TaskResultResponse(
			status="failed",
			task_id=task_id,
			document_id=doc.id,
			score=result_payload.get("score"),
			data=result_payload.get("data"),
			errors=result_payload.get("errors", []),
			warnings=result_payload.get("warnings", []),
			message=doc.error_message or result_payload.get("message"),
		)

	result_payload = json.loads(doc.result_json) if doc.result_json else {}
	return TaskResultResponse(
		status="completed",
		task_id=task_id,
		document_id=doc.id,
		score=result_payload.get("score"),
		data=result_payload.get("data"),
		errors=result_payload.get("errors", []),
		warnings=result_payload.get("warnings", []),
		message=result_payload.get("message"),
	)


@router.get("/documents/{document_id}", response_model=DocumentResultResponse)
def get_document_result(
	document_id: str,
	db: Session = Depends(get_db_session),
	current_user=Depends(get_current_user),
) -> DocumentResultResponse:
	doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
	if not doc:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

	parsed_result = json.loads(doc.result_json) if doc.result_json else None
	return DocumentResultResponse(
		document_id=doc.id,
		filename=doc.filename,
		status=doc.status,
		idempotency_key=doc.idempotency_key,
		result=parsed_result,
		error_message=doc.error_message,
		created_at=doc.created_at,
		completed_at=doc.completed_at,
	)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
	document_id: str,
	db: Session = Depends(get_db_session),
	current_user=Depends(get_current_user),
):
	doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
	if not doc:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

	# Attempt to remove file from storage
	try:
		if doc.storage_path and os.path.exists(doc.storage_path):
			os.remove(doc.storage_path)
	except Exception as exc:
		logger.warning("Failed to delete physical file %s: %s", doc.storage_path, exc)

	db.delete(doc)
	db.commit()
	return None

