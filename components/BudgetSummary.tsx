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
    FOOD: "bg-[#DDA15E]",
    SIGHTSEEING: "bg-[#386641]",
    TRANSPORT: "bg-[#003049]",
    HOTEL: "bg-[#C1121F]",
    ACTIVITY: "bg-[#386641]/80",
    OTHER: "bg-[#003049]/50",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#003049] flex items-center gap-2">
          <span>予算 & 費用サマリー</span>
        </h2>
        <p className="text-[#003049]/70 text-xs mt-0.5">
          予定・移動・スポットに登録された費用の合計と予算の内訳です。
        </p>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget */}
        <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#003049]/50 mb-2">
            <span className="text-xs font-semibold text-[#003049]/70">目標予算</span>
            <PiggyBank className="w-4 h-4 text-[#003049]/60" />
          </div>
          <div className="text-2xl font-bold text-[#003049]">
            {budget > 0 ? `¥${budget.toLocaleString()}` : "未設定"}
          </div>
          <div className="text-[11px] text-[#003049]/60 mt-1">旅行全体の想定予算</div>
        </div>

        {/* Total Scheduled Expense */}
        <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#003049]/50 mb-2">
            <span className="text-xs font-semibold text-[#003049]/70">旅程の合計予定額</span>
            <TrendingUp className="w-4 h-4 text-[#DDA15E]" />
          </div>
          <div className="text-2xl font-bold text-[#C1121F]">
            ¥{totalScheduledCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#003049]/60 mt-1">
            {trip.schedules.filter((s) => s.cost).length} 件の予定に費用設定
          </div>
        </div>

        {/* Remaining / Balance */}
        <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#003049]/50 mb-2">
            <span className="text-xs font-semibold text-[#003049]/70">予算の残り</span>
            <CircleDollarSign
              className={`w-4 h-4 ${
                remaining !== null && remaining < 0 ? "text-[#C1121F]" : "text-[#386641]"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold ${
              remaining === null
                ? "text-[#003049]"
                : remaining < 0
                ? "text-[#C1121F]"
                : "text-[#386641]"
            }`}
          >
            {remaining !== null ? `¥${remaining.toLocaleString()}` : "予算未設定"}
          </div>
          <div className="text-[11px] text-[#003049]/60 mt-1">
            {remaining !== null && remaining < 0 ? "⚠️ 予算を超過しています" : "余裕があります"}
          </div>
        </div>
      </div>

      {/* Budget usage progress bar */}
      {budget > 0 && (
        <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#003049] mb-2">
            <span>予算消化率</span>
            <span>
              {usagePercent}% (¥{totalScheduledCost.toLocaleString()} / ¥{budget.toLocaleString()})
            </span>
          </div>

          <div className="w-full bg-[#FDF0D5] border border-[#DDA15E]/20 rounded-full h-3 overflow-hidden flex">
            {Object.entries(categoryTotals).map(([catKey, total]) => {
              if (total === 0) return null;
              const pct = (total / budget) * 100;
              return (
                <div
                  key={catKey}
                  className={`${categoryColors[catKey] || "bg-[#003049]/40"} h-full transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${CATEGORY_LABELS[catKey] || catKey}: ¥${total.toLocaleString()}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 border-t border-[#003049]/10 text-xs text-[#003049]/80">
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
      <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-[#003049] mb-3 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-[#DDA15E]" />
          カテゴリ別費用一覧
        </h3>

        <div className="flex flex-col divide-y divide-[#003049]/10 text-xs">
          {Object.entries(categoryTotals).map(([catKey, total]) => (
            <div key={catKey} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${categoryColors[catKey]}`} />
                <span className="font-semibold text-[#003049]">
                  {CATEGORY_LABELS[catKey] || catKey}
                </span>
              </div>
              <span className="font-bold text-[#003049]">¥{total.toLocaleString()}</span>
            </div>
          ))}
          <div className="pt-3 flex items-center justify-between font-bold text-sm text-[#003049]">
            <span>合計予定費用</span>
            <span className="text-[#C1121F]">¥{totalScheduledCost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
