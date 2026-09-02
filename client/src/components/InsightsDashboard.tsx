import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api, LongitudinalInsightsResponse } from "../services/api";
import { 
  Sparkles, 
  RotateCw, 
  Activity, 
  Award, 
  CheckCircle, 
  Target, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Lightbulb,
} from "lucide-react";

export const InsightsDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [insights, setInsights] = useState<LongitudinalInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (forceRefresh: boolean = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = await getToken();
      const res = await api.getInsights(token, range, forceRefresh);
      setInsights(res);
    } catch (err) {
      console.error("Failed to load longitudinal insights:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights(false);
  }, [range]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Balanced":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Deficit":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Surplus":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar with Timeframe Switcher & Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Longitudinal Health Reasoning</h2>
            <p className="text-xs text-slate-500">Gemini 3.7 Flash &bull; High Thinking Level Nutritional Synthesis</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center space-x-1">
            <button
              onClick={() => setRange("7d")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === "7d"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRange("30d")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === "30d"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <button
            onClick={() => fetchInsights(true)}
            disabled={loading || refreshing}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors disabled:opacity-40"
            title="Re-run Gemini 3.7 Flash High Thinking Analysis"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center animate-bounce">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Synthesizing Longitudinal Patterns...</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Gemini 3.7 Flash is analyzing your multi-day meal logs with high thinking effort to uncover metabolic insights.
            </p>
          </div>
        </div>
      ) : !insights ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-500">Failed to load insights. Please try refreshing.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Key Metrics Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Health Score</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{insights.overall_score} / 100</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Nutritional Quality</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Avg Calories</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{insights.avg_daily_calories}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">kcal / active day</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Avg Protein</span>
                <Beef className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{insights.avg_daily_protein_g}g</div>
              <div className="text-[10px] text-slate-400 mt-0.5">grams / day</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Avg Carbs</span>
                <Wheat className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{insights.avg_daily_carbs_g}g</div>
              <div className="text-[10px] text-slate-400 mt-0.5">grams / day</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Avg Fat</span>
                <Droplets className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{insights.avg_daily_fat_g}g</div>
              <div className="text-[10px] text-slate-400 mt-0.5">grams / day</div>
            </div>
          </div>

          {/* Macro Balance & Status Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Macronutrient Balance Assessment</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(insights.macro_balance.status)}`}>
                {insights.macro_balance.status}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">
              {insights.macro_balance.summary}
            </p>
          </div>

          {/* Detected Patterns & Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Patterns Detected */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Longitudinal Patterns Uncovered ({insights.patterns_detected.length})</span>
              </h3>
              <div className="space-y-3">
                {insights.patterns_detected.map((pattern, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 text-xs text-slate-700 flex items-start space-x-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{pattern}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Behavioral Recommendations */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Actionable Nutritional Recommendations ({insights.actionable_recommendations.length})</span>
              </h3>
              <div className="space-y-3">
                {insights.actionable_recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/70 text-xs text-slate-800 flex items-start space-x-3"
                  >
                    <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
