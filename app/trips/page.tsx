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
    <main className="min-h-screen bg-[#FDF0D5] text-[#386641] pb-24">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-[#FDF0D5]/90 backdrop-blur-md border-b border-[#386641]/10 px-6 sm:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-wider text-[#386641] font-brand">
          Marcaderno
        </Link>
        <Link
          href="/trips/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#C1121F] text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-[#a50f1a] transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          新しい旅を計画
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#386641]">
                旅行プラン一覧
              </h1>
              {isOfflineMode && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/50">
                  📴 オフライン
                </span>
              )}
            </div>
            <p className="text-[#386641]/70 text-xs sm:text-sm mt-1">
              保存したプランは自動で端末にキャッシュされ、オフラインでも閲覧できます。
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-[#386641]/50">
            <div className="text-3xl animate-bounce mb-3">✈️</div>
            <p className="text-sm font-medium">プランを読み込み中...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white/90 border border-dashed border-[#DDA15E]/40 rounded-3xl max-w-lg mx-auto shadow-xs">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-lg font-bold text-[#386641] mb-1">まだ旅行プランがありません</h2>
            <p className="text-[#386641]/60 text-xs max-w-sm mx-auto mb-6">
              行きたい観光地やご飯のお店、日程を登録して、自分だけの旅のしおりを作りましょう！
            </p>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C1121F] text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-[#a50f1a] transition shadow-sm"
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
                  className="bg-white/95 border border-[#DDA15E]/30 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-[#DDA15E]/60 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Destination & Duration Header */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {trip.destination && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#386641] text-[#FDF0D5]">
                            <MapPin className="w-3 h-3" />
                            {trip.destination}
                          </span>
                        )}
                        {duration && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#386641]">
                            {duration}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => deleteTrip(trip.id, trip.title)}
                        className="p-1.5 text-stone-300 hover:text-[#C1121F] rounded-lg hover:bg-[#C1121F]/10 transition"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title */}
                    <Link href={`/trips/${trip.id}`} className="block my-2">
                      <h2 className="text-lg font-bold text-[#386641] tracking-tight group-hover:text-[#C1121F] transition">
                        {trip.title}
                      </h2>
                    </Link>

                    {/* Description */}
                    {trip.description && (
                      <p className="text-[#386641]/70 text-xs mb-3 line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    )}

                    {/* Dates */}
                    {(trip.startDate || trip.endDate) && (
                      <div className="flex items-center gap-1.5 text-xs text-[#386641]/70 mb-3">
                        <Calendar className="w-3.5 h-3.5 text-[#386641]/50" />
                        <span>
                          {formatDate(trip.startDate)}
                          {trip.endDate && ` 〜 ${formatDate(trip.endDate)}`}
                        </span>
                      </div>
                    )}

                    {/* Budget */}
                    {trip.budget !== null && trip.budget !== undefined && (
                      <div className="flex items-center gap-1.5 text-xs text-[#386641] font-medium mb-3">
                        <CircleDollarSign className="w-3.5 h-3.5 text-[#DDA15E]" />
                        <span>目標予算: ¥{trip.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer stats & link */}
                  <div className="pt-4 mt-2 border-t border-[#386641]/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-[#386641]/60">
                      <span>📍 {trip.places?.length || 0} スポット</span>
                      <span>🗓️ {trip.schedules?.length || 0} 予定</span>
                      {totalPacking > 0 && (
                        <span>🎒 {packedCount}/{totalPacking} 荷物</span>
                      )}
                    </div>

                    <Link
                      href={`/trips/${trip.id}`}
                      className="inline-flex items-center gap-1 font-bold text-[#386641] group-hover:text-[#C1121F] transition"
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