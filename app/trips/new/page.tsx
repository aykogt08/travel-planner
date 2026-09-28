"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveTripOffline } from "@/lib/offline-storage";
import { normalizeNumberInput } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CircleDollarSign,
  FileText,
  Sparkles,
  Plane,
} from "lucide-react";

export default function NewTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    destination: "",
    description: "",
    startDate: "",
    endDate: "",
    budget: "",
    includeDefaultPacking: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "budget") {
      setForm((prev) => ({ ...prev, [name]: normalizeNumberInput(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("旅行タイトルを入力してください");

    setLoading(true);

    try {
      // 1. Create Trip via API
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          destination: form.destination.trim() || null,
          description: form.description.trim() || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          budget: form.budget ? Number(form.budget) : null,
        }),
      });

      if (res.ok) {
        const trip = await res.json();

        // 2. Optionally add default packing list
        if (form.includeDefaultPacking) {
          const defaultItems = [
            { name: "財布・現金・クレジットカード", category: "ESSENTIAL" },
            { name: "スマホ・身分証明書", category: "ESSENTIAL" },
            { name: "新幹線/航空券・予約確認", category: "ESSENTIAL" },
            { name: "スマホ充電器・ケーブル", category: "GADGET" },
            { name: "モバイルバッテリー", category: "GADGET" },
            { name: "着替え・インナー・靴下", category: "CLOTHES" },
            { name: "常備薬・目薬・絆創膏", category: "MEDICINE" },
            { name: "歯ブラシ・スキンケア", category: "MEDICINE" },
            { name: "折りたたみ傘・雨具", category: "OTHER" },
          ];
          await fetch("/api/packing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: defaultItems,
              tripId: trip.id,
            }),
          });
        }

        // Cache offline
        await saveTripOffline(trip);
        router.push(`/trips/${trip.id}`);
      } else {
        alert("作成に失敗しました。もう一度お試しください。");
        setLoading(false);
      }
    } catch (e) {
      console.error("Create trip error:", e);
      alert("作成に失敗しました。");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <Link href="/trips" className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
          <span>✈️ マルカ・デルノ</span>
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-10">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> プラン一覧に戻る
        </Link>

        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
              新しい旅を計画する
            </h1>
            <p className="text-stone-500 text-xs mt-1">
              目的地や日程、予算を設定して、旅のスケジュール作りを始めましょう。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                旅行タイトル <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="例: 京都 桜の寺社巡り & グルメ旅、沖縄ドライブ"
                required
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                目的地・エリア
              </label>
              <input
                name="destination"
                value={form.destination}
                onChange={handleChange}
                placeholder="例: 京都、金沢、北海道、台湾"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  出発日
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  帰国日・最終日
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <CircleDollarSign className="w-3.5 h-3.5 text-stone-400" />
                目標総予算 (円)
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                placeholder="例: 50000 (全角・半角どちらでも自動変換)"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                メモ・旅のテーマ
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="旅の目的や、やりたいことリストなど"
                rows={3}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
              />
            </div>

            {/* Default packing list checkbox */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
              <input
                type="checkbox"
                id="defaultPacking"
                checked={form.includeDefaultPacking}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, includeDefaultPacking: e.target.checked }))
                }
                className="w-4 h-4 accent-stone-900 rounded"
              />
              <label htmlFor="defaultPacking" className="text-xs text-stone-700 font-medium cursor-pointer">
                ✨ 定番の持ち物リスト（充電器、着替え、常備薬など）を初期登録する
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 bg-stone-900 text-white rounded-2xl text-sm font-bold hover:bg-stone-700 transition disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                "プランを作成中..."
              ) : (
                <>
                  <Plane className="w-4 h-4" />
                  プランを作成してスケジュールを組む
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}