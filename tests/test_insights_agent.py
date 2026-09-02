from server.agents.longitudinal_insights import longitudinal_insights_agent

def test_compute_aggregates_empty_logs():
    """Verify compute_aggregates returns graceful zero structure on empty logs."""
    aggregates = longitudinal_insights_agent.compute_aggregates([])
    assert aggregates["total_logs"] == 0
    assert aggregates["days_with_logs"] == 0
    assert aggregates["avg_daily_calories"] == 0.0

def test_compute_aggregates_multi_day():
    """Verify statistical aggregation across multiple days."""
    sample_logs = [
        {
            "meal_type": "Breakfast",
            "totals": {"calories": 400.0, "protein_g": 20.0, "carbs_g": 50.0, "fat_g": 10.0},
            "logged_at": "2026-09-01T08:30:00Z"
        },
        {
            "meal_type": "Lunch",
            "totals": {"calories": 600.0, "protein_g": 40.0, "carbs_g": 60.0, "fat_g": 15.0},
            "logged_at": "2026-09-01T13:00:00Z"
        },
        {
            "meal_type": "Dinner",
            "totals": {"calories": 500.0, "protein_g": 30.0, "carbs_g": 40.0, "fat_g": 12.0},
            "logged_at": "2026-09-02T19:30:00Z"
        }
    ]

    aggregates = longitudinal_insights_agent.compute_aggregates(sample_logs)
    assert aggregates["total_logs"] == 3
    assert aggregates["days_with_logs"] == 2
    # Day 1 total: 1000 cals, Day 2 total: 500 cals. Average = (1000 + 500) / 2 = 750
    assert aggregates["avg_daily_calories"] == 750.0
    # Day 1 protein: 60g, Day 2 protein: 30g. Average = 45g
    assert aggregates["avg_daily_protein_g"] == 45.0
