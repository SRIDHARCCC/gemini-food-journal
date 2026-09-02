import pytest
from server.models.schemas import MealItem, MealParseResponse
from server.agents.nutrition_grounding import nutrition_grounding_agent

def test_meal_parse_response_validation():
    """Verify MealParseResponse validates correctly against schema."""
    item1 = MealItem(
        name="Roti",
        quantity="2 pieces",
        estimated_weight_g=80.0,
        calories=240.0,
        protein_g=6.0,
        carbs_g=48.0,
        fat_g=2.0
    )
    item2 = MealItem(
        name="Dal Tadka",
        quantity="1 medium bowl",
        estimated_weight_g=150.0,
        calories=180.0,
        protein_g=9.0,
        carbs_g=24.0,
        fat_g=5.0
    )

    response = MealParseResponse(
        meal_type="Lunch",
        confidence_score=0.95,
        items=[item1, item2],
        total_calories=420.0,
        total_protein_g=15.0,
        total_carbs_g=72.0,
        total_fat_g=7.0,
        summary_note="Nutrient-dense vegetarian lunch with balanced carbs and protein."
    )

    assert response.meal_type == "Lunch"
    assert response.confidence_score == 0.95
    assert len(response.items) == 2
    assert response.total_calories == 420.0

def test_nutrition_grounding_refinement():
    """Verify NutritionGroundingAgent checks and recalculates macro sums."""
    item1 = MealItem(name="Item A", quantity="1", calories=100.0, protein_g=10.0, carbs_g=10.0, fat_g=2.0)
    item2 = MealItem(name="Item B", quantity="1", calories=200.0, protein_g=15.0, carbs_g=20.0, fat_g=5.0)

    # Initial response with slightly desynced total
    response = MealParseResponse(
        meal_type="Dinner",
        confidence_score=0.9,
        items=[item1, item2],
        total_calories=250.0, # Off total
        total_protein_g=20.0,
        total_carbs_g=30.0,
        total_fat_g=7.0,
        summary_note="Test note"
    )

    grounded = nutrition_grounding_agent.validate_and_refine(response)

    # Should be corrected to sum of items
    assert grounded.total_calories == 300.0
    assert grounded.total_protein_g == 25.0
    assert grounded.total_carbs_g == 30.0
    assert grounded.total_fat_g == 7.0
