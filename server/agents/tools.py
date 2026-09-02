import logging
from typing import Dict, Any, Optional
from google.adk.tools import FunctionTool

logger = logging.getLogger(__name__)

# Nutritional Knowledge Base (Density per 100g)
NUTRITION_DATABASE: Dict[str, Dict[str, float]] = {
    "roti": {"calories": 260.0, "protein_g": 8.5, "carbs_g": 52.0, "fat_g": 1.5},
    "chapati": {"calories": 260.0, "protein_g": 8.5, "carbs_g": 52.0, "fat_g": 1.5},
    "paratha": {"calories": 320.0, "protein_g": 7.0, "carbs_g": 48.0, "fat_g": 11.0},
    "naan": {"calories": 300.0, "protein_g": 8.7, "carbs_g": 50.0, "fat_g": 6.5},
    "moong dal": {"calories": 105.0, "protein_g": 7.0, "carbs_g": 18.0, "fat_g": 1.0},
    "dal tadka": {"calories": 120.0, "protein_g": 6.5, "carbs_g": 16.0, "fat_g": 3.5},
    "dal makhani": {"calories": 160.0, "protein_g": 5.8, "carbs_g": 15.0, "fat_g": 9.0},
    "steamed rice": {"calories": 130.0, "protein_g": 2.7, "carbs_g": 28.0, "fat_g": 0.3},
    "brown rice": {"calories": 112.0, "protein_g": 2.6, "carbs_g": 23.5, "fat_g": 0.9},
    "paneer": {"calories": 290.0, "protein_g": 18.3, "carbs_g": 3.5, "fat_g": 22.0},
    "paneer tikka": {"calories": 240.0, "protein_g": 16.0, "carbs_g": 6.0, "fat_g": 17.0},
    "chicken breast": {"calories": 165.0, "protein_g": 31.0, "carbs_g": 0.0, "fat_g": 3.6},
    "grilled chicken": {"calories": 180.0, "protein_g": 29.0, "carbs_g": 0.5, "fat_g": 7.0},
    "chicken curry": {"calories": 190.0, "protein_g": 17.0, "carbs_g": 5.0, "fat_g": 11.5},
    "salmon": {"calories": 208.0, "protein_g": 20.4, "carbs_g": 0.0, "fat_g": 13.4},
    "egg": {"calories": 143.0, "protein_g": 12.6, "carbs_g": 0.7, "fat_g": 9.5},
    "boiled egg": {"calories": 155.0, "protein_g": 13.0, "carbs_g": 1.1, "fat_g": 10.6},
    "scrambled eggs": {"calories": 165.0, "protein_g": 11.0, "carbs_g": 1.5, "fat_g": 12.0},
    "oats": {"calories": 389.0, "protein_g": 16.9, "carbs_g": 66.3, "fat_g": 6.9},
    "oatmeal": {"calories": 71.0, "protein_g": 2.5, "carbs_g": 12.0, "fat_g": 1.4},
    "greek yogurt": {"calories": 59.0, "protein_g": 10.0, "carbs_g": 3.6, "fat_g": 0.4},
    "curd": {"calories": 98.0, "protein_g": 11.0, "carbs_g": 3.4, "fat_g": 4.3},
    "avocado": {"calories": 160.0, "protein_g": 2.0, "carbs_g": 8.5, "fat_g": 14.7},
    "banana": {"calories": 89.0, "protein_g": 1.1, "carbs_g": 22.8, "fat_g": 0.3},
    "apple": {"calories": 52.0, "protein_g": 0.3, "carbs_g": 13.8, "fat_g": 0.2},
    "almonds": {"calories": 579.0, "protein_g": 21.2, "carbs_g": 21.6, "fat_g": 49.9},
    "walnuts": {"calories": 654.0, "protein_g": 15.2, "carbs_g": 13.7, "fat_g": 65.2},
    "broccoli": {"calories": 34.0, "protein_g": 2.8, "carbs_g": 6.6, "fat_g": 0.4},
    "cucumber salad": {"calories": 25.0, "protein_g": 0.8, "carbs_g": 4.0, "fat_g": 0.5},
    "green salad": {"calories": 20.0, "protein_g": 1.2, "carbs_g": 3.5, "fat_g": 0.2},
    "dosa": {"calories": 165.0, "protein_g": 3.9, "carbs_g": 28.0, "fat_g": 4.2},
    "idli": {"calories": 140.0, "protein_g": 4.0, "carbs_g": 30.0, "fat_g": 0.4},
    "sambar": {"calories": 65.0, "protein_g": 2.8, "carbs_g": 10.5, "fat_g": 1.2},
    "coconut chutney": {"calories": 210.0, "protein_g": 2.5, "carbs_g": 7.0, "fat_g": 20.0},
    "coffee with milk": {"calories": 35.0, "protein_g": 1.5, "carbs_g": 3.5, "fat_g": 1.5},
    "black coffee": {"calories": 2.0, "protein_g": 0.3, "carbs_g": 0.0, "fat_g": 0.0},
    "milk": {"calories": 62.0, "protein_g": 3.2, "carbs_g": 4.8, "fat_g": 3.4},
    "almond milk": {"calories": 17.0, "protein_g": 0.6, "carbs_g": 0.6, "fat_g": 1.5},
    "chia seeds": {"calories": 486.0, "protein_g": 16.5, "carbs_g": 42.1, "fat_g": 30.7},
}

def lookup_nutrition_database_func(food_name: str) -> Dict[str, Any]:
    """
    Looks up standard nutritional density (calories, protein, carbs, fat per 100g) for a given food.
    """
    clean_name = food_name.lower().strip()
    # Exact match
    if clean_name in NUTRITION_DATABASE:
        return {"food": food_name, "per_100g": NUTRITION_DATABASE[clean_name], "matched": True}

    # Partial substring match
    for key, val in NUTRITION_DATABASE.items():
        if key in clean_name or clean_name in key:
            return {"food": food_name, "per_100g": val, "matched": True, "matched_key": key}

    # Generic estimate fallback
    return {
        "food": food_name,
        "per_100g": {"calories": 150.0, "protein_g": 5.0, "carbs_g": 20.0, "fat_g": 4.0},
        "matched": False,
        "note": "Standard composite estimate used."
    }

def estimate_portion_grams_func(quantity_description: str, food_name: str) -> float:
    """
    Converts portion descriptors (e.g. '2 pieces', '1 bowl', '1 cup', '1 slice', '1 fillet') to grams.
    """
    q = quantity_description.lower().strip()
    food = food_name.lower().strip()

    # Base portions
    if "roti" in food or "chapati" in food:
        count = 2 if "2" in q else (3 if "3" in q else 1)
        return float(count * 40)
    if "paratha" in food:
        count = 2 if "2" in q else 1
        return float(count * 80)
    if "egg" in food:
        count = 2 if "2" in q else (3 if "3" in q else 1)
        return float(count * 50)
    if "dosa" in food:
        count = 2 if "2" in q else 1
        return float(count * 90)
    if "idli" in food:
        count = 2 if "2" in q else (3 if "3" in q else 1)
        return float(count * 40)
    if "bowl" in q or "katori" in q:
        return 150.0 if "medium" in q or not ("large" in q or "small" in q) else (200.0 if "large" in q else 100.0)
    if "cup" in q:
        return 200.0
    if "slice" in q or "piece" in q:
        count = 2 if "2" in q else (3 if "3" in q else 1)
        return float(count * 35)
    if "fillet" in q or "breast" in q:
        return 180.0
    if "tbsp" in q or "spoon" in q:
        return 20.0
    if "handful" in q or "serving" in q:
        return 30.0

    return 100.0

def verify_macro_energy_balance_func(protein_g: float, carbs_g: float, fat_g: float) -> Dict[str, Any]:
    """
    Calculates exact caloric density: (protein * 4) + (carbs * 4) + (fat * 9).
    """
    calculated_cals = (protein_g * 4.0) + (carbs_g * 4.0) + (fat_g * 9.0)
    total_g = max(0.1, protein_g + carbs_g + fat_g)
    return {
        "calculated_calories": round(calculated_cals, 1),
        "protein_percent": round((protein_g * 4.0 / calculated_cals) * 100, 1) if calculated_cals > 0 else 0,
        "carbs_percent": round((carbs_g * 4.0 / calculated_cals) * 100, 1) if calculated_cals > 0 else 0,
        "fat_percent": round((fat_g * 9.0 / calculated_cals) * 100, 1) if calculated_cals > 0 else 0,
    }

# ADK Function Tools
nutrition_lookup_tool = FunctionTool(lookup_nutrition_database_func)
portion_estimator_tool = FunctionTool(estimate_portion_grams_func)
macro_balance_tool = FunctionTool(verify_macro_energy_balance_func)

__all__ = [
    "nutrition_lookup_tool",
    "portion_estimator_tool",
    "macro_balance_tool",
    "lookup_nutrition_database_func",
    "estimate_portion_grams_func",
    "verify_macro_energy_balance_func",
    "NUTRITION_DATABASE"
]
