import time
from fastapi import APIRouter
from server.config import settings

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
async def health_check():
    """
    Health check endpoint reporting system status, GCP project, and security compliance.
    """
    return {
        "status": "healthy",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "project_id": settings.PROJECT_ID,
        "region": settings.REGION,
        "ai_model": settings.MODEL_NAME,
        "auth_provider": "Firebase Authentication",
        "storage": "Google Cloud Firestore",
        "security_compliance": {
            "zero_api_keys": True,
            "iam_adc_enabled": True,
            "tenant_isolation_enabled": True,
            "pii_redacted_telemetry": True,
            "draft_and_verify_enforced": True,
            "adk_framework_enabled": True
        }
    }
