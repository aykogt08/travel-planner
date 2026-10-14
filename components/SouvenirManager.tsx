"use client";

import { useState, useMemo } from "react";
import { SouvenirItem } from "@/types/trip";
import {
  Gift,
  Plus,
  Check,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Search,
  Users,
  MapPin,
  FileText,
  DollarSign,
  X,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

interface SouvenirManagerProps {
  tripId: number;
  souvenirs: SouvenirItem[];
  onSouvenirsChange: (items: SouvenirItem[]) => void;
  isOffline?: boolean;
}

const PRESET_RECIPIENTS = [
  "自分用",
  "両親",
  "たろー",
  "家族",
  "友達",
  "職場・同僚",
  "親戚",
];

export default function SouvenirManager({
  tripId,
  souvenirs = [],
  onSouvenirsChange,
  isOffline = false,
}: SouvenirManagerProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNBOUGHT" | "BOUGHT">("ALL");
  const [selectedRecipient, setSelectedRecipient] = useState<string>("ALL");

  // Inline quick add
  const [quickName, setQuickName] = useState("");
  const [quickRecipient, setQuickRecipient] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Full Modal state (for add & edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SouvenirItem | null>(null);
  const [modalForm, setModalForm] = useState({
    name: "",
    recipient: "",
    memo: "",
    cost: "",
    currency: "EUR",
    city: "",
    isBought: false,
  });

  // Calculate stats
  const totalCount = souvenirs.length;
  const boughtCount = souvenirs.filter((s) => s.isBought).length;
  const progressPercent = totalCount > 0 ? Math.round((boughtCount / totalCount) * 100) : 0;

  // Extract unique recipients from existing souvenirs
  const allRecipients = useMemo(() => {
    const set = new Set<string>();
    souvenirs.forEach((s) => {
      if (s.recipient && s.recipient.trim()) {
        set.add(s.recipient.trim());
      }
    });
    return Array.from(set);
  }, [souvenirs]);

  // Filtered souvenirs
  const filteredSouvenirs = useMemo(() => {
    return souvenirs.filter((item) => {
      // Status filter
      if (statusFilter === "UNBOUGHT" && item.isBought) return false;
      if (statusFilter === "BOUGHT" && !item.isBought) return false;

      // Recipient filter
      if (selectedRecipient !== "ALL" && item.recipient !== selectedRecipient) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchMemo = item.memo ? item.memo.toLowerCase().includes(query) : false;
        const matchRecipient = item.recipient ? item.recipient.toLowerCase().includes(query) : false;
        const matchCity = item.city ? item.city.toLowerCase().includes(query) : false;
        if (!matchName && !matchMemo && !matchRecipient && !matchCity) return false;
      }

      return true;
    });
  }, [souvenirs, statusFilter, selectedRecipient, searchQuery]);

  // Toggle bought status
  const handleToggleBought = async (item: SouvenirItem) => {
    const newBought = !item.isBought;
    // Optimistic UI update
    const updatedList = souvenirs.map((s) =>
      s.id === item.id ? { ...s, isBought: newBought } : s
    );
    onSouvenirsChange(updatedList);

    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    if (!isOfflineMode) {
      try {
        await fetch(`/api/souvenirs/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBought: newBought }),
        });
      } catch (err) {
        console.warn("Failed to update souvenir bought status online:", err);
      }
    }
  };

  // Quick add item
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    setIsQuickAdding(true);
    const payload = {
      name: quickName.trim(),
      recipient: quickRecipient.trim() || null,
      isBought: false,
      tripId,
    };

    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    let created: SouvenirItem | null = null;

    if (!isOfflineMode) {
      try {
        const res = await fetch("/api/souvenirs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          created = await res.json();
        }
      } catch (err) {
        console.warn("Failed to create souvenir online:", err);
      }
    }

    const finalItem: SouvenirItem = created || {
      id: Date.now(),
      name: payload.name,
      recipient: payload.recipient,
      memo: null,
      cost: null,
      currency: "EUR",
      isBought: false,
      city: null,
      tripId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSouvenirsChange([...souvenirs, finalItem]);
    setQuickName("");
    setQuickRecipient("");
    setIsQuickAdding(false);
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setModalForm({
      name: "",
      recipient: selectedRecipient !== "ALL" ? selectedRecipient : "",
      memo: "",
      cost: "",
      currency: "EUR",
      city: "",
      isBought: false,
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (item: SouvenirItem) => {
    setEditingItem(item);
    setModalForm({
      name: item.name,
      recipient: item.recipient || "",
      memo: item.memo || "",
      cost: item.cost !== null ? String(item.cost) : "",
      currency: item.currency || "EUR",
      city: item.city || "",
      isBought: item.isBought,
    });
    setIsModalOpen(true);
  };

  // Save from modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim()) return alert("お土産名を入力してください");

    const payload = {
      name: modalForm.name.trim(),
      recipient: modalForm.recipient.trim() || null,
      memo: modalForm.memo.trim() || null,
      cost: modalForm.cost ? Number(modalForm.cost) : null,
      currency: modalForm.currency || "EUR",
      city: modalForm.city.trim() || null,
      isBought: modalForm.isBought,
      tripId,
    };

    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);

    if (editingItem) {
      let updated: SouvenirItem | null = null;
      if (!isOfflineMode) {
        try {
          const res = await fetch(`/api/souvenirs/${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            updated = await res.json();
          }
        } catch (err) {
          console.warn("Failed to update souvenir online:", err);
        }
      }

      const finalUpdated: SouvenirItem = updated || {
        ...editingItem,
        ...payload,
        updatedAt: new Date().toISOString(),
      };

      onSouvenirsChange(souvenirs.map((s) => (s.id === finalUpdated.id ? finalUpdated : s)));
    } else {
      let created: SouvenirItem | null = null;
      if (!isOfflineMode) {
        try {
          const res = await fetch("/api/souvenirs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            created = await res.json();
          }
        } catch (err) {
          console.warn("Failed to create souvenir online:", err);
        }
      }

      const finalCreated: SouvenirItem = created || {
        id: Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSouvenirsChange([...souvenirs, finalCreated]);
    }

    setIsModalOpen(false);
  };

  // Delete item
  const handleDelete = async (id: number) => {
    if (!confirm("このお土産アイテムを削除しますか？")) return;

    onSouvenirsChange(souvenirs.filter((s) => s.id !== id));

    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    if (!isOfflineMode) {
      try {
        await fetch(`/api/souvenirs/${id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Failed to delete souvenir online:", err);
      }
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 pb-12">
      {/* Header Banner & Progress */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-5 shadow-xs border border-[#DDA15E]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#C1121F]/10 flex items-center justify-center text-[#C1121F]">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#386641] flex items-center gap-2">
                <span>お土産リスト</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#386641]/10 text-[#386641] font-semibold">
                  {boughtCount}/{totalCount}個 完了
                </span>
              </h2>
              <p className="text-xs text-[#386641]/70">
                誰あてのお土産か、メモや預け先、購入チェックを一元管理
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#386641] text-[#FDF0D5] font-bold rounded-xl text-xs hover:bg-[#386641]/90 transition shadow-2xs w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>詳細を追加</span>
          </button>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-4 pt-3 border-t border-[#DDA15E]/20">
            <div className="flex items-center justify-between text-xs font-semibold text-[#386641] mb-1.5">
              <span>購入進捗</span>
              <span>{progressPercent}% 完了</span>
            </div>
            <div className="w-full bg-[#386641]/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#386641] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleQuickAdd}
        className="bg-white/95 rounded-2xl p-3 sm:p-4 shadow-xs border border-[#DDA15E]/30 flex flex-col sm:flex-row gap-2"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="お土産名を入力... (例: クスミティーの紅茶缶)"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FDF0D5]/20 border border-[#DDA15E]/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#386641] text-[#386641]"
          />
        </div>
        <div className="w-full sm:w-40">
          <input
            type="text"
            value={quickRecipient}
            onChange={(e) => setQuickRecipient(e.target.value)}
            placeholder="誰あて (例: 両親)"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FDF0D5]/20 border border-[#DDA15E]/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#386641] text-[#386641]"
          />
        </div>
        <button
          type="submit"
          disabled={!quickName.trim() || isQuickAdding}
          className="px-4 py-2 bg-[#DDA15E] text-[#386641] font-bold rounded-xl text-xs sm:text-sm hover:bg-[#DDA15E]/80 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>追加</span>
        </button>
      </form>

      {/* Filters & Search */}
      <div className="space-y-2">
        {/* Status filter tabs & search */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-[#DDA15E]/30 text-xs font-semibold overflow-x-auto scrollbar-none">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-[#386641] text-[#FDF0D5] shadow-2xs"
                  : "text-[#386641]/70 hover:text-[#386641]"
              }`}
            >
              すべて ({souvenirs.length})
            </button>
            <button
              onClick={() => setStatusFilter("UNBOUGHT")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === "UNBOUGHT"
                  ? "bg-[#386641] text-[#FDF0D5] shadow-2xs"
                  : "text-[#386641]/70 hover:text-[#386641]"
              }`}
            >
              未購入 ({souvenirs.filter((s) => !s.isBought).length})
            </button>
            <button
              onClick={() => setStatusFilter("BOUGHT")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                statusFilter === "BOUGHT"
                  ? "bg-[#386641] text-[#FDF0D5] shadow-2xs"
                  : "text-[#386641]/70 hover:text-[#386641]"
              }`}
            >
              購入済み ({boughtCount})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#386641]/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="品名・メモ・相手で検索..."
              className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs bg-white/90 border border-[#DDA15E]/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#386641] text-[#386641]"
            />
          </div>
        </div>

        {/* Recipient filter chips */}
        {allRecipients.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#386641]/60 font-semibold text-[11px] whitespace-nowrap pl-1">
              相手:
            </span>
            <button
              onClick={() => setSelectedRecipient("ALL")}
              className={`px-2.5 py-1 rounded-full font-semibold transition border whitespace-nowrap ${
                selectedRecipient === "ALL"
                  ? "bg-[#386641] text-white border-[#386641]"
                  : "bg-white/80 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
              }`}
            >
              全員
            </button>
            {allRecipients.map((rec) => {
              const isSelected = selectedRecipient === rec;
              const count = souvenirs.filter((s) => s.recipient === rec).length;
              return (
                <button
                  key={rec}
                  onClick={() => setSelectedRecipient(rec)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition border whitespace-nowrap ${
                    isSelected
                      ? "bg-[#386641] text-white border-[#386641]"
                      : "bg-white/80 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                  }`}
                >
                  <span>{rec}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Souvenir Items List */}
      {filteredSouvenirs.length === 0 ? (
        <div className="bg-white/80 rounded-2xl p-8 text-center border border-dashed border-[#DDA15E]/40">
          <ShoppingBag className="w-10 h-10 text-[#DDA15E] mx-auto mb-2 opacity-60" />
          <p className="text-sm font-bold text-[#386641]">
            {souvenirs.length === 0
              ? "お土産アイテムがまだありません"
              : "条件に一致するお土産が見つかりませんでした"}
          </p>
          <p className="text-xs text-[#386641]/60 mt-1">
            {souvenirs.length === 0
              ? "上のフォームから買いたいお土産や頼まれたものを追加してみましょう！"
              : "検索条件やフィルターを変更してみてください"}
          </p>
          {souvenirs.length === 0 && (
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#386641] text-[#FDF0D5] font-bold rounded-xl text-xs hover:bg-[#386641]/90 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>最初のお土産を追加する</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSouvenirs.map((item) => {
            return (
              <div
                key={item.id}
                className={`bg-white/95 rounded-2xl p-3.5 sm:p-4 shadow-xs border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.isBought
                    ? "border-[#386641]/20 bg-[#386641]/3 opacity-80"
                    : "border-[#DDA15E]/30 hover:border-[#DDA15E]"
                }`}
              >
                {/* Left: Checkbox & Title & Badges */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleBought(item)}
                    className="mt-0.5 shrink-0 text-[#386641] hover:opacity-80 transition"
                    title={item.isBought ? "未購入に戻す" : "購入済みにする"}
                  >
                    {item.isBought ? (
                      <CheckSquare className="w-5 h-5 text-[#386641]" />
                    ) : (
                      <Square className="w-5 h-5 text-[#DDA15E]" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold break-all ${
                          item.isBought
                            ? "line-through text-[#386641]/50"
                            : "text-[#386641]"
                        }`}
                      >
                        {item.name}
                      </span>

                      {/* Recipient Badge */}
                      {item.recipient && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/30">
                          <Users className="w-3 h-3 text-[#DDA15E]" />
                          <span>{item.recipient}</span>
                        </span>
                      )}

                      {/* City Badge */}
                      {item.city && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#386641]/10 text-[#386641]">
                          <MapPin className="w-3 h-3" />
                          <span>{item.city}</span>
                        </span>
                      )}

                      {/* Cost Badge */}
                      {item.cost !== null && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#003049]/10 text-[#003049]">
                          <span>
                            {item.currency === "EUR" ? "€" : item.currency === "USD" ? "$" : "¥"}
                            {item.cost.toLocaleString()}
                          </span>
                        </span>
                      )}

                      {/* Bought Pill */}
                      {item.isBought && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#386641] text-[#FDF0D5]">
                          <Check className="w-2.5 h-2.5" />
                          <span>購入済</span>
                        </span>
                      )}
                    </div>

                    {/* Memo (Highlighted Note box) */}
                    {item.memo && (
                      <div className="text-xs bg-[#FDF0D5]/50 border border-[#DDA15E]/30 text-[#386641] px-2.5 py-1.5 rounded-xl flex items-start gap-1.5 mt-1">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-[#DDA15E] mt-0.5" />
                        <span className="break-all whitespace-pre-wrap">{item.memo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DDA15E]/20">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-[#386641]/60 hover:text-[#386641] hover:bg-[#386641]/10 rounded-lg transition"
                    title="編集"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-[#C1121F]/60 hover:text-[#C1121F] hover:bg-[#C1121F]/10 rounded-lg transition"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-[#DDA15E]/30 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDA15E]/20">
              <h3 className="font-bold text-base text-[#386641] flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#C1121F]" />
                <span>{editingItem ? "お土産の編集" : "新しいお土産を追加"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#386641]/50 hover:text-[#386641] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs sm:text-sm">
              {/* Name */}
              <div>
                <label className="block font-bold text-[#386641] mb-1">
                  品名・お土産名 <span className="text-[#C1121F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="例: クスミティーの紅茶、ワイン、バタークッキー"
                  className="w-full px-3 py-2 bg-[#FDF0D5]/20 border border-[#DDA15E]/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#386641] text-[#386641]"
                />
              </div>

              {/* Recipient */}
              <div>
                <label className="block font-bold text-[#386641] mb-1">
                  誰あて・渡す相手
                </label>
                <input
                  type="text"
                  value={modalForm.recipient}
                  onChange={(e) => setModalForm({ ...modalForm, recipient: e.target.value })}
                  placeholder="例: 両親、たろー、友達、自分用"
                  className="w-full px-3 py-2 bg-[#FDF0D5]/20 border border-[#DDA15E]/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#386641] text-[#386641]"
                />
                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  {PRESET_RECIPIENTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setModalForm({ ...modalForm, recipient: preset })}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                        modalForm.recipient === preset
                          ? "bg-[#386641] text-white border-[#386641]"
                          : "bg-stone-50 text-[#386641]/70 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="block font-bold text-[#386641] mb-1">
                  メモ (例: 親に持って帰ってもらった、保管場所など)
                </label>
                <textarea
                  rows={2}
                  value={modalForm.memo}
                  onChange={(e) => setModalForm({ ...modalForm, memo: e.target.value })}
                  placeholder="例: 親に持って帰ってもらった / ボン・マルシェの地下で購入 / 割れ物注意"
                  className="w-full px-3 py-2 bg-[#FDF0D5]/20 border border-[#DDA15E]/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#386641] text-[#386641] text-xs"
                />
              </div>

              {/* City & Cost Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#386641] mb-1">
                    購入都市 / 店
                  </label>
                  <input
                    type="text"
                    value={modalForm.city}
                    onChange={(e) => setModalForm({ ...modalForm, city: e.target.value })}
                    placeholder="例: パリ、免税店"
                    className="w-full px-3 py-2 bg-[#FDF0D5]/20 border border-[#DDA15E]/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#386641] text-[#386641]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#386641] mb-1">
                    概算金額
                  </label>
                  <div className="flex gap-1">
                    <select
                      value={modalForm.currency}
                      onChange={(e) => setModalForm({ ...modalForm, currency: e.target.value })}
                      className="px-2 py-2 bg-[#FDF0D5]/20 border border-[#DDA15E]/40 rounded-xl focus:outline-none text-[#386641] text-xs font-semibold"
                    >
                      <option value="EUR">€</option>
                      <option value="JPY">¥</option>
                      <option value="USD">$</option>
                    </select>
                    <input
                      type="number"
                      value={modalForm.cost}
                      onChange={(e) => setModalForm({ ...modalForm, cost: e.target.value })}
                      placeholder="例: 25"
                      className="w-full px-3 py-2 bg-[#FDF0D5]/20 border border-[#DDA15E]/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#386641] text-[#386641]"
                    />
                  </div>
                </div>
              </div>

              {/* Bought Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#386641]">
                  <input
                    type="checkbox"
                    checked={modalForm.isBought}
                    onChange={(e) => setModalForm({ ...modalForm, isBought: e.target.checked })}
                    className="w-4 h-4 rounded text-[#386641] focus:ring-[#386641]"
                  />
                  <span>購入済みにする</span>
                </label>
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDA15E]/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold text-xs"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#386641] text-[#FDF0D5] rounded-xl font-bold text-xs hover:bg-[#386641]/90 shadow-2xs"
                >
                  {editingItem ? "更新する" : "追加する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
