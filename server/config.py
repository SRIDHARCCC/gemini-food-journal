import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "your-gcp-project-id")
    REGION: str = os.getenv("GCP_REGION", "us-central1")
    # Vertex AI model (gemini-3.7-flash / gemini-2.5-flash)
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "gemini-3.7-flash")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gemini-3.7-flash")
    FALLBACK_MODELS: list[str] = ["gemini-3.7-flash", "gemini-2.5-flash", "gemini-1.5-flash"]
    PORT: int = int(os.getenv("PORT", "8080"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    ENV: str = os.getenv("ENV", "development")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "your-gcp-project-id")
    FIREBASE_WEB_API_KEY: str = os.getenv("FIREBASE_WEB_API_KEY", os.getenv("VITE_FIREBASE_API_KEY", ""))
    FIREBASE_AUTH_DOMAIN: str = os.getenv("FIREBASE_AUTH_DOMAIN", "")
    FIREBASE_STORAGE_BUCKET: str = os.getenv("FIREBASE_STORAGE_BUCKET", "")
    FIREBASE_MESSAGING_SENDER_ID: str = os.getenv("FIREBASE_MESSAGING_SENDER_ID", "")
    FIREBASE_APP_ID: str = os.getenv("FIREBASE_APP_ID", "")

settings = Settings()
