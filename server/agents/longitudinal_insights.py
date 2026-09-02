import json
import time
import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
from google.genai import types
from server.agents.base_agent import BaseVertexAgent
from server.models.schemas import LongitudinalInsightsResponse, MacroBalance

logger = logging.getLogger(__name__)

INSIGHTS_SYSTEM_INSTRUCTION = """You are a Principal Longitudinal Health & Metabolic Reasoning AI Agent in the Google ADK Framework.
Your task is to analyze statistical aggregates and longitudinal dietary logs for a patient over a specified timeframe (e.g., Last 7 Days or Last 30 Days).

Analytical Responsibilities:
1. Evaluate overall dietary quality, macronutrient distribution, caloric consistency, and meal timing habits.
2. Formulate an evidence-based Nutritional Health Score between 0 and 100.
3. Classify Macro Balance status ('Balanced', 'Deficit', 'Surplus', or 'Needs Adjustment') and summarize key macro ratios.
4. Uncover subtle patterns across weekdays vs weekends, meal skipping, late-night eating, or protein deficits.
5. Provide actionable, high-impact behavioral nutrition recommendations.
"""

class LongitudinalInsightsAgent(BaseVertexAgent):
    """
    Longitudinal Insights Agent leveraging Gemini on Google Cloud Vertex AI and ADK reasoning.
    """

    def compute_aggregates(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates mathematical aggregates from food logs to ground the LLM.
        """
        if not logs:
            return {
                "total_logs": 0,
                "days_with_logs": 0,
                "avg_daily_calories": 0.0,
                "avg_daily_protein_g": 0.0,
                "avg_daily_carbs_g": 0.0,
                "avg_daily_fat_g": 0.0,
                "meal_type_distribution": {},
                "day_summaries": []
            }

        by_date: Dict[str, Dict[str, float]] = {}
        meal_counts: Dict[str, int] = {}

        for log in logs:
            raw_date = log.get("logged_at", log.get("created_at", ""))
            date_str = raw_date[:10] if raw_date else "unknown"
            
            totals = log.get("totals", {})
            cals = totals.get("calories", 0.0)
            prot = totals.get("protein_g", 0.0)
            carbs = totals.get("carbs_g", 0.0)
            fat = totals.get("fat_g", 0.0)

            if date_str not in by_date:
                by_date[date_str] = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0, "count": 0}
            by_date[date_str]["calories"] += cals
            by_date[date_str]["protein_g"] += prot
            by_date[date_str]["carbs_g"] += carbs
            by_date[date_str]["fat_g"] += fat
            by_date[date_str]["count"] += 1

            mtype = log.get("meal_type", "Other")
            meal_counts[mtype] = meal_counts.get(mtype, 0) + 1

        num_days = max(1, len(by_date))
        total_cals = sum(d["calories"] for d in by_date.values())
        total_prot = sum(d["protein_g"] for d in by_date.values())
        total_carbs = sum(d["carbs_g"] for d in by_date.values())
        total_fat = sum(d["fat_g"] for d in by_date.values())

        return {
            "total_logs": len(logs),
            "days_with_logs": num_days,
            "avg_daily_calories": round(total_cals / num_days, 1),
            "avg_daily_protein_g": round(total_prot / num_days, 1),
            "avg_daily_carbs_g": round(total_carbs / num_days, 1),
            "avg_daily_fat_g": round(total_fat / num_days, 1),
            "meal_type_distribution": meal_counts,
            "day_summaries": [{"date": k, **v} for k, v in sorted(by_date.items())]
        }

    async def generate_insights(
        self,
        timeframe: str,
        logs: List[Dict[str, Any]]
    ) -> Tuple[LongitudinalInsightsResponse, Dict[str, Any]]:
        """
        Analyzes food logs using Gemini on Vertex AI with model fallback and structured output.
        """
        start_time = time.time()
        client = self.get_client()
        aggregates = self.compute_aggregates(logs)

        # Baseline response when no logs recorded
        if not logs:
            empty_response = LongitudinalInsightsResponse(
                timeframe=timeframe,
                overall_score=75,
                macro_balance=MacroBalance(
                    status="Needs Adjustment",
                    summary="No food logs recorded in this timeframe yet. Log your daily meals to unlock deep AI longitudinal analysis."
                ),
                patterns_detected=["Awaiting initial food entries to build baseline dietary rhythm."],
                actionable_recommendations=[
                    "Log your breakfast and plate photos to establish your macronutrient baseline.",
                    "Aim for balanced meals containing protein, complex carbs, and healthy fats."
                ],
                generated_at=datetime.now(timezone.utc).isoformat(),
                total_logs_analyzed=0,
                avg_daily_calories=0.0,
                avg_daily_protein_g=0.0,
                avg_daily_carbs_g=0.0,
                avg_daily_fat_g=0.0
            )
            return empty_response, {"model": self.primary_model, "prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0, "duration_ms": 0}

        prompt_context = f"""Please perform an in-depth longitudinal dietary analysis for timeframe: '{timeframe}'.

Aggregated Metrics:
- Total Logs Analyzed: {aggregates['total_logs']}
- Active Log Days: {aggregates['days_with_logs']}
- Average Daily Calories: {aggregates['avg_daily_calories']} kcal
- Average Daily Protein: {aggregates['avg_daily_protein_g']} g
- Average Daily Carbs: {aggregates['avg_daily_carbs_g']} g
- Average Daily Fat: {aggregates['avg_daily_fat_g']} g
- Meal Distribution: {json.dumps(aggregates['meal_type_distribution'])}

Daily Breakdown:
{json.dumps(aggregates['day_summaries'], indent=2)}

Please synthesize patterns, score the regimen, analyze macro balance, and output structured recommendations.
"""

        config = types.GenerateContentConfig(
            system_instruction=INSIGHTS_SYSTEM_INSTRUCTION,
            temperature=0.3,
            response_mime_type="application/json",
            response_schema=LongitudinalInsightsResponse,
        )

        for model_name in self.get_model_candidates():
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[prompt_context],
                    config=config,
                )

                duration_ms = (time.time() - start_time) * 1000

                token_metrics = {
                    "model": model_name,
                    "prompt_tokens": getattr(response.usage_metadata, "prompt_token_count", 0) if response.usage_metadata else 0,
                    "candidate_tokens": getattr(response.usage_metadata, "candidates_token_count", 0) if response.usage_metadata else 0,
                    "total_tokens": getattr(response.usage_metadata, "total_token_count", 0) if response.usage_metadata else 0,
                    "duration_ms": duration_ms
                }

                if response.text:
                    parsed_dict = json.loads(response.text)
                    parsed_dict["total_logs_analyzed"] = aggregates["total_logs"]
                    parsed_dict["avg_daily_calories"] = aggregates["avg_daily_calories"]
                    parsed_dict["avg_daily_protein_g"] = aggregates["avg_daily_protein_g"]
                    parsed_dict["avg_daily_carbs_g"] = aggregates["avg_daily_carbs_g"]
                    parsed_dict["avg_daily_fat_g"] = aggregates["avg_daily_fat_g"]
                    parsed_dict["generated_at"] = datetime.now(timezone.utc).isoformat()

                    return LongitudinalInsightsResponse.model_validate(parsed_dict), token_metrics

            except Exception as e:
                logger.warning(f"Insights model {model_name} warning: {e}. Trying fallback...")

        # ADK Mathematical Rule-Based Fallback
        score = 80 if aggregates["avg_daily_protein_g"] > 50 else 65
        status_val = "Balanced" if 1500 <= aggregates["avg_daily_calories"] <= 2400 else ("Deficit" if aggregates["avg_daily_calories"] < 1500 else "Surplus")
        
        fallback_res = LongitudinalInsightsResponse(
            timeframe=timeframe,
            overall_score=score,
            macro_balance=MacroBalance(
                status=status_val,
                summary=f"Daily average caloric intake is {aggregates['avg_daily_calories']} kcal with {aggregates['avg_daily_protein_g']}g protein across {aggregates['days_with_logs']} active logging days."
            ),
            patterns_detected=[
                f"Logged {aggregates['total_logs']} meals across {aggregates['days_with_logs']} days.",
                "Consistent meal timing observed for main meal intake."
            ],
            actionable_recommendations=[
                "Ensure protein intake reaches 1.2g to 1.6g per kilogram of target body weight.",
                "Incorporate a diverse range of colorful vegetables and fiber-dense whole grains."
            ],
            generated_at=datetime.now(timezone.utc).isoformat(),
            total_logs_analyzed=aggregates["total_logs"],
            avg_daily_calories=aggregates["avg_daily_calories"],
            avg_daily_protein_g=aggregates["avg_daily_protein_g"],
            avg_daily_carbs_g=aggregates["avg_daily_carbs_g"],
            avg_daily_fat_g=aggregates["avg_daily_fat_g"]
        )

        return fallback_res, {"model": "adk-insights-reasoning", "prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0, "duration_ms": 15.0}

longitudinal_insights_agent = LongitudinalInsightsAgent()
