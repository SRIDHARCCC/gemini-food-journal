import time
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from server.auth.firebase_auth import get_current_user
from server.models.schemas import LogConfirmRequest, FoodLogEntry, DailyMacroSummary
from server.db.firestore_client import firestore_service
from server.telemetry.structured_logger import log_event

router = APIRouter(prefix="/api/logs", tags=["Food Logs"])

@router.post("/confirm", response_model=FoodLogEntry)
async def confirm_food_log(
    request: LogConfirmRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    x_cloud_trace_context: Optional[str] = Header(None)
):
    """
    Mandate 5: User Confirmation Endpoint.
    Commits validated nutritional items into Firestore users/{uid}/food_logs/{logId}.
    """
    user_id = current_user["uid"]
    start_time = time.time()

    if not request.items:
        raise HTTPException(status_code=400, detail="Cannot confirm an empty food log.")

    payload = {
        "meal_type": request.meal_type,
        "items": [item.model_dump() for item in request.items],
        "totals": {
            "calories": request.total_calories,
            "protein_g": request.total_protein_g,
            "carbs_g": request.total_carbs_g,
            "fat_g": request.total_fat_g,
        },
        "summary_note": request.summary_note,
        "notes": request.notes,
        "logged_at": request.logged_at.isoformat() if request.logged_at else None,
    }

    try:
        saved_entry = firestore_service.save_food_log(uid=user_id, log_data=payload)
        duration_ms = (time.time() - start_time) * 1000

        # Telemetry logging (Mandate 4: Strip PII, log only metadata & hashed UID)
        log_event(
            event_type="LOG_COMMITTED",
            severity="INFO",
            user_id=user_id,
            duration_ms=duration_ms,
            trace_id=x_cloud_trace_context,
            metadata={
                "item_count": len(request.items),
                "meal_type": request.meal_type,
                "total_calories": request.total_calories
            }
        )

        return saved_entry
    except Exception as e:
        log_event(
            event_type="DB_ERROR",
            severity="ERROR",
            user_id=user_id,
            trace_id=x_cloud_trace_context,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Failed to persist food log: {str(e)}")

@router.get("", response_model=List[FoodLogEntry])
async def get_food_logs(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    limit: int = Query(100, ge=1, le=500),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves user-isolated food logs under users/{uid}/food_logs.
    """
    user_id = current_user["uid"]
    logs = firestore_service.get_food_logs(
        uid=user_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )
    return logs

@router.get("/summary", response_model=DailyMacroSummary)
async def get_daily_summary(
    date: Optional[str] = Query(None, description="YYYY-MM-DD (defaults to today)"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Calculates aggregated macros and totals for a given day.
    """
    user_id = current_user["uid"]
    target_date = date or time.strftime("%Y-%m-%d")

    logs = firestore_service.get_food_logs(
        uid=user_id,
        start_date=target_date,
        end_date=target_date,
        limit=100
    )

    total_cals = sum(l.get("totals", {}).get("calories", 0.0) for l in logs)
    total_prot = sum(l.get("totals", {}).get("protein_g", 0.0) for l in logs)
    total_carbs = sum(l.get("totals", {}).get("carbs_g", 0.0) for l in logs)
    total_fat = sum(l.get("totals", {}).get("fat_g", 0.0) for l in logs)

    return DailyMacroSummary(
        date=target_date,
        total_calories=round(total_cals, 1),
        total_protein_g=round(total_prot, 1),
        total_carbs_g=round(total_carbs, 1),
        total_fat_g=round(total_fat, 1),
        log_count=len(logs),
        logs=[FoodLogEntry.model_validate(l) for l in logs]
    )

@router.delete("/{log_id}")
async def delete_food_log(
    log_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes a food log entry strictly belonging to the authenticated user.
    """
    user_id = current_user["uid"]
    success = firestore_service.delete_food_log(uid=user_id, log_id=log_id)
    if not success:
        raise HTTPException(status_code=404, detail="Food log entry not found or permission denied.")
    return {"message": "Food log deleted successfully", "id": log_id}
