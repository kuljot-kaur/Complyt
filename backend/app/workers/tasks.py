from __future__ import annotations

import json
from datetime import datetime, timezone

from app.models.db import Document, SessionLocal, create_db_and_tables
from app.services.encryption import protect_result_payload
from app.workers.celery_app import celery_app


def _execute_processing(file_path: str) -> dict:
	# Person B integration point: call Person A contract directly.
	from app.main import process_document

	return process_document(file_path)


@celery_app.task(bind=True, name="process_document_task")
def process_document_task(self, document_id: str) -> dict:
	"""Integration point: distributed worker calls Person A pipeline."""
	create_db_and_tables()
	db = SessionLocal()
	try:
		doc = db.query(Document).filter(Document.id == document_id).first()
		if doc is None:
			return {"status": "error", "message": f"Document not found: {document_id}"}

		if doc.status == "completed" and doc.result_json:
			return {"status": "success", "message": "Already processed", "document_id": document_id}

		doc.status = "processing"
		doc.task_id = self.request.id
		doc.processing_started_at = datetime.now(timezone.utc)
		db.commit()

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

		doc.completed_at = datetime.now(timezone.utc)
		db.commit()

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

