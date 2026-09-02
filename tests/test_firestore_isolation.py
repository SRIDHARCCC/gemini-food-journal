from server.db.firestore_client import FirestoreService

def test_multi_tenant_isolation():
    """Mandate 3: Strict isolation between users/{userA} and users/{userB}."""
    service = FirestoreService()
    user_a = "user_alpha_1"
    user_b = "user_beta_2"

    # User A logs meal
    log_a = service.save_food_log(
        uid=user_a,
        log_data={
            "meal_type": "Breakfast",
            "items": [{"name": "Oatmeal", "quantity": "1 cup", "calories": 150, "protein_g": 5, "carbs_g": 27, "fat_g": 2.5}],
            "totals": {"calories": 150, "protein_g": 5, "carbs_g": 27, "fat_g": 2.5},
            "logged_at": "2026-09-01T08:00:00Z"
        }
    )

    # User B logs meal
    log_b = service.save_food_log(
        uid=user_b,
        log_data={
            "meal_type": "Dinner",
            "items": [{"name": "Grilled Salmon", "quantity": "1 fillet", "calories": 300, "protein_g": 34, "carbs_g": 0, "fat_g": 18}],
            "totals": {"calories": 300, "protein_g": 34, "carbs_g": 0, "fat_g": 18},
            "logged_at": "2026-09-01T19:00:00Z"
        }
    )

    # Query User A logs
    logs_a = service.get_food_logs(uid=user_a)
    assert len(logs_a) == 1
    assert logs_a[0]["id"] == log_a["id"]
    assert logs_a[0]["items"][0]["name"] == "Oatmeal"

    # Query User B logs
    logs_b = service.get_food_logs(uid=user_b)
    assert len(logs_b) == 1
    assert logs_b[0]["id"] == log_b["id"]
    assert logs_b[0]["items"][0]["name"] == "Grilled Salmon"

    # Ensure cross-tenant data leakage is zero
    assert log_b["id"] not in [l["id"] for l in logs_a]
    assert log_a["id"] not in [l["id"] for l in logs_b]

def test_delete_food_log_isolation():
    """Ensure user cannot delete another user's logs."""
    service = FirestoreService()
    user_a = "user_alpha_del"
    user_b = "user_beta_del"

    log_a = service.save_food_log(
        uid=user_a,
        log_data={"meal_type": "Lunch", "items": [], "totals": {"calories": 100, "protein_g": 2, "carbs_g": 10, "fat_g": 1}}
    )

    # Attempt delete as User B
    deleted_by_b = service.delete_food_log(uid=user_b, log_id=log_a["id"])
    assert deleted_by_b is False

    # Still exists for User A
    assert len(service.get_food_logs(uid=user_a)) == 1

    # User A deletes their own log
    deleted_by_a = service.delete_food_log(uid=user_a, log_id=log_a["id"])
    assert deleted_by_a is True
    assert len(service.get_food_logs(uid=user_a)) == 0
