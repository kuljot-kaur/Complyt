from __future__ import annotations

import hashlib

from sqlalchemy.orm import Session

from app.models.db import Document


def generate_idempotency_key(file_bytes: bytes) -> str:
	"""Return deterministic SHA-256 hash for uploaded file bytes."""
	return hashlib.sha256(file_bytes).hexdigest()


def generate_file_hash(file_bytes: bytes) -> str:
	return generate_idempotency_key(file_bytes)


def find_existing_document(db: Session, owner_id: str, idempotency_key: str) -> Document | None:
	return (
		db.query(Document)
		.filter(Document.idempotency_key == idempotency_key)
		.order_by(Document.created_at.desc())
		.first()
	)

