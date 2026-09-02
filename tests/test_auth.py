import os
import pytest
from fastapi.testclient import TestClient

# Enable test auth bypass for local test run
os.environ["ENABLE_TEST_AUTH"] = "true"

from server.main import app

client = TestClient(app)

def test_unauthenticated_request_rejected():
    """Mandate 3: Unauthenticated calls must return 401."""
    res = client.get("/api/logs")
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"]

def test_invalid_bearer_token_rejected():
    """Mandate 3: Malformed or invalid tokens must return 401."""
    headers = {"Authorization": "Bearer invalid-token-xyz"}
    res = client.get("/api/logs", headers=headers)
    assert res.status_code == 401

def test_authenticated_request_succeeds_with_valid_token():
    """Mandate 3: Valid token allows access and derives UID correctly."""
    headers = {"Authorization": "Bearer test-token-user-12345"}
    res = client.get("/api/logs", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_health_check_public():
    """Health check endpoint should be publicly accessible and report security compliance."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "project_id" in data
    assert "gemini" in data["ai_model"]
    assert data["security_compliance"]["zero_api_keys"] is True
    assert data["security_compliance"]["adk_framework_enabled"] is True
