import React from "react";
import { Flame, Beef, Wheat, Droplets } from "lucide-react";

interface MacroProgressBarProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

export const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  targetCalories = 2000,
  targetProtein = 120,
  targetCarbs = 220,
  targetFat = 65,
}) => {
  const calPercent = Math.min(100, Math.round((totalCalories / targetCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / targetProtein) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / targetCarbs) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / targetFat) * 100));

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Daily Macro Targets</span>
        </h3>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {totalCalories} / {targetCalories} kcal
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Calories */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span className="flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Calories</span>
            </span>
            <span className="font-bold text-slate-900">{totalCalories} kcal</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${calPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right mt-1">{calPercent}% of {targetCalories}</div>
        </div>

        {/* Protein */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span className="flex items-center space-x-1">
              <Beef className="w-3.5 h-3.5 text-rose-500" />
              <span>Protein</span>
            </span>
            <span className="font-bold text-slate-900">{totalProtein}g</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right mt-1">{proteinPercent}% of {targetProtein}g</div>
        </div>

        {/* Carbs */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span className="flex items-center space-x-1">
              <Wheat className="w-3.5 h-3.5 text-amber-500" />
              <span>Carbs</span>
            </span>
            <span className="font-bold text-slate-900">{totalCarbs}g</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right mt-1">{carbsPercent}% of {targetCarbs}g</div>
        </div>

        {/* Fat */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span className="flex items-center space-x-1">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span>Fat</span>
            </span>
            <span className="font-bold text-slate-900">{totalFat}g</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right mt-1">{fatPercent}% of {targetFat}g</div>
        </div>
      </div>
    </div>
  );
};
