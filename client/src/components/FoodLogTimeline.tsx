import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api, DailyMacroSummary } from "../services/api";
import { MacroProgressBar } from "./MacroProgressBar";
import { 
  Calendar, 
  Trash2, 
  Clock, 
  Beef, 
  Wheat, 
  Droplets, 
  Utensils, 
  Coffee, 
  Sun, 
  Moon, 
  Apple,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface FoodLogTimelineProps {
  onRefreshTrigger?: number;
}

export const FoodLogTimeline: React.FC<FoodLogTimelineProps> = ({ onRefreshTrigger }) => {
  const { getToken } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [summary, setSummary] = useState<DailyMacroSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDailyLogs = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await api.getDailySummary(token, selectedDate);
      setSummary(res);
    } catch (err) {
      console.error("Failed to load daily logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyLogs();
  }, [selectedDate, onRefreshTrigger]);

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this food entry?")) return;
    setDeletingId(logId);
    try {
      const token = await getToken();
      await api.deleteLog(token, logId);
      await fetchDailyLogs();
    } catch (err) {
      console.error("Failed to delete food log:", err);
      alert("Failed to delete log entry.");
    } finally {
      setDeletingId(null);
    }
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case "Breakfast":
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case "Lunch":
        return <Sun className="w-4 h-4 text-orange-500" />;
      case "Dinner":
        return <Moon className="w-4 h-4 text-indigo-500" />;
      case "Snack":
      default:
        return <Apple className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Date Navigation & Macro Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
          className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
        >
          Jump to Today
        </button>
      </div>

      {/* Macro Target Progress Bars */}
      <MacroProgressBar
        totalCalories={summary?.total_calories || 0}
        totalProtein={summary?.total_protein_g || 0}
        totalCarbs={summary?.total_carbs_g || 0}
        totalFat={summary?.total_fat_g || 0}
      />

      {/* Log Timeline List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Utensils className="w-4 h-4 text-blue-600" />
            <span>Meals Logged on {selectedDate} ({summary?.logs.length || 0})</span>
          </h3>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading food log timeline from Firestore...</p>
          </div>
        ) : !summary?.logs || summary.logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Meals Logged for this Date</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the AI Journal to chat or snap a plate photo to log your meals for {selectedDate}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {summary.logs.map((log) => {
              const logTime = log.logged_at
                ? new Date(log.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                        {getMealIcon(log.meal_type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{log.meal_type}</span>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{logTime}</span>
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-orange-600">
                          {log.totals.calories} kcal
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      disabled={deletingId === log.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-40"
                      title="Delete Entry"
                    >
                      {deletingId === log.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {log.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50/70 border border-slate-150 rounded-xl p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="truncate mr-2">{item.name}</span>
                          <span className="text-orange-600 flex-shrink-0">{item.calories} kcal</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.quantity} {item.estimated_weight_g ? `(${item.estimated_weight_g}g)` : ""}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-600 pt-1 border-t border-slate-200/50">
                          <span className="text-rose-600 font-semibold">P: {item.protein_g}g</span>
                          <span className="text-amber-600 font-semibold">C: {item.carbs_g}g</span>
                          <span className="text-sky-600 font-semibold">F: {item.fat_g}g</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & User Notes */}
                  {(log.summary_note || log.notes) && (
                    <div className="pt-2 text-xs space-y-1">
                      {log.summary_note && (
                        <p className="text-slate-600 bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-[11px]">
                          <span className="font-semibold text-blue-900">AI Note: </span>
                          {log.summary_note}
                        </p>
                      )}
                      {log.notes && (
                        <p className="text-slate-500 text-[11px] italic flex items-center space-x-1 px-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>Notes: {log.notes}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Meal Totals Pill Bar */}
                  <div className="flex items-center justify-end space-x-3 text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1">
                      <Beef className="w-3.5 h-3.5 text-rose-500" />
                      <span>{log.totals.protein_g}g Prot</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Wheat className="w-3.5 h-3.5 text-amber-500" />
                      <span>{log.totals.carbs_g}g Carbs</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" />
                      <span>{log.totals.fat_g}g Fat</span>
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
