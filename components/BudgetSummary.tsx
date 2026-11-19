"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Trip, Schedule, TripGroup } from "@/types/trip";
import {
  CircleDollarSign,
  TrendingUp,
  PiggyBank,
  PieChart,
  Users,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CATEGORY_LABELS } from "./PlacesManager";

interface BudgetSummaryProps {
  trip: Trip;
  onSchedulesChange?: (schedules: Schedule[]) => void;
  tripGroups?: TripGroup[];
}

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "bg-[#DDA15E]",
  SIGHTSEEING: "bg-[#003049]",
  TRANSPORT: "bg-[#386641]",
  HOTEL: "bg-[#C1121F]",
  ACTIVITY: "bg-[#003049]/80",
  OTHER: "bg-[#386641]/50",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  FOOD: "🍽️",
  SIGHTSEEING: "🏛️",
  TRANSPORT: "🚆",
  HOTEL: "🏨",
  ACTIVITY: "🏄",
  OTHER: "✨",
};

const GROUP_PALETTE = [
  "#386641",
  "#003049",
  "#DDA15E",
  "#C1121F",
  "#7C3AED",
  "#0D9488",
  "#D97706",
  "#4F46E5",
  "#64748B",
];

export default function BudgetSummary({
  trip,
  onSchedulesChange,
  tripGroups,
}: BudgetSummaryProps) {
  const budget = trip.budget || 0;

  // Groups state (fallback to fetch if not pre-populated)
  const [groups, setGroups] = useState<TripGroup[]>(() => {
    return tripGroups || trip.tripGroups || [];
  });
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (tripGroups && tripGroups.length > 0) {
      setGroups(tripGroups);
    } else if (trip.tripGroups && trip.tripGroups.length > 0) {
      setGroups(trip.tripGroups);
    } else {
      fetch(`/api/trips/${trip.id}/groups`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            const mapped: TripGroup[] = data.map((d: any) => ({
              id: Number(d.id),
              tripId: trip.id,
              name: d.name,
              flag: d.flag || "👥",
              country: d.country || "",
              cityName: d.cityName,
              startDate: d.startDate,
              endDate: d.endDate,
              customMemo: d.customMemo,
            }));
            setGroups(mapped);
          }
        })
        .catch((err) => console.error("Failed to fetch groups in budget:", err));
    }
  }, [trip.id, tripGroups, trip.tripGroups]);

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
  const schedulesWithCost = useMemo(() => {
    return trip.schedules.filter((s) => s.cost && s.cost > 0);
  }, [trip.schedules]);

  schedulesWithCost.forEach((s) => {
    if (s.cost) {
      totalScheduledCost += s.cost;
      const cat = s.category || "OTHER";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + s.cost;
    }
  });

  const remaining = budget > 0 ? budget - totalScheduledCost : null;
  const usagePercent =
    budget > 0 ? Math.min(100, Math.round((totalScheduledCost / budget) * 100)) : 0;

  // Group breakdown calculations
  const groupStats = useMemo(() => {
    const groupMap = new Map<
      number,
      { group: TripGroup; schedules: Schedule[]; total: number; color: string }
    >();

    groups.forEach((g, index) => {
      groupMap.set(g.id, {
        group: g,
        schedules: [],
        total: 0,
        color: GROUP_PALETTE[index % GROUP_PALETTE.length],
      });
    });

    const unassigned: Schedule[] = [];
    let unassignedTotal = 0;

    schedulesWithCost.forEach((s) => {
      if (s.groupId && groupMap.has(s.groupId)) {
        const entry = groupMap.get(s.groupId)!;
        entry.schedules.push(s);
        entry.total += s.cost || 0;
      } else {
        unassigned.push(s);
        unassignedTotal += s.cost || 0;
      }
    });

    return {
      list: Array.from(groupMap.values()),
      unassigned,
      unassignedTotal,
    };
  }, [groups, schedulesWithCost]);

  // Handle assigning/changing group for a schedule
  const handleAssignGroup = async (scheduleId: number, newGroupIdStr: string) => {
    setAssigningId(scheduleId);
    const newGroupId = newGroupIdStr ? Number(newGroupIdStr) : null;

    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: newGroupId }),
      });

      if (res.ok) {
        const updatedTarget = groups.find((g) => g.id === newGroupId) || null;
        const newSchedules = trip.schedules.map((s) =>
          s.id === scheduleId
            ? {
                ...s,
                groupId: newGroupId,
                group: updatedTarget,
              }
            : s
        );

        if (onSchedulesChange) {
          onSchedulesChange(newSchedules);
        }
      } else {
        alert("グループの割り当てに失敗しました");
      }
    } catch (err) {
      console.error("Failed to assign group:", err);
      alert("通信エラーが発生しました");
    } finally {
      setAssigningId(null);
    }
  };

  const toggleGroupExpand = (groupId: string | number) => {
    const key = String(groupId);
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const formatShortDate = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).split("T")[0];
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#386641] flex items-center gap-2">
          <span>予算 & 費用サマリー</span>
        </h2>
        <p className="text-[#386641]/70 text-xs mt-0.5">
          予定・移動・宿泊に登録された費用の合計と、グループ（同行者）別の出費内訳です。
        </p>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget */}
        <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#386641]/50 mb-2">
            <span className="text-xs font-semibold text-[#386641]/70">目標予算</span>
            <PiggyBank className="w-4 h-4 text-[#386641]/60" />
          </div>
          <div className="text-2xl font-bold text-[#386641]">
            {budget > 0 ? `¥${budget.toLocaleString()}` : "未設定"}
          </div>
          <div className="text-[11px] text-[#386641]/60 mt-1">旅行全体の想定予算</div>
        </div>

        {/* Total Scheduled Expense */}
        <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#386641]/50 mb-2">
            <span className="text-xs font-semibold text-[#386641]/70">旅程の合計予定額</span>
            <TrendingUp className="w-4 h-4 text-[#DDA15E]" />
          </div>
          <div className="text-2xl font-bold text-[#C1121F]">
            ¥{totalScheduledCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#386641]/60 mt-1">
            {schedulesWithCost.length} 件の予定に費用設定
          </div>
        </div>

        {/* Remaining / Balance */}
        <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#386641]/50 mb-2">
            <span className="text-xs font-semibold text-[#386641]/70">予算の残り</span>
            <CircleDollarSign
              className={`w-4 h-4 ${
                remaining !== null && remaining < 0 ? "text-[#C1121F]" : "text-[#003049]"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold ${
              remaining === null
                ? "text-[#386641]"
                : remaining < 0
                ? "text-[#C1121F]"
                : "text-[#003049]"
            }`}
          >
            {remaining !== null ? `¥${remaining.toLocaleString()}` : "予算未設定"}
          </div>
          <div className="text-[11px] text-[#386641]/60 mt-1">
            {remaining !== null && remaining < 0 ? "⚠️ 予算を超過しています" : "余裕があります"}
          </div>
        </div>
      </div>

      {/* Budget usage progress bar */}
      {budget > 0 && (
        <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#386641] mb-2">
            <span>全体予算消化率</span>
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
                  className={`${CATEGORY_COLORS[catKey] || "bg-[#386641]/40"} h-full transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${CATEGORY_LABELS[catKey] || catKey}: ¥${total.toLocaleString()}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap mt-3 pt-3 border-t border-[#386641]/10 text-xs text-[#386641]/80">
            {Object.entries(categoryTotals).map(([catKey, total]) => {
              if (total === 0) return null;
              return (
                <div key={catKey} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[catKey]}`} />
                  <span>
                    {CATEGORY_LABELS[catKey]?.split("・")[0] || catKey}: ¥{total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* グループ別出費サマリー (Group Expenses Breakdown) */}
      {/* ======================================================== */}
      <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-[#386641] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#003049]" />
              <span>グループ別出費サマリー</span>
            </h3>
            <span className="text-xs font-semibold text-[#003049] bg-[#003049]/10 px-2.5 py-1 rounded-full">
              {groups.length} グループ登録
            </span>
          </div>
          <p className="text-xs text-[#386641]/70 mt-1">
            同行者や区間ごとの出費内訳です。未割り当ての出費は、各項目のセレクトボックスからグループへ振り分けできます。
          </p>
        </div>

        {/* Group share progress bar */}
        {totalScheduledCost > 0 && (
          <div className="bg-[#FDF0D5]/50 border border-[#DDA15E]/30 rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#386641]">
              <span>グループ別費用構成比</span>
              <span>合計: ¥{totalScheduledCost.toLocaleString()}</span>
            </div>

            <div className="w-full bg-stone-200 rounded-full h-3.5 overflow-hidden flex shadow-inner">
              {groupStats.list.map((item) => {
                if (item.total === 0) return null;
                const pct = (item.total / totalScheduledCost) * 100;
                return (
                  <div
                    key={item.group.id}
                    className="h-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                    title={`${item.group.flag} ${item.group.name}: ¥${item.total.toLocaleString()} (${Math.round(pct)}%)`}
                  />
                );
              })}
              {groupStats.unassignedTotal > 0 && (
                <div
                  className="h-full bg-stone-400 transition-all opacity-80"
                  style={{
                    width: `${(groupStats.unassignedTotal / totalScheduledCost) * 100}%`,
                  }}
                  title={`未設定: ¥${groupStats.unassignedTotal.toLocaleString()} (${Math.round((groupStats.unassignedTotal / totalScheduledCost) * 100)}%)`}
                />
              )}
            </div>

            {/* Legend chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              {groupStats.list.map((item) => {
                if (item.total === 0) return null;
                const pct = Math.round((item.total / totalScheduledCost) * 100);
                return (
                  <div
                    key={item.group.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#DDA15E]/30 text-xs font-medium text-[#386641]"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>
                      {item.group.flag} {item.group.name}:
                    </span>
                    <span className="font-bold text-[#003049]">
                      ¥{item.total.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                );
              })}
              {groupStats.unassignedTotal > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/20 text-xs font-medium text-[#C1121F]">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-400 shrink-0" />
                  <span>⚠️ 未設定:</span>
                  <span className="font-bold">
                    ¥{groupStats.unassignedTotal.toLocaleString()} (
                    {Math.round((groupStats.unassignedTotal / totalScheduledCost) * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Unassigned Expenses Card (When unassigned items exist) */}
        {/* ---------------------------------------------------- */}
        {groupStats.unassigned.length > 0 && (
          <div className="bg-[#C1121F]/5 border-2 border-[#C1121F]/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#C1121F]/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#C1121F] shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#C1121F] flex items-center gap-1.5">
                    <span>グループ未設定の出費</span>
                    <span className="bg-[#C1121F] text-white text-[11px] px-2 py-0.2 rounded-full font-bold">
                      {groupStats.unassigned.length} 件
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#C1121F]/80 mt-0.5">
                    以下の予定は出費グループが設定されていません。右端のメニューから所属グループを選択してください。
                  </p>
                </div>
              </div>
              <div className="text-right ml-auto">
                <span className="text-xs text-[#C1121F]/70">未設定合計: </span>
                <span className="text-base font-bold text-[#C1121F]">
                  ¥{groupStats.unassignedTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Unassigned items list */}
            <div className="flex flex-col divide-y divide-[#C1121F]/15">
              {groupStats.unassigned.map((s) => (
                <div
                  key={s.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono text-[#386641]/60 shrink-0 w-12">
                      {formatShortDate(s.date)}
                    </span>
                    <span className="text-xs shrink-0" title={s.category}>
                      {CATEGORY_EMOJIS[s.category] || "✨"}
                    </span>
                    <span className="font-semibold text-[#386641] truncate max-w-xs sm:max-w-md">
                      {s.title}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-bold text-sm text-[#C1121F]">
                      ¥{s.cost?.toLocaleString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {assigningId === s.id ? (
                        <div className="flex items-center gap-1 text-xs text-[#386641]/70 px-2 py-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#003049]" />
                          <span>更新中...</span>
                        </div>
                      ) : (
                        <select
                          value=""
                          onChange={(e) => handleAssignGroup(s.id, e.target.value)}
                          className="border border-[#C1121F]/40 rounded-xl px-2.5 py-1 text-xs bg-white text-[#386641] font-medium focus:outline-none focus:ring-2 focus:ring-[#C1121F]/30"
                        >
                          <option value="">＋ グループを割り当て</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.flag} {g.name} ({g.startDate.slice(5)}〜{g.endDate.slice(5)})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* Groups Cards List */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col gap-4">
          {groupStats.list.map((item) => {
            const isExpanded = expandedGroups[String(item.group.id)] ?? true;
            const pct =
              totalScheduledCost > 0
                ? Math.round((item.total / totalScheduledCost) * 100)
                : 0;

            return (
              <div
                key={item.group.id}
                className="border border-[#DDA15E]/40 rounded-2xl bg-white/95 overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
              >
                {/* Group card header */}
                <div
                  onClick={() => toggleGroupExpand(item.group.id)}
                  className="p-4 sm:p-4.5 bg-linear-to-r from-stone-50/70 to-white flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg">{item.group.flag}</span>
                        <h4 className="font-bold text-sm sm:text-base text-[#386641] truncate">
                          {item.group.name}
                        </h4>
                        {item.group.cityName && (
                          <span className="text-[11px] font-medium text-[#003049] bg-[#003049]/10 px-2 py-0.5 rounded-md">
                            {item.group.cityName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#386641]/60 mt-0.5">
                        期間: {item.group.startDate} 〜 {item.group.endDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-[#003049]">
                        ¥{item.total.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#386641]/60">
                        {item.schedules.length}件 ({pct}%)
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1 text-[#386641]/40 hover:text-[#386641] rounded-lg transition"
                      aria-label={isExpanded ? "閉じる" : "開く"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Group items breakdown */}
                {isExpanded && (
                  <div className="p-4 pt-1 sm:p-5 sm:pt-2 border-t border-stone-100">
                    {item.schedules.length === 0 ? (
                      <div className="py-4 text-center text-xs text-[#386641]/50">
                        このグループに登録された出費はありません。
                        <p className="text-[11px] text-[#386641]/40 mt-1">
                          タイムライン予定の作成・編集時や上記「未設定」からこのグループに出費を割り当てられます。
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-stone-100 text-xs">
                        {item.schedules.map((s) => (
                          <div
                            key={s.id}
                            className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[11px] font-mono text-[#386641]/60 shrink-0 w-12">
                                {formatShortDate(s.date)}
                              </span>
                              <span className="text-xs shrink-0" title={s.category}>
                                {CATEGORY_EMOJIS[s.category] || "✨"}
                              </span>
                              <span className="font-semibold text-[#386641] truncate max-w-xs sm:max-w-md">
                                {s.title}
                              </span>
                              <span className="text-[10px] text-[#386641]/50 bg-stone-100 px-1.5 py-0.5 rounded shrink-0">
                                {CATEGORY_LABELS[s.category]?.split("・")[0] || s.category}
                              </span>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className="font-bold text-sm text-[#386641]">
                                ¥{s.cost?.toLocaleString()}
                              </span>

                              {/* Reassign dropdown */}
                              <div className="flex items-center gap-1.5">
                                {assigningId === s.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#003049]" />
                                ) : (
                                  <select
                                    value={String(item.group.id)}
                                    onChange={(e) => handleAssignGroup(s.id, e.target.value)}
                                    className="border border-[#386641]/20 rounded-lg px-2 py-0.5 text-[11px] bg-white text-[#386641] focus:outline-none focus:ring-1 focus:ring-[#386641]"
                                    title="グループを変更"
                                  >
                                    <option value="">未設定 / 全体共通</option>
                                    {groups.map((g) => (
                                      <option key={g.id} value={g.id}>
                                        {g.flag} {g.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="pt-3 flex items-center justify-between font-bold text-xs text-[#386641]">
                          <span>{item.group.name} 合計</span>
                          <span className="text-[#003049] text-sm">
                            ¥{item.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-[#386641] mb-3 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-[#DDA15E]" />
          カテゴリ別費用一覧
        </h3>

        <div className="flex flex-col divide-y divide-[#386641]/10 text-xs">
          {Object.entries(categoryTotals).map(([catKey, total]) => (
            <div key={catKey} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[catKey]}`} />
                <span className="font-semibold text-[#386641]">
                  {CATEGORY_LABELS[catKey] || catKey}
                </span>
              </div>
              <span className="font-bold text-[#386641]">¥{total.toLocaleString()}</span>
            </div>
          ))}
          <div className="pt-3 flex items-center justify-between font-bold text-sm text-[#386641]">
            <span>合計予定費用</span>
            <span className="text-[#C1121F]">¥{totalScheduledCost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
