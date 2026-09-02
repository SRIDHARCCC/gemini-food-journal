import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from server.auth.firebase_auth import get_current_user
from server.models.schemas import LongitudinalInsightsResponse
from server.db.firestore_client import firestore_service
from server.agents.orchestrator import orchestrator
from server.telemetry.structured_logger import log_event

router = APIRouter(prefix="/api/insights", tags=["Insights"])

@router.get("", response_model=LongitudinalInsightsResponse)
async def get_insights(
    range: str = Query("7d", pattern="^(7d|30d)$"),
    force_refresh: bool = Query(False),
    current_user: Dict[str, Any] = Depends(get_current_user),
    x_cloud_trace_context: Optional[str] = Header(None)
):
    """
    Longitudinal Insights Engine Endpoint.
    Analyzes multi-day food logs using Gemini 3.7 Flash with thinking_level='high' on Vertex AI.
    """
    user_id = current_user["uid"]
    start_time = time.time()
    timeframe_label = "Last 7 Days" if range == "7d" else "Last 30 Days"
    days_back = 7 if range == "7d" else 30

    # Check cached insight if not forcing refresh
    if not force_refresh:
        cached = firestore_service.get_latest_insight(uid=user_id, timeframe=timeframe_label)
        if cached:
            # If generated within last 4 hours, return cached
            gen_time_str = cached.get("generated_at")
            if gen_time_str:
                try:
                    gen_time = datetime.fromisoformat(gen_time_str)
                    if (datetime.now(timezone.utc) - gen_time).total_seconds() < 14400:
                        return cached
                except Exception:
                    pass

    # Query bounded range of logs from Firestore
    now = datetime.now(timezone.utc)
    start_date_str = (now - timedelta(days=days_back)).strftime("%Y-%m-%d")
    end_date_str = now.strftime("%Y-%m-%d")

    logs = firestore_service.get_food_logs(
        uid=user_id,
        start_date=start_date_str,
        end_date=end_date_str,
        limit=300
    )

    try:
        insights_res, metrics = await orchestrator.process_insights_request(
            timeframe=timeframe_label,
            logs=logs
        )
        duration_ms = (time.time() - start_time) * 1000

        # Save to Firestore users/{uid}/insights/{insightId}
        firestore_service.save_insight(uid=user_id, insight_data=insights_res.model_dump())

        # Telemetry logging (Mandate 4: Strip PII, log only operational metrics)
        log_event(
            event_type="INSIGHTS_GENERATED",
            severity="INFO",
            user_id=user_id,
            duration_ms=duration_ms,
            trace_id=x_cloud_trace_context,
            model_metrics=metrics,
            metadata={
                "timeframe": timeframe_label,
                "logs_analyzed": len(logs),
                "overall_score": insights_res.overall_score,
                "macro_status": insights_res.macro_balance.status
            }
        )

        return insights_res

    except Exception as e:
        log_event(
            event_type="INSIGHTS_ERROR",
            severity="ERROR",
            user_id=user_id,
            trace_id=x_cloud_trace_context,
            error_message=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate longitudinal insights: {str(e)}"
        )
