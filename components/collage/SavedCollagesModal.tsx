"use client";

import React from "react";
import { SavedCollage } from "@/types/collage";
import { X, Trash2, Calendar, Eye, Download } from "lucide-react";

interface SavedCollagesModalProps {
  collages: SavedCollage[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onSelect: (collage: SavedCollage) => void;
}

export default function SavedCollagesModal({
  collages,
  onClose,
  onDelete,
  onSelect,
}: SavedCollagesModalProps) {
  const handleDownload = (collage: SavedCollage, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.download = `marcaderno-collage-${new Date(collage.createdAt).toISOString().slice(0, 10)}.png`;
    link.href = collage.thumbnail;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#386641]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#DDA15E]/30 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#386641]/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📁</span>
            <h2 className="text-lg font-bold text-[#386641]">
              保存済みコラージュ ({collages.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#386641]/10 text-[#386641]/70 transition"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {collages.map((c) => (
                <div
                  key={c.id}
                  className="group relative rounded-2xl overflow-hidden border border-[#DDA15E]/40 bg-[#FDF0D5]/30 hover:shadow-md transition flex flex-col cursor-pointer"
                  onClick={() => onSelect(c)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/5] w-full bg-[#386641]/5 overflow-hidden flex items-center justify-center relative">
                    <img
                      src={c.thumbnail}
                      alt="Collage thumbnail"
                      className="w-full h-full object-contain group-hover:scale-102 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-[#386641]/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-white text-[#386641] text-xs font-bold shadow-md flex items-center gap-1"
                        onClick={() => onSelect(c)}
                      >
                        <Eye className="w-3.5 h-3.5" /> 開く
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-xl bg-white text-[#386641] hover:text-[#C1121F] shadow-md"
                        onClick={(e) => handleDownload(c, e)}
                        title="画像をダウンロード"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="p-2.5 flex items-center justify-between gap-1 text-[11px] bg-white/80 border-t border-[#DDA15E]/20">
                    <div className="flex items-center gap-1 text-[#386641]/70 truncate">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("このコラージュを削除してもよろしいですか？")) {
                          onDelete(c.id);
                        }
                      }}
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
      </div>
    </div>
  );
}
