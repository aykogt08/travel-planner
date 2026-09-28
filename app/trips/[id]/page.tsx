"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trip, Place, Schedule, PackingItem, WishItem } from "@/types/trip";
import {
  saveTripOffline,
  getTripOffline,
  deleteTripOffline,
} from "@/lib/offline-storage";
import { normalizeNumberInput } from "@/lib/utils";
import TimelineView from "@/components/TimelineView";
import PlacesManager from "@/components/PlacesManager";
import PackingManager from "@/components/PackingManager";
import BudgetSummary from "@/components/BudgetSummary";
import WishCollection from "@/components/WishCollection";
import OfflineGuideModal from "@/components/OfflineGuideModal";
import OfflineStatusBanner from "@/components/OfflineStatusBanner";
import {
  Calendar,
  MapPin,
  CircleDollarSign,
  Share2,
  HardDrive,
  Edit,
  Trash2,
  ArrowLeft,
  CalendarDays,
  Utensils,
  CheckSquare,
  PieChart,
  Luggage,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function TripDetailPage() {
  const params = useParams();
  const tripId = Number(params.id);
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "places" | "wishes" | "packing" | "budget">("timeline");
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Edit trip form state
  const [editForm, setEditForm] = useState({
    title: "",
    destination: "",
    description: "",
    startDate: "",
    endDate: "",
    budget: "",
  });

  // Load trip data: Network First with IndexedDB Cache Fallback
  const loadTripData = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (res.ok) {
        const data: Trip = await res.json();
        const normalizedData: Trip = { ...data, wishes: data.wishes || [] };
        setTrip(normalizedData);
        // Automatically mirror to offline storage
        await saveTripOffline(normalizedData);
        setIsOfflineMode(false);
      } else {
        throw new Error("Network request failed");
      }
    } catch (err) {
      console.warn("Falling back to offline storage:", err);
      const offlineData = await getTripOffline(tripId);
      if (offlineData) {
        const normalizedOffline: Trip = {
          ...offlineData,
          wishes: offlineData.wishes || [],
        };
        setTrip(normalizedOffline);
        setIsOfflineMode(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  // Sync state changes with offline storage
  const updateTripState = (updated: Trip) => {
    setTrip(updated);
    saveTripOffline(updated);
  };

  const handlePlacesChange = (places: Place[]) => {
    if (!trip) return;
    // Clear stale placeId references from schedules when places are removed
    const placeIds = new Set(places.map((p) => p.id));
    const updatedSchedules = trip.schedules.map((s) =>
      s.placeId && !placeIds.has(s.placeId)
        ? { ...s, placeId: null, place: null }
        : s
    );
    updateTripState({ ...trip, places, schedules: updatedSchedules });
  };

  const handleSchedulesChange = (schedules: Schedule[]) => {
    if (!trip) return;
    updateTripState({ ...trip, schedules });
  };

  const handlePackingListChange = (packingList: PackingItem[]) => {
    if (!trip) return;
    updateTripState({ ...trip, packingList });
  };

  const handleWishesChange = (wishes: WishItem[]) => {
    if (!trip) return;
    updateTripState({ ...trip, wishes });
  };

  // Add schedule linked from Place
  const handleAddScheduleFromPlace = async (scheduleData: {
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
  }) => {
    if (!trip) return;
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...scheduleData,
          tripId: trip.id,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        handleSchedulesChange([...trip.schedules, created]);
        setActiveTab("timeline");
      }
    } catch (e) {
      console.error("Failed to add schedule:", e);
    }
  };

  // Open edit modal
  const handleOpenEditModal = () => {
    if (!trip) return;
    setEditForm({
      title: trip.title,
      destination: trip.destination || "",
      description: trip.description || "",
      startDate: trip.startDate ? trip.startDate.split("T")[0] : "",
      endDate: trip.endDate ? trip.endDate.split("T")[0] : "",
      budget: trip.budget ? String(trip.budget) : "",
    });
    setIsEditTripModalOpen(true);
  };

  // Save edit trip
  const handleSaveTrip = async () => {
    if (!trip || !editForm.title.trim()) return alert("タイトルを入力してください");

    const payload = {
      title: editForm.title.trim(),
      destination: editForm.destination.trim() || null,
      description: editForm.description.trim() || null,
      startDate: editForm.startDate || null,
      endDate: editForm.endDate || null,
      budget: editForm.budget ? Number(editForm.budget) : null,
    };

    const res = await fetch(`/api/trips/${trip.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      updateTripState({
        ...trip,
        ...updated,
        places: trip.places,
        schedules: trip.schedules,
        packingList: trip.packingList,
      });
      setIsEditTripModalOpen(false);
    } else {
      alert("更新に失敗しました");
    }
  };

  // Delete trip
  const handleDeleteTrip = async () => {
    if (!trip) return;
    if (!confirm(`「${trip.title}」を完全に削除しますか？`)) return;

    await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
    await deleteTripOffline(trip.id);
    router.push("/trips");
  };

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // Calculate trip days duration
  const getDurationText = () => {
    if (!trip?.startDate) return null;
    if (!trip.endDate || trip.startDate === trip.endDate) return "日帰り";
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays - 1}泊${diffDays}日`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center text-stone-400 gap-3">
        <div className="text-3xl animate-bounce">✈️</div>
        <p className="text-sm font-medium">旅行プランを読み込み中...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center text-stone-600 gap-4 p-6">
        <p className="text-4xl">🗺️</p>
        <h2 className="text-xl font-bold">プランが見つかりませんでした</h2>
        <p className="text-xs text-stone-400 text-center max-w-sm">
          削除されたか、オフラインストレージに保存されていない可能性があります。
        </p>
        <Link
          href="/trips"
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-700 transition"
        >
          プラン一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 pb-24">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/trips"
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition"
            title="一覧に戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-lg font-bold tracking-tight text-stone-900 hidden sm:inline">
            ✈️ Marcaderno
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline Guidebook & Help button */}
          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300/80 text-xs font-semibold transition shadow-2xs"
            title="オフラインしおり出力 & 利用ガイド"
          >
            <HardDrive className="w-4 h-4 text-stone-500" />
            <span className="hidden sm:inline">オフラインしおり出力</span>
            <span className="sm:hidden">しおり</span>
          </button>

          <button
            onClick={() => setIsOfflineModalOpen(true)}
            className="p-2 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition"
            title="オフライン・利用ガイドヘルプ"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Edit Plan button */}
          <button
            onClick={handleOpenEditModal}
            className="p-2 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition"
            title="プラン設定を編集"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete Plan button */}
          <button
            onClick={handleDeleteTrip}
            className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
            title="プランを削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 flex flex-col gap-6">
        {/* Header Summary Banner */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {trip.destination && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-stone-800 text-stone-50 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5" />
                    {trip.destination}
                  </span>
                )}
                {getDurationText() && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
                    {getDurationText()}
                  </span>
                )}
                {isOfflineMode && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    📴 オフラインキャッシュ
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                {trip.title}
              </h1>

              {trip.description && (
                <p className="text-stone-500 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                  {trip.description}
                </p>
              )}
            </div>

            {/* Date & Budget overview */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 text-xs text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                <span className="font-medium">
                  {trip.startDate ? formatDate(trip.startDate) : "日程未定"}
                  {trip.endDate && ` 〜 ${formatDate(trip.endDate)}`}
                </span>
              </div>

              {trip.budget !== null && trip.budget !== undefined && (
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-stone-400" />
                  <span className="font-medium">目標予算: ¥{trip.budget.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-[11px] text-stone-400 pt-1 border-t border-stone-200/60">
                <span>{trip.places.length} スポット</span>
                <span>{trip.schedules.length} 予定</span>
                <span>{trip.packingList.filter((p) => p.isPacked).length}/{trip.packingList.length} 持ち物</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 bg-stone-200/70 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === "timeline"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/60"
            }`}
          >
            <CalendarDays className={`w-4 h-4 ${activeTab === "timeline" ? "text-stone-700" : "text-stone-500"}`} />
            <span>タイムライン</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200/80 text-stone-500">
              {trip.schedules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("wishes")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === "wishes"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/60"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === "wishes" ? "text-stone-700" : "text-stone-500"}`} />
            <span>やりたいこと</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200/80 text-stone-500">
              {trip.wishes ? trip.wishes.length : 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("places")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === "places"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/60"
            }`}
          >
            <Utensils className={`w-4 h-4 ${activeTab === "places" ? "text-stone-700" : "text-stone-500"}`} />
            <span>ご飯・観光スポット</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200/80 text-stone-500">
              {trip.places.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("packing")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === "packing"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/60"
            }`}
          >
            <Luggage className={`w-4 h-4 ${activeTab === "packing" ? "text-stone-700" : "text-stone-500"}`} />
            <span>持ち物リスト</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-200/80 text-stone-500">
              {trip.packingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === "budget"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/60"
            }`}
          >
            <PieChart className={`w-4 h-4 ${activeTab === "budget" ? "text-stone-700" : "text-stone-500"}`} />
            <span>予算サマリー</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-2">
          {activeTab === "timeline" && (
            <TimelineView
              tripId={trip.id}
              schedules={trip.schedules}
              places={trip.places}
              startDate={trip.startDate}
              endDate={trip.endDate}
              onSchedulesChange={handleSchedulesChange}
              isOffline={isOfflineMode}
            />
          )}

          {activeTab === "wishes" && (
            <WishCollection
              tripId={trip.id}
              wishes={trip.wishes || []}
              onWishesChange={handleWishesChange}
              isOffline={isOfflineMode}
            />
          )}

          {activeTab === "places" && (
            <PlacesManager
              tripId={trip.id}
              places={trip.places}
              tripStartDate={trip.startDate}
              tripEndDate={trip.endDate}
              onPlacesChange={handlePlacesChange}
              onAddScheduleFromPlace={handleAddScheduleFromPlace}
              isOffline={isOfflineMode}
            />
          )}

          {activeTab === "packing" && (
            <PackingManager
              tripId={trip.id}
              packingList={trip.packingList}
              onPackingListChange={handlePackingListChange}
              isOffline={isOfflineMode}
            />
          )}

          {activeTab === "budget" && <BudgetSummary trip={trip} />}
        </div>
      </div>

      {/* Edit Trip Modal */}
      {isEditTripModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-base font-bold text-stone-800">旅の基本設定を編集</h3>
              <button
                onClick={() => setIsEditTripModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  旅行タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  目的地・エリア (例: 京都, 札幌, パリ)
                </label>
                <input
                  value={editForm.destination}
                  onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                  placeholder="例: 京都"
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">出発日</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">帰国日</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  目標総予算 (円)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.budget}
                  onChange={(e) =>
                    setEditForm({ ...editForm, budget: normalizeNumberInput(e.target.value) })
                  }
                  placeholder="例: 50000 (全角・半角どちらでも自動変換)"
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  旅のメモ・目的
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditTripModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSaveTrip}
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-700 transition"
                >
                  変更を保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Guidebook Modal */}
      <OfflineGuideModal
        trip={trip}
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
      />

      {/* Online/Offline Status Notification */}
      <OfflineStatusBanner
        onManualSync={loadTripData}
        onOpenGuide={() => setIsOfflineModalOpen(true)}
      />
    </main>
  );
}