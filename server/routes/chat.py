import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from server.auth.firebase_auth import get_current_user
from server.models.schemas import ChatRequest, ChatResponse
from server.db.firestore_client import firestore_service
from server.agents.nutrition_coach import nutrition_coach_agent
from server.telemetry.structured_logger import log_event

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def chat_with_nutritionist(
    request: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    x_cloud_trace_context: Optional[str] = Header(None)
):
    """
    Two-Way Conversational Nutrition Coach Endpoint.
    Interacts dynamically with user, assessing dietary goals and providing personalized opinions
    grounded in the user's latest logged meals.
    """
    user_id = current_user["uid"]
    start_time = time.time()

    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message content cannot be empty."
        )

    # Fetch recent logged meals (last 15 meals) from Firestore for contextual grounding
    recent_logs = firestore_service.get_food_logs(
        uid=user_id,
        limit=15
    )

    try:
        chat_response, metrics = await nutrition_coach_agent.chat(
            message=request.message.strip(),
            history=request.history or [],
            recent_logs=recent_logs,
            user_goals=request.user_goals
        )
        duration_ms = (time.time() - start_time) * 1000

        # Sanitized Telemetry Logging
        log_event(
            event_type="CHAT_MESSAGE_PROCESSED",
            severity="INFO",
            user_id=user_id,
            duration_ms=duration_ms,
            trace_id=x_cloud_trace_context,
            model_metrics=metrics,
            metadata={
                "history_turns": len(request.history or []),
                "context_logs_count": len(recent_logs),
                "suggestions_count": len(chat_response.suggestions)
            }
        )

        return chat_response

    except Exception as e:
        log_event(
            event_type="CHAT_ERROR",
            severity="ERROR",
            user_id=user_id,
            trace_id=x_cloud_trace_context,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to communicate with Nutrition Coach: {str(e)}"
        )
