"use client";

import { useState } from "react";
import { PackingItem, PackingCategory } from "@/types/trip";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Shirt,
  Smartphone,
  Pill,
  Bookmark,
} from "lucide-react";

interface PackingManagerProps {
  tripId: number;
  packingList: PackingItem[];
  onPackingListChange: (items: PackingItem[]) => void;
  isOffline?: boolean;
}

const PACKING_CATEGORY_LABELS: Record<string, string> = {
  ESSENTIAL: "必需品・貴重品",
  CLOTHES: "衣類・着替え",
  GADGET: "電子機器・充電器",
  MEDICINE: "薬・コスメ・衛生",
  OTHER: "その他・便利グッズ",
};

const PACKING_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ESSENTIAL: <ShieldCheck className="w-4 h-4 text-rose-600" />,
  CLOTHES: <Shirt className="w-4 h-4 text-violet-600" />,
  GADGET: <Smartphone className="w-4 h-4 text-sky-600" />,
  MEDICINE: <Pill className="w-4 h-4 text-emerald-600" />,
  OTHER: <Bookmark className="w-4 h-4 text-stone-600" />,
};

// Default checklist suggestions
const DEFAULT_PACKING_SUGGESTIONS = [
  { name: "財布・現金・クレジットカード", category: "ESSENTIAL" },
  { name: "スマホ・身分証明書/免許証", category: "ESSENTIAL" },
  { name: "新幹線/航空券 Eチケット・予約確認", category: "ESSENTIAL" },
  { name: "スマホ充電器・ケーブル", category: "GADGET" },
  { name: "モバイルバッテリー", category: "GADGET" },
  { name: "着替え・インナー・靴下", category: "CLOTHES" },
  { name: "羽織もの / 防寒具", category: "CLOTHES" },
  { name: "常備薬・目薬・絆創膏", category: "MEDICINE" },
  { name: "歯ブラシ・スキンケア・コスメ", category: "MEDICINE" },
  { name: "折りたたみ傘・雨具", category: "OTHER" },
  { name: "ウェットティッシュ・除菌シート", category: "OTHER" },
];

export default function PackingManager({
  tripId,
  packingList,
  onPackingListChange,
  isOffline = false,
}: PackingManagerProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newCategory, setNewCategory] = useState<PackingCategory>("ESSENTIAL");
  const [isAdding, setIsAdding] = useState(false);

  const packedCount = packingList.filter((item) => item.isPacked).length;
  const totalCount = packingList.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  // Add single item
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName.trim(),
          category: newCategory,
          tripId,
        }),
      });
      if (res.ok) {
        const item = await res.json();
        onPackingListChange([...packingList, item]);
        setNewItemName("");
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Bulk add default checklist
  const handleAddDefaultSuggestions = async () => {
    if (packingList.length > 0) {
      if (!confirm("定番の持ち物リスト（11点）を追加しますか？")) return;
    }
    const res = await fetch("/api/packing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: DEFAULT_PACKING_SUGGESTIONS,
        tripId,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      onPackingListChange([...packingList, ...created]);
    }
  };

  // Toggle packed status
  const handleTogglePacked = async (item: PackingItem) => {
    const nextPacked = !item.isPacked;
    const res = await fetch(`/api/packing/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, isPacked: nextPacked }),
    });
    if (res.ok) {
      const updated = await res.json();
      onPackingListChange(packingList.map((p) => (p.id === updated.id ? updated : p)));
    }
  };

  // Delete item
  const handleDeleteItem = async (id: number) => {
    await fetch(`/api/packing/${id}`, { method: "DELETE" });
    onPackingListChange(packingList.filter((p) => p.id !== id));
  };

  // Group by category
  const categories: PackingCategory[] = ["ESSENTIAL", "CLOTHES", "GADGET", "MEDICINE", "OTHER"];

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-800 flex items-center gap-2">
            <span>持ち物・事前準備リスト</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
              {packedCount} / {totalCount} 完了 ({progressPercent}%)
            </span>
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            忘れ物のないように荷物をチェック！オフラインでもチェック状態を確認できます。
          </p>
        </div>

        <button
          onClick={handleAddDefaultSuggestions}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition shadow-2xs"
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          定番持ち物を一括追加
        </button>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
            <span>パッキング進捗</span>
            <span>{progressPercent}% 完了</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progressPercent === 100 ? "bg-emerald-500" : "bg-stone-800"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white border border-stone-200 rounded-2xl p-2.5 shadow-xs">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as PackingCategory)}
          className="w-full sm:w-44 text-xs border border-stone-200 rounded-xl px-3 py-2.5 bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 font-medium"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {PACKING_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          placeholder="持ち物を追加 (例: パスポート、充電器、予備の靴下)..."
          className="flex-1 w-full text-xs sm:text-sm border border-stone-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
        />

        <button
          onClick={handleAddItem}
          disabled={isAdding || !newItemName.trim()}
          className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          追加
        </button>
      </div>

      {/* Categories & Items */}
      {totalCount === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-stone-200 rounded-2xl">
          <div className="text-4xl mb-3">🎒</div>
          <h3 className="text-stone-700 font-semibold text-sm">持ち物リストが空です</h3>
          <p className="text-stone-400 text-xs mt-1 max-w-sm mx-auto">
            上の入力欄から追加するか、「定番持ち物を一括追加」ボタンをお試しください。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((catKey) => {
            const items = packingList.filter((item) => item.category === catKey);
            if (items.length === 0) return null;

            return (
              <div
                key={catKey}
                className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-stone-100">
                    {PACKING_CATEGORY_ICONS[catKey]}
                    <h3 className="text-xs font-bold text-stone-800">
                      {PACKING_CATEGORY_LABELS[catKey]}
                    </h3>
                    <span className="text-[10px] text-stone-400 ml-auto font-medium">
                      {items.filter((i) => i.isPacked).length}/{items.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition ${
                          item.isPacked
                            ? "bg-stone-50/60 border-stone-100 text-stone-400"
                            : "bg-white border-stone-200 text-stone-800 hover:border-stone-300"
                        }`}
                      >
                        <button
                          onClick={() => handleTogglePacked(item)}
                          className="flex items-center gap-2 text-left flex-1 text-xs"
                        >
                          {item.isPacked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 fill-emerald-100 flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-300 flex-shrink-0" />
                          )}
                          <span className={`${item.isPacked ? "line-through" : "font-medium"}`}>
                            {item.name}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-stone-300 hover:text-red-500 p-1 transition"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
