import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from server.auth.firebase_auth import get_current_user
from server.models.schemas import MealParseRequest, MealParseResponse
from server.agents.orchestrator import orchestrator
from server.telemetry.structured_logger import log_event

router = APIRouter(prefix="/api", tags=["Parse"])

@router.post("/parse", response_model=MealParseResponse)
async def parse_meal(
    request: MealParseRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    x_cloud_trace_context: Optional[str] = Header(None)
):
    """
    Multimodal Meal Parser Endpoint.
    Analyzes text and/or plate image using Gemini 3.7 Flash on Vertex AI (thinking_level='medium').
    Produces a provisional draft (Mandate 5: Draft & Verify Loop).
    """
    user_id = current_user["uid"]
    start_time = time.time()

    if not request.text and not request.image_base64:
        raise HTTPException(
            status_code=400,
            detail="Either 'text' description or 'image_base64' payload is required."
        )

    try:
        draft_response, metrics = await orchestrator.process_meal_input(request)
        duration_ms = (time.time() - start_time) * 1000

        # Log sanitized telemetry (Mandate 4: NEVER log prompt text, food items, or image payload)
        log_event(
            event_type="MEAL_PARSED",
            severity="INFO",
            user_id=user_id,
            duration_ms=duration_ms,
            trace_id=x_cloud_trace_context,
            model_metrics=metrics,
            metadata={
                "item_count": len(draft_response.items),
                "has_image": bool(request.image_base64),
                "has_text": bool(request.text),
                "meal_type": draft_response.meal_type,
                "confidence_score": draft_response.confidence_score
            }
        )

        return draft_response

    except Exception as e:
        log_event(
            event_type="PARSE_ERROR",
            severity="ERROR",
            user_id=user_id,
            trace_id=x_cloud_trace_context,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse meal: {str(e)}"
        )
