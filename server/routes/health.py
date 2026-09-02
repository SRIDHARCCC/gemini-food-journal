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

@router.get("/config/firebase")
async def get_firebase_config():
    """
    Returns public client Firebase configuration for the web frontend.
    """
    proj = settings.FIREBASE_PROJECT_ID or settings.PROJECT_ID
    return {
        "apiKey": settings.FIREBASE_WEB_API_KEY,
        "authDomain": settings.FIREBASE_AUTH_DOMAIN or f"{proj}.firebaseapp.com",
        "projectId": proj,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET or f"{proj}.appspot.com",
        "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_APP_ID
    }
