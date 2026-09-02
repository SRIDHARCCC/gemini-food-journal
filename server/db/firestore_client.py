import os
import time
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from google.cloud import firestore
from server.config import settings

logger = logging.getLogger(__name__)

class FirestoreService:
    def __init__(self):
        self.project_id = settings.PROJECT_ID
        self.client: Optional[firestore.Client] = None
        self._in_memory_db: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self._init_client()

    def _init_client(self):
        try:
            self.client = firestore.Client(project=self.project_id)
            logger.info(f"Firestore Client initialized successfully for project: {self.project_id}")
        except Exception as e:
            logger.warning(f"Firestore Client initialization with ADC deferred/offline mode: {e}")
            self.client = None

    def save_food_log(self, uid: str, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mandate 3 & 4: Writes strictly to users/{uid}/food_logs/{logId}.
        """
        if not uid:
            raise ValueError("User ID cannot be empty.")

        log_id = log_data.get("id") or str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        doc_payload = {
            **log_data,
            "id": log_id,
            "user_id": uid,
            "user_confirmed": True,
            "created_at": log_data.get("created_at") or now_iso,
            "logged_at": log_data.get("logged_at") or now_iso,
        }

        if self.client:
            try:
                doc_ref = self.client.collection("users").document(uid).collection("food_logs").document(log_id)
                doc_ref.set(doc_payload)
                return doc_payload
            except Exception as e:
                logger.error(f"Firestore save error: {e}. Falling back to memory store.")

        # In-memory store fallback
        if uid not in self._in_memory_db:
            self._in_memory_db[uid] = {"food_logs": {}, "insights": {}}
        self._in_memory_db[uid]["food_logs"][log_id] = doc_payload
        return doc_payload

    def get_food_logs(
        self,
        uid: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieves user-scoped food logs within an optional date range.
        """
        if not uid:
            raise ValueError("User ID cannot be empty.")

        if self.client:
            try:
                col_ref = self.client.collection("users").document(uid).collection("food_logs")
                query = col_ref.order_by("logged_at", direction=firestore.Query.DESCENDING).limit(limit)
                
                docs = query.stream()
                results = [doc.to_dict() for doc in docs]

                # Filter by date if provided
                if start_date or end_date:
                    filtered = []
                    for r in results:
                        log_date = r.get("logged_at", "")[:10]
                        if start_date and log_date < start_date:
                            continue
                        if end_date and log_date > end_date:
                            continue
                        filtered.append(r)
                    return filtered
                return results
            except Exception as e:
                logger.error(f"Firestore get error: {e}. Falling back to memory store.")

        # In-memory store fallback
        user_store = self._in_memory_db.get(uid, {}).get("food_logs", {})
        logs = list(user_store.values())
        logs.sort(key=lambda x: x.get("logged_at", ""), reverse=True)

        if start_date or end_date:
            filtered = []
            for r in logs:
                log_date = r.get("logged_at", "")[:10]
                if start_date and log_date < start_date:
                    continue
                if end_date and log_date > end_date:
                    continue
                filtered.append(r)
            return filtered[:limit]
        return logs[:limit]

    def delete_food_log(self, uid: str, log_id: str) -> bool:
        """
        Deletes a food log entry strictly belonging to users/{uid}/food_logs/{logId}.
        """
        if not uid or not log_id:
            return False

        if self.client:
            try:
                doc_ref = self.client.collection("users").document(uid).collection("food_logs").document(log_id)
                doc_ref.delete()
                return True
            except Exception as e:
                logger.error(f"Firestore delete error: {e}")

        # Memory store fallback
        if uid in self._in_memory_db and log_id in self._in_memory_db[uid].get("food_logs", {}):
            del self._in_memory_db[uid]["food_logs"][log_id]
            return True
        return False

    def save_insight(self, uid: str, insight_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Caches generated longitudinal insights under users/{uid}/insights/{insightId}.
        """
        if not uid:
            raise ValueError("User ID cannot be empty.")

        insight_id = insight_data.get("id") or str(uuid.uuid4())
        doc_payload = {
            **insight_data,
            "id": insight_id,
            "user_id": uid,
            "generated_at": insight_data.get("generated_at") or datetime.now(timezone.utc).isoformat()
        }

        if self.client:
            try:
                doc_ref = self.client.collection("users").document(uid).collection("insights").document(insight_id)
                doc_ref.set(doc_payload)
                return doc_payload
            except Exception as e:
                logger.error(f"Firestore save insight error: {e}")

        if uid not in self._in_memory_db:
            self._in_memory_db[uid] = {"food_logs": {}, "insights": {}}
        self._in_memory_db[uid]["insights"][insight_id] = doc_payload
        return doc_payload

    def get_latest_insight(self, uid: str, timeframe: str = "Last 7 Days") -> Optional[Dict[str, Any]]:
        """
        Retrieves the most recent cached insight for the user.
        """
        if not uid:
            return None

        if self.client:
            try:
                col_ref = self.client.collection("users").document(uid).collection("insights")
                query = col_ref.where("timeframe", "==", timeframe).order_by(
                    "generated_at", direction=firestore.Query.DESCENDING
                ).limit(1)
                docs = list(query.stream())
                if docs:
                    return docs[0].to_dict()
            except Exception as e:
                logger.error(f"Firestore get insight error: {e}")

        # Memory store fallback
        insights = list(self._in_memory_db.get(uid, {}).get("insights", {}).values())
        matching = [i for i in insights if i.get("timeframe") == timeframe]
        if matching:
            matching.sort(key=lambda x: x.get("generated_at", ""), reverse=True)
            return matching[0]
        return None

# Singleton instance
firestore_service = FirestoreService()
