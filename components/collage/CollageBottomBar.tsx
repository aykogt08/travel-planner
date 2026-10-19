// components/collage/CollageBottomBar.tsx
"use client";

import React from "react";
import {
  ImagePlus,
  Sticker,
  Layers,
  Ratio,
  Download,
  Trash2,
  BringToFront,
  RotateCcw,
  Check,
  ClipboardPaste,
  Sparkles,
} from "lucide-react";
import { FreeformSticker } from "@/types/collage";

interface CollageBottomBarProps {
  onAddPhotosClick: () => void;
  onAddStickerClick: () => void;
  onPasteFromClipboard: () => void;
  onNextLayout: () => void;
  onToggleAspectRatio: () => void;
  currentAspect: "4:5" | "9:16" | "1:1";
  onSaveCollage: () => void;
  isSaving?: boolean;
  selectedSticker: FreeformSticker | null;
  onDeleteSticker: (stickerId: string) => void;
  onBringStickerToFront: (stickerId: string) => void;
  onResetStickerRotation: (stickerId: string) => void;
  onDeselectSticker: () => void;
  isDynamicMosaic?: boolean;
  onToggleDynamicMosaic?: () => void;
  totalPhotosCount: number;
}

export const CollageBottomBar: React.FC<CollageBottomBarProps> = ({
  onAddPhotosClick,
  onAddStickerClick,
  onPasteFromClipboard,
  onNextLayout,
  onToggleAspectRatio,
  currentAspect,
  onSaveCollage,
  isSaving = false,
  selectedSticker,
  onDeleteSticker,
  onBringStickerToFront,
  onResetStickerRotation,
  onDeselectSticker,
  isDynamicMosaic = false,
  onToggleDynamicMosaic,
  totalPhotosCount,
}) => {
  // If a sticker is currently selected, show the sticker action bar
  if (selectedSticker) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 dark:bg-black/95 text-white backdrop-blur-md border-t border-stone-800 px-4 py-2 pb-safe shadow-2xl transition-all animate-in slide-in-from-bottom duration-200">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400">
            <Sticker className="w-4 h-4 text-amber-400" />
            <span>ステッカー編集中</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bring to Front */}
            <button
              onClick={() => onBringStickerToFront(selectedSticker.id)}
              className="flex items-center justify-center p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 text-xs gap-1 min-h-[44px] min-w-[44px] transition-all"
              title="最前面に移動"
            >
              <BringToFront className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">前面へ</span>
            </button>

            {/* Reset Rotation */}
            <button
              onClick={() => onResetStickerRotation(selectedSticker.id)}
              className="flex items-center justify-center p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 text-xs gap-1 min-h-[44px] min-w-[44px] transition-all"
              title="回転角度をリセット"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">回転リセット</span>
            </button>

            {/* Delete Sticker */}
            <button
              onClick={() => onDeleteSticker(selectedSticker.id)}
              className="flex items-center justify-center p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-xs gap-1 min-h-[44px] min-w-[44px] transition-all"
              title="ステッカーを削除"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">削除</span>
            </button>

            {/* Done / Deselect */}
            <button
              onClick={onDeselectSticker}
              className="flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs gap-1 min-h-[44px] transition-all"
            >
              <Check className="w-4 h-4" />
              <span>完了</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Action Bar
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-3 py-2 pb-safe shadow-lg transition-all">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {/* Add Photo */}
        <button
          onClick={onAddPhotosClick}
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 min-h-[46px] transition-colors"
          title="写真を追加"
        >
          <ImagePlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-0.5" />
          <span className="text-[10px] sm:text-xs font-medium">写真追加</span>
        </button>

        {/* Add Sticker (Sticker picker or paste) */}
        <button
          onClick={onAddStickerClick}
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 min-h-[46px] transition-colors"
          title="ステッカーを追加"
        >
          <Sticker className="w-5 h-5 text-amber-500 mb-0.5" />
          <span className="text-[10px] sm:text-xs font-medium">ステッカー</span>
        </button>

        {/* Clipboard Paste Quick Button - Highlighted for thumb operation */}
        <button
          onClick={onPasteFromClipboard}
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/60 active:scale-95 min-h-[46px] transition-all font-bold shadow-2xs"
          title="コピーしたステッカーをワンタップで貼る"
        >
          <ClipboardPaste className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-0.5" />
          <span className="text-[10px] sm:text-xs">貼る</span>
        </button>


        {/* Dynamic Mosaic / Next Layout */}
        {totalPhotosCount >= 7 && onToggleDynamicMosaic ? (
          <button
            onClick={onToggleDynamicMosaic}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl active:scale-95 min-h-[46px] transition-colors ${
              isDynamicMosaic
                ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold"
                : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
            title="7枚以上のスマートモザイク切替"
          >
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-0.5" />
            <span className="text-[10px] sm:text-xs font-medium">モザイク</span>
          </button>
        ) : (
          <button
            onClick={onNextLayout}
            className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 min-h-[46px] transition-colors"
            title="レイアウトを変更"
          >
            <Layers className="w-5 h-5 text-stone-600 dark:text-stone-400 mb-0.5" />
            <span className="text-[10px] sm:text-xs font-medium">切替</span>
          </button>
        )}

        {/* Aspect Ratio */}
        <button
          onClick={onToggleAspectRatio}
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 min-h-[46px] transition-colors"
          title="比率を変更"
        >
          <Ratio className="w-5 h-5 text-stone-600 dark:text-stone-400 mb-0.5" />
          <span className="text-[10px] sm:text-xs font-medium">{currentAspect}</span>
        </button>

        {/* Save / Export */}
        <button
          onClick={onSaveCollage}
          disabled={isSaving}
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 active:scale-95 min-h-[46px] font-medium shadow-sm transition-all disabled:opacity-50"
          title="コラージュを保存"
        >
          <Download className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] sm:text-xs">{isSaving ? "保存中" : "保存"}</span>
        </button>
      </div>
    </div>
  );
};
