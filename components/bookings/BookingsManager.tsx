"use client";

import React, { useState, useMemo } from "react";
import { Schedule, Place, ReservationStatus, PRESET_PAYMENT_METHODS, PRESET_BOOKING_SITES } from "@/types/trip";
import {
  Hotel,
  Plane,
  Train,
  Bus,
  Car,
  Ship,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  CreditCard,
  Edit2,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Info,
  Building,
} from "lucide-react";
import { TRANSPORT_ICONS, TRANSPORT_LABELS } from "@/components/TimelineView";

interface BookingsManagerProps {
  tripId: number;
  schedules: Schedule[];
  places: Place[];
  onSchedulesChange: (schedules: Schedule[]) => void;
  onPlacesChange?: (places: Place[]) => void;
  isOffline?: boolean;
}

export interface BookingItem {
  id: string; // "schedule-123" or "place-456"
  sourceType: "SCHEDULE" | "PLACE";
  rawSchedule?: Schedule;
  rawPlace?: Place;
  type: "HOTEL" | "TRANSPORT";
  title: string;
  categoryLabel: string;
  dateStr: string; // YYYY-MM-DD
  endDateStr?: string | null;
  timeStr?: string | null;
  cost?: number | null;
  reservationStatus: ReservationStatus;
  bookingNumber?: string | null;
  paymentMethod?: string | null;
  cancelDeadline?: string | null; // e.g. "2026-03-20 23:59"
  bookingSite?: string | null;
  memo?: string | null;
  fromPlace?: string | null;
  toPlace?: string | null;
  flightNumber?: string | null;
  transportType?: string | null;
}

export default function BookingsManager({
  tripId,
  schedules,
  places,
  onSchedulesChange,
  onPlacesChange,
  isOffline = false,
}: BookingsManagerProps) {
  const [filterType, setFilterType] = useState<"ALL" | "HOTEL" | "TRANSPORT">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | ReservationStatus>("ALL");
  const [editingItem, setEditingItem] = useState<BookingItem | null>(null);

  // Edit Modal form state
  const [editForm, setEditForm] = useState({
    reservationStatus: "NONE" as ReservationStatus,
    bookingNumber: "",
    paymentMethod: "",
    cancelDeadline: "",
    bookingSite: "",
    cost: "",
    memo: "",
  });

  // Extract all Hotel and Transport items across schedules and places
  const allBookings = useMemo(() => {
    const list: BookingItem[] = [];

    // 1. From Schedules (Hotels & Transports)
    schedules.forEach((s) => {
      const isHotel = s.category === "HOTEL";
      const isTransport = s.category === "TRANSPORT" || !!s.transportType;

      if (isHotel || isTransport) {
        list.push({
          id: `schedule-${s.id}`,
          sourceType: "SCHEDULE",
          rawSchedule: s,
          type: isHotel ? "HOTEL" : "TRANSPORT",
          title: s.title,
          categoryLabel: isHotel
            ? "宿泊・ホテル"
            : s.transportType
            ? TRANSPORT_LABELS[s.transportType] || "交通機関"
            : "交通・移動",
          dateStr: s.date.split("T")[0],
          endDateStr: s.checkOutDate ? s.checkOutDate.split("T")[0] : null,
          timeStr: s.startTime || null,
          cost: s.cost,
          reservationStatus: (s.reservationStatus as ReservationStatus) || "NONE",
          bookingNumber: s.bookingNumber || null,
          paymentMethod: s.paymentMethod || null,
          cancelDeadline: s.cancelDeadline || null,
          bookingSite: s.bookingSite || null,
          memo: s.memo || null,
          fromPlace: s.fromPlace,
          toPlace: s.toPlace,
          flightNumber: s.flightNumber,
          transportType: s.transportType,
        });
      }
    });

    // 2. From Hotel Places (if not already represented as a schedule)
    places
      .filter((p) => p.category === "HOTEL")
      .forEach((p) => {
        // check if schedule already references this placeId
        const hasSchedule = schedules.some((s) => s.placeId === p.id);
        if (!hasSchedule) {
          list.push({
            id: `place-${p.id}`,
            sourceType: "PLACE",
            rawPlace: p,
            type: "HOTEL",
            title: p.name,
            categoryLabel: "宿泊・スポット",
            dateStr: p.checkInDate ? p.checkInDate.split("T")[0] : "",
            endDateStr: p.checkOutDate ? p.checkOutDate.split("T")[0] : null,
            timeStr: p.checkInTime || null,
            cost: p.cost,
            reservationStatus: (p.reservationStatus as ReservationStatus) || "NONE",
            bookingNumber: p.bookingNumber || null,
            paymentMethod: p.paymentMethod || null,
            cancelDeadline: p.cancelDeadline || null,
            bookingSite: p.bookingSite || null,
            memo: p.memo || null,
          });
        }
      });

    // Sort chronologically
    return list.sort((a, b) => {
      if (!a.dateStr) return 1;
      if (!b.dateStr) return -1;
      return a.dateStr.localeCompare(b.dateStr);
    });
  }, [schedules, places]);

  // Filtered List
  const filteredBookings = useMemo(() => {
    return allBookings.filter((item) => {
      if (filterType !== "ALL" && item.type !== filterType) return false;
      if (filterStatus !== "ALL" && item.reservationStatus !== filterStatus) return false;
      return true;
    });
  }, [allBookings, filterType, filterStatus]);

  // Statistics & Card summaries
  const stats = useMemo(() => {
    const total = allBookings.length;
    const booked = allBookings.filter((b) => b.reservationStatus === "BOOKED").length;
    const needBooking = allBookings.filter((b) => b.reservationStatus === "NEED_BOOKING").length;

    // Card totals
    const cardTotals: Record<string, number> = {};
    let totalCost = 0;

    allBookings.forEach((b) => {
      if (b.cost) {
        totalCost += b.cost;
        const method = b.paymentMethod || "未定 / 未登録";
        cardTotals[method] = (cardTotals[method] || 0) + b.cost;
      }
    });

    // Cancel Deadlines check (today vs deadline)
    const today = new Date().toISOString().split("T")[0];
    const upcomingDeadlines = allBookings
      .filter((b) => b.cancelDeadline && b.cancelDeadline >= today)
      .sort((a, b) => (a.cancelDeadline || "").localeCompare(b.cancelDeadline || ""));

    return { total, booked, needBooking, cardTotals, totalCost, upcomingDeadlines };
  }, [allBookings]);

  // Open Edit Modal
  const handleOpenEdit = (item: BookingItem) => {
    setEditingItem(item);
    setEditForm({
      reservationStatus: item.reservationStatus,
      bookingNumber: item.bookingNumber || "",
      paymentMethod: item.paymentMethod || "",
      cancelDeadline: item.cancelDeadline || "",
      bookingSite: item.bookingSite || "",
      cost: item.cost !== null && item.cost !== undefined ? String(item.cost) : "",
      memo: item.memo || "",
    });
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const updatedCost = editForm.cost ? Number(editForm.cost) : null;

    if (editingItem.sourceType === "SCHEDULE" && editingItem.rawSchedule) {
      const scheduleId = editingItem.rawSchedule.id;
      const payload = {
        reservationStatus: editForm.reservationStatus,
        bookingNumber: editForm.bookingNumber || null,
        paymentMethod: editForm.paymentMethod || null,
        cancelDeadline: editForm.cancelDeadline || null,
        bookingSite: editForm.bookingSite || null,
        cost: updatedCost,
        memo: editForm.memo || null,
      };

      if (!isOffline) {
        try {
          await fetch(`/api/schedules/${scheduleId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.warn("Online update failed, will update local state:", e);
        }
      }

      onSchedulesChange(
        schedules.map((s) => (s.id === scheduleId ? { ...s, ...payload } : s))
      );
    } else if (editingItem.sourceType === "PLACE" && editingItem.rawPlace && onPlacesChange) {
      const placeId = editingItem.rawPlace.id;
      const payload = {
        reservationStatus: editForm.reservationStatus,
        bookingNumber: editForm.bookingNumber || null,
        paymentMethod: editForm.paymentMethod || null,
        cancelDeadline: editForm.cancelDeadline || null,
        bookingSite: editForm.bookingSite || null,
        cost: updatedCost,
        memo: editForm.memo || null,
      };

      if (!isOffline) {
        try {
          await fetch(`/api/places/${placeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.warn("Online update failed, will update local state:", e);
        }
      }

      onPlacesChange(
        places.map((p) => (p.id === placeId ? { ...p, ...payload } : p))
      );
    }

    setEditingItem(null);
  };

  // Days until cancel deadline helper
  const getDaysUntilDeadline = (deadlineStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status card */}
        <div className="bg-white/90 border border-[#DDA15E]/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#386641]/70">予約・手配状況</span>
            <CheckCircle2 className="w-4 h-4 text-[#386641]" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#386641]">
                {stats.booked} <span className="text-sm font-normal text-[#386641]/70">/ {stats.total} 件完了</span>
              </span>
            </div>
            {stats.needBooking > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C1121F] bg-[#C1121F]/10 px-2 py-0.5 rounded-full mt-1">
                ⚠️ 要手配が {stats.needBooking} 件あります
              </span>
            ) : stats.total > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#386641] bg-[#386641]/10 px-2 py-0.5 rounded-full mt-1">
                ✓ すべて手配完了！
              </span>
            ) : null}
          </div>
          <div className="w-full bg-[#386641]/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#386641] h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.total > 0 ? (stats.booked / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Cancel Deadline Card */}
        <div className="bg-white/90 border border-[#DDA15E]/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#C1121F]">無料キャンセル期限アラート</span>
            <AlertTriangle className="w-4 h-4 text-[#C1121F]" />
          </div>
          <div className="my-2">
            {stats.upcomingDeadlines.length > 0 ? (
              <div>
                {(() => {
                  const nearest = stats.upcomingDeadlines[0];
                  const days = getDaysUntilDeadline(nearest.cancelDeadline!);
                  return (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-[#C1121F]">
                          あと {days} 日
                        </span>
                        <span className="text-xs text-[#386641]/70 truncate max-w-[140px]" title={nearest.title}>
                          ({nearest.title})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#386641]/70 mt-1">
                        期限: {nearest.cancelDeadline}
                      </p>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="py-1">
                <span className="text-sm font-semibold text-[#386641]/70">直近の期限アラートなし</span>
                <p className="text-[11px] text-[#386641]/50 mt-0.5">無料キャンセル期限を設定するとここに表示されます</p>
              </div>
            )}
          </div>
          <div className="text-[11px] text-[#386641]/60">
            登録済み期限: {allBookings.filter((b) => b.cancelDeadline).length} 件
          </div>
        </div>

        {/* Payment Methods breakdown card */}
        <div className="bg-white/90 border border-[#DDA15E]/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#003049]">決済カード・支払先別集計</span>
            <CreditCard className="w-4 h-4 text-[#003049]" />
          </div>
          <div className="my-1.5 max-h-24 overflow-y-auto pr-1 flex flex-col gap-1">
            {Object.keys(stats.cardTotals).length > 0 ? (
              Object.entries(stats.cardTotals).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between text-xs">
                  <span className="text-[#386641]/80 truncate max-w-[130px]" title={method}>
                    💳 {method}
                  </span>
                  <span className="font-bold text-[#386641]">¥{amount.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-[#386641]/50 py-2">費用情報がまだありません</span>
            )}
          </div>
          <div className="text-[11px] font-bold text-[#386641] pt-1 border-t border-[#386641]/10 flex items-center justify-between">
            <span>移動・ホテル合計</span>
            <span>¥{stats.totalCost.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white/80 border border-[#DDA15E]/30 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Type filters */}
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === "ALL"
                ? "bg-[#386641] text-white shadow-xs"
                : "bg-[#386641]/10 text-[#386641] hover:bg-[#386641]/20"
            }`}
          >
            すべて ({allBookings.length})
          </button>
          <button
            onClick={() => setFilterType("HOTEL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              filterType === "HOTEL"
                ? "bg-[#386641] text-white shadow-xs"
                : "bg-[#386641]/10 text-[#386641] hover:bg-[#386641]/20"
            }`}
          >
            <Hotel className="w-3.5 h-3.5" />
            <span>ホテル ({allBookings.filter((b) => b.type === "HOTEL").length})</span>
          </button>
          <button
            onClick={() => setFilterType("TRANSPORT")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              filterType === "TRANSPORT"
                ? "bg-[#386641] text-white shadow-xs"
                : "bg-[#386641]/10 text-[#386641] hover:bg-[#386641]/20"
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>移動・交通 ({allBookings.filter((b) => b.type === "TRANSPORT").length})</span>
          </button>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#386641]/60" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs bg-[#FDF0D5]/60 border border-[#DDA15E]/40 rounded-xl px-2.5 py-1.5 font-bold text-[#386641] focus:outline-none"
          >
            <option value="ALL">すべてのステータス</option>
            <option value="BOOKED">✓ 予約済み</option>
            <option value="NEED_BOOKING">⚠️ 要予約 / 手配前</option>
            <option value="NONE">予約不要 / 未定</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white/60 border border-dashed border-[#DDA15E]/50 rounded-3xl p-8">
          <span className="text-4xl mb-2 block">📋</span>
          <p className="font-bold text-base text-[#386641]">対象の予約・手配項目がありません</p>
          <p className="text-xs text-[#386641]/60 mt-1">
            タイムラインで「宿泊」や「交通（電車・飛行機・バスなど）」を追加すると、自動的にここに集約されます。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBookings.map((item) => {
            const daysLeft = item.cancelDeadline ? getDaysUntilDeadline(item.cancelDeadline) : null;
            const isDeadlineClose = daysLeft !== null && daysLeft <= 5 && daysLeft >= 0;
            const isDeadlinePassed = daysLeft !== null && daysLeft < 0;

            return (
              <div
                key={item.id}
                className="bg-white/95 rounded-2xl border border-[#DDA15E]/30 p-4 sm:p-5 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              >
                {/* Left: Icon & Main Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-[#FDF0D5] border border-[#DDA15E]/40 flex items-center justify-center shrink-0 text-lg">
                    {item.type === "HOTEL" ? (
                      <Hotel className="w-5 h-5 text-[#DDA15E]" />
                    ) : item.transportType ? (
                      TRANSPORT_ICONS[item.transportType] || <Plane className="w-5 h-5 text-[#386641]" />
                    ) : (
                      <Plane className="w-5 h-5 text-[#386641]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Category Label */}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#386641]/10 text-[#386641]">
                        {item.categoryLabel}
                      </span>

                      {/* Status Badge */}
                      {item.reservationStatus === "BOOKED" ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#386641]/15 text-[#386641] border border-[#386641]/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#386641]" />
                          予約済み
                        </span>
                      ) : item.reservationStatus === "NEED_BOOKING" ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[#C1121F]" />
                          要予約
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600">
                          予約不要 / 未定
                        </span>
                      )}

                      {/* Date */}
                      {item.dateStr && (
                        <span className="text-xs text-[#386641]/60 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.dateStr}
                          {item.endDateStr ? ` 〜 ${item.endDateStr}` : ""}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base text-[#386641] truncate">
                      {item.title}
                      {item.flightNumber ? ` (${item.flightNumber})` : ""}
                    </h3>

                    {/* From -> To details */}
                    {(item.fromPlace || item.toPlace) && (
                      <p className="text-xs text-[#386641]/70 mt-0.5">
                        {item.fromPlace || "出発"} → {item.toPlace || "到着"}
                      </p>
                    )}

                    {/* Booking metadata tags */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                      {item.bookingNumber && (
                        <span className="font-mono bg-[#003049]/5 border border-[#003049]/15 px-2 py-0.5 rounded-md text-[#003049] font-bold">
                          No: {item.bookingNumber}
                        </span>
                      )}

                      {item.paymentMethod && (
                        <span className="bg-[#DDA15E]/15 border border-[#DDA15E]/30 px-2 py-0.5 rounded-md text-[#386641] font-medium flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-[#DDA15E]" />
                          {item.paymentMethod}
                        </span>
                      )}

                      {item.bookingSite && (
                        <span className="bg-[#386641]/5 px-2 py-0.5 rounded-md text-[#386641]/70">
                          経由: {item.bookingSite}
                        </span>
                      )}

                      {/* Cancel Deadline Warning */}
                      {item.cancelDeadline && (
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                            isDeadlineClose
                              ? "bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/30 animate-pulse"
                              : isDeadlinePassed
                              ? "bg-stone-200 text-stone-500 line-through"
                              : "bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/30"
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            {isDeadlinePassed
                              ? `キャンセル期限超過 (${item.cancelDeadline})`
                              : `キャンセル無料: ${item.cancelDeadline} (残 ${daysLeft}日)`}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Cost & Edit Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#386641]/10">
                  <div className="text-right">
                    {item.cost !== null && item.cost !== undefined ? (
                      <span className="font-bold text-base sm:text-lg text-[#386641]">
                        ¥{item.cost.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs text-[#386641]/40">金額未設定</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="flex items-center gap-1 text-xs font-bold text-[#386641] bg-[#FDF0D5] hover:bg-[#FDF0D5]/80 border border-[#DDA15E]/40 px-3 py-1.5 rounded-xl transition shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#C1121F]" />
                    <span>予約情報を編集</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Booking Details Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#386641]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#DDA15E]/40 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#386641]/10 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#386641]">予約・決済情報の編集</h3>
                <p className="text-xs text-[#386641]/70 truncate max-w-xs">{editingItem.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full text-[#386641]/60 hover:text-[#386641]"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Status */}
              <div>
                <label className="block font-semibold text-[#386641] mb-1">予約ステータス</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["NONE", "NEED_BOOKING", "BOOKED"] as ReservationStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, reservationStatus: st })}
                      className={`py-2 px-2 rounded-xl font-bold border text-center transition ${
                        editForm.reservationStatus === st
                          ? st === "BOOKED"
                            ? "bg-[#386641] text-white border-[#386641]"
                            : st === "NEED_BOOKING"
                            ? "bg-[#C1121F] text-white border-[#C1121F]"
                            : "bg-[#003049] text-white border-[#003049]"
                          : "bg-white text-[#386641] border-[#386641]/20 hover:bg-[#FDF0D5]/50"
                      }`}
                    >
                      {st === "BOOKED" ? "✓ 予約済み" : st === "NEED_BOOKING" ? "⚠️ 要予約" : "予約不要/未定"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method with Preset Chips */}
              <div>
                <label className="block font-semibold text-[#386641] mb-1">
                  支払い方法・使用クレジットカード
                </label>
                <input
                  type="text"
                  placeholder="例: 楽天カード、三井住友VISA、現地決済"
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                  className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 bg-white text-[#386641] focus:outline-none focus:border-[#386641]"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {PRESET_PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, paymentMethod: pm })}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition ${
                        editForm.paymentMethod === pm
                          ? "bg-[#386641] text-white border-[#386641]"
                          : "bg-[#FDF0D5]/60 text-[#386641] border-[#DDA15E]/40 hover:bg-[#FDF0D5]"
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Number & Booking Site */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#386641] mb-1">予約番号 / 照会番号</label>
                  <input
                    type="text"
                    placeholder="例: #BK-123456"
                    value={editForm.bookingNumber}
                    onChange={(e) => setEditForm({ ...editForm, bookingNumber: e.target.value })}
                    className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 bg-white font-mono text-[#386641] focus:outline-none focus:border-[#386641]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#386641] mb-1">予約サイト・窓口</label>
                  <input
                    type="text"
                    placeholder="例: Booking.com, スマートEX"
                    value={editForm.bookingSite}
                    onChange={(e) => setEditForm({ ...editForm, bookingSite: e.target.value })}
                    className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 bg-white text-[#386641] focus:outline-none focus:border-[#386641]"
                  />
                </div>
              </div>

              {/* Cancel Deadline */}
              <div>
                <label className="block font-semibold text-[#386641] mb-1 flex items-center justify-between">
                  <span>無料キャンセル期限 (日付・時刻)</span>
                  <span className="text-[10px] text-[#C1121F]">※この日時を過ぎるとキャンセル料発生</span>
                </label>
                <input
                  type="date"
                  value={editForm.cancelDeadline}
                  onChange={(e) => setEditForm({ ...editForm, cancelDeadline: e.target.value })}
                  className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 bg-white text-[#386641] focus:outline-none focus:border-[#386641]"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="block font-semibold text-[#386641] mb-1">決済金額 / 宿泊費・運賃 (円)</label>
                <input
                  type="number"
                  placeholder="例: 18500"
                  value={editForm.cost}
                  onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                  className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 bg-white text-[#386641] focus:outline-none focus:border-[#386641]"
                />
              </div>

              {/* Memo */}
              <div>
                <label className="block font-semibold text-[#386641] mb-1">予約メモ・注意事項</label>
                <textarea
                  rows={2}
                  placeholder="例: 現地で宿泊税別途支払い、朝食7:00から、スマートEXのQRコード保存済"
                  value={editForm.memo}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                  className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 bg-white text-[#386641] focus:outline-none focus:border-[#386641] resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-[#386641]/10">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-bold text-[#386641]/70 hover:text-[#386641]"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-[#386641] hover:bg-[#2b4f32] text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
