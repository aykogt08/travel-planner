"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trip } from "@/types/trip";
import {
  saveTripsOffline,
  getAllTripsOffline,
  deleteTripOffline,
} from "@/lib/offline-storage";
import OfflineStatusBanner from "@/components/OfflineStatusBanner";
import {
  MapPin,
  Calendar,
  CircleDollarSign,
  Plus,
  ArrowRight,
  Trash2,
  Luggage,
  Sparkles,
} from "lucide-react";

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const fetchTrips = async () => {
    try {
      const res = await fetch("/api/trips");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setTrips(list);
        await saveTripsOffline(list);
        setIsOfflineMode(false);
      } else {
        throw new Error("Failed to fetch trips");
      }
    } catch (e) {
      console.warn("Loading trips from offline cache:", e);
      const cached = await getAllTripsOffline();
      setTrips(cached);
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const getDurationText = (startStr: string | null, endStr: string | null) => {
    if (!startStr) return null;
    if (!endStr || startStr === endStr) return "日帰り";
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays - 1}泊${diffDays}日`;
  };

  const deleteTrip = async (id: number, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    try {
      await fetch(`/api/trips/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Server delete failed, deleting offline copy:", e);
    }
    await deleteTripOffline(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 pb-24">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
          <span>✈️ TravelPlanner</span>
        </Link>
        <Link
          href="/trips/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-stone-700 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          新しい旅を計画
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                旅行プラン一覧
              </h1>
              {isOfflineMode && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  📴 オフライン
                </span>
              )}
            </div>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              保存したプランは自動で端末にキャッシュされ、オフラインでも閲覧できます。
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-stone-400">
            <div className="text-3xl animate-bounce mb-3">✈️</div>
            <p className="text-sm font-medium">プランを読み込み中...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white border border-dashed border-stone-200 rounded-3xl max-w-lg mx-auto">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-lg font-bold text-stone-800 mb-1">まだ旅行プランがありません</h2>
            <p className="text-stone-400 text-xs max-w-sm mx-auto mb-6">
              行きたい観光地やご飯のお店、日程を登録して、自分だけの旅のしおりを作りましょう！
            </p>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-stone-700 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              最初のプランを作る
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trips.map((trip) => {
              const packedCount = trip.packingList
                ? trip.packingList.filter((p) => p.isPacked).length
                : 0;
              const totalPacking = trip.packingList ? trip.packingList.length : 0;
              const duration = getDurationText(trip.startDate, trip.endDate);

              return (
                <div
                  key={trip.id}
                  className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Destination & Duration Header */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {trip.destination && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-900 text-white">
                            <MapPin className="w-3 h-3" />
                            {trip.destination}
                          </span>
                        )}
                        {duration && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                            {duration}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => deleteTrip(trip.id, trip.title)}
                        className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title */}
                    <Link href={`/trips/${trip.id}`} className="block my-2">
                      <h2 className="text-lg font-bold text-stone-900 tracking-tight group-hover:text-amber-700 transition">
                        {trip.title}
                      </h2>
                    </Link>

                    {/* Description */}
                    {trip.description && (
                      <p className="text-stone-500 text-xs mb-3 line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    )}

                    {/* Dates */}
                    {(trip.startDate || trip.endDate) && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {formatDate(trip.startDate)}
                          {trip.endDate && ` 〜 ${formatDate(trip.endDate)}`}
                        </span>
                      </div>
                    )}

                    {/* Budget */}
                    {trip.budget !== null && trip.budget !== undefined && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium mb-3">
                        <CircleDollarSign className="w-3.5 h-3.5 text-stone-400" />
                        <span>目標予算: ¥{trip.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer stats & link */}
                  <div className="pt-4 mt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-stone-400">
                      <span>📍 {trip.places?.length || 0} スポット</span>
                      <span>🗓️ {trip.schedules?.length || 0} 予定</span>
                      {totalPacking > 0 && (
                        <span>🎒 {packedCount}/{totalPacking} 荷物</span>
                      )}
                    </div>

                    <Link
                      href={`/trips/${trip.id}`}
                      className="inline-flex items-center gap-1 font-bold text-stone-800 group-hover:text-amber-700 transition"
                    >
                      開く <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OfflineStatusBanner onManualSync={fetchTrips} />
    </main>
  );
}