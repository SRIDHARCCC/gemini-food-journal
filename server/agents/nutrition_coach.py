import json
import time
import logging
from typing import List, Dict, Any, Tuple, Optional
from google.genai import types
from server.agents.base_agent import BaseVertexAgent
from server.models.schemas import ChatMessage, ChatResponse

logger = logging.getLogger(__name__)

COACH_SYSTEM_INSTRUCTION = """You are a supportive, knowledgeable, and proactive Clinical Nutrition Coach and Health Advisor powered by Gemini on Google Cloud Vertex AI.
Your role is to have an interactive, two-way dialogue with the user.

Your capabilities:
1. Assess the customer's dietary needs, fitness goals (weight loss, muscle gain, maintenance, athletic performance), and health conditions (e.g. diabetes, hypertension, PCOS, vegetarian/vegan).
2. Proactively analyze the user's logged meals (which are injected into your context) to provide tailored opinions, macro feedback, and constructive advice.
3. Suggest healthy meal ideas, recipe modifications, smart substitutions (e.g. replacing refined carbs with complex carbs, boosting lean protein).
4. Answer nutritional queries conversationally, offering clear, scientifically sound explanations with positive encouragement.
5. Provide 2-3 relevant, actionable follow-up suggestion chips/questions to keep the conversation dynamic.

Guidelines:
- Keep your tone conversational, empathetic, and professional.
- Structure responses with bullet points or short paragraphs for readability.
- When referencing the user's logged meals, refer to specific foods or numbers to show high relevance.
- Always output a JSON object adhering to the schema:
  {
    "response": "Your conversational answer, opinion, or suggestion in Markdown format",
    "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
  }
"""

class NutritionCoachAgent(BaseVertexAgent):
    """
    Two-way interactive Nutrition Coach Agent leveraging Gemini on Google Cloud Vertex AI.
    """

    async def chat(
        self,
        message: str,
        history: List[ChatMessage],
        recent_logs: List[Dict[str, Any]],
        user_goals: Optional[str] = None
    ) -> Tuple[ChatResponse, Dict[str, Any]]:
        """
        Processes a multi-turn chat interaction with meal context grounding.
        """
        start_time = time.time()
        client = self.get_client()

        # Build context from recent food logs
        log_summary_lines = []
        for log in recent_logs[-10:]:  # Last 10 logged meals
            meal_type = log.get("meal_type", "Meal")
            logged_at = log.get("logged_at", log.get("created_at", ""))
            date_str = logged_at[:10] if logged_at else ""
            totals = log.get("totals", {})
            cals = totals.get("calories", 0)
            prot = totals.get("protein_g", 0)
            carbs = totals.get("carbs_g", 0)
            fat = totals.get("fat_g", 0)
            
            items_desc = ", ".join([f"{item.get('quantity', '')} {item.get('name', '')}" for item in log.get("items", [])])
            log_summary_lines.append(
                f"- [{date_str} {meal_type}] {items_desc} -> {cals} kcal (P: {prot}g, C: {carbs}g, F: {fat}g)"
            )

        context_block = "Recent Logged Meals:\n" + ("\n".join(log_summary_lines) if log_summary_lines else "No meals logged yet.")
        if user_goals:
            context_block += f"\n\nUser Profile & Goals:\n{user_goals}"

        # Construct conversation prompt with history
        history_formatted = []
        for msg in history[-8:]:  # Last 8 turns
            role_label = "User" if msg.role == "user" else "Nutrition Coach"
            history_formatted.append(f"{role_label}: {msg.content}")

        history_text = "\n".join(history_formatted) if history_formatted else "None (Start of conversation)"

        full_prompt = f"""{context_block}

---
Recent Conversation History:
{history_text}

---
Current User Message:
{message}

Please evaluate the user's message, refer to their logged meals if relevant, and respond thoughtfully as their Nutrition Coach. Provide your response as JSON."""

        config = types.GenerateContentConfig(
            system_instruction=COACH_SYSTEM_INSTRUCTION,
            temperature=0.4,
            response_mime_type="application/json",
            response_schema=ChatResponse,
        )

        # If client is configured, call Gemini
        if client:
            last_error = None
            for model_name in self.get_model_candidates():
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[full_prompt],
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
                        parsed_json = json.loads(response.text)
                        return ChatResponse(**parsed_json), token_metrics

                except Exception as e:
                    logger.warning(f"Chat model {model_name} failed: {e}. Trying fallback if available.")
                    last_error = e

        # Fallback: Generate intelligent contextual response based on logged meals and user query
        return self._generate_local_response(message, recent_logs, user_goals)

    def _generate_local_response(
        self,
        message: str,
        recent_logs: List[Dict[str, Any]],
        user_goals: Optional[str]
    ) -> Tuple[ChatResponse, Dict[str, Any]]:
        """
        Provides rich, context-aware nutrition advice based on logged meals when running in local offline demo.
        """
        msg_lower = message.lower()
        goal_text = user_goals or "Balanced Nutrition & Health"

        # Calculate metrics from logged meals
        tot_cals = sum(l.get("totals", {}).get("calories", 0) for l in recent_logs)
        tot_prot = sum(l.get("totals", {}).get("protein_g", 0) for l in recent_logs)
        tot_carbs = sum(l.get("totals", {}).get("carbs_g", 0) for l in recent_logs)
        tot_fat = sum(l.get("totals", {}).get("fat_g", 0) for l in recent_logs)
        meal_count = len(recent_logs)

        # Contextual advice based on query topic
        if any(k in msg_lower for k in ["dinner", "lunch", "breakfast", "eat next", "suggest", "recipe", "meal idea", "snack", "what should i eat"]):
            cals_ctx = f" ({round(tot_cals, 0)} kcal logged so far today)" if meal_count > 0 else ""
            response_text = (
                f"### 🥗 Personalized Meal Suggestion for '{goal_text}'\n\n"
                f"Here are 3 high-impact meal options tailored to your goals{cals_ctx}:\n\n"
                f"1. **High-Protein Power Bowl** (approx. 420 kcal, 34g Protein):\n"
                f"   - 150g grilled chicken breast / air-fried tofu or boiled chickpeas\n"
                f"   - Steamed broccoli, charred bell peppers & baby spinach\n"
                f"   - 1/2 cup quinoa or 1 whole wheat roti with 1 tsp olive oil\n\n"
                f"2. **Light Mediterranean Plate** (approx. 340 kcal, 24g Protein):\n"
                f"   - 1 cup Greek yogurt or low-fat paneer with cucumber & mint\n"
                f"   - 1 bowl yellow lentil soup (tadka dal) with a crisp green salad\n\n"
                f"3. **Quick Protein Stir-Fry** (approx. 380 kcal, 28g Protein):\n"
                f"   - Edamame, mushrooms, and zucchini sautéed in sesame oil with garlic."
            )
            suggestions = [
                "Give me a low-carb alternative",
                "How can I meal prep this?",
                "Suggest a healthy snack under 150 kcal"
            ]

        elif any(k in msg_lower for k in ["rate", "opinion", "balance", "healthy", "review", "evaluate"]):
            response_text = (
                f"### 🔍 Dietary Assessment & Review\n\n"
                f"Evaluating your recent meal choices against your focus **'{goal_text}'**:\n\n"
                f"- **Logged Meals**: {meal_count} meal(s) recorded ({round(tot_cals, 0)} kcal, {round(tot_prot, 0)}g Protein, {round(tot_carbs, 0)}g Carbs, {round(tot_fat, 0)}g Fat).\n"
                f"- **Strengths**: Good ingredient variety and steady meal pacing.\n"
                f"- **Recommendations**:\n"
                f"  1. Ensure you get at least 25-30g protein per major meal to support metabolic rate.\n"
                f"  2. Boost fiber with legumes, dark greens, and seeds (chia/flax) for sustained satiety."
            )
            suggestions = [
                "What foods will boost my fiber intake?",
                "Suggest healthy snack swaps",
                "How to stay full longer between meals?"
            ]

        elif any(k in msg_lower for k in ["macro", "calorie", "protein", "carb", "fat", "today", "how am i", "status", "progress"]):
            if meal_count > 0:
                response_text = (
                    f"### 📊 Today's Nutritional Breakdown\n\n"
                    f"Based on your **{meal_count} logged meal(s)** in the journal:\n\n"
                    f"- **Total Energy**: **{round(tot_cals, 1)} kcal**\n"
                    f"- **Protein**: **{round(tot_prot, 1)} g**\n"
                    f"- **Carbohydrates**: **{round(tot_carbs, 1)} g**\n"
                    f"- **Fats**: **{round(tot_fat, 1)} g**\n\n"
                    f"**🎯 Assessment for '{goal_text}'**:\n"
                    f"- Your protein intake is **{'on track' if tot_prot >= 40 else 'a bit low so far'}**.\n"
                    f"- *Recommendation*: Aim to distribute your calories evenly across the day and stay hydrated!"
                )
            else:
                response_text = (
                    f"### 📊 Daily Macro Tracker\n\n"
                    f"You haven't logged any meals yet today! You can log your first meal on the left pane (**Field 1: Food Logger**).\n\n"
                    f"For your goal of **{goal_text}**, recommended targets for today:\n"
                    f"- **Calories**: ~1800 - 2000 kcal\n"
                    f"- **Protein**: ~120 - 140g\n"
                    f"- **Carbs**: ~150 - 180g\n"
                    f"- **Fat**: ~50 - 60g"
                )
            suggestions = [
                "Suggest a high-protein dinner",
                "What healthy snack can I eat under 150 kcal?",
                "Rate my overall food quality"
            ]

        else:
            response_text = (
                f"### 💬 Nutrition Coach Advice\n\n"
                f"I'm here to assist you with your health goal of **{goal_text}**!\n\n"
                f"**Current Status**: {meal_count} meal(s) logged in your journal ({round(tot_cals, 0)} kcal total).\n\n"
                f"**What would you like to explore?**\n"
                f"- Ask for instant feedback or recipe ideas on any dish.\n"
                f"- Check if your protein, carbs, and fats are on track for the day.\n"
                f"- Get smart swaps to satisfy cravings while staying in your target."
            )
            suggestions = [
                "Suggest a high-protein dinner",
                "How are my macros and calories today?",
                "Rate my meal balance today"
            ]

        return ChatResponse(
            response=response_text,
            suggestions=suggestions
        ), {"model": "local-nutrition-expert", "status": "active"}

nutrition_coach_agent = NutritionCoachAgent()

