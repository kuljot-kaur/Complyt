from __future__ import annotations

import base64
import copy
import hashlib
import os
from typing import Any

from cryptography.fernet import Fernet


PII_FIELDS = {
	"exporter_name",
	"exporter_address",
	"importer_name",
	"importer_address",
}


def _build_fernet() -> Fernet:
	key = os.getenv("FERNET_KEY", "")
	if not key:
		secret = os.getenv("JWT_SECRET_KEY", "dev-secret-only")
		digest = hashlib.sha256(secret.encode("utf-8")).digest()
		key = base64.urlsafe_b64encode(digest).decode("utf-8")
	return Fernet(key.encode("utf-8"))


FERNET = _build_fernet()


def encrypt_text(value: str) -> str:
	return FERNET.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_text(token: str) -> str:
	return FERNET.decrypt(token.encode("utf-8")).decode("utf-8")


def encrypt_pii(data: str) -> str:
	return encrypt_text(data)


def decrypt_pii(data: str) -> str:
	return decrypt_text(data)


def mask_value(value: str) -> str:
	# Keep first char per token visible and mask remaining alpha chars.
	masked_tokens: list[str] = []
	for token in value.split(" "):
		if not token:
			masked_tokens.append(token)
			continue
		first = token[0]
		rest = "".join("*" if c.isalpha() else c for c in token[1:])
		masked_tokens.append(first + rest)
	return " ".join(masked_tokens)


def protect_result_payload(result: dict[str, Any]) -> tuple[dict[str, Any], dict[str, str]]:
	"""
	Returns (masked_result_for_ui, encrypted_pii_blob_for_db).
	"""
	masked = copy.deepcopy(result)
	encrypted_blob: dict[str, str] = {}

	data = masked.get("data")
	if not isinstance(data, dict):
		return masked, encrypted_blob

	for key in PII_FIELDS:
		raw = data.get(key)
		if isinstance(raw, str) and raw.strip():
			encrypted_blob[key] = encrypt_text(raw)
			data[key] = mask_value(raw)

	return masked, encrypted_blob

