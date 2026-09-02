import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, MealParseResponse } from "../services/api";
import { ImageUploader } from "./ImageUploader";
import {
  Sparkles,
  Camera,
  Utensils,
  PlusCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  Dna,
  Wheat,
  Droplet
} from "lucide-react";

interface FoodLoggerProps {
  onDraftReady: (draft: MealParseResponse) => void;
  onLogSavedSuccessfully: () => void;
}

const QUICK_EXAMPLES = [
  "2 Rotis with Moong Dal & Salad",
  "Oatmeal with Blueberries & Chia",
  "Grilled Chicken with Broccoli & Rice",
  "Greek Yogurt with Walnuts & Honey"
];

const MEAL_TYPES: Array<"Breakfast" | "Lunch" | "Dinner" | "Snack"> = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack"
];

export const FoodLogger: React.FC<FoodLoggerProps> = ({
  onDraftReady,
  onLogSavedSuccessfully
}) => {
  const { getToken } = useAuth();
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [foodText, setFoodText] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Lunch");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestDraft, setLatestDraft] = useState<MealParseResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async (customPrompt?: string) => {
    const textToAnalyze = customPrompt !== undefined ? customPrompt : foodText;
    if (!textToAnalyze.trim() && !imageBase64) {
      setErrorMessage("Please enter food description or upload a plate image.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAnalyzing(true);

    try {
      const token = await getToken();
      const draft = await api.parseMeal(token, {
        text: textToAnalyze.trim() || undefined,
        image_base64: imageBase64 || undefined,
        image_mime_type: imageMimeType,
        meal_type_hint: selectedMealType
      });

      setLatestDraft(draft);
    } catch (err: any) {
      console.error("Parse error:", err);
      setErrorMessage(err.message || "Failed to analyze meal. Please check network/service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickLog = async () => {
    if (!latestDraft) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const token = await getToken();
      await api.confirmLog(token, {
        meal_type: latestDraft.meal_type,
        items: latestDraft.items,
        total_calories: latestDraft.total_calories,
        total_protein_g: latestDraft.total_protein_g,
        total_carbs_g: latestDraft.total_carbs_g,
        total_fat_g: latestDraft.total_fat_g,
        summary_note: latestDraft.summary_note
      });

      setSuccessMessage(`Logged ${latestDraft.meal_type} (${latestDraft.total_calories} kcal) to your journal!`);
      setLatestDraft(null);
      setFoodText("");
      setImageBase64(null);
      onLogSavedSuccessfully();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save meal log.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px] sm:h-[720px] max-h-[85vh]">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-100 shadow-inner">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">1. Food & Meal Logger</h3>
            <p className="text-xs text-emerald-100">Upload plate photo or enter words to parse</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-white/20 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-sm">
          Gemini 3.7 Flash
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto min-h-0">
        {/* Meal Type Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Meal Category</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMealType(type)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedMealType === type
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Input Mode Selector (Text vs Photo) */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              inputMode === "text"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Type Food Description</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode("image")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              inputMode === "image"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Plate Photo</span>
          </button>
        </div>

        {/* Text Input Mode */}
        {inputMode === "text" ? (
          <div className="space-y-2">
            <textarea
              rows={3}
              value={foodText}
              onChange={(e) => setFoodText(e.target.value)}
              placeholder="e.g., 2 whole wheat rotis with 1 bowl of yellow dal, steamed rice, and cucumber tomato salad..."
              className="w-full text-xs sm:text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400 resize-none"
            />

            {/* Quick Example Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-slate-400">Quick ideas:</span>
              {QUICK_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFoodText(ex);
                    handleAnalyze(ex);
                  }}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 px-2 py-0.5 rounded-full transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Image Upload Mode */
          <div className="space-y-2">
            <ImageUploader
              selectedImageBase64={imageBase64}
              onImageSelected={(b64, mime) => {
                setImageBase64(b64);
                setImageMimeType(mime);
              }}
            />
            {imageBase64 && (
              <input
                type="text"
                value={foodText}
                onChange={(e) => setFoodText(e.target.value)}
                placeholder="Optional notes: e.g. cooked with olive oil, no sugar"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            )}
          </div>
        )}

        {/* Action Button: Analyze Food */}
        <button
          type="button"
          onClick={() => handleAnalyze()}
          disabled={isAnalyzing || (!foodText.trim() && !imageBase64)}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gemini Analyzing Ingredients & Calories...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Parse & Calculate Nutrition</span>
            </>
          )}
        </button>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Parsed Breakdown Card */}
        {latestDraft && (
          <div className="bg-slate-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  {latestDraft.meal_type}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Confidence: {Math.round(latestDraft.confidence_score * 100)}%
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-slate-900">{latestDraft.total_calories}</span>
                <span className="text-xs font-bold text-slate-500 ml-1">kcal</span>
              </div>
            </div>

            {/* Macro Summary Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-center space-x-1 text-blue-600 mb-0.5">
                  <Dna className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">Protein</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900">{latestDraft.total_protein_g}g</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-center space-x-1 text-amber-600 mb-0.5">
                  <Wheat className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">Carbs</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900">{latestDraft.total_carbs_g}g</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-center space-x-1 text-rose-600 mb-0.5">
                  <Droplet className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">Fat</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900">{latestDraft.total_fat_g}g</span>
              </div>
            </div>

            {/* Individual Items List */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Identified Items:</span>
              <div className="space-y-1">
                {latestDraft.items.map((item, idx) => (
                  <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {item.quantity} {item.name}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {item.calories} kcal ({item.protein_g}P / {item.carbs_g}C / {item.fat_g}F)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {latestDraft.summary_note && (
              <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                "{latestDraft.summary_note}"
              </p>
            )}

            {/* Confirmation Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleQuickLog}
                disabled={isSaving}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition-all"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Log to Firestore</span>
              </button>
              <button
                type="button"
                onClick={() => onDraftReady(latestDraft)}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Adjust Portions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
