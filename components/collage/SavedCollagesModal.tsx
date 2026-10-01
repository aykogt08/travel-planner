"use client";

import React, { useState, useMemo } from "react";
import { SavedCollage } from "@/types/collage";
import {
  X,
  Trash2,
  Calendar,
  Eye,
  Download,
  Edit3,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  BookOpen,
  MapPin,
  WifiOff,
  CheckCircle2,
} from "lucide-react";
import TravelBookViewer from "./TravelBookViewer";

interface SavedCollagesModalProps {
  collages: SavedCollage[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onReEdit: (collage: SavedCollage) => void;
  tripTitle?: string;
}

export default function SavedCollagesModal({
  collages,
  onClose,
  onDelete,
  onReEdit,
  tripTitle,
}: SavedCollagesModalProps) {
  const [selectedCollage, setSelectedCollage] = useState<SavedCollage | null>(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("ALL");
  const [isBookViewerOpen, setIsBookViewerOpen] = useState(false);
  const [bookInitialIndex, setBookInitialIndex] = useState(0);

  // Distinct cities from collages
  const availableCities = useMemo(() => {
    const map = new Map<string, { name: string; flag?: string }>();
    collages.forEach((c) => {
      if (c.cityName) {
        map.set(c.cityName, { name: c.cityName, flag: c.cityFlag });
      }
    });
    return Array.from(map.values());
  }, [collages]);

  // Filtered and sorted collages
  const filteredCollages = useMemo(() => {
    let list = [...collages];
    if (selectedCityFilter !== "ALL") {
      list = list.filter((c) => c.cityName === selectedCityFilter);
    }
    // Sort chronologically (visitDate or createdAt)
    list.sort((a, b) => {
      const dateA = a.visitDate || a.createdAt;
      const dateB = b.visitDate || b.createdAt;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    return list;
  }, [collages, selectedCityFilter]);

  const handleDownload = async (collage: SavedCollage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(collage.thumbnail);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `marcaderno-collage-${new Date(collage.createdAt).toISOString().slice(0, 10)}.png`,
        { type: "image/png" }
      );

      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Marcaderno コラージュ",
        });
        return;
      }

      const link = document.createElement("a");
      link.download = `marcaderno-collage-${new Date(collage.createdAt).toISOString().slice(0, 10)}.png`;
      link.href = collage.thumbnail;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        window.open(collage.thumbnail);
      }
    }
  };

  const handleDeleteCollage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("このコラージュを削除してもよろしいですか？")) {
      onDelete(id);
      if (selectedCollage?.id === id) {
        setSelectedCollage(null);
      }
    }
  };

  const handleOpenBookViewer = (startIndex = 0) => {
    setBookInitialIndex(startIndex);
    setIsBookViewerOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#386641]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white/95 rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DDA15E]/30 animate-in zoom-in-95 duration-200">
          
          {/* --- DETAIL / LIGHTBOX VIEW --- */}
          {selectedCollage ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Detail Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#386641]/10 mb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCollage(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#386641] hover:text-[#606C38] px-2.5 py-1.5 rounded-xl hover:bg-[#386641]/10 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>一覧に戻る</span>
                </button>
                <div className="text-center font-bold text-sm text-[#386641] truncate max-w-[200px]">
                  {selectedCollage.customTitle || "コラージュ詳細"}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-[#386641]/10 text-[#386641]/70 transition"
                  title="閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detail Body (Image Preview) */}
              <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-2 bg-[#FDF0D5]/20 rounded-2xl border border-[#DDA15E]/20">
                <div className="relative group max-h-[50vh] sm:max-h-[55vh] flex items-center justify-center">
                  <img
                    src={selectedCollage.thumbnail}
                    alt="Collage Large Preview"
                    className="max-h-[50vh] sm:max-h-[55vh] w-auto object-contain rounded-xl shadow-lg border border-[#DDA15E]/30"
                  />
                  {/* City tag on detail image */}
                  {selectedCollage.cityName && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1C2541]/80 backdrop-blur-xs text-white text-xs font-bold shadow-md">
                      <span>{selectedCollage.cityFlag || "📍"}</span>
                      <span>{selectedCollage.cityName}</span>
                    </div>
                  )}
                </div>

                {/* Detail Info Badges */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-[#386641]/80">
                  <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-[#DDA15E]/30 shadow-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#386641]/60" />
                    {selectedCollage.visitDate || new Date(selectedCollage.createdAt).toLocaleDateString()}
                  </span>

                  {selectedCollage.syncStatus === "pending_sync" ? (
                    <span className="flex items-center gap-1 bg-[#DDA15E]/30 text-[#003049] font-bold px-2.5 py-1 rounded-full">
                      <WifiOff className="w-3.5 h-3.5 text-[#C1121F]" />
                      オフライン保存 (未同期)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-[#386641]/10 text-[#386641] font-bold px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#386641]" />
                      保存済み
                    </span>
                  )}

                  {selectedCollage.savedPhotos && selectedCollage.savedPhotos.length > 0 ? (
                    <span className="flex items-center gap-1 bg-[#386641]/10 text-[#386641] font-bold px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-[#DDA15E]" />
                      {selectedCollage.savedPhotos.length}枚の写真を保持（再編集可能）
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-[#DDA15E]/20 text-[#606C38] px-2.5 py-1 rounded-full">
                      <ImageIcon className="w-3.5 h-3.5" />
                      画像として保存済み
                    </span>
                  )}
                </div>
              </div>

              {/* Detail Actions Footer */}
              <div className="mt-4 pt-3 border-t border-[#386641]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteCollage(selectedCollage.id)}
                  className="px-3 py-2 text-xs font-bold text-[#C1121F] hover:bg-[#C1121F]/10 rounded-xl transition flex items-center justify-center gap-1 order-last sm:order-first"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>

                <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const idx = filteredCollages.findIndex((c) => c.id === selectedCollage.id);
                      handleOpenBookViewer(idx >= 0 ? idx : 0);
                    }}
                    className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-[#003049] hover:bg-[#002233] text-[#FDF0D5] transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <BookOpen className="w-4 h-4 text-[#DDA15E]" />
                    <span>ブックで見る</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(selectedCollage)}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-xl border border-[#386641]/30 text-[#386641] hover:bg-[#386641]/10 transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    保存 / 共有
                  </button>
                  <button
                    type="button"
                    onClick={() => onReEdit(selectedCollage)}
                    className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#386641] to-[#606C38] text-white hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-98"
                  >
                    <Edit3 className="w-4 h-4" />
                    スタジオで再編集
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* --- LIST / GRID VIEW --- */
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#386641]/10 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📁</span>
                  <h2 className="text-base sm:text-lg font-bold text-[#386641]">
                    保存済みコラージュ ({collages.length})
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {collages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenBookViewer(0)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#003049] to-[#1C2541] text-[#FDF0D5] text-xs font-bold hover:opacity-95 transition shadow-xs"
                    >
                      <BookOpen className="w-4 h-4 text-[#DDA15E]" />
                      <span>📖 ブックで振り返る</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-[#386641]/10 text-[#386641]/70 transition"
                    title="閉じる"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* City Filter Tabs (if multiple cities exist) */}
              {availableCities.length > 0 && (
                <div className="flex items-center gap-1.5 pb-3 overflow-x-auto scrollbar-none shrink-0">
                  <button
                    onClick={() => setSelectedCityFilter("ALL")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCityFilter === "ALL"
                        ? "bg-[#386641] text-white shadow-xs"
                        : "bg-[#386641]/10 text-[#386641] hover:bg-[#386641]/20"
                    }`}
                  >
                    すべて ({collages.length})
                  </button>
                  {availableCities.map((city) => {
                    const count = collages.filter((c) => c.cityName === city.name).length;
                    return (
                      <button
                        key={city.name}
                        onClick={() => setSelectedCityFilter(city.name)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
                          selectedCityFilter === city.name
                            ? "bg-[#386641] text-white shadow-xs"
                            : "bg-[#386641]/10 text-[#386641] hover:bg-[#386641]/20"
                        }`}
                      >
                        <span>{city.flag || "📍"}</span>
                        <span>{city.name}</span>
                        <span className="text-[10px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Content Grid */}
              <div className="overflow-y-auto flex-1 pr-1">
                {filteredCollages.length === 0 ? (
                  <div className="text-center py-12 text-[#386641]/50">
                    <p className="text-4xl mb-3">🖼️</p>
                    <p className="font-bold text-sm">
                      {selectedCityFilter === "ALL"
                        ? "保存されたコラージュはありません"
                        : "該当する都市のコラージュはありません"}
                    </p>
                    <p className="text-xs mt-1 text-[#386641]/40">
                      写真を選んで「💾 保存」するとここにストックされます
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {filteredCollages.map((c, idx) => (
                      <div
                        key={c.id}
                        className="group relative rounded-2xl overflow-hidden border border-[#DDA15E]/40 bg-[#FDF0D5]/30 hover:shadow-md transition flex flex-col cursor-pointer hover:border-[#386641]/50"
                        onClick={() => setSelectedCollage(c)}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-[4/5] w-full bg-[#386641]/5 overflow-hidden flex items-center justify-center relative">
                          <img
                            src={c.thumbnail}
                            alt="Collage thumbnail"
                            className="w-full h-full object-contain group-hover:scale-102 transition duration-200"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {c.cityName && (
                              <div className="px-2 py-0.5 rounded-md bg-[#1C2541]/90 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                                <span>{c.cityFlag || "📍"}</span>
                                <span className="truncate max-w-[80px]">{c.cityName}</span>
                              </div>
                            )}
                            {c.syncStatus === "pending_sync" && (
                              <div className="px-2 py-0.5 rounded-md bg-[#C1121F]/90 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                                <WifiOff className="w-2.5 h-2.5" />
                                未同期
                              </div>
                            )}
                          </div>

                          {c.savedPhotos && c.savedPhotos.length > 0 && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#386641]/90 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-[#DDA15E]" />
                              {c.savedPhotos.length}
                            </div>
                          )}

                          <div className="absolute inset-0 bg-[#386641]/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="px-2.5 py-1.5 rounded-xl bg-white text-[#386641] text-xs font-bold shadow-md flex items-center gap-1 hover:bg-[#FDF0D5]"
                              onClick={() => setSelectedCollage(c)}
                            >
                              <Eye className="w-3.5 h-3.5" /> 拡大
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-xl bg-white text-[#386641] hover:text-[#C1121F] shadow-md"
                              onClick={(e) => handleDownload(c, e)}
                              title="画像を保存 / 共有"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Metadata & Actions */}
                        <div className="p-2.5 flex items-center justify-between gap-1 text-[11px] bg-white/90 border-t border-[#DDA15E]/20">
                          <div className="flex items-center gap-1 text-[#386641]/80 truncate">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {c.customTitle || c.visitDate || new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCollage(c.id, e)}
                            className="text-[#386641]/40 hover:text-[#C1121F] p-1 transition"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-[#386641]/10 flex items-center justify-between">
                <span className="text-xs text-[#386641]/60">
                  {filteredCollages.length} 件表示中
                </span>
                <button
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#386641]/10 text-[#386641] hover:bg-[#386641]/20 transition"
                >
                  閉じる
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Book Viewer */}
      {isBookViewerOpen && (
        <TravelBookViewer
          collages={filteredCollages}
          initialIndex={bookInitialIndex}
          onClose={() => setIsBookViewerOpen(false)}
          onReEdit={onReEdit}
          tripTitle={tripTitle}
        />
      )}
    </>
  );
}
