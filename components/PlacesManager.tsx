"use client";

import { useState } from "react";
import { Place, PlaceCategory, ReservationStatus, Schedule } from "@/types/trip";
import { normalizeNumberInput } from "@/lib/utils";
import {
  Utensils,
  Landmark,
  Coffee,
  Hotel,
  ShoppingBag,
  Ticket,
  Bookmark,
  ExternalLink,
  MapPin,
  Clock,
  CircleDollarSign,
  CalendarPlus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Plus,
  Star,
  Users,
  Divide,
} from "lucide-react";

interface PlacesManagerProps {
  tripId: number;
  places: Place[];
  tripStartDate: string | null;
  tripEndDate: string | null;
  onPlacesChange: (places: Place[]) => void;
  onAddScheduleFromPlace: (scheduleData: {
    date: string;
    startTime: string;
    endTime: string;
    checkOutDate?: string | null;
    title: string;
    category: string;
    placeId: number;
    cost: number | null;
    memo: string | null;
    hasBreakfast?: boolean | null;
  }) => Promise<void>;
  isOffline?: boolean;
}

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  FOOD: <Utensils className="w-4 h-4 text-orange-500" />,
  SIGHTSEEING: <Landmark className="w-4 h-4 text-sky-500" />,
  CAFE: <Coffee className="w-4 h-4 text-amber-600" />,
  HOTEL: <Hotel className="w-4 h-4 text-violet-500" />,
  SHOPPING: <ShoppingBag className="w-4 h-4 text-pink-500" />,
  ACTIVITY: <Ticket className="w-4 h-4 text-emerald-500" />,
  OTHER: <Bookmark className="w-4 h-4 text-stone-500" />,
};

export const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "ご飯・グルメ",
  SIGHTSEEING: "観光スポット",
  CAFE: "カフェ・甘味",
  HOTEL: "宿泊・ホテル",
  SHOPPING: "ショッピング",
  ACTIVITY: "アクティビティ",
  OTHER: "その他",
};

export default function PlacesManager({
  tripId,
  places,
  tripStartDate,
  tripEndDate,
  onPlacesChange,
  onAddScheduleFromPlace,
  isOffline = false,
}: PlacesManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [autoAddToSchedule, setAutoAddToSchedule] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: "",
    category: "FOOD" as PlaceCategory,
    memo: "",
    address: "",
    mapUrl: "",
    websiteUrl: "",
    cost: "",
    businessHours: "",
    checkInDate: "",
    checkOutDate: "",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    reservationStatus: "NONE" as ReservationStatus,
    rating: 3,
    hasBreakfast: false,
  });

  const [splitMode, setSplitMode] = useState(false);
  const [splitPeople, setSplitPeople] = useState("2");

  // Schedule linking modal
  const [targetPlaceForSchedule, setTargetPlaceForSchedule] = useState<Place | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: tripStartDate ? tripStartDate.split("T")[0] : new Date().toISOString().split("T")[0],
    checkOutDate: tripEndDate ? tripEndDate.split("T")[0] : "",
    startTime: "12:00",
    endTime: "13:30",
  });

  const categories = [
    { key: "ALL", label: "すべて", icon: null },
    { key: "FOOD", label: "ご飯・グルメ", icon: <Utensils className="w-3.5 h-3.5" /> },
    { key: "SIGHTSEEING", label: "観光地", icon: <Landmark className="w-3.5 h-3.5" /> },
    { key: "CAFE", label: "カフェ", icon: <Coffee className="w-3.5 h-3.5" /> },
    { key: "HOTEL", label: "ホテル", icon: <Hotel className="w-3.5 h-3.5" /> },
    { key: "SHOPPING", label: "ショッピング", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { key: "ACTIVITY", label: "体験・遊ぶ", icon: <Ticket className="w-3.5 h-3.5" /> },
  ];

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.category === selectedCategory;
  });

  const resetForm = () => {
    setForm({
      name: "",
      category: "FOOD",
      memo: "",
      address: "",
      mapUrl: "",
      websiteUrl: "",
      cost: "",
      businessHours: "",
      checkInDate: tripStartDate ? tripStartDate.split("T")[0] : "",
      checkOutDate: tripEndDate ? tripEndDate.split("T")[0] : "",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      reservationStatus: "NONE",
      rating: 3,
      hasBreakfast: false,
    });
    setSplitMode(false);
    setSplitPeople("2");
    setEditingPlace(null);
  };

  const handleOpenAddModal = (category: PlaceCategory = "FOOD") => {
    resetForm();
    setAutoAddToSchedule(true);
    setForm((prev) => ({
      ...prev,
      category,
      checkInDate: tripStartDate ? tripStartDate.split("T")[0] : "",
      checkOutDate: tripEndDate ? tripEndDate.split("T")[0] : "",
      hasBreakfast: false,
    }));
    setShowAddModal(true);
  };

  const handleOpenEditModal = (place: Place) => {
    setEditingPlace(place);
    setAutoAddToSchedule(false);
    setForm({
      name: place.name,
      category: (place.category as PlaceCategory) || "SIGHTSEEING",
      memo: place.memo || "",
      address: place.address || "",
      mapUrl: place.mapUrl || "",
      websiteUrl: place.websiteUrl || "",
      cost: place.cost ? String(place.cost) : "",
      businessHours: place.businessHours || "",
      checkInDate: place.checkInDate || (tripStartDate ? tripStartDate.split("T")[0] : ""),
      checkOutDate: place.checkOutDate || (tripEndDate ? tripEndDate.split("T")[0] : ""),
      checkInTime: place.checkInTime || "15:00",
      checkOutTime: place.checkOutTime || "11:00",
      reservationStatus: (place.reservationStatus as ReservationStatus) || "NONE",
      rating: place.rating || 0,
      hasBreakfast: Boolean(place.hasBreakfast),
    });
    setShowAddModal(true);
  };

  const handleSavePlace = async () => {
    if (!form.name.trim()) return alert("名前を入力してください");

    let costValue = form.cost ? Number(form.cost) : null;
    if (costValue && splitMode) {
      const people = Number(splitPeople) || 1;
      costValue = Math.ceil(costValue / people);
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      memo: form.memo.trim() || null,
      address: form.address.trim() || null,
      mapUrl: form.mapUrl.trim() || null,
      websiteUrl: form.websiteUrl.trim() || null,
      cost: costValue,
      businessHours: form.businessHours.trim() || null,
      checkInDate: form.category === "HOTEL" && form.checkInDate ? form.checkInDate : null,
      checkOutDate: form.category === "HOTEL" && form.checkOutDate ? form.checkOutDate : null,
      checkInTime: form.category === "HOTEL" && form.checkInTime ? form.checkInTime : null,
      checkOutTime: form.category === "HOTEL" && form.checkOutTime ? form.checkOutTime : null,
      reservationStatus: form.reservationStatus,
      rating: Number(form.rating),
      hasBreakfast: form.category === "HOTEL" ? Boolean(form.hasBreakfast) : false,
      tripId,
    };

    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);

    try {
      if (editingPlace) {
        let updated: Place | null = null;
        if (!isOfflineMode) {
          try {
            const res = await fetch(`/api/places/${editingPlace.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              updated = await res.json();
            }
          } catch (e) {
            console.warn("Online update failed, falling back to offline update:", e);
          }
        }

        if (!updated) {
          updated = {
            ...editingPlace,
            ...payload,
            updatedAt: new Date(),
          };
        }

        onPlacesChange(places.map((p) => (p.id === updated!.id ? updated! : p)));
        if (selectedCategory !== "ALL" && selectedCategory !== form.category) {
          setSelectedCategory(form.category);
        }
        setShowAddModal(false);
        resetForm();
      } else {
        let created: Place | null = null;
        if (!isOfflineMode) {
          try {
            const res = await fetch("/api/places", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              created = await res.json();
            }
          } catch (e) {
            console.warn("Online create failed, falling back to offline create:", e);
          }
        }

        if (!created) {
          created = {
            id: Date.now(),
            ...payload,
            visited: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        onPlacesChange([...places, created]);
        if (selectedCategory !== "ALL" && selectedCategory !== form.category) {
          setSelectedCategory(form.category);
        }

        // If category is HOTEL and user opted to auto-add to timeline
        if (form.category === "HOTEL" && form.checkInDate && autoAddToSchedule) {
          await onAddScheduleFromPlace({
            date: form.checkInDate,
            checkOutDate: form.checkOutDate || null,
            startTime: form.checkInTime || "15:00",
            endTime: form.checkOutTime || "11:00",
            title: created.name,
            category: "HOTEL",
            placeId: created.id,
            cost: created.cost,
            memo: created.memo,
            hasBreakfast: created.hasBreakfast,
          });
        }

        setShowAddModal(false);
        resetForm();
      }
    } catch (err) {
      console.error("Save place error:", err);
      // Fallback optimistic creation even if unexpected error occurs
      const fallbackPlace: Place = {
        id: editingPlace ? editingPlace.id : Date.now(),
        ...payload,
        visited: editingPlace ? editingPlace.visited : false,
        createdAt: editingPlace ? editingPlace.createdAt : new Date(),
        updatedAt: new Date(),
      };
      if (editingPlace) {
        onPlacesChange(places.map((p) => (p.id === fallbackPlace.id ? fallbackPlace : p)));
      } else {
        onPlacesChange([...places, fallbackPlace]);
      }
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleDeletePlace = async (id: number) => {
    if (!confirm("このスポットを削除しますか？")) return;
    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    if (!isOfflineMode) {
      fetch(`/api/places/${id}`, { method: "DELETE" }).catch((e) => console.warn(e));
    }
    onPlacesChange(places.filter((p) => p.id !== id));
  };

  const handleToggleVisited = async (place: Place) => {
    const nextVisited = !place.visited;
    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    if (!isOfflineMode) {
      fetch(`/api/places/${place.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...place, visited: nextVisited }),
      }).catch((e) => console.warn(e));
    }
    onPlacesChange(places.map((p) => (p.id === place.id ? { ...p, visited: nextVisited } : p)));
  };

  const handleConfirmAddToSchedule = async () => {
    if (!targetPlaceForSchedule) return;
    const isHotel = targetPlaceForSchedule.category === "HOTEL";
    await onAddScheduleFromPlace({
      date: scheduleForm.date,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      checkOutDate: isHotel && scheduleForm.checkOutDate ? scheduleForm.checkOutDate : null,
      title: targetPlaceForSchedule.name,
      category: targetPlaceForSchedule.category,
      placeId: targetPlaceForSchedule.id,
      cost: targetPlaceForSchedule.cost,
      memo: targetPlaceForSchedule.memo,
      hasBreakfast: targetPlaceForSchedule.hasBreakfast,
    });
    setTargetPlaceForSchedule(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-800 flex items-center gap-2">
            <span>📍 行きたいスポット・お店リスト</span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
              {places.length} 件
            </span>
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            食べたいグルメや観光地をストックし、ワンクリックで旅程タイムラインに組み込めます。
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal("FOOD")}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-stone-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          スポットを追加
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const count =
            cat.key === "ALL"
              ? places.length
              : places.filter((p) => p.category === cat.key).length;

          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                isSelected
                  ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-stone-700 text-stone-200" : "bg-stone-100 text-stone-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spot Cards Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-stone-200 rounded-2xl">
          <div className="text-4xl mb-3">📍</div>
          <h3 className="text-stone-700 font-semibold text-sm">スポットが登録されていません</h3>
          <p className="text-stone-400 text-xs mt-1 max-w-sm mx-auto">
            ご飯のお店や行きたい観光スポットを追加して、旅の計画を充実させましょう！
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => handleOpenAddModal("FOOD")}
              className="px-3.5 py-2 bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-medium hover:bg-stone-200 transition flex items-center gap-1"
            >
              <Utensils className="w-3.5 h-3.5" /> 飲食店を追加
            </button>
            <button
              onClick={() => handleOpenAddModal("SIGHTSEEING")}
              className="px-3.5 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-medium hover:bg-sky-100 transition flex items-center gap-1"
            >
              <Landmark className="w-3.5 h-3.5" /> 観光地を追加
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                place.visited ? "border-stone-200/80 bg-stone-50/60 opacity-80" : "border-stone-200"
              }`}
            >
              <div>
                {/* Header: Category, Visited check & Actions */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                      {CATEGORY_ICONS[place.category] || CATEGORY_ICONS.OTHER}
                      {CATEGORY_LABELS[place.category] || place.category}
                    </span>

                    {place.reservationStatus === "BOOKED" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ 予約済み
                      </span>
                    )}
                    {place.reservationStatus === "NEED_BOOKING" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        ⚠️ 要予約
                      </span>
                    )}

                    {place.rating && place.rating > 0 ? (
                      <span className="flex items-center text-amber-500 text-xs">
                        {Array.from({ length: place.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(place)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
                      title="編集"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlace(place.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spot Name & Visited Toggle */}
                <div className="flex items-start gap-2.5 my-2">
                  <button
                    onClick={() => handleToggleVisited(place)}
                    className="mt-0.5 text-stone-400 hover:text-emerald-600 transition"
                    title={place.visited ? "未訪問に戻す" : "訪問済みにする"}
                  >
                    {place.visited ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300" />
                    )}
                  </button>
                  <h3
                    className={`text-base font-bold tracking-tight text-stone-800 ${
                      place.visited ? "line-through text-stone-400" : ""
                    }`}
                  >
                    {place.name}
                  </h3>
                </div>

                {/* Hotel Stay Banner if HOTEL category */}
                {place.category === "HOTEL" && (place.checkInDate || place.checkOutDate) && (
                  <div className="my-2 p-2.5 rounded-xl bg-violet-50/80 border border-violet-200/80 flex flex-col gap-1 text-xs text-violet-950">
                    <div className="flex items-center justify-between font-bold text-violet-900">
                      <span className="flex items-center gap-1.5">
                        <Hotel className="w-3.5 h-3.5 text-violet-600" />
                        宿泊日程
                      </span>
                      {place.checkInDate && place.checkOutDate && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-200/70 text-violet-800">
                          {(() => {
                            const start = new Date(place.checkInDate);
                            const end = new Date(place.checkOutDate);
                            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                            return diff > 0 ? `${diff}泊` : "日帰り・1日";
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-violet-800 font-medium">
                      <span>
                        IN: {place.checkInDate ? new Date(place.checkInDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) : "-"}
                        {place.checkInTime ? ` ${place.checkInTime}` : ""}
                      </span>
                      <span>→</span>
                      <span>
                        OUT: {place.checkOutDate ? new Date(place.checkOutDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) : "-"}
                        {place.checkOutTime ? ` ${place.checkOutTime}` : ""}
                      </span>
                    </div>

                    {/* Breakfast status */}
                    <div className="mt-1 pt-1.5 border-t border-violet-200/50 flex items-center gap-1.5">
                      {place.hasBreakfast ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          <Coffee className="w-3 h-3 text-amber-700" />
                          朝食付き
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-md">
                          素泊まり（朝食なし）
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Meta Information (Cost, Hours, Address) */}
                <div className="flex flex-col gap-1.5 text-xs text-stone-600 mt-2">
                  {place.cost !== null && place.cost !== undefined && (
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <CircleDollarSign className="w-3.5 h-3.5 text-stone-400" />
                      <span>{place.category === "HOTEL" ? "宿泊費用" : "目安予算"}: ¥{place.cost.toLocaleString()}</span>
                    </div>
                  )}

                  {place.businessHours && place.category !== "HOTEL" && (
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>営業時間: {place.businessHours}</span>
                    </div>
                  )}

                  {place.address && (
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate">{place.address}</span>
                    </div>
                  )}

                  {place.memo && (
                    <div className="mt-2 p-2.5 rounded-xl bg-stone-50 text-stone-600 text-xs border border-stone-100 leading-relaxed">
                      💬 {place.memo}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Map link, Web link & Add to Schedule button */}
              <div className="flex items-center justify-between pt-4 mt-3 border-t border-stone-100 gap-2">
                <div className="flex items-center gap-2">
                  {place.mapUrl ? (
                    <a
                      href={place.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 hover:text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg transition"
                    >
                      <MapPin className="w-3 h-3" />
                      Googleマップ
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        place.name + (place.address ? " " + place.address : "")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg transition"
                    >
                      <MapPin className="w-3 h-3" />
                      マップ検索
                    </a>
                  )}

                  {place.websiteUrl && (
                    <a
                      href={place.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      サイト
                    </a>
                  )}
                </div>

                {/* Add to schedule button */}
                <button
                  onClick={() => {
                    setTargetPlaceForSchedule(place);
                    const isHotel = place.category === "HOTEL";
                    const defaultDate =
                      isHotel && place.checkInDate
                        ? place.checkInDate
                        : tripStartDate
                        ? tripStartDate.split("T")[0]
                        : new Date().toISOString().split("T")[0];

                    const defaultOutDate =
                      isHotel && place.checkOutDate
                        ? place.checkOutDate
                        : (() => {
                            const next = new Date(defaultDate);
                            next.setDate(next.getDate() + 1);
                            return next.toISOString().split("T")[0];
                          })();

                    setScheduleForm({
                      date: defaultDate,
                      checkOutDate: defaultOutDate,
                      startTime: isHotel ? place.checkInTime || "15:00" : "12:00",
                      endTime: isHotel ? place.checkOutTime || "11:00" : "13:30",
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition shadow-2xs"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-amber-600" />
                  旅程に追加
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Place Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-lg font-bold text-stone-800">
                {editingPlace ? "スポットを編集" : "新しいスポットを追加"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              {/* Category selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                  カテゴリ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setForm({ ...form, category: catKey as PlaceCategory })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                        form.category === catKey
                          ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {CATEGORY_ICONS[catKey]}
                      <span>{label.split("・")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spot Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  {form.category === "HOTEL" ? "ホテル・宿名" : "スポット名・店名"} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={form.category === "HOTEL" ? "例: 京都ホテルオークラ、星野リゾート" : "例: 祇園きなな、清水寺、ルーヴル美術館"}
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              {/* Hotel Specific Check-in / Check-out section */}
              {form.category === "HOTEL" && (
                <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                      <Hotel className="w-4 h-4 text-violet-600" />
                      宿泊期間（チェックイン & チェックアウト）
                    </span>
                    {form.checkInDate && form.checkOutDate && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-200 text-violet-800">
                        {(() => {
                          const start = new Date(form.checkInDate);
                          const end = new Date(form.checkOutDate);
                          const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          return diff > 0 ? `${diff}泊` : "日帰り";
                        })()}
                      </span>
                    )}
                  </div>

                  {/* Check-in Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        チェックイン日
                      </label>
                      <input
                        type="date"
                        value={form.checkInDate}
                        onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        チェックイン時刻
                      </label>
                      <input
                        type="time"
                        value={form.checkInTime}
                        onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  </div>

                  {/* Check-out Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        チェックアウト日
                      </label>
                      <input
                        type="date"
                        value={form.checkOutDate}
                        onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        チェックアウト時刻
                      </label>
                      <input
                        type="time"
                        value={form.checkOutTime}
                        onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  </div>

                  {/* Breakfast Option */}
                  <div className="pt-2 border-t border-violet-200/60 flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block">朝食プラン</label>
                      <p className="text-[10px] text-stone-400">朝食が含まれているか選択</p>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-violet-200">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, hasBreakfast: false })}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                          !form.hasBreakfast
                            ? "bg-stone-100 text-stone-700 shadow-xs font-semibold"
                            : "text-stone-400 hover:text-stone-600"
                        }`}
                      >
                        素泊まり
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, hasBreakfast: true })}
                        className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg font-semibold transition ${
                          form.hasBreakfast
                            ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                            : "text-stone-400 hover:text-stone-600"
                        }`}
                      >
                        <Coffee className="w-3.5 h-3.5 text-amber-700" />
                        朝食付き
                      </button>
                    </div>
                  </div>

                  {!editingPlace && (
                    <div className="pt-2 border-t border-violet-200/60 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-violet-900">
                        <input
                          type="checkbox"
                          checked={autoAddToSchedule}
                          onChange={(e) => setAutoAddToSchedule(e.target.checked)}
                          className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                        />
                        <span>🗓️ 保存時に旅程タイムラインにも自動で追加する</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Budget & Reservation Status */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-600">
                      目安予算 (円)
                    </label>
                    <button
                      type="button"
                      onClick={() => setSplitMode(!splitMode)}
                      className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        splitMode
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100"
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
                    placeholder={splitMode ? "合計金額を入力" : "例: 2500"}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                  {splitMode && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={splitPeople}
                          onChange={(e) => setSplitPeople(normalizeNumberInput(e.target.value))}
                          className="w-10 text-center text-sm bg-transparent focus:outline-none font-semibold text-amber-800"
                        />
                        <span className="text-xs text-amber-700">人</span>
                      </div>
                      <div className="flex-1 text-right">
                        {form.cost && Number(splitPeople) > 0 ? (
                          <p className="text-sm">
                            <span className="text-stone-500">1人あたり </span>
                            <span className="font-bold text-stone-600">
                              ¥{Math.ceil(Number(form.cost) / (Number(splitPeople) || 1)).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-stone-400 ml-1">（保存される金額）</span>
                          </p>
                        ) : (
                          <p className="text-xs text-stone-400">金額を入力すると1人分が計算されます</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    予約ステータス
                  </label>
                  <select
                    value={form.reservationStatus}
                    onChange={(e) =>
                      setForm({ ...form, reservationStatus: e.target.value as ReservationStatus })
                    }
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  >
                    <option value="NONE">予約不要</option>
                    <option value="NEED_BOOKING">⚠️ 要予約</option>
                    <option value="BOOKED">✓ 予約済み</option>
                  </select>
                </div>
              </div>

              {/* Business hours & Rating */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    営業時間・定休日
                  </label>
                  <input
                    value={form.businessHours}
                    onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
                    placeholder="例: 11:00〜20:00 (水曜休)"
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    行きたい度 (星評価)
                  </label>
                  <select
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  >
                    <option value="5">★★★★★ 絶対行きたい</option>
                    <option value="4">★★★★☆ とても行きたい</option>
                    <option value="3">★★★☆☆ 行きたい</option>
                    <option value="2">★★☆☆☆ 候補</option>
                    <option value="1">★☆☆☆☆ 気になる</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  住所・最寄り駅
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="例: 京都市東山区祇園町南側570-119"
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              {/* Google Maps URL & Website URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Google Maps URL
                  </label>
                  <input
                    value={form.mapUrl}
                    onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    公式サイト / 食べログ / SNS
                  </label>
                  <input
                    value={form.websiteUrl}
                    onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                    placeholder="https://tabelog.com/..."
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  メモ・おすすめメニュー・予約番号
                </label>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="例: パフェが有名。混むので開店直後がおすすめ。予約番号 #12345"
                  rows={3}
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSavePlace}
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-700 transition"
                >
                  {editingPlace ? "変更を保存" : "スポットを登録"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add To Schedule Modal */}
      {targetPlaceForSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-amber-600" />
                旅程タイムラインに追加
              </h3>
              <button
                onClick={() => setTargetPlaceForSchedule(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-3">
              「<span className="font-semibold text-stone-900">{targetPlaceForSchedule.name}</span>
              」をタイムラインに追加します。
            </p>

            <div className="flex flex-col gap-4 text-sm">
              {targetPlaceForSchedule.category === "HOTEL" ? (
                /* Hotel specific checkin / checkout dates */
                <div className="p-3.5 rounded-2xl bg-violet-50/80 border border-violet-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-950 flex items-center gap-1.5">
                      <Hotel className="w-4 h-4 text-violet-600" />
                      宿泊設定
                    </span>
                    {scheduleForm.date && scheduleForm.checkOutDate && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-200 text-violet-900">
                        {(() => {
                          const start = new Date(scheduleForm.date);
                          const end = new Date(scheduleForm.checkOutDate);
                          const diff = Math.ceil(
                            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                          );
                          return diff > 0 ? `${diff}泊${diff + 1}日` : "日帰り・1日";
                        })()}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-violet-800">
                    💡 チェックイン時刻とチェックアウト時刻がそれぞれの日のタイムラインに自動挿入されます。
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        チェックイン日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={scheduleForm.date}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                        className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        チェックイン時刻
                      </label>
                      <input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                        }
                        className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        チェックアウト日
                      </label>
                      <input
                        type="date"
                        value={scheduleForm.checkOutDate}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, checkOutDate: e.target.value })
                        }
                        className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        チェックアウト時刻
                      </label>
                      <input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                        }
                        className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-hotel date and time */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      訪問日 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        開始時刻
                      </label>
                      <input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                        }
                        className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        終了時刻
                      </label>
                      <input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) =>
                          setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                        }
                        className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 mt-2">
                <button
                  type="button"
                  onClick={() => setTargetPlaceForSchedule(null)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddToSchedule}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition shadow-xs"
                >
                  タイムラインに追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
