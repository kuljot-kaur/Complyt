from __future__ import annotations

import os
from pathlib import Path
import uuid

import pytest
from fastapi.testclient import TestClient


os.environ.setdefault("DATABASE_URL", "sqlite:///./test_complyt.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")

from app.main import app
from app.models.db import Document, SessionLocal, User, create_db_and_tables
from app.workers import tasks as task_module
from app.workers.celery_app import celery_app


@pytest.fixture(autouse=True)
def setup_and_cleanup(monkeypatch):
    create_db_and_tables()

    def fake_execute_processing(_file_path: str):
        return {
            "status": "success",
            "data": {
                "exporter_name": "Alice Exporters",
                "exporter_address": "Road 1, Export City",
                "importer_name": "Bob Imports",
                "importer_address": "Road 2, Import City",
                "invoice_number": "INV-100",
                "invoice_date": "2026-04-16",
                "currency": "USD",
                "total_value": 1250,
                "incoterms": "FOB",
                "country_of_origin": "India",
                "country_of_destination": "UAE",
                "port_of_loading": "Mumbai",
                "port_of_discharge": "Dubai",
                "goods_description": "Electronic parts",
                "hs_code": "853400",
                "hs_source": "extracted",
                "net_weight_kg": 100,
                "gross_weight_kg": 120,
                "quantity": 25,
                "unit_of_measure": "PCS",
            },
            "errors": [],
            "warnings": [],
            "score": 92,
            "message": "Document processed successfully (compliance score: 92)",
        }

    monkeypatch.setattr(task_module, "_execute_processing", fake_execute_processing)

    old_eager = celery_app.conf.task_always_eager
    old_propagates = celery_app.conf.task_eager_propagates
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True

    yield

    db = SessionLocal()
    docs = db.query(Document).all()
    for doc in docs:
        try:
            p = Path(doc.storage_path)
            if p.exists():
                p.unlink()
        except Exception:
            pass
    db.query(Document).delete()
    db.query(User).delete()
    db.commit()
    db.close()

    celery_app.conf.task_always_eager = old_eager
    celery_app.conf.task_eager_propagates = old_propagates


@pytest.fixture
def client():
    return TestClient(app)


def auth_headers(client: TestClient) -> dict[str, str]:
    email = f"personb-{uuid.uuid4().hex[:8]}@example.com"
    register_payload = {
        "email": email,
        "full_name": "Person B",
        "password": "StrongPass123!",
    }

    reg = client.post("/auth/register", json=register_payload)
    assert reg.status_code == 201

    login = client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass123!"},
    )
    assert login.status_code == 200

    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_auth_upload_status_result_and_stats_flow(client: TestClient):
    headers = auth_headers(client)

    files = {"file": ("invoice.pdf", b"%PDF-1.4 fake content", "application/pdf")}
    upload = client.post("/upload", files=files, headers=headers)
    assert upload.status_code == 202

    upload_data = upload.json()
    document_id = upload_data["document_id"]
    task_id = upload_data["task_id"]
    assert task_id
    assert upload_data["status"] in {"processing", "completed"}

    task_result_resp = client.get(f"/result/{task_id}", headers=headers)
    assert task_result_resp.status_code == 200
    task_result = task_result_resp.json()
    assert task_result["status"] == "completed"
    assert task_result["score"] == 92
    assert task_result["data"]["hs_code"] == "853400"

    status_resp = client.get(f"/documents/{document_id}/status", headers=headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "completed"

    result_resp = client.get(f"/documents/{document_id}", headers=headers)
    assert result_resp.status_code == 200
    result = result_resp.json()["result"]
    assert result["score"] == 92
    assert result["data"]["hs_code"] == "853400"
    assert result["data"]["exporter_name"].startswith("A")
    assert "*" in result["data"]["exporter_name"]

    list_resp = client.get("/documents", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    stats_resp = client.get("/documents/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_documents"] == 1
    assert stats["avg_compliance_score"] == 92
    assert stats["pending_documents"] == 0

    logout_resp = client.post("/auth/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert logout_resp.json()["message"] == "Logged out successfully"


def test_idempotency_same_file_returns_existing_document(client: TestClient):
    headers = auth_headers(client)
    file_payload = {"file": ("invoice.pdf", b"same-content-for-hash", "application/pdf")}

    first = client.post("/upload", files=file_payload, headers=headers)
    assert first.status_code == 202
    first_doc_id = first.json()["document_id"]

    second = client.post("/upload", files=file_payload, headers=headers)
    assert second.status_code == 202
    second_json = second.json()

    assert second_json["document_id"] == first_doc_id
    assert second_json["status"] in {"completed", "queued", "processing"}
