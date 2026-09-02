import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from server.models.schemas import ChatMessage, ChatRequest, ChatResponse
from server.agents.nutrition_coach import NutritionCoachAgent

@pytest.mark.asyncio
async def test_nutrition_coach_agent_chat_mock():
    agent = NutritionCoachAgent(project_id="test-proj", region="us-central1")
    
    mock_response = MagicMock()
    mock_response.text = '{"response": "Great job on hitting your protein goal! Consider adding some leafy greens to dinner.", "suggestions": ["How much fiber did I have?", "Suggest a healthy dinner recipe"]}'
    mock_response.usage_metadata = MagicMock()
    mock_response.usage_metadata.prompt_token_count = 120
    mock_response.usage_metadata.candidates_token_count = 45
    mock_response.usage_metadata.total_token_count = 165

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response
    agent.client = mock_client

    history = [
        ChatMessage(role="user", content="Hi, I had eggs and oatmeal for breakfast."),
        ChatMessage(role="assistant", content="That sounds like a balanced breakfast with good complex carbs!")
    ]
    recent_logs = [
        {
            "meal_type": "Breakfast",
            "items": [{"name": "Boiled Eggs", "quantity": "2", "calories": 140, "protein_g": 12, "carbs_g": 1, "fat_g": 10}],
            "totals": {"calories": 140, "protein_g": 12, "carbs_g": 1, "fat_g": 10}
        }
    ]

    res, metrics = await agent.chat(
        message="What should I eat for lunch to keep on track with my weight loss goal?",
        history=history,
        recent_logs=recent_logs,
        user_goals="Weight Loss & Calorie Deficit"
    )

    assert isinstance(res, ChatResponse)
    assert "protein" in res.response
    assert len(res.suggestions) == 2
    assert metrics["total_tokens"] == 165
