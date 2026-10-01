"use client";

import React, { useState, useRef } from "react";
import { PhotoMetadata, PhotoCategory, PHOTO_CATEGORY_LABELS } from "@/types/photo-analysis";
import { PhotoAnalyzer } from "@/lib/photo-analyzer/photo-analyzer-facade";
import MetadataCard from "./MetadataCard";
import {
  UploadCloud,
  Sparkles,
  Scissors,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface PhotoItemState {
  id: string;
  file: File;
  previewUrl: string;
  metadata?: PhotoMetadata;
  error?: string;
  isAnalyzing?: boolean;
  progressStep?: string;
}

export default function PhotoLabView() {
  const [items, setItems] = useState<PhotoItemState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<{ completed: number; total: number; step: string }>({
    completed: 0,
    total: 0,
    step: "",
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const cancelRequestedRef = useRef(false);

  // File Selection
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: PhotoItemState[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setItems((prev) => [...prev, ...newItems]);
  };

  // Run Batch Analysis with Sequential Non-Blocking Queue
  const handleStartAnalysis = async () => {
    if (items.length === 0 || isProcessing) return;

    setIsProcessing(true);
    cancelRequestedRef.current = false;

    const unanalyzed = items.filter((item) => !item.metadata);
    const total = unanalyzed.length;
    let completed = 0;

    setCurrentProgress({ completed: 0, total, step: "準備中..." });

    for (const item of unanalyzed) {
      if (cancelRequestedRef.current) break;

      // Update state to show current item is analyzing
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isAnalyzing: true, progressStep: "AI解析開始..." } : i
        )
      );

      try {
        const metadata = await PhotoAnalyzer.analyze(item.file, {
          enableCutout: true,
          onProgress: (stepMsg) => {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progressStep: stepMsg } : i))
            );
          },
        });

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, metadata, isAnalyzing: false, progressStep: undefined } : i
          )
        );
      } catch (err: any) {
        console.error("Photo analysis failed for item:", item.file.name, err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, error: err.message || "解析エラー", isAnalyzing: false, progressStep: undefined }
              : i
          )
        );
      }

      completed++;
      setCurrentProgress({ completed, total, step: `${completed} / ${total} 完了` });

      // Yield control briefly to ensure smooth 60fps UI updates
      await new Promise((r) => setTimeout(r, 40));
    }

    setIsProcessing(false);
  };

  const handleCancel = () => {
    cancelRequestedRef.current = true;
    setIsProcessing(false);
  };

  const handleClearAll = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  };

  // Filter items by category
  const filteredItems = items.filter((item) => {
    if (selectedCategoryFilter === "ALL") return true;
    if (selectedCategoryFilter === "cutout_only") return !!item.metadata?.cutout?.hasSubject;
    return item.metadata?.primaryCategory === selectedCategoryFilter;
  });

  const analyzedCount = items.filter((i) => !!i.metadata).length;
  const cutoutCount = items.filter((i) => !!i.metadata?.cutout?.hasSubject).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Explaining Local On-Device AI */}
      <div className="bg-gradient-to-r from-[#003049] to-[#1C2541] rounded-3xl p-5 sm:p-7 text-[#FDF0D5] shadow-md border border-[#DDA15E]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">🔬</span>
            <h1 className="text-lg sm:text-2xl font-black text-white">
              Google MediaPipe AI 写真解析ラボ
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#386641] text-white text-[10px] font-bold border border-white/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#DDA15E]" />
              完全オンデバイス・オフライン
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#FDF0D5]/80 max-w-2xl leading-relaxed">
            写真を外部サーバーに送信せず、Google MediaPipe (WebAssembly) が端末内だけで人物・被写体の自動切り抜きや14カテゴリの旅行写真分類を行います。
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#DDA15E]" />
            <span>通信量 0GB</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-[#DDA15E]" />
            <span>自動切り抜き</span>
          </div>
        </div>
      </div>

      {/* Upload & Action Bar */}
      <div className="bg-white/95 rounded-3xl p-4 sm:p-6 border border-[#DDA15E]/40 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* File Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 px-5 py-2.5 bg-[#C1121F] hover:bg-[#a50f1a] text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95">
              <UploadCloud className="w-4 h-4" />
              <span>写真を選択する（複数枚可）</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                disabled={isProcessing}
                onChange={(e) => {
                  handleFilesAdded(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            {items.length > 0 && !isProcessing && (
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#386641] hover:bg-[#2b4f32] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs active:scale-95"
              >
                <Play className="w-4 h-4 text-[#DDA15E]" />
                <span>AI解析を開始 ({items.filter((i) => !i.metadata).length}枚)</span>
              </button>
            )}

            {isProcessing && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>キャンセル</span>
              </button>
            )}

            {items.length > 0 && !isProcessing && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-semibold text-[#386641]/60 hover:text-[#C1121F] px-2 py-1 transition"
              >
                クリア
              </button>
            )}
          </div>

          {/* Quick Stats */}
          {items.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-[#386641] font-semibold bg-[#FDF0D5]/50 px-3 py-1.5 rounded-xl border border-[#DDA15E]/30">
              <span>全 {items.length} 枚</span>
              <span>•</span>
              <span className="text-[#386641]">解析済 {analyzedCount} 枚</span>
              <span>•</span>
              <span className="text-[#C1121F]">切り抜き成功 {cutoutCount} 枚</span>
            </div>
          )}
        </div>

        {/* Progress Bar (Visible during processing) */}
        {isProcessing && (
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#003049]/5 border border-[#003049]/10">
            <div className="flex items-center justify-between text-xs font-bold text-[#003049]">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#003049] animate-spin" />
                <span>MediaPipe WASM 順次解析中...</span>
              </span>
              <span>
                {currentProgress.completed} / {currentProgress.total} 枚 ({Math.round((currentProgress.completed / (currentProgress.total || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#386641] to-[#DDA15E] transition-all duration-200"
                style={{
                  width: `${Math.round((currentProgress.completed / (currentProgress.total || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Category Filters Bar */}
        {items.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-[#386641]/10 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedCategoryFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategoryFilter === "ALL"
                  ? "bg-[#386641] text-white shadow-xs"
                  : "bg-[#386641]/10 text-[#386641] hover:bg-[#386641]/20"
              }`}
            >
              すべて ({items.length})
            </button>

            <button
              onClick={() => setSelectedCategoryFilter("cutout_only")}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
                selectedCategoryFilter === "cutout_only"
                  ? "bg-[#C1121F] text-white shadow-xs"
                  : "bg-[#C1121F]/10 text-[#C1121F] hover:bg-[#C1121F]/20"
              }`}
            >
              <span>✂️ 切り抜きあり</span>
              <span>({cutoutCount})</span>
            </button>

            {Object.entries(PHOTO_CATEGORY_LABELS).map(([catKey, info]) => {
              const count = items.filter((i) => i.metadata?.primaryCategory === catKey).length;
              if (count === 0) return null;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategoryFilter(catKey)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
                    selectedCategoryFilter === catKey
                      ? "bg-[#386641] text-white shadow-xs"
                      : "bg-[#386641]/10 text-[#386641] hover:bg-[#386641]/20"
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Photo Cards */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-20 border-2 border-dashed border-[#DDA15E]/50 rounded-3xl bg-white/70 text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#DDA15E]/20 text-[#386641] flex items-center justify-center shadow-inner">
            <Sparkles className="w-8 h-8 text-[#C1121F]" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-[#386641]">
              旅行写真をアップロードしてMediaPipe AI解析を試してみよう
            </h2>
            <p className="text-xs sm:text-sm text-[#386641]/70 max-w-md mt-1 leading-relaxed">
              人物写真を選ぶと背景を自動で切り抜いた透過ステッカーが生成され、料理・景色・乗り物・建物など14カテゴリへ自動分類されます。
            </p>
          </div>
          <label className="px-6 py-3 bg-[#C1121F] hover:bg-[#a50f1a] text-white text-xs sm:text-sm font-bold rounded-2xl cursor-pointer shadow-md transition active:scale-95">
            写真を選択して試す
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleFilesAdded(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <MetadataCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
