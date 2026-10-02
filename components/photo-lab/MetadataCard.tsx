"use client";

import React, { useState } from "react";
import { PhotoMetadata, PHOTO_CATEGORY_LABELS } from "@/types/photo-analysis";
import {
  Download,
  Copy,
  Check,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  RefreshCw,
} from "lucide-react";

interface MetadataCardProps {
  item: {
    file: File;
    previewUrl: string;
    metadata?: PhotoMetadata;
    error?: string;
    isAnalyzing?: boolean;
    progressStep?: string;
  };
}

export default function MetadataCard({ item }: MetadataCardProps) {
  const [activeTab, setActiveTab] = useState<"cutout" | "original" | "details">("cutout");
  const [isCopied, setIsCopied] = useState(false);
  const [useInvertedCutout, setUseInvertedCutout] = useState(false);

  const { file, previewUrl, metadata, error, isAnalyzing, progressStep } = item;

  const currentCutoutUrl = useInvertedCutout && metadata?.cutout?.invertedCutoutDataUrl
    ? metadata.cutout.invertedCutoutDataUrl
    : metadata?.cutout?.cutoutDataUrl;

  const handleDownloadCutout = () => {
    if (!currentCutoutUrl) return;
    const a = document.createElement("a");
    a.href = currentCutoutUrl;
    a.download = `cutout_${metadata?.fileName.replace(/\.[^/.]+$/, "") || "subject"}${useInvertedCutout ? "_inv" : ""}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyCutout = async () => {
    if (!currentCutoutUrl || !navigator.clipboard?.write) return;
    try {
      const res = await fetch(currentCutoutUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      alert("クリップボードへのコピーに失敗しました。ダウンロードをご利用ください。");
    }
  };

  const handleToggleInvert = () => {
    setUseInvertedCutout((prev) => !prev);
  };

  const catInfo = metadata
    ? PHOTO_CATEGORY_LABELS[metadata.primaryCategory] || PHOTO_CATEGORY_LABELS.other
    : null;

  return (
    <div className="bg-white/95 rounded-3xl border border-[#DDA15E]/40 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
      {/* Header with Category Badge & Status */}
      <div className="p-3.5 border-b border-[#386641]/10 flex items-center justify-between gap-2 bg-[#FDF0D5]/30">
        <div className="flex items-center gap-2 min-w-0">
          {catInfo ? (
            <span className="px-2.5 py-1 rounded-xl bg-[#386641] text-white text-xs font-bold flex items-center gap-1 shadow-2xs">
              <span>{catInfo.icon}</span>
              <span>{catInfo.label}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-[#003049]/10 text-[#003049] text-xs font-bold">
              未解析
            </span>
          )}

          <span className="text-xs font-semibold text-[#386641] truncate max-w-[150px] sm:max-w-[200px]" title={file.name}>
            {file.name}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#386641]/70 shrink-0">
          <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>

      {/* Main Image Display Area with Tabs */}
      <div className="relative aspect-[4/3] bg-radial from-[#FDF0D5]/50 to-[#386641]/5 flex items-center justify-center p-2 overflow-hidden group">
        {/* Checkerboard background for transparent PNG cutout */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `linear-gradient(45deg, #386641 25%, transparent 25%), linear-gradient(-45deg, #386641 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #386641 75%), linear-gradient(-45deg, transparent 75%, #386641 75%)`,
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
          }}
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center z-10 p-4">
            <div className="w-8 h-8 rounded-full border-3 border-[#386641] border-t-transparent animate-spin" />
            <span className="text-xs font-bold text-[#386641] animate-pulse">
              {progressStep || "MediaPipe AIで解析中..."}
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-1 text-center text-[#C1121F] p-4 z-10">
            <Info className="w-6 h-6" />
            <span className="text-xs font-bold">解析に失敗しました</span>
            <span className="text-[10px] text-[#C1121F]/70">{error}</span>
          </div>
        ) : activeTab === "cutout" && currentCutoutUrl ? (
          <img
            src={currentCutoutUrl}
            alt="AI Cutout Subject"
            className="w-full h-full object-contain relative z-10 transition-transform group-hover:scale-102"
          />
        ) : (
          <img
            src={previewUrl}
            alt="Original Photo"
            className="w-full h-full object-contain relative z-10"
          />
        )}

        {/* View Switcher Overlay on Bottom */}
        {metadata && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs p-0.5 rounded-xl border border-[#DDA15E]/40 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab("cutout")}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                  activeTab === "cutout"
                    ? "bg-[#C1121F] text-white"
                    : "text-[#386641] hover:bg-[#FDF0D5]"
                }`}
              >
                ✂️ 切り抜き
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("original")}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                  activeTab === "original"
                    ? "bg-[#386641] text-white"
                    : "text-[#386641] hover:bg-[#FDF0D5]"
                }`}
              >
                元画像
              </button>
            </div>

            {/* Cutout quick actions */}
            {metadata.cutout?.cutoutDataUrl && (
              <div className="flex items-center gap-1">
                {/* Invert mask button */}
                {metadata.cutout.invertedCutoutDataUrl && activeTab === "cutout" && (
                  <button
                    type="button"
                    onClick={handleToggleInvert}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition shadow-xs ${
                      useInvertedCutout
                        ? "bg-[#003049] text-white"
                        : "bg-white/90 text-[#386641] hover:bg-white"
                    }`}
                    title="背景と人物の切り抜きを反転（逆転）する"
                  >
                    <RefreshCw className={`w-3 h-3 ${useInvertedCutout ? "animate-spin-once" : ""}`} />
                    <span>{useInvertedCutout ? "反転中" : "反転"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyCutout}
                  className="p-1.5 rounded-lg bg-white/90 text-[#386641] hover:bg-white transition shadow-xs"
                  title="切り抜きをクリップボードにコピー"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-[#386641]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCutout}
                  className="p-1.5 rounded-lg bg-white/90 text-[#386641] hover:bg-white transition shadow-xs"
                  title="透明PNGとして保存"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata & Analysis Attributes */}
      {metadata && (
        <div className="p-3.5 flex flex-col gap-2.5 text-xs text-[#386641] bg-white">
          {/* Secondary Categories & Detection Attributes */}
          <div className="flex flex-wrap items-center gap-1.5">
            {metadata.hasPerson && (
              <span className="px-2 py-0.5 rounded-md bg-[#003049]/10 text-[#003049] font-bold text-[10px] flex items-center gap-0.5">
                👤 人物 ({metadata.personCount}人)
              </span>
            )}
            {metadata.hasFood && (
              <span className="px-2 py-0.5 rounded-md bg-[#DDA15E]/20 text-[#606C38] font-bold text-[10px]">
                🍴 料理・スイーツ
              </span>
            )}
            {metadata.hasBuilding && (
              <span className="px-2 py-0.5 rounded-md bg-[#386641]/10 text-[#386641] font-bold text-[10px]">
                🏛️ 建物・街並み
              </span>
            )}
            {metadata.hasVehicle && (
              <span className="px-2 py-0.5 rounded-md bg-[#003049]/10 text-[#003049] font-bold text-[10px]">
                🚆 乗り物
              </span>
            )}
            {metadata.isOutdoor && (
              <span className="px-2 py-0.5 rounded-md bg-[#386641]/10 text-[#386641] font-bold text-[10px]">
                ☀️ 屋外
              </span>
            )}
            {metadata.isIndoor && (
              <span className="px-2 py-0.5 rounded-md bg-[#DDA15E]/20 text-[#606C38] font-bold text-[10px]">
                🏠 屋内
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium text-[10px]">
              {metadata.orientation === "portrait" ? "縦長" : metadata.orientation === "landscape" ? "横長" : "正方形"} ({metadata.width}×{metadata.height})
            </span>
          </div>

          {/* Detected Objects / Entities Chips */}
          {metadata.detectedEntities.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-[#386641]/10">
              <span className="text-[10px] text-[#386641]/60 font-semibold">検出:</span>
              {metadata.detectedEntities.map((ent, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.2 rounded-sm bg-[#FDF0D5] text-[#386641] text-[10px] border border-[#DDA15E]/30"
                >
                  {ent.label} ({(ent.score * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
          )}

          {/* EXIF Details (GPS, Date, Camera) */}
          <div className="flex items-center justify-between text-[11px] text-[#386641]/70 pt-1 border-t border-[#386641]/10 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              {metadata.exif.takenAt ? (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#386641]/60" />
                  <span>{new Date(metadata.exif.takenAt).toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" })}</span>
                </span>
              ) : (
                <span className="text-[#386641]/40">日時なし</span>
              )}

              {metadata.exif.latitude !== null && metadata.exif.latitude !== undefined && (
                <span className="flex items-center gap-0.5 text-[#C1121F] font-semibold">
                  <MapPin className="w-3 h-3" />
                  <span>GPS付</span>
                </span>
              )}
            </div>

            <span className="text-[10px] text-[#386641]/50 font-mono">
              {metadata.analysisTimeMs}ms (WASM)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
