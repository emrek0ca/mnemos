import pytest
from fastapi.testclient import TestClient
from core.api.server import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_telemetry_endpoint():
    response = client.get("/api/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert "avg_latency_ms" in data or "status" in data

def test_memory_stats_endpoint():
    response = client.get("/api/memory/stats")
    assert response.status_code == 200
    assert "episodic" in response.json()
    assert "semantic" in response.json()

def test_audit_summary_endpoint():
    response = client.get("/api/audit/summary")
    assert response.status_code == 200
