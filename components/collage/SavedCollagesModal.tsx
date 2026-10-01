"use client";

import React, { useState } from "react";
import { SavedCollage } from "@/types/collage";
import { X, Trash2, Calendar, Eye, Download, Edit3, ArrowLeft, Sparkles, Image as ImageIcon } from "lucide-react";

interface SavedCollagesModalProps {
  collages: SavedCollage[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onReEdit: (collage: SavedCollage) => void;
}

export default function SavedCollagesModal({
  collages,
  onClose,
  onDelete,
  onReEdit,
}: SavedCollagesModalProps) {
  const [selectedCollage, setSelectedCollage] = useState<SavedCollage | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 bg-[#386641]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DDA15E]/30 animate-in zoom-in-95 duration-200">
        
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
              </div>

              {/* Detail Info Badges */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-[#386641]/80">
                <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-[#DDA15E]/30 shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-[#386641]/60" />
                  {new Date(selectedCollage.createdAt).toLocaleDateString()} {new Date(selectedCollage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
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
            <div className="flex items-center justify-between pb-4 border-b border-[#386641]/10 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <h2 className="text-lg font-bold text-[#386641]">
                  保存済みコラージュ ({collages.length})
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#386641]/10 text-[#386641]/70 transition"
                title="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 pr-1">
              {collages.length === 0 ? (
                <div className="text-center py-12 text-[#386641]/50">
                  <p className="text-4xl mb-3">🖼️</p>
                  <p className="font-bold text-sm">保存されたコラージュはありません</p>
                  <p className="text-xs mt-1 text-[#386641]/40">
                    写真を選んで「💾 保存」するとここにストックされます
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {collages.map((c) => (
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
                        {c.savedPhotos && c.savedPhotos.length > 0 && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#386641]/90 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-[#DDA15E]" />
                            {c.savedPhotos.length}枚
                          </div>
                        )}

                        <div className="absolute inset-0 bg-[#386641]/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-white text-[#386641] text-xs font-bold shadow-md flex items-center gap-1 hover:bg-[#FDF0D5]"
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
                          <span className="truncate">{c.customTitle || new Date(c.createdAt).toLocaleDateString()}</span>
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
            <div className="mt-4 pt-3 border-t border-[#386641]/10 flex justify-end">
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
  );
}
