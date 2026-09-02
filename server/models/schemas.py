from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class MealItem(BaseModel):
    name: str = Field(..., description="Name of the food item")
    quantity: str = Field(..., description="Portion size / quantity description e.g. 2 pieces, 1 cup")
    estimated_weight_g: float = Field(default=0.0, description="Estimated weight in grams")
    calories: float = Field(..., description="Estimated calories in kcal")
    protein_g: float = Field(..., description="Estimated protein in grams")
    carbs_g: float = Field(..., description="Estimated carbohydrates in grams")
    fat_g: float = Field(..., description="Estimated fat in grams")

class MealParseRequest(BaseModel):
    text: Optional[str] = Field(None, description="Conversational text description of the meal")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image of the meal")
    image_mime_type: Optional[str] = Field("image/jpeg", description="MIME type of the image")
    meal_type_hint: Optional[str] = Field(None, description="Optional user hint for meal type")

class MealParseResponse(BaseModel):
    meal_type: Literal["Breakfast", "Lunch", "Dinner", "Snack"] = Field(..., description="Type of meal")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score of AI extraction")
    items: List[MealItem] = Field(..., description="List of recognized food items")
    total_calories: float = Field(..., description="Total calories")
    total_protein_g: float = Field(..., description="Total protein in grams")
    total_carbs_g: float = Field(..., description="Total carbs in grams")
    total_fat_g: float = Field(..., description="Total fat in grams")
    summary_note: str = Field(..., description="Brief nutritional assessment or feedback note")

class LogConfirmRequest(BaseModel):
    meal_type: Literal["Breakfast", "Lunch", "Dinner", "Snack"]
    items: List[MealItem]
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    summary_note: Optional[str] = None
    notes: Optional[str] = None
    logged_at: Optional[datetime] = None

class FoodLogEntry(BaseModel):
    id: str
    user_id: str
    meal_type: Literal["Breakfast", "Lunch", "Dinner", "Snack"]
    items: List[MealItem]
    totals: dict
    summary_note: Optional[str] = None
    notes: Optional[str] = None
    user_confirmed: bool = True
    created_at: str
    logged_at: str

class MacroBalance(BaseModel):
    status: Literal["Balanced", "Deficit", "Surplus", "Needs Adjustment"]
    summary: str

class LongitudinalInsightsResponse(BaseModel):
    timeframe: str = Field(..., description="e.g. Last 7 Days, Last 30 Days")
    overall_score: int = Field(..., ge=0, le=100, description="Nutritional health score out of 100")
    macro_balance: MacroBalance
    patterns_detected: List[str]
    actionable_recommendations: List[str]
    generated_at: str
    total_logs_analyzed: int = 0
    avg_daily_calories: float = 0.0
    avg_daily_protein_g: float = 0.0
    avg_daily_carbs_g: float = 0.0
    avg_daily_fat_g: float = 0.0

class DailyMacroSummary(BaseModel):
    date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    log_count: int
    logs: List[FoodLogEntry] = []

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message to Gemini Nutritionist")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation turns")
    user_goals: Optional[str] = Field(None, description="Optional user dietary goals or health context")

class ChatResponse(BaseModel):
    response: str = Field(..., description="Gemini Nutrition Coach response text")
    suggestions: List[str] = Field(default=[], description="Suggested follow-up questions or actions")

