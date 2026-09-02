import json
import time
import hashlib
import logging
import sys
from typing import Optional, Dict, Any
from server.config import settings

# Configure standard logger to stdout
logger = logging.getLogger("food_journal_telemetry")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(message)s"))
if not logger.handlers:
    logger.addHandler(handler)

# Forbidden sensitive PII keys to sanitize
FORBIDDEN_PII_KEYS = {
    "prompt",
    "text",
    "rawimage",
    "raw_image",
    "image_base64",
    "base64",
    "notes",
    "summary_note",
    "items",
    "item_name",
    "user_notes",
    "ingredients",
    "food_name",
    "description"
}

def hash_user_id(uid: Optional[str]) -> Optional[str]:
    """Generates a SHA-256 pseudonymized hash of the User ID for privacy compliance."""
    if not uid:
        return None
    return hashlib.sha256(uid.encode("utf-8")).hexdigest()

def sanitize_metadata(meta: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Recursively strips any fields that could carry user dietary descriptions,
    prompts, image payloads, or free-text journal notes.
    """
    if not meta:
        return {}
    clean = {}
    for k, v in meta.items():
        lower_k = str(k).lower().replace("-", "_")
        if lower_k in FORBIDDEN_PII_KEYS:
            continue
        if isinstance(v, dict):
            clean[k] = sanitize_metadata(v)
        elif isinstance(v, (int, float, bool, str)):
            # If string length is unusually long or looks like base64, omit it
            if isinstance(v, str) and len(v) > 120:
                continue
            clean[k] = v
        else:
            clean[k] = str(v)
    return clean

def log_event(
    event_type: str,
    severity: str = "INFO",
    user_id: Optional[str] = None,
    duration_ms: Optional[float] = None,
    trace_id: Optional[str] = None,
    model_metrics: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None,
):
    """
    Emits a structured JSON event to stdout, formatted for Google Cloud Logging
    and linked to Cloud Trace, strictly sanitized of all PII.
    """
    event = {
        "severity": severity,
        "eventType": event_type,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "userId_hash": hash_user_id(user_id),
        "durationMs": round(duration_ms, 2) if duration_ms is not None else None,
        "traceId": f"projects/{settings.PROJECT_ID}/traces/{trace_id}" if trace_id else None,
    }

    if model_metrics:
        event["modelMetrics"] = {
            "provider": "vertex-ai",
            "model": model_metrics.get("model", settings.MODEL_NAME),
            "promptTokens": model_metrics.get("prompt_tokens", 0),
            "candidateTokens": model_metrics.get("candidate_tokens", 0),
            "totalTokens": model_metrics.get("total_tokens", 0),
        }

    if metadata:
        event["metadata"] = sanitize_metadata(metadata)

    if error_message:
        event["errorMessage"] = str(error_message)[:200]

    # Clean out None values
    filtered_event = {k: v for k, v in event.items() if v is not None}
    logger.info(json.dumps(filtered_event))
