"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SavedCollage } from "@/types/collage";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
  Edit3,
  Download,
} from "lucide-react";

interface TravelBookViewerProps {
  collages: SavedCollage[];
  initialIndex?: number;
  onClose: () => void;
  onReEdit?: (collage: SavedCollage) => void;
  tripTitle?: string;
}

export default function TravelBookViewer({
  collages,
  initialIndex = 0,
  onClose,
  onReEdit,
  tripTitle,
}: TravelBookViewerProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Filter or sort collages chronologically if possible
  const totalPages = collages.length;
  const currentCollage = collages[currentIndex] || null;

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  }, [totalPages]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "ArrowRight") goToNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext, onClose]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      goToNext();
    } else if (diff < -50) {
      goToPrev();
    }
    setTouchStartX(null);
  };

  if (!currentCollage || totalPages === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1C2541]/95 backdrop-blur-md flex flex-col justify-between text-[#FDF0D5] animate-in fade-in duration-200 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#DDA15E]" />
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-md">
              {tripTitle ? `${tripTitle} - トラベルブック` : "旅のスクラップブック"}
            </h2>
            <p className="text-[10px] sm:text-xs text-[#FDF0D5]/60">
              左右にスワイプまたは矢印でページをめくれます
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/10">
            Page {currentIndex + 1} / {totalPages}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            title="閉じる"
            aria-label="閉じる"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Book Page View */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Left Arrow Button */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrev}
            className="absolute left-2 sm:left-6 z-10 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition active:scale-95 shadow-lg backdrop-blur-xs"
            title="前のページ (←)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* The Album Page */}
        <div className="relative max-h-[75vh] max-w-[90vw] sm:max-w-[70vw] flex flex-col items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-black/20 flex items-center justify-center">
            <img
              src={currentCollage.thumbnail}
              alt={currentCollage.customTitle || `Page ${currentIndex + 1}`}
              className="max-h-[68vh] sm:max-h-[72vh] w-auto object-contain"
            />

            {/* City Tag Badge on Image */}
            {currentCollage.cityName && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C2541]/85 backdrop-blur-md text-white text-xs font-bold shadow-md border border-white/20">
                <span>{currentCollage.cityFlag || "📍"}</span>
                <span>{currentCollage.cityName}</span>
              </div>
            )}
          </div>

          {/* Page Caption & Metadata */}
          <div className="mt-3 flex items-center justify-between w-full px-2 text-xs text-[#FDF0D5]/80 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {currentCollage.customTitle || "無題のコラージュ"}
              </span>
              {currentCollage.visitDate && (
                <span className="flex items-center gap-1 text-[11px] text-[#FDF0D5]/60">
                  <Calendar className="w-3 h-3" />
                  {currentCollage.visitDate}
                </span>
              )}
            </div>

            {currentCollage.savedPhotos && currentCollage.savedPhotos.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-[#DDA15E]">
                <Sparkles className="w-3 h-3" />
                {currentCollage.savedPhotos.length}枚の写真
              </span>
            )}
          </div>
        </div>

        {/* Right Arrow Button */}
        {currentIndex < totalPages - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-6 z-10 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition active:scale-95 shadow-lg backdrop-blur-xs"
            title="次のページ (→)"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="px-4 py-3 sm:px-8 sm:py-4 border-t border-white/10 flex items-center justify-between gap-2 shrink-0 bg-[#0B132B]/80 backdrop-blur-md">
        <div className="text-xs text-[#FDF0D5]/50 hidden sm:block">
          キーボードの [←] [→] キーでも操作できます
        </div>

        {/* Thumbnail Dots Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50vw] py-1">
          {collages.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-6 bg-[#DDA15E]"
                  : "w-2 bg-white/30 hover:bg-white/60"
              }`}
              title={`Page ${idx + 1}`}
            />
          ))}
        </div>

        {/* Actions for current collage */}
        <div className="flex items-center gap-2">
          {onReEdit && currentCollage.savedPhotos && currentCollage.savedPhotos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onReEdit(currentCollage);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#386641] hover:bg-[#4a8556] text-white text-xs font-bold transition shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>スタジオで再編集</span>
            </button>
          )}

          <a
            href={currentCollage.thumbnail}
            download={`travel-book-page-${currentIndex + 1}.png`}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="画像をダウンロード"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
