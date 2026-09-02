import hashlib
from server.telemetry.structured_logger import hash_user_id, sanitize_metadata, FORBIDDEN_PII_KEYS

def test_user_id_hashing():
    """Mandate 4: User IDs must be hashed with SHA-256."""
    raw_uid = "firebase_user_abc123"
    hashed = hash_user_id(raw_uid)
    expected = hashlib.sha256(raw_uid.encode("utf-8")).hexdigest()
    assert hashed == expected
    assert raw_uid not in hashed
    assert len(hashed) == 64

def test_telemetry_metadata_pii_redaction():
    """Mandate 4: Logs must NEVER contain food text, prompts, notes, or image payloads."""
    dirty_metadata = {
        "item_count": 3,
        "meal_type": "Lunch",
        "prompt": "I had a giant pepperoni pizza with extra cheese",
        "text": "User personal dietary comment",
        "image_base64": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "notes": "Feeling bloated afterwards",
        "user_notes": "Private note",
        "duration_ms": 420.5
    }

    clean = sanitize_metadata(dirty_metadata)

    # Allowed operational metrics
    assert clean["item_count"] == 3
    assert clean["meal_type"] == "Lunch"
    assert clean["duration_ms"] == 420.5

    # Forbidden PII keys MUST be stripped
    for forbidden in FORBIDDEN_PII_KEYS:
        assert forbidden not in clean
    assert "prompt" not in clean
    assert "text" not in clean
    assert "image_base64" not in clean
    assert "notes" not in clean
    assert "user_notes" not in clean
