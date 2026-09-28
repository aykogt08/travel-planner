"use client";

import { useState, useMemo } from "react";
import { WishItem, WishStatus, WishCategory } from "@/types/trip";
import { getRandomPrompt, WishPrompt, WISH_PROMPTS } from "@/lib/wish-prompts";
import {
  Sparkles,
  Plus,
  Shuffle,
  BarChart2,
  Heart,
  Edit2,
  Trash2,
  Check,
  X,
  Compass,
  MapPin,
  Users,
  Star,
  ChevronRight,
  Filter,
  ArrowUpDown,
  BookOpen,
  Coffee,
  Waves,
  Footprints,
  Utensils,
  Mountain,
  Palette,
  ShoppingBag,
  Armchair,
  Train,
  CheckCircle2,
} from "lucide-react";

interface WishCollectionProps {
  tripId: number;
  wishes: WishItem[];
  onWishesChange: (wishes: WishItem[]) => void;
  isOffline?: boolean;
}

// ステータス定義
export const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; activeClass: string }
> = {
  IDEA: {
    label: "思いついた",
    badgeClass: "bg-[#003049]/5 text-[#003049] border-[#003049]/20",
    activeClass: "bg-[#003049] text-white border-[#003049]",
  },
  CANDIDATE: {
    label: "候補",
    badgeClass: "bg-[#DDA15E]/15 text-[#003049] border-[#DDA15E]/40 font-medium",
    activeClass: "bg-[#DDA15E] text-[#003049] font-bold border-[#DDA15E]",
  },
  DONE: {
    label: "やった",
    badgeClass: "bg-[#386641]/10 text-[#386641] border-[#386641]/30 font-semibold",
    activeClass: "bg-[#386641] text-white border-[#386641]",
  },
  BEST: {
    label: "最高だった",
    badgeClass: "bg-[#C1121F]/10 text-[#C1121F] border-[#C1121F]/30 font-bold",
    activeClass: "bg-[#C1121F] text-white border-[#C1121F]",
  },
  NORMAL: {
    label: "普通だった",
    badgeClass: "bg-[#003049]/5 text-[#003049]/70 border-[#003049]/15",
    activeClass: "bg-[#003049]/70 text-white border-[#003049]/70",
  },
  SKIPPED: {
    label: "やらなかった",
    badgeClass: "bg-[#003049]/5 text-[#003049]/40 border-[#003049]/10 line-through",
    activeClass: "bg-[#003049]/40 text-white border-[#003049]/40",
  },
};

// ヨーロッパ旅行の代表的な都市プリセット
const CITY_PRESETS = [
  "どこでも",
  "パリ",
  "ポルト",
  "リスボン",
  "ビルバオ",
  "サン・セバスチャン",
  "ナポリ",
  "ブダペスト",
  "プラハ",
  "ウィーン",
];

// 「誰と」の代表的なプリセット
const WITH_WHOM_PRESETS = ["ひとり", "両親", "友達", "誰とでも"];

// 振り返り・集計用カテゴリ
export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  CAFE: { label: "カフェ", icon: <Coffee className="w-3.5 h-3.5" /> },
  SEA: { label: "海・水辺", icon: <Waves className="w-3.5 h-3.5" /> },
  WALK: { label: "街歩き", icon: <Footprints className="w-3.5 h-3.5" /> },
  FOOD: { label: "食事", icon: <Utensils className="w-3.5 h-3.5" /> },
  SCENERY: { label: "景色", icon: <Mountain className="w-3.5 h-3.5" /> },
  ART: { label: "アート・歴史", icon: <Palette className="w-3.5 h-3.5" /> },
  SHOPPING: { label: "買い物", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  RELAX: { label: "のんびり", icon: <Armchair className="w-3.5 h-3.5" /> },
  TRANSIT: { label: "移動", icon: <Train className="w-3.5 h-3.5" /> },
  OTHER: { label: "その他", icon: <Compass className="w-3.5 h-3.5" /> },
};

export default function WishCollection({
  tripId,
  wishes,
  onWishesChange,
  isOffline = false,
}: WishCollectionProps) {
  // 表示モード: 'list' (一覧), 'stats' (統計), 'reflection' (最高だったこと振り返り)
  const [viewMode, setViewMode] = useState<"list" | "stats" | "reflection">("list");

  // フィルター & ソート状態
  const [filterCity, setFilterCity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterWithWhom, setFilterWithWhom] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"priority" | "newest">("priority");

  // モーダル管理
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showRandomPickModal, setShowRandomPickModal] = useState(false);
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);

  // お題ステート
  const [currentPrompt, setCurrentPrompt] = useState<WishPrompt>(() => getRandomPrompt());

  // ランダムピック「今日これやりたい」ステート
  const [pickedWish, setPickedWish] = useState<WishItem | null>(null);

  // フォームステート
  const [form, setForm] = useState({
    title: "",
    city: "どこでも",
    customCity: "",
    withWhomList: ["ひとり"],
    customWithWhom: "",
    priority: 3,
    status: "IDEA" as WishStatus,
    category: "WALK" as WishCategory,
    memo: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      city: "どこでも",
      customCity: "",
      withWhomList: ["ひとり"],
      customWithWhom: "",
      priority: 3,
      status: "IDEA",
      category: "WALK",
      memo: "",
    });
    setEditingWish(null);
  };

  const handleOpenAddModal = (initialTitle?: string, initialCategory?: WishCategory) => {
    resetForm();
    if (initialTitle) {
      setForm((prev) => ({
        ...prev,
        title: initialTitle,
        category: initialCategory || prev.category,
      }));
    }
    setShowAddModal(true);
  };

  const handleOpenEditModal = (wish: WishItem) => {
    setEditingWish(wish);
    let parsedWithWhom: string[] = [];
    if (wish.withWhom) {
      try {
        parsedWithWhom = JSON.parse(wish.withWhom);
      } catch {
        parsedWithWhom = wish.withWhom.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    const isPresetCity = wish.city && CITY_PRESETS.includes(wish.city);

    setForm({
      title: wish.title,
      city: isPresetCity ? wish.city! : wish.city ? "CUSTOM" : "どこでも",
      customCity: !isPresetCity && wish.city ? wish.city : "",
      withWhomList: parsedWithWhom.length > 0 ? parsedWithWhom : ["ひとり"],
      customWithWhom: "",
      priority: wish.priority || 3,
      status: (wish.status as WishStatus) || "IDEA",
      category: (wish.category as WishCategory) || "WALK",
      memo: wish.memo || "",
    });
    setShowAddModal(true);
  };

  // 保存処理 (新規 / 更新)
  const handleSaveWish = async () => {
    if (!form.title.trim()) {
      alert("やりたいことを入力してください");
      return;
    }

    const resolvedCity =
      form.city === "CUSTOM"
        ? form.customCity.trim() || null
        : form.city || null;

    const extraWithWhom = form.customWithWhom.trim();
    let finalWithWhomList = [...form.withWhomList];
    if (extraWithWhom && !finalWithWhomList.includes(extraWithWhom)) {
      finalWithWhomList = finalWithWhomList.filter((t) => t !== "誰とでも");
      finalWithWhomList.push(extraWithWhom);
    }

    const payload = {
      title: form.title.trim(),
      city: resolvedCity,
      withWhom: JSON.stringify(finalWithWhomList),
      priority: Number(form.priority),
      status: form.status,
      category: form.category || null,
      memo: form.memo.trim() || null,
      tripId,
    };

    try {
      if (editingWish) {
        // 更新
        if (!isOffline) {
          const res = await fetch(`/api/wishes/${editingWish.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const updated = await res.json();
            onWishesChange(wishes.map((w) => (w.id === updated.id ? updated : w)));
          } else {
            throw new Error("更新APIエラー");
          }
        } else {
          // オフライン時の楽観的更新
          const updated: WishItem = {
            ...editingWish,
            ...payload,
            updatedAt: new Date().toISOString(),
          };
          onWishesChange(wishes.map((w) => (w.id === updated.id ? updated : w)));
        }
      } else {
        // 新規作成
        if (!isOffline) {
          const res = await fetch("/api/wishes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const created = await res.json();
            onWishesChange([created, ...wishes]);
          } else {
            throw new Error("作成APIエラー");
          }
        } else {
          // オフライン時の楽観的更新
          const created: WishItem = {
            id: Date.now(), // 一時ID
            ...payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onWishesChange([created, ...wishes]);
        }
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Save wish error:", err);
      // 通信失敗時もローカルステートを更新
      if (editingWish) {
        const updated: WishItem = {
          ...editingWish,
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        onWishesChange(wishes.map((w) => (w.id === updated.id ? updated : w)));
      } else {
        const created: WishItem = {
          id: Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onWishesChange([created, ...wishes]);
      }
      setShowAddModal(false);
      resetForm();
    }
  };

  // 削除処理
  const handleDeleteWish = async (id: number) => {
    if (!confirm("このやりたいことを削除しますか？")) return;
    try {
      if (!isOffline) {
        await fetch(`/api/wishes/${id}`, { method: "DELETE" });
      }
    } catch (e) {
      console.warn("Delete API failed, proceeding with local update:", e);
    }
    onWishesChange(wishes.filter((w) => w.id !== id));
    if (pickedWish?.id === id) setPickedWish(null);
  };

  // やりたい度（1〜5）のワンタップ直接変更
  const handleDirectChangePriority = async (wish: WishItem, newPriority: number) => {
    const updatedWish = { ...wish, priority: newPriority };
    onWishesChange(wishes.map((w) => (w.id === wish.id ? updatedWish : w)));

    try {
      if (!isOffline) {
        await fetch(`/api/wishes/${wish.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority: newPriority }),
        });
      }
    } catch (e) {
      console.warn("Update priority failed:", e);
    }
  };

  // ステータスのワンタップ直接変更
  const handleDirectChangeStatus = async (wish: WishItem, newStatus: WishStatus) => {
    const updatedWish = { ...wish, status: newStatus };
    onWishesChange(wishes.map((w) => (w.id === wish.id ? updatedWish : w)));

    try {
      if (!isOffline) {
        await fetch(`/api/wishes/${wish.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      }
    } catch (e) {
      console.warn("Update status failed:", e);
    }
  };

  // 「誰と」タグのトグル処理
  const toggleWithWhom = (tag: string) => {
    setForm((prev) => {
      const exists = prev.withWhomList.includes(tag);
      let nextList = exists
        ? prev.withWhomList.filter((t) => t !== tag)
        : [...prev.withWhomList, tag];
      if (nextList.length === 0) nextList = ["誰とでも"];
      return { ...prev, withWhomList: nextList };
    });
  };

  // 自由入力の「誰と」タグを追加
  const handleAddCustomWithWhom = () => {
    const val = form.customWithWhom.trim();
    if (!val) return;
    setForm((prev) => {
      if (prev.withWhomList.includes(val)) {
        return { ...prev, customWithWhom: "" };
      }
      const cleanList = prev.withWhomList.filter((t) => t !== "誰とでも");
      return {
        ...prev,
        withWhomList: [...cleanList, val],
        customWithWhom: "",
      };
    });
  };

  // 自由入力の「誰と」タグを削除
  const handleRemoveCustomWithWhom = (tagToRemove: string) => {
    setForm((prev) => {
      let nextList = prev.withWhomList.filter((t) => t !== tagToRemove);
      if (nextList.length === 0) nextList = ["誰とでも"];
      return { ...prev, withWhomList: nextList };
    });
  };

  // 「今日これやりたい」のランダム抽出
  const handleTriggerRandomPick = () => {
    if (wishes.length === 0) {
      alert("まだやりたいことが登録されていません。お題や＋ボタンから登録してみましょう！");
      return;
    }
    // 未完了のもの（IDEA, CANDIDATE）を優先し、なければ全体から
    const activeCandidates = wishes.filter(
      (w) => w.status === "IDEA" || w.status === "CANDIDATE"
    );
    const pool = activeCandidates.length > 0 ? activeCandidates : wishes;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setPickedWish(pool[randomIndex]);
    setShowRandomPickModal(true);
  };

  // フィルター・ソート済みのやりたいこと一覧
  const filteredWishes = useMemo(() => {
    return wishes
      .filter((w) => {
        if (filterCity !== "ALL") {
          if (filterCity === "どこでも" && (!w.city || w.city === "どこでも")) return true;
          if (w.city !== filterCity) return false;
        }
        if (filterStatus !== "ALL" && w.status !== filterStatus) return false;
        if (filterWithWhom !== "ALL") {
          let parsed: string[] = [];
          try {
            parsed = w.withWhom ? JSON.parse(w.withWhom) : [];
          } catch {
            parsed = w.withWhom ? [w.withWhom] : [];
          }
          if (!parsed.includes(filterWithWhom)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return b.id - a.id;
        }
        return b.id - a.id;
      });
  }, [wishes, filterCity, filterStatus, filterWithWhom, sortBy]);

  // 統計情報の計算
  const stats = useMemo(() => {
    const total = wishes.length;
    const byStatus: Record<string, number> = {
      IDEA: 0,
      CANDIDATE: 0,
      DONE: 0,
      BEST: 0,
      NORMAL: 0,
      SKIPPED: 0,
    };
    const byCity: Record<string, number> = {};
    const byWithWhom: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    wishes.forEach((w) => {
      // Status
      if (byStatus[w.status] !== undefined) {
        byStatus[w.status]++;
      }

      // City
      const c = w.city || "どこでも";
      byCity[c] = (byCity[c] || 0) + 1;

      // WithWhom
      let withArr: string[] = [];
      try {
        withArr = w.withWhom ? JSON.parse(w.withWhom) : [];
      } catch {
        withArr = w.withWhom ? [w.withWhom] : [];
      }
      withArr.forEach((person) => {
        byWithWhom[person] = (byWithWhom[person] || 0) + 1;
      });

      // Category
      if (w.category) {
        byCategory[w.category] = (byCategory[w.category] || 0) + 1;
      }
    });

    // 都市ランキング
    const sortedCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]);

    return {
      total,
      byStatus,
      sortedCities,
      byWithWhom,
      byCategory,
      bestCount: byStatus.BEST || 0,
    };
  }, [wishes]);

  // 「最高だった」アイテム一覧
  const bestWishes = useMemo(() => {
    return wishes.filter((w) => w.status === "BEST");
  }, [wishes]);

  return (
    <div className="flex flex-col gap-6">
      {/* 上部ヘッダー & 主要アクション */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#003049] flex items-center gap-2">
            <span>旅行でやりたいことコレクション</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#003049]/10 text-[#003049]">
              {wishes.length}
            </span>
          </h2>
          <p className="text-[#003049]/70 text-xs mt-1">
            何気なく過ごしたい時間や、やってみたい小さな体験を集めて旅を育てます。
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* お題から考えるボタン */}
          <button
            onClick={() => {
              setCurrentPrompt(getRandomPrompt());
              setShowPromptModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#DDA15E]/15 hover:bg-[#DDA15E]/25 text-[#003049] border border-[#DDA15E]/40 rounded-xl text-xs font-semibold transition shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#DDA15E]" />
            お題から考える
          </button>

          {/* 今日これやりたいボタン */}
          <button
            onClick={handleTriggerRandomPick}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FDF0D5]/50 text-[#003049] border border-[#DDA15E]/30 rounded-xl text-xs font-semibold transition"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#003049]/70" />
            今日これやりたい
          </button>

          {/* ＋ やりたいことを追加 */}
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C1121F] hover:bg-[#C1121F]/90 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            やりたいことを追加
          </button>
        </div>
      </div>

      {/* サブナビゲーション（一覧 / 統計 / 振り返り） */}
      <div className="flex items-center gap-1 bg-[#003049]/10 p-1 rounded-xl self-start border border-[#DDA15E]/20">
        <button
          onClick={() => setViewMode("list")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === "list"
              ? "bg-white text-[#003049] shadow-2xs"
              : "text-[#003049]/70 hover:text-[#003049]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#003049]" />
          コレクション ({wishes.length})
        </button>

        <button
          onClick={() => setViewMode("stats")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === "stats"
              ? "bg-white text-[#003049] shadow-2xs"
              : "text-[#003049]/70 hover:text-[#003049]"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-[#003049]" />
          統計
        </button>

        <button
          onClick={() => setViewMode("reflection")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            viewMode === "reflection"
              ? "bg-white text-[#C1121F] shadow-2xs"
              : "text-[#003049]/70 hover:text-[#C1121F]"
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-[#C1121F] fill-[#C1121F]/20" />
          好きだったこと ({bestWishes.length})
        </button>
      </div>

      {/* ======================= 1. 一覧ビュー ======================= */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-4">
          {/* フィルターバー */}
          <div className="p-3 bg-white/95 rounded-2xl border border-[#DDA15E]/30 shadow-2xs flex flex-col gap-2.5">
            {/* 都市タグフィルター */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[#003049]/60 font-medium text-[11px] shrink-0 flex items-center gap-1 mr-1">
                <MapPin className="w-3 h-3 text-[#C1121F]" /> 都市:
              </span>
              <button
                onClick={() => setFilterCity("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                  filterCity === "ALL"
                    ? "bg-[#003049] text-white"
                    : "bg-[#003049]/5 text-[#003049] hover:bg-[#003049]/10"
                }`}
              >
                すべて
              </button>
              {CITY_PRESETS.map((city) => (
                <button
                  key={city}
                  onClick={() => setFilterCity(city)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                    filterCity === city
                      ? "bg-[#003049] text-white"
                      : "bg-[#003049]/5 text-[#003049] hover:bg-[#003049]/10"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* ステータス & 誰と & ソート */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#003049]/10 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* ステータスセレクト */}
                <div className="flex items-center gap-1 bg-[#FDF0D5]/60 border border-[#DDA15E]/30 px-2.5 py-1 rounded-lg">
                  <span className="text-[#003049]/70 text-[11px]">状態:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent font-medium text-[#003049] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">すべての状態</option>
                    <option value="IDEA">思いついた</option>
                    <option value="CANDIDATE">候補</option>
                    <option value="DONE">やった</option>
                    <option value="BEST">最高だった</option>
                    <option value="NORMAL">普通だった</option>
                    <option value="SKIPPED">やらなかった</option>
                  </select>
                </div>

                {/* 誰とセレクト */}
                <div className="flex items-center gap-1 bg-[#FDF0D5]/60 border border-[#DDA15E]/30 px-2.5 py-1 rounded-lg">
                  <span className="text-[#003049]/70 text-[11px]">誰と:</span>
                  <select
                    value={filterWithWhom}
                    onChange={(e) => setFilterWithWhom(e.target.value)}
                    className="bg-transparent font-medium text-[#003049] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">全員・すべて</option>
                    <option value="ひとり">ひとり</option>
                    <option value="両親">両親</option>
                    <option value="友達">友達</option>
                    <option value="誰とでも">誰とでも</option>
                  </select>
                </div>
              </div>

              {/* ソート */}
              <div className="flex items-center gap-1">
                <span className="text-[#003049]/50 text-[11px] flex items-center gap-0.5">
                  <ArrowUpDown className="w-3 h-3 text-[#003049]/70" />
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "priority" | "newest")}
                  className="bg-transparent text-xs font-medium text-[#003049]/80 focus:outline-none cursor-pointer"
                >
                  <option value="priority">やりたい度 順</option>
                  <option value="newest">新しい順</option>
                </select>
              </div>
            </div>
          </div>

          {/* やりたいことカード一覧 */}
          {filteredWishes.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/95 border border-dashed border-[#DDA15E]/40 rounded-2xl">
              <Compass className="w-8 h-8 text-[#003049]/30 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-[#003049]">やりたいことがありません</h3>
              <p className="text-xs text-[#003049]/60 mt-1 max-w-sm mx-auto">
                フィルター条件を変更するか、「お題から考える」や「やりたいことを追加」から登録してみましょう。
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setCurrentPrompt(getRandomPrompt());
                    setShowPromptModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#DDA15E]/20 text-[#003049] border border-[#DDA15E]/40 rounded-xl text-xs font-semibold hover:bg-[#DDA15E]/30"
                >
                  お題を見てみる
                </button>
                <button
                  onClick={() => handleOpenAddModal()}
                  className="px-3.5 py-1.5 bg-[#C1121F] text-white rounded-xl text-xs font-semibold hover:bg-[#C1121F]/90"
                >
                  直接追加する
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredWishes.map((wish) => {
                let parsedWithWhom: string[] = [];
                try {
                  parsedWithWhom = wish.withWhom ? JSON.parse(wish.withWhom) : [];
                } catch {
                  parsedWithWhom = wish.withWhom ? [wish.withWhom] : [];
                }

                const statusCfg = STATUS_CONFIG[wish.status] || STATUS_CONFIG.IDEA;
                const isBest = wish.status === "BEST";

                return (
                  <div
                    key={wish.id}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      isBest
                        ? "bg-[#C1121F]/5 border-[#C1121F]/40 shadow-xs"
                        : "bg-white/95 border-[#DDA15E]/30 shadow-2xs hover:border-[#DDA15E]/60"
                    }`}
                  >
                    {/* 上部: 都市タグ & 誰とタグ & アクション */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 都市 */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#003049]/5 text-[#003049]">
                          <MapPin className="w-3 h-3 text-[#C1121F]" />
                          {wish.city || "どこでも"}
                        </span>

                        {/* 誰と */}
                        {parsedWithWhom.map((person) => (
                          <span
                            key={person}
                            className="inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-[#FDF0D5]/50 text-[#003049] border border-[#DDA15E]/30"
                          >
                            <Users className="w-2.5 h-2.5 text-[#003049]/50" />
                            {person}
                          </span>
                        ))}

                        {/* カテゴリ */}
                        {wish.category && CATEGORY_CONFIG[wish.category] && (
                          <span className="text-[10px] text-[#003049]/50 px-1">
                            {CATEGORY_CONFIG[wish.category].label}
                          </span>
                        )}
                      </div>

                      {/* 編集・削除 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(wish)}
                          className="p-1 text-[#003049]/40 hover:text-[#003049] rounded-md transition"
                          title="編集"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWish(wish.id)}
                          className="p-1 text-[#003049]/40 hover:text-[#C1121F] rounded-md transition"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* タイトル */}
                    <h3
                      className={`text-sm font-bold text-[#003049] leading-snug mb-2 ${
                        wish.status === "SKIPPED" ? "line-through text-[#003049]/40" : ""
                      }`}
                    >
                      {wish.title}
                    </h3>

                    {/* メモ（あれば表示） */}
                    {wish.memo && (
                      <p className="text-xs text-[#003049]/80 bg-[#FDF0D5]/40 border border-[#DDA15E]/20 p-2 rounded-lg mb-3 leading-relaxed whitespace-pre-wrap">
                        {wish.memo}
                      </p>
                    )}

                    {/* 下部: やりたい度（タップで直接変更） & ステータスセレクター */}
                    <div className="pt-2.5 border-t border-[#003049]/10 flex items-center justify-between gap-3 text-xs">
                      {/* やりたい度 (1〜5 タップ直接変更) */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#003049]/50 mr-0.5">やりたい度:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleDirectChangePriority(wish, lvl)}
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition ${
                                lvl <= wish.priority
                                  ? "bg-[#DDA15E] text-[#003049] shadow-2xs scale-105"
                                  : "bg-[#003049]/5 text-[#003049]/40 hover:bg-[#003049]/10"
                              }`}
                              title={`やりたい度 ${lvl} に変更`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ステータスバッジ（直接変更セレクター） */}
                      <div className="relative">
                        <select
                          value={wish.status}
                          onChange={(e) =>
                            handleDirectChangeStatus(wish, e.target.value as WishStatus)
                          }
                          className={`appearance-none text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition ${statusCfg.badgeClass}`}
                        >
                          <option value="IDEA">思いついた</option>
                          <option value="CANDIDATE">候補</option>
                          <option value="DONE">やった</option>
                          <option value="BEST">最高だった ★</option>
                          <option value="NORMAL">普通だった</option>
                          <option value="SKIPPED">やらなかった</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= 2. 統計ビュー ======================= */}
      {viewMode === "stats" && (
        <div className="flex flex-col gap-6 bg-white/95 p-6 rounded-2xl border border-[#DDA15E]/30 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-[#003049]">コレクションの統計</h3>
            <p className="text-xs text-[#003049]/70 mt-0.5">
              集めたやりたいことの進行状況や、都市・同行者ごとの集計です。
            </p>
          </div>

          {/* 総数とステータスカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#003049]/5 border border-[#003049]/15">
              <span className="text-[11px] font-medium text-[#003049]/70 block">総登録数</span>
              <span className="text-2xl font-bold text-[#003049] mt-0.5 block">
                {stats.total}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#C1121F]/10 border border-[#C1121F]/30">
              <span className="text-[11px] font-bold text-[#C1121F] block">最高だった</span>
              <span className="text-2xl font-bold text-[#C1121F] mt-0.5 block">
                {stats.byStatus.BEST || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#386641]/10 border border-[#386641]/30">
              <span className="text-[11px] font-semibold text-[#386641] block">やった</span>
              <span className="text-2xl font-bold text-[#386641] mt-0.5 block">
                {stats.byStatus.DONE || 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#DDA15E]/15 border border-[#DDA15E]/40">
              <span className="text-[11px] font-semibold text-[#003049] block">候補</span>
              <span className="text-2xl font-bold text-[#003049] mt-0.5 block">
                {stats.byStatus.CANDIDATE || 0}
              </span>
            </div>
          </div>

          {/* ステータス内訳バー */}
          <div>
            <h4 className="text-xs font-bold text-[#003049] mb-2">ステータス内訳</h4>
            <div className="space-y-1.5 text-xs">
              {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => {
                const count = stats.byStatus[stKey] || 0;
                const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={stKey} className="flex items-center gap-2">
                    <span className="w-20 text-[11px] text-[#003049]/80 truncate">{cfg.label}</span>
                    <div className="flex-1 bg-[#FDF0D5] border border-[#DDA15E]/20 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          stKey === "BEST"
                            ? "bg-[#C1121F]"
                            : stKey === "DONE"
                            ? "bg-[#386641]"
                            : stKey === "CANDIDATE"
                            ? "bg-[#DDA15E]"
                            : "bg-[#003049]/40"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-[#003049] text-[11px]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 一番やりたい都市ランキング */}
          <div className="pt-4 border-t border-[#003049]/10">
            <h4 className="text-xs font-bold text-[#003049] mb-2">都市ごとの件数</h4>
            {stats.sortedCities.length === 0 ? (
              <p className="text-xs text-[#003049]/50">データがありません</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {stats.sortedCities.map(([city, count]) => {
                  const percent = (count / stats.total) * 100;
                  return (
                    <div key={city} className="flex items-center gap-2">
                      <span className="w-24 text-[11px] font-medium text-[#003049] truncate">
                        {city}
                      </span>
                      <div className="flex-1 bg-[#FDF0D5] border border-[#DDA15E]/20 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-[#003049]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-medium text-[#003049] text-[11px]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 誰とやるか別 */}
          <div className="pt-4 border-t border-[#003049]/10">
            <h4 className="text-xs font-bold text-[#003049] mb-2">誰とやるか</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byWithWhom).map(([person, count]) => (
                <div
                  key={person}
                  className="px-3 py-1.5 rounded-xl bg-[#FDF0D5]/50 border border-[#DDA15E]/30 text-xs flex items-center gap-2"
                >
                  <span className="text-[#003049]">{person}</span>
                  <span className="font-bold text-[#003049] bg-[#003049]/10 px-1.5 py-0.2 rounded-md text-[11px]">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= 3. 旅行後の振り返りビュー ======================= */}
      {viewMode === "reflection" && (
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#C1121F]/10 border border-[#C1121F]/30">
            <div className="flex items-center gap-2 text-[#C1121F] font-bold text-base mb-1">
              <Heart className="w-5 h-5 text-[#C1121F] fill-[#C1121F]" />
              <span>今回のヨーロッパで好きだったこと</span>
            </div>
            <p className="text-xs text-[#003049]/80 leading-relaxed max-w-xl">
              「最高だった」にマークした体験のコレクションです。旅行中に自分が本当に心動かされた瞬間や、好きだった時間の傾向を振り返ることができます。
            </p>
          </div>

          {bestWishes.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/95 border border-[#DDA15E]/30 rounded-2xl">
              <Heart className="w-8 h-8 text-[#003049]/30 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-[#003049]">
                まだ「最高だった」がありません
              </h3>
              <p className="text-xs text-[#003049]/60 mt-1 max-w-sm mx-auto">
                実際に体験して心に残ったものを、カードのステータスから「最高だった」に変更してみましょう。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* カテゴリ傾向サマリー */}
              <div className="p-4 bg-white/95 rounded-2xl border border-[#DDA15E]/30 text-xs">
                <h4 className="font-bold text-[#003049] mb-2">好きだったジャンルの傾向</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([catKey, cfg]) => {
                    const count = bestWishes.filter((w) => w.category === catKey).length;
                    if (count === 0) return null;
                    return (
                      <span
                        key={catKey}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#C1121F]/15 text-[#C1121F] border border-[#C1121F]/30 font-semibold"
                      >
                        {cfg.icon}
                        {cfg.label}: {count}件
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 最高だったカードグリッド */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {bestWishes.map((wish) => (
                  <div
                    key={wish.id}
                    className="p-5 rounded-2xl bg-white/95 border border-[#C1121F]/40 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#003049]/10 text-[#003049]">
                          <MapPin className="w-3 h-3 text-[#C1121F]" />
                          {wish.city || "どこでも"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C1121F] text-white">
                          ★ 最高だった
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#003049] leading-snug mb-2">
                        {wish.title}
                      </h3>
                      {wish.memo && (
                        <p className="text-xs text-[#003049]/80 bg-[#FDF0D5]/50 border border-[#DDA15E]/20 p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed">
                          {wish.memo}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#003049]/10 flex items-center justify-between text-[11px] text-[#003049]/60">
                      <span>やりたい度: {wish.priority}</span>
                      <button
                        onClick={() => handleOpenEditModal(wish)}
                        className="text-[#003049] hover:text-[#C1121F] underline font-medium"
                      >
                        詳細を編集
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= モーダル: お題から考える ======================= */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003049]/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#DDA15E]/30 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#003049] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#DDA15E]" />
                {currentPrompt.categoryLabel}
              </span>
              <button
                onClick={() => setShowPromptModal(false)}
                className="p-1 rounded-full text-[#003049]/40 hover:text-[#003049]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* お題の質問文 */}
            <div className="py-4">
              <p className="text-lg font-bold text-[#003049] leading-relaxed">
                「{currentPrompt.question}」
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowPromptModal(false);
                  handleOpenAddModal();
                }}
                className="w-full py-3 bg-[#C1121F] hover:bg-[#C1121F]/90 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                このお題でやりたいことを追加
              </button>

              <button
                onClick={() => setCurrentPrompt(getRandomPrompt(currentPrompt.id))}
                className="w-full py-2.5 bg-[#FDF0D5]/60 hover:bg-[#FDF0D5] text-[#003049] border border-[#DDA15E]/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#003049]/70" />
                別のお題を見る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= モーダル: 今日これやりたい ======================= */}
      {showRandomPickModal && pickedWish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003049]/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#DDA15E]/30 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#003049]/10 text-[#003049] flex items-center gap-1">
                <Shuffle className="w-3 h-3 text-[#003049]/70" />
                今日これやりたい
              </span>
              <button
                onClick={() => setShowRandomPickModal(false)}
                className="p-1 rounded-full text-[#003049]/40 hover:text-[#003049]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ピックされたカード */}
            <div className="p-4 rounded-2xl bg-[#FDF0D5]/40 border border-[#DDA15E]/30 my-2">
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="font-semibold text-[#003049] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C1121F]" />
                  {pickedWish.city || "どこでも"}
                </span>
                <span className="text-[#003049]/30">•</span>
                <span className="text-[#003049]/70">やりたい度: {pickedWish.priority}</span>
              </div>
              <h3 className="text-base font-bold text-[#003049] leading-snug">
                {pickedWish.title}
              </h3>
              {pickedWish.memo && (
                <p className="text-xs text-[#003049]/80 mt-2 bg-white/95 p-2 rounded-lg border border-[#DDA15E]/20">
                  {pickedWish.memo}
                </p>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  handleDirectChangeStatus(pickedWish, "DONE");
                  setShowRandomPickModal(false);
                }}
                className="w-full py-2.5 bg-[#386641] hover:bg-[#386641]/90 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                やった！にする
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleTriggerRandomPick}
                  className="py-2.5 bg-[#FDF0D5]/60 hover:bg-[#FDF0D5] text-[#003049] border border-[#DDA15E]/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                  <Shuffle className="w-3.5 h-3.5 text-[#003049]/70" />
                  もう一回
                </button>
                <button
                  onClick={() => {
                    setShowRandomPickModal(false);
                    handleOpenEditModal(pickedWish);
                  }}
                  className="py-2.5 bg-[#003049]/5 hover:bg-[#003049]/10 text-[#003049] rounded-xl text-xs font-semibold transition"
                >
                  詳細を見る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= モーダル: 追加 / 編集 ======================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#003049]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-[#DDA15E]/30 flex flex-col gap-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#003049]">
                {editingWish ? "やりたいことを編集" : "やりたいことを追加"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 rounded-full text-[#003049]/40 hover:text-[#003049]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* やりたいことタイトル */}
            <div>
              <label className="block text-xs font-bold text-[#003049] mb-1">
                やりたいこと <span className="text-[#C1121F]">*</span>
              </label>
              <textarea
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="例: 朝のカフェで1時間ぼーっとする、地元のベーカリーに並ぶ..."
                rows={2}
                className="w-full border border-[#DDA15E]/40 rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#003049] focus:outline-none focus:ring-2 focus:ring-[#DDA15E]"
              />
            </div>

            {/* 都市の選択 */}
            <div>
              <label className="block text-xs font-bold text-[#003049] mb-1.5">
                都市との紐付け
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CITY_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, city: c })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      form.city === c
                        ? "bg-[#003049] text-white"
                        : "bg-[#003049]/5 text-[#003049] hover:bg-[#003049]/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, city: "CUSTOM" })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    form.city === "CUSTOM"
                      ? "bg-[#003049] text-white"
                      : "bg-[#003049]/5 text-[#003049] hover:bg-[#003049]/10"
                  }`}
                >
                  自由入力
                </button>
              </div>
              {form.city === "CUSTOM" && (
                <input
                  type="text"
                  value={form.customCity}
                  onChange={(e) => setForm({ ...form, customCity: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  placeholder="都市名を入力（例: コモ湖）"
                  className="w-full mt-2 border border-[#DDA15E]/40 rounded-xl px-3 py-2 text-xs bg-white text-[#003049] focus:ring-2 focus:ring-[#DDA15E]"
                />
              )}
            </div>

            {/* 誰とやるか（複数選択可） */}
            <div>
              <label className="block text-xs font-bold text-[#003049] mb-1.5">
                誰とやるか（複数選択可）
              </label>
              <div className="flex flex-wrap gap-1.5">
                {/* プリセット選択肢 */}
                {WITH_WHOM_PRESETS.map((p) => {
                  const selected = form.withWhomList.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleWithWhom(p)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition ${
                        selected
                          ? "bg-[#003049] text-white font-semibold"
                          : "bg-[#003049]/5 text-[#003049] hover:bg-[#003049]/10"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {p}
                    </button>
                  );
                })}

                {/* 自由入力で追加されたタグ */}
                {form.withWhomList
                  .filter((item) => !WITH_WHOM_PRESETS.includes(item))
                  .map((customTag) => (
                    <span
                      key={customTag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#003049] text-white shadow-2xs"
                    >
                      <Check className="w-3 h-3" />
                      {customTag}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomWithWhom(customTag)}
                        className="p-0.5 hover:bg-[#003049]/80 rounded text-white/70 hover:text-white transition"
                        title={`${customTag} を削除`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              {/* 自由入力タグ追加 */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={form.customWithWhom}
                  onChange={(e) => setForm({ ...form, customWithWhom: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomWithWhom();
                    }
                  }}
                  placeholder="タグを入力（例: 家族、同僚、現地の人）"
                  className="flex-1 border border-[#DDA15E]/40 rounded-xl px-3 py-1.5 text-xs bg-white text-[#003049] focus:ring-2 focus:ring-[#DDA15E]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomWithWhom}
                  className="px-3.5 py-1.5 bg-[#003049] text-white hover:bg-[#003049]/90 rounded-xl text-xs font-semibold transition"
                >
                  追加
                </button>
              </div>
            </div>

            {/* やりたい度 (1〜5) */}
            <div>
              <label className="block text-xs font-bold text-[#003049] mb-1.5">
                やりたい度: <span className="text-[#DDA15E] font-bold">{form.priority}</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setForm({ ...form, priority: lvl })}
                    className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                      form.priority === lvl
                        ? "bg-[#DDA15E] text-[#003049] ring-2 ring-[#003049] shadow-2xs font-extrabold"
                        : "bg-[#003049]/5 text-[#003049] hover:bg-[#003049]/10"
                    }`}
                  >
                    <span>{lvl}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ステータス */}
            <div>
              <label className="block text-xs font-bold text-[#003049] mb-1.5">
                現在のステータス
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(STATUS_CONFIG).map(([stKey, cfg]) => (
                  <button
                    key={stKey}
                    type="button"
                    onClick={() => setForm({ ...form, status: stKey as WishStatus })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition border ${
                      form.status === stKey
                        ? cfg.activeClass
                        : "bg-[#FDF0D5]/40 border-[#DDA15E]/30 text-[#003049] hover:bg-[#FDF0D5]"
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* カテゴリ選択（振り返り用） */}
            <div>
              <label className="block text-xs font-bold text-[#003049] mb-1.5">
                カテゴリ（振り返り用）
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CATEGORY_CONFIG).map(([catKey, cfg]) => (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setForm({ ...form, category: catKey as WishCategory })}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition ${
                      form.category === catKey
                        ? "bg-[#003049] text-white font-semibold"
                        : "bg-[#003049]/5 text-[#003049] hover:bg-[#003049]/10"
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* メモ */}
            <div>
              <label className="block text-xs font-bold text-[#003049] mb-1">
                メモ
              </label>
              <textarea
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="場所の目安や、具体的な思いつきなど"
                rows={2}
                className="w-full border border-[#DDA15E]/40 rounded-xl px-3 py-2 text-xs bg-white text-[#003049] focus:outline-none focus:ring-2 focus:ring-[#DDA15E]"
              />
            </div>

            {/* 保存ボタン */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#003049]/10">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl text-xs text-[#003049]/70 hover:bg-[#003049]/5 font-medium"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveWish}
                className="px-5 py-2 bg-[#386641] hover:bg-[#386641]/90 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {editingWish ? "更新する" : "登録する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
