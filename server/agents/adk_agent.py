import logging
from typing import Dict, Any, List, Optional
from google.adk import Agent, Context, Event
from google.adk.tools import FunctionTool
from server.agents.tools import (
    nutrition_lookup_tool,
    portion_estimator_tool,
    macro_balance_tool,
    lookup_nutrition_database_func,
    estimate_portion_grams_func,
    verify_macro_energy_balance_func
)
from server.config import settings

logger = logging.getLogger(__name__)

# System Instructions for the Google ADK Agent
ADK_AGENT_INSTRUCTION = """You are the Primary Nutrition Grounding Agent in the Google Agent Development Kit (ADK) system.
Your job is to deconstruct meals, look up nutritional density from your tools, estimate accurate gram weights, and verify that caloric calculations adhere to standard physiological energy constants (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat).
"""

# Define the Google ADK LlmAgent equipped with FunctionTools
try:
    food_nutrition_adk_agent = Agent(
        name="FoodNutritionADKAgent",
        instruction=ADK_AGENT_INSTRUCTION,
        tools=[
            nutrition_lookup_tool,
            portion_estimator_tool,
            macro_balance_tool,
        ],
    )
    logger.info("Google ADK FoodNutritionADKAgent initialized with 3 FunctionTools.")
except Exception as e:
    logger.warning(f"ADK Agent initialization notice: {e}")
    food_nutrition_adk_agent = None

class ADKAgentWorkflow:
    """
    Google ADK Workflow Orchestrator coordinating meal ingestion and tool execution.
    """
    def __init__(self):
        self.agent = food_nutrition_adk_agent
        self.nutrition_lookup = lookup_nutrition_database_func
        self.portion_estimator = estimate_portion_grams_func
        self.macro_verifier = verify_macro_energy_balance_func

    def execute_tool_grounding(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Executes ADK tool grounding for each parsed item.
        """
        grounded_items = []
        for item in items:
            name = item.get("name", "")
            qty = item.get("quantity", "1 serving")
            weight = item.get("estimated_weight_g") or self.portion_estimator(qty, name)
            
            # Query ADK tool
            nutr = self.nutrition_lookup(name)["per_100g"]
            factor = weight / 100.0

            cals = item.get("calories") or (nutr["calories"] * factor)
            prot = item.get("protein_g") or (nutr["protein_g"] * factor)
            carbs = item.get("carbs_g") or (nutr["carbs_g"] * factor)
            fat = item.get("fat_g") or (nutr["fat_g"] * factor)

            grounded_items.append({
                "name": name,
                "quantity": qty,
                "estimated_weight_g": round(weight, 1),
                "calories": round(cals, 1),
                "protein_g": round(prot, 1),
                "carbs_g": round(carbs, 1),
                "fat_g": round(fat, 1)
            })

        return grounded_items

adk_workflow = ADKAgentWorkflow()

__all__ = ["food_nutrition_adk_agent", "adk_workflow", "ADKAgentWorkflow"]
