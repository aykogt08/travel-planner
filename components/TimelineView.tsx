"use client";

import { useState } from "react";
import { Schedule, Place, TransportType, ScheduleCategory } from "@/types/trip";
import { normalizeNumberInput } from "@/lib/utils";
import {
  Clock,
  MapPin,
  CircleDollarSign,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Footprints,
  Train,
  Bus,
  Car,
  Plane,
  Ship,
  Sparkles,
  Calendar,
  Utensils,
  Landmark,
  Hotel,
  LogOut,
  LogIn,
  Moon,
  Users,
  Divide,
  Coffee,
} from "lucide-react";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "./PlacesManager";

interface TimelineViewProps {
  tripId: number;
  schedules: Schedule[];
  places: Place[];
  startDate: string | null;
  endDate: string | null;
  onSchedulesChange: (schedules: Schedule[]) => void;
  isOffline?: boolean;
}

export const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  WALK: <Footprints className="w-3.5 h-3.5 text-[#386641]" />,
  TRAIN: <Train className="w-3.5 h-3.5 text-[#003049]" />,
  BUS: <Bus className="w-3.5 h-3.5 text-[#003049]" />,
  CAR: <Car className="w-3.5 h-3.5 text-[#003049]" />,
  FLIGHT: <Plane className="w-3.5 h-3.5 text-[#003049]" />,
  SHIP: <Ship className="w-3.5 h-3.5 text-[#003049]" />,
  TAXI: <Car className="w-3.5 h-3.5 text-[#003049]" />,
};

export const TRANSPORT_LABELS: Record<string, string> = {
  WALK: "徒歩",
  TRAIN: "電車・新幹線",
  BUS: "バス",
  CAR: "車・レンタカー",
  FLIGHT: "飛行機",
  SHIP: "船・フェリー",
  TAXI: "タクシー",
};

export interface TimelineEventItem {
  key: string;
  schedule: Schedule;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // "15:00"
  type: "NORMAL" | "HOTEL_CHECKIN" | "HOTEL_CHECKOUT";
  hotelNights?: number;
  hotelStayRangeText?: string;
}

export default function TimelineView({
  tripId,
  schedules,
  places,
  startDate,
  endDate,
  onSchedulesChange,
  isOffline = false,
}: TimelineViewProps) {
  const [selectedDateTab, setSelectedDateTab] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
  };

  // Calculate day list from trip start/end date & schedules (including checkOutDate)
  const getDateList = () => {
    const datesSet = new Set<string>();

    // From schedules & hotel checkout dates
    schedules.forEach((s) => {
      datesSet.add(s.date.split("T")[0]);
      if (s.checkOutDate) {
        datesSet.add(s.checkOutDate.split("T")[0]);
      }
    });

    // From trip range
    if (startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(startDate);
      const cur = new Date(start);
      while (cur <= end) {
        datesSet.add(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }

    return Array.from(datesSet).sort();
  };

  const datesList = getDateList();

  // Helper: Project schedules into timeline event cards (expanding Hotel check-in & check-out)
  const allTimelineItems: TimelineEventItem[] = [];

  schedules.forEach((s) => {
    const sDate = s.date.split("T")[0];
    const sOutDate = s.checkOutDate ? s.checkOutDate.split("T")[0] : null;

    if (s.category === "HOTEL") {
      let nights = 1;
      if (sOutDate && sOutDate > sDate) {
        nights = Math.ceil(
          (new Date(sOutDate).getTime() - new Date(sDate).getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      const stayRangeText = sOutDate
        ? `${formatDate(sDate)} 〜 ${formatDate(sOutDate)} (${nights}泊)`
        : `${formatDate(sDate)} (日帰り・1日)`;

      // Check-in Event
      allTimelineItems.push({
        key: `${s.id}-checkin`,
        schedule: s,
        dateStr: sDate,
        timeStr: s.startTime || "15:00",
        type: "HOTEL_CHECKIN",
        hotelNights: nights,
        hotelStayRangeText: stayRangeText,
      });

      // Check-out Event (if checkout date is different from check-in date)
      if (sOutDate && sOutDate !== sDate) {
        allTimelineItems.push({
          key: `${s.id}-checkout`,
          schedule: s,
          dateStr: sOutDate,
          timeStr: s.endTime || "11:00",
          type: "HOTEL_CHECKOUT",
          hotelNights: nights,
          hotelStayRangeText: stayRangeText,
        });
      }
    } else {
      allTimelineItems.push({
        key: String(s.id),
        schedule: s,
        dateStr: sDate,
        timeStr: s.startTime || "",
        type: "NORMAL",
      });
    }
  });

  // Filter items for selected tab and sort chronologically
  const filteredTimelineItems = allTimelineItems
    .filter((item) => {
      if (selectedDateTab === "ALL") return true;
      return item.dateStr === selectedDateTab;
    })
    .sort((a, b) => {
      const dateDiff = new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.timeStr.localeCompare(b.timeStr);
    });

  // Intermediate staying hotels (e.g. Day 2 of a 2-night stay)
  const activeStayingHotels =
    selectedDateTab !== "ALL"
      ? schedules.filter((s) => {
          if (s.category !== "HOTEL" || !s.checkOutDate) return false;
          const sDate = s.date.split("T")[0];
          const sOutDate = s.checkOutDate.split("T")[0];
          return sDate < selectedDateTab && selectedDateTab < sOutDate;
        })
      : [];

  // Form state
  const defaultInitialDate = () => {
    if (selectedDateTab !== "ALL") return selectedDateTab;
    if (startDate) return startDate.split("T")[0];
    return new Date().toISOString().split("T")[0];
  };

  const [form, setForm] = useState({
    date: defaultInitialDate(),
    startTime: "10:00",
    endTime: "11:30",
    checkOutDate: "",
    title: "",
    category: "SIGHTSEEING" as ScheduleCategory,
    transportType: "" as TransportType | "",
    flightNumber: "",
    duration: "",
    fromPlace: "",
    toPlace: "",
    cost: "",
    memo: "",
    placeId: "" as string,
    hasBreakfast: false,
  });

  const [splitMode, setSplitMode] = useState(false);
  const [splitPeople, setSplitPeople] = useState("2");

  const resetForm = (targetDate?: string) => {
    const baseDate =
      targetDate ||
      (selectedDateTab !== "ALL"
        ? selectedDateTab
        : startDate
        ? startDate.split("T")[0]
        : new Date().toISOString().split("T")[0]);

    // Calculate default next day for hotel
    const nextDay = new Date(baseDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const defaultOutDate = nextDay.toISOString().split("T")[0];

    setForm({
      date: baseDate,
      startTime: "10:00",
      endTime: "11:30",
      checkOutDate: defaultOutDate,
      title: "",
      category: "SIGHTSEEING",
      transportType: "",
      flightNumber: "",
      duration: "",
      fromPlace: "",
      toPlace: "",
      cost: "",
      memo: "",
      placeId: "",
      hasBreakfast: false,
    });
    setSplitMode(false);
    setSplitPeople("2");
    setEditingSchedule(null);
  };

  const handleOpenAddModal = (date?: string, category: ScheduleCategory = "SIGHTSEEING") => {
    resetForm(date);
    const baseDate =
      date ||
      (selectedDateTab !== "ALL"
        ? selectedDateTab
        : startDate
        ? startDate.split("T")[0]
        : new Date().toISOString().split("T")[0]);

    const nextDay = new Date(baseDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const defaultOutDate = nextDay.toISOString().split("T")[0];

    setForm((prev) => ({
      ...prev,
      category,
      startTime: category === "HOTEL" ? "15:00" : "10:00",
      endTime: category === "HOTEL" ? "11:00" : "11:30",
      checkOutDate: defaultOutDate,
      hasBreakfast: false,
    }));
    setShowAddModal(true);
  };

  const handleOpenEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    const sDate = schedule.date.split("T")[0];
    let sOutDate = schedule.checkOutDate ? schedule.checkOutDate.split("T")[0] : "";
    if (schedule.category === "HOTEL" && !sOutDate) {
      const nextDay = new Date(sDate);
      nextDay.setDate(nextDay.getDate() + 1);
      sOutDate = nextDay.toISOString().split("T")[0];
    }

    setForm({
      date: sDate,
      startTime: schedule.startTime || (schedule.category === "HOTEL" ? "15:00" : ""),
      endTime: schedule.endTime || (schedule.category === "HOTEL" ? "11:00" : ""),
      checkOutDate: sOutDate,
      title: schedule.title,
      category: (schedule.category as ScheduleCategory) || "SIGHTSEEING",
      transportType: (schedule.transportType as TransportType) || "",
      flightNumber: schedule.flightNumber || "",
      duration: schedule.duration ? String(schedule.duration) : "",
      fromPlace: schedule.fromPlace || "",
      toPlace: schedule.toPlace || "",
      cost: schedule.cost ? String(schedule.cost) : "",
      memo: schedule.memo || "",
      placeId: schedule.placeId && places.some((p) => p.id === schedule.placeId) ? String(schedule.placeId) : "",
      hasBreakfast: Boolean(schedule.hasBreakfast),
    });
    setShowAddModal(true);
  };

  const handleCategoryChange = (newCat: ScheduleCategory) => {
    setForm((prev) => {
      if (newCat === "HOTEL") {
        const nextDay = new Date(prev.date);
        nextDay.setDate(nextDay.getDate() + 1);
        return {
          ...prev,
          category: newCat,
          startTime: prev.startTime === "10:00" ? "15:00" : prev.startTime || "15:00",
          endTime: prev.endTime === "11:30" ? "11:00" : prev.endTime || "11:00",
          checkOutDate: prev.checkOutDate || nextDay.toISOString().split("T")[0],
        };
      }
      return {
        ...prev,
        category: newCat,
      };
    });
  };

  const handleSaveSchedule = async () => {
    if (!form.title.trim() || !form.date) {
      return alert("タイトルと日付を入力してください");
    }

    const isHotel = form.category === "HOTEL";
    let costValue = form.cost ? Number(form.cost) : null;
    if (costValue && splitMode) {
      const people = Number(splitPeople) || 1;
      costValue = Math.ceil(costValue / people);
    }
    const payload = {
      date: form.date,
      startTime: form.startTime || (isHotel ? "15:00" : null),
      endTime: form.endTime || (isHotel ? "11:00" : null),
      checkOutDate: isHotel && form.checkOutDate ? form.checkOutDate : null,
      title: form.title.trim(),
      category: form.category,
      transportType: form.transportType || null,
      flightNumber: form.flightNumber.trim() || null,
      duration: form.duration ? Number(form.duration) : null,
      fromPlace: form.fromPlace.trim() || null,
      toPlace: form.toPlace.trim() || null,
      cost: costValue,
      memo: form.memo.trim() || null,
      hasBreakfast: isHotel ? Boolean(form.hasBreakfast) : false,
      placeId: form.placeId ? Number(form.placeId) : null,
      tripId,
    };

    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);

    try {
      if (editingSchedule) {
        let updated: Schedule | null = null;
        if (!isOfflineMode) {
          try {
            const res = await fetch(`/api/schedules/${editingSchedule.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              updated = await res.json();
            }
          } catch (e) {
            console.warn("Online schedule update failed, fallback to offline:", e);
          }
        }

        if (!updated) {
          updated = {
            ...editingSchedule,
            ...payload,
            date: payload.date,
            updatedAt: new Date().toISOString(),
          };
        }

        onSchedulesChange(schedules.map((s) => (s.id === updated!.id ? updated! : s)));
        if (selectedDateTab !== "ALL" && selectedDateTab !== form.date) {
          setSelectedDateTab(form.date);
        }
        setShowAddModal(false);
        resetForm();
      } else {
        let created: Schedule | null = null;
        if (!isOfflineMode) {
          try {
            const res = await fetch("/api/schedules", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              created = await res.json();
            }
          } catch (e) {
            console.warn("Online schedule create failed, fallback to offline:", e);
          }
        }

        const finalCreated: Schedule = created || {
          id: Date.now(),
          ...payload,
          date: payload.date,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onSchedulesChange([...schedules, finalCreated]);
        if (selectedDateTab !== "ALL" && selectedDateTab !== form.date) {
          setSelectedDateTab(form.date);
        }
        setShowAddModal(false);
        resetForm();
      }
    } catch (err) {
      console.error("Save schedule error:", err);
      // Fallback local update
      const fallbackSchedule: Schedule = {
        id: editingSchedule ? editingSchedule.id : Date.now(),
        ...payload,
        date: payload.date,
        isCompleted: editingSchedule ? editingSchedule.isCompleted : false,
        createdAt: editingSchedule ? editingSchedule.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (editingSchedule) {
        onSchedulesChange(schedules.map((s) => (s.id === fallbackSchedule.id ? fallbackSchedule : s)));
      } else {
        onSchedulesChange([...schedules, fallbackSchedule]);
      }
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("このスケジュールを削除しますか？")) return;
    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    if (!isOfflineMode) {
      fetch(`/api/schedules/${id}`, { method: "DELETE" }).catch((e) => console.warn(e));
    }
    onSchedulesChange(schedules.filter((s) => s.id !== id));
  };

  const handleToggleComplete = async (schedule: Schedule) => {
    const nextCompleted = !schedule.isCompleted;
    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    if (!isOfflineMode) {
      fetch(`/api/schedules/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextCompleted }),
      }).catch((e) => console.warn(e));
    }
    onSchedulesChange(schedules.map((s) => (s.id === schedule.id ? { ...s, isCompleted: nextCompleted } : s)));
  };

  const handleSelectPlace = (placeIdStr: string) => {
    setForm((prev) => {
      const p = places.find((item) => item.id === Number(placeIdStr));
      if (p) {
        const isHotel = p.category === "HOTEL";
        const nextDate = isHotel && p.checkInDate ? p.checkInDate : prev.date;
        let nextCheckOutDate = prev.checkOutDate;
        if (isHotel) {
          if (p.checkOutDate) {
            nextCheckOutDate = p.checkOutDate;
          } else {
            const nextD = new Date(nextDate);
            nextD.setDate(nextD.getDate() + 1);
            nextCheckOutDate = nextD.toISOString().split("T")[0];
          }
        }

        return {
          ...prev,
          placeId: placeIdStr,
          title: prev.title || p.name,
          category: (isHotel ? "HOTEL" : (p.category as ScheduleCategory)) || prev.category,
          date: nextDate,
          checkOutDate: nextCheckOutDate,
          startTime: isHotel ? p.checkInTime || "15:00" : prev.startTime,
          endTime: isHotel ? p.checkOutTime || "11:00" : prev.endTime,
          cost: prev.cost || (p.cost ? String(p.cost) : ""),
          memo: prev.memo || (p.memo ? p.memo : ""),
          hasBreakfast: isHotel ? Boolean(p.hasBreakfast) : prev.hasBreakfast,
        };
      }
      return { ...prev, placeId: placeIdStr };
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Add Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#003049] flex items-center gap-2">
            <span>🗓️ 旅程タイムライン</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#003049]">
              {schedules.length} 件の予定
            </span>
          </h2>
          <p className="text-[#003049]/70 text-xs mt-0.5">
            日ごとのスケジュール・移動・宿泊（チェックイン/アウト）をタイムライン形式で把握できます。
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenAddModal(undefined, "HOTEL")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#DDA15E]/20 text-[#003049] border border-[#DDA15E]/40 rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#DDA15E]/30 transition shadow-2xs"
          >
            <Hotel className="w-4 h-4 text-[#DDA15E]" />
            宿泊を追加
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C1121F] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#a50f1a] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            予定を追加
          </button>
        </div>
      </div>

      {/* Date filter tabs (Day 1, Day 2...) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedDateTab("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
            selectedDateTab === "ALL"
              ? "bg-[#003049] text-[#FDF0D5] border-[#003049] shadow-xs"
              : "bg-white/90 text-[#003049] border-[#DDA15E]/30 hover:bg-white"
          }`}
        >
          全日程 ({allTimelineItems.length})
        </button>

        {datesList.map((dateStr, idx) => {
          const isSelected = selectedDateTab === dateStr;
          const count = allTimelineItems.filter((item) => item.dateStr === dateStr).length;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDateTab(dateStr)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                isSelected
                  ? "bg-[#003049] text-[#FDF0D5] border-[#003049] shadow-xs"
                  : "bg-white/90 text-[#003049] border-[#DDA15E]/30 hover:bg-white"
              }`}
            >
              <span>
                Day {idx + 1} ({formatDate(dateStr)})
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#003049]/10 text-[#003049]/70"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Staying Hotel Banner (for multi-day stays) */}
      {activeStayingHotels.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeStayingHotels.map((h) => (
            <div
              key={h.id}
              className="p-3.5 rounded-2xl bg-[#DDA15E]/15 border border-[#DDA15E]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#DDA15E]/20 text-[#003049]">
                  <Hotel className="w-4 h-4 text-[#DDA15E]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#003049] flex items-center gap-1.5 flex-wrap">
                    <span>宿泊中: {h.title}</span>
                    {h.hasBreakfast && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#003049] border border-[#DDA15E]/40 inline-flex items-center gap-1">
                        <Coffee className="w-2.5 h-2.5 text-[#DDA15E]" />
                        朝食付き
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#003049]/70 mt-0.5">
                    チェックイン: {formatDate(h.date)} {h.startTime || "15:00"} 〜 チェックアウト: {formatDate(h.checkOutDate!)} {h.endTime || "11:00"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#DDA15E]/30 text-[#003049]">
                  連泊滞在中
                </span>
                <button
                  onClick={() => handleOpenEditModal(h)}
                  className="text-xs text-[#003049] hover:underline font-medium px-1"
                >
                  宿の詳細
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline List */}
      {filteredTimelineItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/90 border border-dashed border-[#DDA15E]/40 rounded-2xl">
          <div className="text-4xl mb-3"></div>
          <h3 className="text-[#003049] font-semibold text-sm">予定がありません</h3>
          <p className="text-[#003049]/60 text-xs mt-1 max-w-sm mx-auto">
            {selectedDateTab === "ALL"
              ? "予定を追加して旅のスケジュールを組み立てましょう。"
              : `${formatDate(selectedDateTab)} の予定はまだありません。`}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => handleOpenAddModal(selectedDateTab !== "ALL" ? selectedDateTab : undefined)}
              className="px-4 py-2 bg-[#C1121F] text-white rounded-xl text-xs font-semibold hover:bg-[#a50f1a] transition"
            >
              + この日に予定を追加
            </button>
            <button
              onClick={() => handleOpenAddModal(selectedDateTab !== "ALL" ? selectedDateTab : undefined, "HOTEL")}
              className="px-4 py-2 bg-[#DDA15E]/20 text-[#003049] border border-[#DDA15E]/40 rounded-xl text-xs font-semibold hover:bg-[#DDA15E]/30 transition"
            >
              宿泊を追加
            </button>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-8 border-l-2 border-[#DDA15E]/40 flex flex-col gap-6 ml-2 my-2">
          {filteredTimelineItems.map((item) => {
            const schedule = item.schedule;
            const place = places.find((p) => p.id === schedule.placeId);
            const isTransport = schedule.category === "TRANSPORT" || schedule.transportType;
            const isCheckIn = item.type === "HOTEL_CHECKIN";
            const isCheckOut = item.type === "HOTEL_CHECKOUT";

            // Node Dot color
            let dotBgClass = "bg-[#C1121F]";
            if (schedule.isCompleted) {
              dotBgClass = "bg-[#386641]";
            } else if (isCheckIn || isCheckOut) {
              dotBgClass = "bg-[#DDA15E]";
            } else if (isTransport) {
              dotBgClass = "bg-[#003049]";
            }

            // Card border & background styling
            let cardClasses = "border-[#DDA15E]/30 bg-white/95";
            if (schedule.isCompleted) {
              cardClasses = "border-[#003049]/10 bg-white/60 opacity-75";
            } else if (isCheckIn) {
              cardClasses = "border-[#DDA15E]/60 bg-[#DDA15E]/10 hover:border-[#DDA15E]";
            } else if (isCheckOut) {
              cardClasses = "border-[#DDA15E]/40 bg-[#DDA15E]/5 hover:border-[#DDA15E]";
            } else if (isTransport) {
              cardClasses = "border-[#003049]/20 bg-[#003049]/5 hover:border-[#003049]/30";
            }

            return (
              <div key={item.key} className="relative group">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[31px] md:-left-[39px] top-4 w-4 h-4 rounded-full border-3 border-white shadow-xs transition-transform group-hover:scale-125 ${dotBgClass}`}
                />

                {/* Timeline Card */}
                <div
                  className={`border rounded-2xl p-4 md:p-5 shadow-xs transition hover:shadow-md ${cardClasses}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Time & Title info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {/* Time badge */}
                        {isCheckIn ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#003049] bg-[#DDA15E]/20 px-2.5 py-1 rounded-lg">
                            <LogIn className="w-3.5 h-3.5 text-[#DDA15E]" />
                            チェックイン {item.timeStr}
                          </span>
                        ) : isCheckOut ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#003049] bg-[#DDA15E]/20 px-2.5 py-1 rounded-lg">
                            <LogOut className="w-3.5 h-3.5 text-[#DDA15E]" />
                            チェックアウト {item.timeStr}
                          </span>
                        ) : isTransport ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#003049] bg-[#003049]/10 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-[#003049]" />
                            {schedule.startTime || "時間指定なし"}
                            {schedule.endTime ? ` 〜 ${schedule.endTime}` : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#003049] bg-[#003049]/10 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-[#003049]" />
                            {schedule.startTime || "時間指定なし"}
                            {schedule.endTime ? ` 〜 ${schedule.endTime}` : ""}
                          </span>
                        )}

                        {/* Category badge */}
                        {isCheckIn ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.8 rounded-lg bg-[#DDA15E]/20 text-[#003049] border border-[#DDA15E]/40">
                            <Hotel className="w-3.5 h-3.5 text-[#DDA15E]" />
                            宿泊・チェックイン
                          </span>
                        ) : isCheckOut ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.8 rounded-lg bg-[#DDA15E]/15 text-[#003049] border border-[#DDA15E]/30">
                            <Hotel className="w-3.5 h-3.5 text-[#DDA15E]" />
                            宿泊・チェックアウト
                          </span>
                        ) : isTransport && schedule.transportType ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.8 rounded-lg bg-[#003049]/10 text-[#003049] border border-[#003049]/20">
                            {TRANSPORT_ICONS[schedule.transportType] || TRANSPORT_ICONS.WALK}
                            {TRANSPORT_LABELS[schedule.transportType] || schedule.transportType}
                            {schedule.flightNumber ? ` (${schedule.flightNumber})` : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.8 rounded-lg bg-[#003049]/5 text-[#003049] border border-[#003049]/10">
                            {CATEGORY_ICONS[schedule.category] || CATEGORY_ICONS.SIGHTSEEING}
                            {CATEGORY_LABELS[schedule.category] || schedule.category}
                          </span>
                        )}

                        {/* Hotel Nights badge */}
                        {(isCheckIn || isCheckOut) && item.hotelNights && item.hotelNights > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDA15E]/30 text-[#003049]">
                            <Moon className="w-3 h-3" />
                            {item.hotelNights}泊{item.hotelNights + 1}日
                          </span>
                        )}

                        {/* Hotel Breakfast badge */}
                        {(isCheckIn || isCheckOut) && (
                          schedule.hasBreakfast ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#003049] border border-[#DDA15E]/40">
                              <Coffee className="w-3 h-3 text-[#DDA15E]" />
                              朝食付き
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-[#003049]/60 bg-[#003049]/10 px-2 py-0.5 rounded-full">
                              素泊まり
                            </span>
                          )
                        )}

                        {selectedDateTab === "ALL" && (
                          <span className="text-[11px] text-[#003049]/50 font-medium ml-auto sm:ml-0">
                            {formatDate(item.dateStr)}
                          </span>
                        )}
                      </div>

                      {/* Title with complete toggle */}
                      <div className="flex items-start gap-2 my-1">
                        <button
                          onClick={() => handleToggleComplete(schedule)}
                          className="mt-0.5 text-[#003049]/30 hover:text-[#386641] transition"
                          title={schedule.isCompleted ? "未完了に戻す" : "完了にする"}
                        >
                          {schedule.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-[#386641] fill-[#386641]/10" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#003049]/30" />
                          )}
                        </button>
                        <h4
                          className={`text-base font-bold text-[#003049] tracking-tight ${
                            schedule.isCompleted ? "line-through text-[#003049]/40" : ""
                          }`}
                        >
                          {schedule.title}
                          {isCheckOut ? " (チェックアウト)" : ""}
                        </h4>
                      </div>

                      {/* Hotel stay detail sub-banner */}
                      {isCheckIn && (
                        <div className="my-1.5 pl-7">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#DDA15E]/15 border border-[#DDA15E]/30 text-xs text-[#003049] font-medium">
                            <Hotel className="w-3.5 h-3.5 text-[#DDA15E]" />
                            <span>
                              チェックイン: {item.timeStr} → チェックアウト:{" "}
                              {schedule.checkOutDate ? formatDate(schedule.checkOutDate) : "翌日"}{" "}
                              {schedule.endTime || "11:00"}
                            </span>
                          </div>
                        </div>
                      )}

                      {isCheckOut && (
                        <div className="my-1.5 pl-7">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#DDA15E]/10 border border-[#DDA15E]/30 text-xs text-[#003049] font-medium">
                            <LogOut className="w-3.5 h-3.5 text-[#DDA15E]" />
                            <span>
                              👋 チェックアウト・出発 (滞在期間: {item.hotelStayRangeText})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Transit Details (From -> To, Duration) */}
                      {(schedule.fromPlace || schedule.toPlace || schedule.duration) && (
                        <div className="flex items-center gap-2 text-xs text-[#003049]/70 mt-1 pl-7">
                          {schedule.fromPlace || schedule.toPlace ? (
                            <span className="font-medium text-[#003049]">
                              {schedule.fromPlace || "出発地"} → {schedule.toPlace || "目的地"}
                            </span>
                          ) : null}
                          {schedule.duration ? (
                            <span className="text-[#003049]/50">所要約 {schedule.duration} 分</span>
                          ) : null}
                        </div>
                      )}

                      {/* Linked Place details if any */}
                      {place && (
                        <div className="mt-2 pl-7 flex items-center gap-2 text-xs">
                          <span className="text-[#003049]/60 font-medium">登録スポット:</span>
                          <span className="text-[#003049] bg-[#003049]/5 px-2 py-0.5 rounded-md font-medium">
                            {place.name}
                          </span>
                          {place.address && (
                            <span className="text-[#003049]/50 truncate">({place.address})</span>
                          )}
                        </div>
                      )}

                      {/* Memo & Cost */}
                      <div className="mt-2 pl-7 flex flex-col gap-1">
                        {schedule.memo && (
                          <div className="p-2.5 rounded-xl bg-[#FDF0D5]/50 border border-[#DDA15E]/30 text-xs text-[#003049]/80 leading-relaxed">
                            {schedule.memo}
                          </div>
                        )}
                        {/* Only show cost on check-in event to prevent double counting display for hotels */}
                        {!isCheckOut && schedule.cost !== null && schedule.cost !== undefined && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-[#003049] mt-1">
                            <CircleDollarSign className="w-3.5 h-3.5 text-[#DDA15E]" />
                            <span>
                              {schedule.category === "HOTEL" ? "宿泊費" : "費用"}: ¥
                              {schedule.cost.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions (Edit / Delete operate on parent schedule) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(schedule)}
                        className="p-1.5 text-[#003049]/40 hover:text-[#003049] rounded-lg hover:bg-[#003049]/10 transition"
                        title="編集"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="p-1.5 text-[#003049]/40 hover:text-[#C1121F] rounded-lg hover:bg-[#C1121F]/10 transition"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#003049]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#DDA15E]/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#003049]/10 mb-4">
              <h3 className="text-lg font-bold text-[#003049]">
                {editingSchedule
                  ? form.category === "HOTEL"
                    ? "宿泊・ホテル予定を編集"
                    : "予定を編集"
                  : form.category === "HOTEL"
                  ? "新しい宿泊を追加"
                  : "新しい予定を追加"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#003049]/40 hover:text-[#003049] p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              {/* Linked Spot selector */}
              {places.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#003049] mb-1">
                    登録済みスポットから選択 (任意)
                  </label>
                  <select
                    value={form.placeId}
                    onChange={(e) => handleSelectPlace(e.target.value)}
                    className="w-full border border-[#003049]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003049]/20 focus:border-[#003049]"
                  >
                    <option value="">選択しない（直接入力）</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        {CATEGORY_LABELS[p.category]
                          ? `[${CATEGORY_LABELS[p.category].split("・")[0]}] `
                          : ""}{p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#003049] mb-1">
                  {form.category === "HOTEL" ? "ホテル・宿名" : "予定タイトル"}{" "}
                  <span className="text-[#C1121F]">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    form.category === "HOTEL"
                      ? "例: ホテル グランヴィア京都"
                      : "例: 清水寺 観光、新幹線 東京発、祇園でディナー"
                  }
                  className="w-full border border-[#003049]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003049]/20 focus:border-[#003049]"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-[#003049] mb-1">
                  カテゴリ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("SIGHTSEEING")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "SIGHTSEEING"
                        ? "bg-[#386641] text-white border-[#386641] shadow-xs"
                        : "bg-white/80 text-[#003049] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>観光</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("FOOD")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "FOOD"
                        ? "bg-[#DDA15E] text-white border-[#DDA15E] shadow-xs"
                        : "bg-white/80 text-[#003049] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>グルメ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("HOTEL")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "HOTEL"
                        ? "bg-[#DDA15E] text-white border-[#DDA15E] shadow-xs"
                        : "bg-[#DDA15E]/15 text-[#003049] border-[#DDA15E]/40 hover:bg-[#DDA15E]/25"
                    }`}
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>宿泊・宿</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("TRANSPORT")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "TRANSPORT"
                        ? "bg-[#003049] text-white border-[#003049] shadow-xs"
                        : "bg-white/80 text-[#003049] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <Train className="w-3.5 h-3.5" />
                    <span>移動・交通</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("ACTIVITY")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "ACTIVITY"
                        ? "bg-[#386641] text-white border-[#386641] shadow-xs"
                        : "bg-white/80 text-[#003049] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>体験</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("OTHER")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "OTHER"
                        ? "bg-[#003049] text-white border-[#003049] shadow-xs"
                        : "bg-white/80 text-[#003049] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <span>🔖 その他</span>
                  </button>
                </div>
              </div>

              {/* HOTEL DEDICATED PANEL */}
              {form.category === "HOTEL" ? (
                <div className="p-4 rounded-2xl bg-[#DDA15E]/10 border border-[#DDA15E]/30 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#003049] flex items-center gap-1.5">
                      <Hotel className="w-4 h-4 text-[#DDA15E]" />
                      宿泊日程 & チェックイン・チェックアウト時刻
                    </span>
                    {form.date && form.checkOutDate && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#003049]">
                        {(() => {
                          const start = new Date(form.date);
                          const end = new Date(form.checkOutDate);
                          const diff = Math.ceil(
                            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                          );
                          return diff > 0 ? `${diff}泊${diff + 1}日` : "日帰り・1日";
                        })()}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#003049]/70">
                    💡 入力されたチェックイン時刻とチェックアウト時刻が、それぞれの日のタイムラインに自動挿入されます。
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Check In */}
                    <div className="p-3 bg-white/90 rounded-xl border border-[#DDA15E]/20 flex flex-col gap-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#003049]">
                        <LogIn className="w-3.5 h-3.5 text-[#DDA15E]" />
                        <span>チェックイン</span>
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#003049]/70 mb-1">
                          チェックイン日 <span className="text-[#C1121F]">*</span>
                        </label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className="w-full border border-[#003049]/20 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-[#003049]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#003049]/70 mb-1">
                          チェックイン時刻
                        </label>
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                          className="w-full border border-[#003049]/20 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-[#003049]/20"
                        />
                      </div>
                    </div>

                    {/* Check Out */}
                    <div className="p-3 bg-white/90 rounded-xl border border-[#DDA15E]/20 flex flex-col gap-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#003049]">
                        <LogOut className="w-3.5 h-3.5 text-[#DDA15E]" />
                        <span>チェックアウト</span>
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#003049]/70 mb-1">
                          チェックアウト日
                        </label>
                        <input
                          type="date"
                          value={form.checkOutDate}
                          onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                          className="w-full border border-[#003049]/20 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-[#003049]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#003049]/70 mb-1">
                          チェックアウト時刻
                        </label>
                        <input
                          type="time"
                          value={form.endTime}
                          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                          className="w-full border border-[#003049]/20 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-[#003049]/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Breakfast Option */}
                  <div className="pt-2 border-t border-[#DDA15E]/20 flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-[#003049] block">朝食プラン</label>
                      <p className="text-[10px] text-[#003049]/60">朝食が含まれているか選択</p>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#DDA15E]/30">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, hasBreakfast: false })}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                          !form.hasBreakfast
                            ? "bg-[#003049]/10 text-[#003049] shadow-xs font-semibold"
                            : "text-[#003049]/50 hover:text-[#003049]"
                        }`}
                      >
                        素泊まり
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, hasBreakfast: true })}
                        className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg font-semibold transition ${
                          form.hasBreakfast
                            ? "bg-[#DDA15E]/20 text-[#003049] border border-[#DDA15E]/40 shadow-xs"
                            : "text-[#003049]/50 hover:text-[#003049]"
                        }`}
                      >
                        <Coffee className="w-3.5 h-3.5 text-[#DDA15E]" />
                        朝食付き
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* NON-HOTEL: Date, Start Time, End Time */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#003049] mb-1">
                      日付 <span className="text-[#C1121F]">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full border border-[#003049]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003049]/20 focus:border-[#003049]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#003049] mb-1">
                      開始時刻
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full border border-[#003049]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003049]/20 focus:border-[#003049]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#003049] mb-1">
                      終了時刻
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full border border-[#003049]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003049]/20 focus:border-[#003049]"
                    />
                  </div>
                </div>
              )}

              {/* Transport selection (if category is TRANSPORT or user wants to add transport info) */}
              {form.category === "TRANSPORT" && (
                <div className="p-3.5 rounded-2xl bg-[#003049]/5 border border-[#003049]/15 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#003049]">移動手段 & 詳細</span>
                  </div>

                  <div>
                    <label className="block text-xs text-[#003049]/70 mb-1">移動手段の種類</label>
                    <select
                      value={form.transportType}
                      onChange={(e) =>
                        setForm({ ...form, transportType: e.target.value as TransportType | "" })
                      }
                      className="w-full border border-[#003049]/20 rounded-xl px-3 py-2 text-xs bg-white"
                    >
                      <option value="TRAIN">🚆 電車・新幹線</option>
                      <option value="FLIGHT">✈️ 飛行機</option>
                      <option value="BUS">🚌 バス</option>
                      <option value="CAR">🚗 車・レンタカー</option>
                      <option value="WALK">🚶 徒歩</option>
                      <option value="TAXI">🚕 タクシー</option>
                      <option value="SHIP">🚢 船・フェリー</option>
                      <option value="">その他</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#003049]/70 mb-1">出発地</label>
                      <input
                        value={form.fromPlace}
                        onChange={(e) => setForm({ ...form, fromPlace: e.target.value })}
                        placeholder="例: 東京駅"
                        className="w-full border border-[#003049]/20 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#003049]/70 mb-1">到着地</label>
                      <input
                        value={form.toPlace}
                        onChange={(e) => setForm({ ...form, toPlace: e.target.value })}
                        placeholder="例: 京都駅"
                        className="w-full border border-[#003049]/20 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#003049]/70 mb-1">便名・列車番号</label>
                      <input
                        value={form.flightNumber}
                        onChange={(e) => setForm({ ...form, flightNumber: e.target.value })}
                        placeholder="例: のぞみ12号, NH025"
                        className="w-full border border-[#003049]/20 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#003049]/70 mb-1">所要時間 (分)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.duration}
                        onChange={(e) =>
                          setForm({ ...form, duration: normalizeNumberInput(e.target.value) })
                        }
                        placeholder="例: 135"
                        className="w-full border border-[#003049]/20 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Cost with Full-width number normalization + Split bill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#003049]">
                    {form.category === "HOTEL" ? "宿泊費用 (円)" : "費用・チケット代 (円)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setSplitMode(!splitMode)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      splitMode
                        ? "bg-[#DDA15E]/20 border-[#DDA15E]/50 text-[#003049] font-bold"
                        : "bg-[#003049]/5 border-[#003049]/15 text-[#003049]/70 hover:bg-[#003049]/10"
                    }`}
                  >
                    <Divide className="w-3 h-3" />
                    割り勘
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cost}
                  onChange={(e) =>
                    setForm({ ...form, cost: normalizeNumberInput(e.target.value) })
                  }
                  placeholder={splitMode ? "合計金額を入力" : "例: 15000（全角入力も自動変換されます）"}
                  className="w-full border border-[#003049]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003049]/20 focus:border-[#003049]"
                />
                {splitMode && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#DDA15E]/15 border border-[#DDA15E]/30 rounded-xl px-3 py-2">
                      <Users className="w-3.5 h-3.5 text-[#DDA15E]" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={splitPeople}
                        onChange={(e) => setSplitPeople(normalizeNumberInput(e.target.value))}
                        className="w-10 text-center text-sm bg-transparent focus:outline-none font-semibold text-[#003049]"
                      />
                      <span className="text-xs text-[#003049]">人</span>
                    </div>
                    <div className="flex-1 text-right">
                      {form.cost && Number(splitPeople) > 0 ? (
                        <p className="text-sm">
                          <span className="text-[#003049]/60">1人あたり </span>
                          <span className="font-bold text-[#003049]">
                            ¥{Math.ceil(Number(form.cost) / (Number(splitPeople) || 1)).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#003049]/50 ml-1">（保存される金額）</span>
                        </p>
                      ) : (
                        <p className="text-xs text-[#003049]/50">金額を入力すると1人分が計算されます</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-semibold text-[#003049] mb-1">
                  メモ・予約情報
                </label>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder={
                    form.category === "HOTEL"
                      ? "例: 予約番号 #12345、朝食付きプラン、荷物預かり可能"
                      : "例: 10分前にホーム集合。QRチケットを提示。"
                  }
                  rows={2}
                  className="w-full border border-[#003049]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003049]/20 focus:border-[#003049] resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#003049]/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[#003049]/70 hover:text-[#003049] text-xs font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-5 py-2.5 bg-[#C1121F] text-white rounded-xl text-xs font-semibold hover:bg-[#a50f1a] transition"
                >
                  {editingSchedule ? "変更を保存" : "予定を追加"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

