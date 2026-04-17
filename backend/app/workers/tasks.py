from __future__ import annotations

import json
from datetime import datetime, timezone

from app.models.db import Document, SessionLocal, create_db_and_tables
from app.services.encryption import protect_result_payload
from app.workers.celery_app import celery_app
from app.utils.logger import log_info, log_error


def _execute_processing(file_path: str) -> dict:
	# Person B integration point: call Person A contract directly.
	from app.main import process_document

	return process_document(file_path)


@celery_app.task(
	bind=True, 
	name="process_document_task"
)
def process_document_task(self, document_id: str, request_id: str = None) -> dict:
	"""Integration point: distributed worker calls Person A pipeline."""
	create_db_and_tables()
	db = SessionLocal()
	try:
		doc = db.query(Document).filter(Document.id == document_id).first()
		if doc is None:
			return {"status": "error", "message": f"Document not found: {document_id}"}

		# CRITICAL: Self-report Task ID to prevent 404 race conditions
		current_task_id = self.request.id
		if current_task_id and doc.task_id != current_task_id:
			doc.task_id = current_task_id
			db.commit()
			db.refresh(doc)

		# GLOBAL EFFICIENCY CACHE: Check if ANYONE has processed this file before
		existing_successful = (
			db.query(Document)
			.filter(Document.idempotency_key == doc.idempotency_key, Document.status == "completed")
			.filter(Document.id != document_id)
			.order_by(Document.completed_at.desc())
			.first()
		)
		if existing_successful and existing_successful.result_json:
			log_info("Global Cache Hit: Reusing existing processing result", 
					 service="worker", 
					 document_id=document_id,
					 cached_from=existing_successful.id)
			doc.result_json = existing_successful.result_json
			doc.encrypted_pii_json = existing_successful.encrypted_pii_json
			doc.status = "completed"
			doc.completed_at = datetime.now(timezone.utc)
			db.commit()
			return {
				"status": "success",
				"document_id": document_id,
				"score": json.loads(doc.result_json).get("score"),
				"message": "Result retrieved from global cache"
			}

		# Final safety: if another worker already finished this specific record, exit early.
		if doc.status == "completed" and doc.result_json:
			log_info("Worker skipping: already completed", 
					 service="worker", 
					 request_id=request_id, 
					 document_id=document_id)
			return {"status": "success", "message": "Already processed", "document_id": document_id}

		doc.status = "processing"
		doc.task_id = self.request.id
		doc.processing_started_at = datetime.now(timezone.utc)
		db.commit()

		log_info("Worker started document processing",
				 service="worker",
				 request_id=request_id,
				 document_id=document_id,
				 storage_path=doc.storage_path)

		report = _execute_processing(doc.storage_path)
		if "status" not in report:
			report = {
				"status": "success",
				"data": report.get("data"),
				"errors": report.get("errors", []),
				"warnings": report.get("warnings", []),
				"score": report.get("score"),
				"message": None,
			}

		masked_report, encrypted_pii = protect_result_payload(report)

		doc.result_json = json.dumps(masked_report)
		doc.encrypted_pii_json = json.dumps(encrypted_pii)

		if masked_report.get("status") == "error":
			doc.status = "failed"
			doc.error_message = masked_report.get("message") or "Processing failed"
		else:
			doc.status = "completed"
			doc.error_message = None

			# Persist Milestones (Transparency)
			milestones = masked_report.get("milestones", {})
			if milestones.get("ocr_completed_at"):
				doc.ocr_completed_at = datetime.fromisoformat(milestones["ocr_completed_at"])
			if milestones.get("extraction_completed_at"):
				doc.extraction_completed_at = datetime.fromisoformat(milestones["extraction_completed_at"])
			if milestones.get("compliance_completed_at"):
				doc.compliance_completed_at = datetime.fromisoformat(milestones["compliance_completed_at"])

		doc.completed_at = datetime.now(timezone.utc)
		db.commit()

		log_info("Worker completed document processing",
				 service="worker",
				 request_id=request_id,
				 document_id=document_id,
				 status=doc.status)

		return {
			"status": masked_report.get("status", "success"),
			"document_id": document_id,
			"score": masked_report.get("score"),
		}
	except Exception as exc:
		doc = db.query(Document).filter(Document.id == document_id).first()
		if doc is not None:
			doc.status = "failed"
			doc.error_message = str(exc)
			doc.completed_at = datetime.now(timezone.utc)
			db.commit()
		raise
	finally:
		db.close()

