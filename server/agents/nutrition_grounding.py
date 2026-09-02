import logging
from typing import List
from server.models.schemas import MealItem, MealParseResponse

logger = logging.getLogger(__name__)

class NutritionGroundingAgent:
    """
    Validates and cross-checks macronutrient balance and caloric mathematical integrity.
    Assures 4 kcal/g protein, 4 kcal/g carb, 9 kcal/g fat constraints.
    """

    def validate_and_refine(self, parsed: MealParseResponse) -> MealParseResponse:
        """
        Ensures totals match the sum of items and checks consistency.
        """
        calc_cals = sum(item.calories for item in parsed.items)
        calc_protein = sum(item.protein_g for item in parsed.items)
        calc_carbs = sum(item.carbs_g for item in parsed.items)
        calc_fat = sum(item.fat_g for item in parsed.items)

        # Update totals if discrepancy detected
        parsed.total_calories = round(calc_cals, 1)
        parsed.total_protein_g = round(calc_protein, 1)
        parsed.total_carbs_g = round(calc_carbs, 1)
        parsed.total_fat_g = round(calc_fat, 1)

        # Macro energy check: (protein * 4) + (carbs * 4) + (fat * 9)
        macro_cals = (calc_protein * 4.0) + (calc_carbs * 4.0) + (calc_fat * 9.0)
        
        # If difference > 20% due to rough item estimates, smooth summary note
        if parsed.total_calories > 0 and abs(macro_cals - parsed.total_calories) / parsed.total_calories > 0.25:
            logger.info("Macro energy divergence noted; adjusted total calories to grounded macro sum.")
            parsed.total_calories = round(macro_cals, 1)

        return parsed

nutrition_grounding_agent = NutritionGroundingAgent()
