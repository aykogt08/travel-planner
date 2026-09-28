"use client";

import { Trip } from "@/types/trip";
import { CircleDollarSign, TrendingUp, PiggyBank, PieChart } from "lucide-react";
import { CATEGORY_LABELS } from "./PlacesManager";

interface BudgetSummaryProps {
  trip: Trip;
}

export default function BudgetSummary({ trip }: BudgetSummaryProps) {
  const budget = trip.budget || 0;

  // Calculate expenses by category from schedules
  const categoryTotals: Record<string, number> = {
    FOOD: 0,
    SIGHTSEEING: 0,
    TRANSPORT: 0,
    HOTEL: 0,
    ACTIVITY: 0,
    OTHER: 0,
  };

  let totalScheduledCost = 0;

  trip.schedules.forEach((s) => {
    if (s.cost) {
      totalScheduledCost += s.cost;
      const cat = s.category || "OTHER";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + s.cost;
    }
  });

  // Calculate spots estimated costs not yet scheduled
  let totalPlacesCost = 0;
  trip.places.forEach((p) => {
    if (p.cost) {
      totalPlacesCost += p.cost;
    }
  });

  const remaining = budget > 0 ? budget - totalScheduledCost : null;
  const usagePercent =
    budget > 0 ? Math.min(100, Math.round((totalScheduledCost / budget) * 100)) : 0;

  const categoryColors: Record<string, string> = {
    FOOD: "bg-orange-500",
    SIGHTSEEING: "bg-sky-500",
    TRANSPORT: "bg-slate-500",
    HOTEL: "bg-violet-500",
    ACTIVITY: "bg-emerald-500",
    OTHER: "bg-stone-400",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-800 flex items-center gap-2">
          <span>予算 & 費用サマリー</span>
        </h2>
        <p className="text-stone-500 text-xs mt-0.5">
          予定・移動・スポットに登録された費用の合計と予算の内訳です。
        </p>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">目標予算</span>
            <PiggyBank className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-2xl font-bold text-stone-800">
            {budget > 0 ? `¥${budget.toLocaleString()}` : "未設定"}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">旅行全体の想定予算</div>
        </div>

        {/* Total Scheduled Expense */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">旅程の合計予定額</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            ¥{totalScheduledCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {trip.schedules.filter((s) => s.cost).length} 件の予定に費用設定
          </div>
        </div>

        {/* Remaining / Balance */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold">予算の残り</span>
            <CircleDollarSign
              className={`w-4 h-4 ${
                remaining !== null && remaining < 0 ? "text-red-500" : "text-emerald-500"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold ${
              remaining === null
                ? "text-stone-700"
                : remaining < 0
                ? "text-rose-600"
                : "text-emerald-600"
            }`}
          >
            {remaining !== null ? `¥${remaining.toLocaleString()}` : "予算未設定"}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {remaining !== null && remaining < 0 ? "⚠️ 予算を超過しています" : "余裕があります"}
          </div>
        </div>
      </div>

      {/* Budget usage progress bar */}
      {budget > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
            <span>予算消化率</span>
            <span>
              {usagePercent}% (¥{totalScheduledCost.toLocaleString()} / ¥{budget.toLocaleString()})
            </span>
          </div>

          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden flex">
            {Object.entries(categoryTotals).map(([catKey, total]) => {
              if (total === 0) return null;
              const pct = (total / budget) * 100;
              return (
                <div
                  key={catKey}
                  className={`${categoryColors[catKey] || "bg-stone-400"} h-full transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${CATEGORY_LABELS[catKey] || catKey}: ¥${total.toLocaleString()}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600">
            {Object.entries(categoryTotals).map(([catKey, total]) => {
              if (total === 0) return null;
              return (
                <div key={catKey} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${categoryColors[catKey]}`} />
                  <span>
                    {CATEGORY_LABELS[catKey]?.split("・")[0] || catKey}: ¥{total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category breakdown table */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-stone-600" />
          カテゴリ別費用一覧
        </h3>

        <div className="flex flex-col divide-y divide-stone-100 text-xs">
          {Object.entries(categoryTotals).map(([catKey, total]) => (
            <div key={catKey} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${categoryColors[catKey]}`} />
                <span className="font-semibold text-stone-700">
                  {CATEGORY_LABELS[catKey] || catKey}
                </span>
              </div>
              <span className="font-bold text-stone-900">¥{total.toLocaleString()}</span>
            </div>
          ))}
          <div className="pt-3 flex items-center justify-between font-bold text-sm text-stone-900">
            <span>合計予定費用</span>
            <span>¥{totalScheduledCost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
