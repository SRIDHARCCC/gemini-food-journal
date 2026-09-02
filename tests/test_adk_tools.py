from server.agents.tools import (
    lookup_nutrition_database_func,
    estimate_portion_grams_func,
    verify_macro_energy_balance_func,
    NUTRITION_DATABASE
)
from server.agents.adk_agent import adk_workflow

def test_nutrition_database_lookup():
    """Verify ADK Tool queries nutritional knowledge base accurately."""
    roti = lookup_nutrition_database_func("Roti")
    assert roti["matched"] is True
    assert roti["per_100g"]["calories"] == 260.0
    assert roti["per_100g"]["protein_g"] == 8.5

    dal = lookup_nutrition_database_func("Moong Dal")
    assert dal["matched"] is True
    assert dal["per_100g"]["protein_g"] == 7.0

def test_portion_grams_estimator():
    """Verify portion estimation tool converts units to realistic weights."""
    assert estimate_portion_grams_func("2 pieces", "Roti") == 80.0
    assert estimate_portion_grams_func("1 medium bowl", "Moong Dal") == 150.0
    assert estimate_portion_grams_func("2 eggs", "Boiled Egg") == 100.0

def test_macro_balance_verifier():
    """Verify caloric formula (protein*4 + carbs*4 + fat*9)."""
    # 20g protein (80 kcal), 50g carbs (200 kcal), 10g fat (90 kcal) -> total 370 kcal
    calc = verify_macro_energy_balance_func(protein_g=20.0, carbs_g=50.0, fat_g=10.0)
    assert calc["calculated_calories"] == 370.0
    assert calc["protein_percent"] == round((80 / 370) * 100, 1)

def test_adk_workflow_grounding():
    """Verify ADK workflow grounds raw items into structured nutritional data."""
    raw_items = [
        {"name": "Roti", "quantity": "2 pieces"},
        {"name": "Moong Dal", "quantity": "1 medium bowl"}
    ]
    grounded = adk_workflow.execute_tool_grounding(raw_items)
    assert len(grounded) == 2
    assert grounded[0]["name"] == "Roti"
    assert grounded[0]["estimated_weight_g"] == 80.0
    assert grounded[1]["name"] == "Moong Dal"
    assert grounded[1]["estimated_weight_g"] == 150.0
