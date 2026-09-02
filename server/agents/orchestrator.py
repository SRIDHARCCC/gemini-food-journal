import logging
from typing import Optional, Dict, Any, Tuple
from server.agents.meal_parser import meal_parser_agent
from server.agents.nutrition_grounding import nutrition_grounding_agent
from server.agents.longitudinal_insights import longitudinal_insights_agent
from server.agents.adk_agent import adk_workflow
from server.models.schemas import MealParseRequest, MealParseResponse, LongitudinalInsightsResponse

logger = logging.getLogger(__name__)

class FoodJournalOrchestrator:
    """
    Google ADK Food Journal Agent Orchestrator.
    Manages multimodal ingestion pipeline:
    1. Multimodal Parse (Gemini on Vertex AI via Google ADK)
    2. ADK Tool-grounded Nutritional Database lookup & Portions
    3. Mathematical Consistency validation
    4. Draft response preparation for client verification
    """

    def __init__(self):
        self.parser = meal_parser_agent
        self.grounding = nutrition_grounding_agent
        self.insights = longitudinal_insights_agent
        self.adk_flow = adk_workflow

    async def process_meal_input(
        self,
        request: MealParseRequest
    ) -> Tuple[MealParseResponse, Dict[str, Any]]:
        """
        Executes the ADK meal ingestion pipeline:
        Multimodal Parse -> ADK Tool Grounding -> Nutrition Consistency -> Provisional Draft.
        """
        # Step 1: Multimodal Parse
        raw_draft, metrics = await self.parser.parse_meal(
            text_prompt=request.text,
            image_base64=request.image_base64,
            image_mime_type=request.image_mime_type,
            meal_type_hint=request.meal_type_hint,
        )

        # Step 2: Grounding & Consistency Check
        grounded_draft = self.grounding.validate_and_refine(raw_draft)

        return grounded_draft, metrics

    async def process_insights_request(
        self,
        timeframe: str,
        logs: list
    ) -> Tuple[LongitudinalInsightsResponse, Dict[str, Any]]:
        """
        Executes longitudinal analysis with Gemini on Vertex AI.
        """
        return await self.insights.generate_insights(timeframe=timeframe, logs=logs)

orchestrator = FoodJournalOrchestrator()
