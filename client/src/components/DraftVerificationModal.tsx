import React, { useState } from "react";
import { MealParseResponse, MealItem } from "../services/api";
import { 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Sparkles, 
  AlertCircle
} from "lucide-react";

interface DraftVerificationModalProps {
  draft: MealParseResponse;
  onConfirm: (confirmedData: {
    meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
    items: MealItem[];
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    summary_note: string;
    notes: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export const DraftVerificationModal: React.FC<DraftVerificationModalProps> = ({
  draft,
  onConfirm,
  onCancel,
  isSaving,
}) => {
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">(draft.meal_type);
  const [items, setItems] = useState<MealItem[]>(draft.items);
  const [notes, setNotes] = useState<string>("");
  const [summaryNote] = useState<string>(draft.summary_note || "");

  // Recalculate totals
  const totalCalories = Math.round(items.reduce((acc, i) => acc + (Number(i.calories) || 0), 0));
  const totalProtein = Math.round(items.reduce((acc, i) => acc + (Number(i.protein_g) || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(items.reduce((acc, i) => acc + (Number(i.carbs_g) || 0), 0) * 10) / 10;
  const totalFat = Math.round(items.reduce((acc, i) => acc + (Number(i.fat_g) || 0), 0) * 10) / 10;

  const handleItemChange = (index: number, field: keyof MealItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: field === "name" || field === "quantity" ? value : Number(value) || 0,
    };
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: "New Item",
        quantity: "1 serving",
        estimated_weight_g: 100,
        calories: 100,
        protein_g: 5,
        carbs_g: 15,
        fat_g: 2,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    await onConfirm({
      meal_type: mealType,
      items,
      total_calories: totalCalories,
      total_protein_g: totalProtein,
      total_carbs_g: totalCarbs,
      total_fat_g: totalFat,
      summary_note: summaryNote,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Review & Confirm Food Log</h2>
              <p className="text-xs text-slate-500">Gemini 3.7 Flash parsed provisional draft &bull; Confidence: {Math.round(draft.confidence_score * 100)}%</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            Draft & Verify
          </span>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Meal Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Meal Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["Breakfast", "Lunch", "Dinner", "Snack"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    mealType === type
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* AI Summary Note */}
          {draft.summary_note && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">AI Nutritional Note: </span>
                <span>{draft.summary_note}</span>
              </div>
            </div>
          )}

          {/* Item Breakdown Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recognized Ingredients & Portions ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-medium">Food Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                        placeholder="e.g. Roti, Moong Dal"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Portion / Weight (g)</label>
                      <div className="flex space-x-1 mt-0.5">
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="w-2/3 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="2 pieces"
                        />
                        <input
                          type="number"
                          value={item.estimated_weight_g || ""}
                          onChange={(e) => handleItemChange(index, "estimated_weight_g", e.target.value)}
                          className="w-1/3 px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="g"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 items-center pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Calories</span>
                      <input
                        type="number"
                        value={item.calories}
                        onChange={(e) => handleItemChange(index, "calories", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Protein (g)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={item.protein_g}
                        onChange={(e) => handleItemChange(index, "protein_g", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Carbs (g)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={item.carbs_g}
                        onChange={(e) => handleItemChange(index, "carbs_g", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Fat (g)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={item.fat_g}
                        onChange={(e) => handleItemChange(index, "fat_g", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Calculated Totals Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Calculated Total Nutrition
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-extrabold text-orange-400">{totalCalories}</div>
                <div className="text-[10px] text-slate-300">Calories (kcal)</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-rose-400">{totalProtein}g</div>
                <div className="text-[10px] text-slate-300">Protein</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-amber-400">{totalCarbs}g</div>
                <div className="text-[10px] text-slate-300">Carbs</div>
              </div>
              <div>
                <div className="text-lg font-extrabold text-sky-400">{totalFat}g</div>
                <div className="text-[10px] text-slate-300">Fat</div>
              </div>
            </div>
          </div>

          {/* User Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Personal Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Post-workout meal, feeling full and energetic"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Discard Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || items.length === 0}
            className="flex items-center space-x-2 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? "Saving to Firestore..." : "Confirm & Save to Journal"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
