"use client";

import React, { useState, useEffect, useRef } from "react";
import { PhotoFeatures, CollageTemplate, TemplateMatchScore } from "@/types/collage-template";
import { SavedCollage } from "@/types/collage";
import { batchAnalyzePhotos } from "@/lib/photo-analyzer";
import { scoreTemplatesForPhotos, assignPhotosToTemplate, MappedSlotAssignment } from "@/lib/template-matcher";
import { renderTemplateCollageToCanvas } from "@/lib/collage-engine";
import { COLLAGE_TEMPLATES } from "@/lib/collage-templates";
import { saveCollage, getAllCollages, deleteCollage } from "@/lib/collage-storage";
import SavedCollagesModal from "./SavedCollagesModal";
import {
  Camera,
  Shuffle,
  Save,
  Download,
  FolderHeart,
  Sparkles,
  RotateCcw,
  Check,
  Award,
  Layers,
} from "lucide-react";

interface CollageStudioProps {
  tripTitle?: string;
  tripDates?: string;
  defaultPlaces?: { name: string }[];
}

export default function CollageStudio({
  tripTitle,
  tripDates,
  defaultPlaces = [],
}: CollageStudioProps) {
  // Photos & Analysis State
  const [analyzedPhotos, setAnalyzedPhotos] = useState<PhotoFeatures[]>([]);
  const [imagesMap, setImagesMap] = useState<Record<string, HTMLImageElement>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Template Scoring & Candidate State
  const [candidateScores, setCandidateScores] = useState<TemplateMatchScore[]>([]);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [currentTemplate, setCurrentTemplate] = useState<CollageTemplate | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<MappedSlotAssignment[]>([]);
  const [jitterSeed, setJitterSeed] = useState<number>(0);

  // Customization Options
  const [customTitle, setCustomTitle] = useState(tripTitle || "");
  const [includeDateStamp, setIncludeDateStamp] = useState(true);

  // Canvas & Storage
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [savedCollages, setSavedCollages] = useState<SavedCollage[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Load saved collages on mount
  useEffect(() => {
    (async () => {
      try {
        const list = await getAllCollages();
        setSavedCollages(list);
      } catch (err) {
        console.error("Failed to load saved collages", err);
      }
    })();
  }, []);

  // Sync title from prop
  useEffect(() => {
    if (tripTitle) setCustomTitle(tripTitle);
  }, [tripTitle]);

  // Handle Photo Selection & On-Device Analysis
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAnalyzing(true);
    try {
      const fileArray = Array.from(files).slice(0, 10);
      const { featuresList, imagesMap: newImagesMap } = await batchAnalyzePhotos(fileArray);

      setAnalyzedPhotos(featuresList);
      setImagesMap(newImagesMap);

      // Score templates automatically
      const scores = scoreTemplatesForPhotos(featuresList);
      setCandidateScores(scores);
      setCandidateIndex(0);

      if (scores.length > 0) {
        const best = scores[0].template;
        setCurrentTemplate(best);
        const assignments = assignPhotosToTemplate(best, featuresList, 0);
        setCurrentAssignments(assignments);
      }
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Re-render Canvas when template or assignments change
  useEffect(() => {
    if (
      !currentTemplate ||
      currentAssignments.length === 0 ||
      !canvasRef.current ||
      Object.keys(imagesMap).length === 0
    ) {
      return;
    }

    renderTemplateCollageToCanvas(
      canvasRef.current,
      currentTemplate,
      currentAssignments,
      imagesMap,
      {
        title: customTitle,
        date: includeDateStamp ? tripDates || new Date().toLocaleDateString("ja-JP") : undefined,
      }
    );
  }, [currentTemplate, currentAssignments, imagesMap, customTitle, includeDateStamp, tripDates]);

  // "もう一回 / 次の候補" Button: Switch to next scored candidate template & tweak jitter
  const handleNextCandidate = () => {
    if (candidateScores.length === 0 || analyzedPhotos.length === 0) return;

    const nextIndex = (candidateIndex + 1) % candidateScores.length;
    const nextSeed = jitterSeed + 1;
    const nextTemplate = candidateScores[nextIndex].template;

    setCandidateIndex(nextIndex);
    setJitterSeed(nextSeed);
    setCurrentTemplate(nextTemplate);

    const assignments = assignPhotosToTemplate(nextTemplate, analyzedPhotos, nextSeed);
    setCurrentAssignments(assignments);
  };

  // Select a specific template manually
  const handleSelectTemplate = (tpl: CollageTemplate) => {
    setCurrentTemplate(tpl);
    const foundIdx = candidateScores.findIndex((s) => s.template.id === tpl.id);
    if (foundIdx !== -1) setCandidateIndex(foundIdx);

    const assignments = assignPhotosToTemplate(tpl, analyzedPhotos, jitterSeed);
    setCurrentAssignments(assignments);
  };

  // Save to IndexedDB
  const handleSave = async () => {
    if (!currentTemplate || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const thumbnail = canvas.toDataURL("image/png", 0.7);

    // Build SavedCollage
    const saved: SavedCollage = {
      id: crypto.randomUUID(),
      layout: {
        elements: currentAssignments.map((a, i) => ({
          photoId: a.photo.id,
          x: a.slot.x * 100,
          y: a.slot.y * 100,
          width: a.slot.width * 100,
          height: a.slot.height * 100,
          rotation: a.rotation,
          zIndex: a.slot.zIndex,
          style: currentTemplate.style as any,
        })),
        background: currentTemplate.background,
        aspect: currentTemplate.aspect,
        theme: currentTemplate.style as any,
      },
      thumbnail,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveCollage(saved);
      setSavedCollages((prev) => [saved, ...prev]);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2000);
    } catch (err) {
      alert("保存中にエラーが発生しました。");
    }
  };

  // Download directly
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `Marcaderno_${currentTemplate?.style || "collage"}_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL("image/png", 0.95);
    link.click();
  };

  const handleDelete = async (id: string) => {
    await deleteCollage(id);
    setSavedCollages((prev) => prev.filter((c) => c.id !== id));
  };

  // Reset
  const handleClearPhotos = () => {
    analyzedPhotos.forEach((p) => URL.revokeObjectURL(p.src));
    setAnalyzedPhotos([]);
    setImagesMap({});
    setCandidateScores([]);
    setCurrentTemplate(null);
    setCurrentAssignments([]);
    setCandidateIndex(0);
  };

  const currentScoreInfo = candidateScores[candidateIndex];

  return (
    <div className="bg-white/95 border border-[#DDA15E]/30 rounded-3xl p-4 sm:p-8 shadow-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#386641]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#386641]">
              自動旅行コラージュ
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#003049]/10 text-[#003049] border border-[#003049]/20">
              端末内写真分析・完全オフライン
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#386641]/70 mt-1">
            写真を選ぶと、端末上で縦横比・構成を自動分析し、最も似合うテンプレートを自動で選定・スコアリングします。
          </p>
        </div>

        {/* Saved collages quick button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSavedModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FDF0D5] text-[#386641] border border-[#DDA15E]/40 hover:bg-[#FDF0D5]/80 transition shadow-2xs"
          >
            <FolderHeart className="w-4 h-4 text-[#C1121F]" />
            <span>保存済み</span>
            <span className="bg-[#386641]/10 px-1.5 py-0.5 rounded-full text-[10px]">
              {savedCollages.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="mt-6 flex flex-col gap-6">
        {/* Step 1: Photos Picker & Analysis Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FDF0D5]/40 p-4 rounded-2xl border border-[#DDA15E]/20">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-[#C1121F] hover:bg-[#a50f1a] text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95">
              <Camera className="w-4 h-4" />
              <span>写真を選ぶ (2〜7枚推奨)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFilesSelected}
              />
            </label>

            {isAnalyzing && (
              <span className="text-xs font-bold text-[#386641] animate-pulse">
                🔍 端末上で写真を分析中...
              </span>
            )}

            {analyzedPhotos.length > 0 && !isAnalyzing && (
              <div className="text-xs text-[#386641] flex items-center gap-2">
                <span className="font-bold">{analyzedPhotos.length}枚を分析完了</span>
                <span className="text-[#386641]/60">
                  (縦: {analyzedPhotos.filter((p) => p.orientation === "portrait").length} / 横:{" "}
                  {analyzedPhotos.filter((p) => p.orientation === "landscape").length})
                </span>
              </div>
            )}
          </div>

          {analyzedPhotos.length > 0 && (
            <button
              onClick={handleClearPhotos}
              className="text-xs text-[#386641]/60 hover:text-[#C1121F] flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 写真を選び直す
            </button>
          )}
        </div>

        {/* Selected Photos Tray with Orientation Badges */}
        {analyzedPhotos.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {analyzedPhotos.map((p, idx) => (
              <div
                key={p.id}
                className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 border-[#DDA15E]/50 shadow-2xs group"
              >
                <img src={p.src} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                  #{idx + 1}
                </span>
                <span className="absolute top-1 left-1 bg-[#386641]/80 text-[#FDF0D5] text-[9px] font-bold px-1 rounded-sm">
                  {p.orientation === "portrait" ? "縦" : p.orientation === "landscape" ? "横" : "正"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Scoring Recommendation Banner */}
        {currentTemplate && currentScoreInfo && (
          <div className="bg-[#386641]/8 border border-[#386641]/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#386641] text-[#FDF0D5] flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-[#386641]">
                    候補 {candidateIndex + 1}/{candidateScores.length} : {currentTemplate.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#C1121F] text-white">
                    相性スコア: {currentScoreInfo.score}点
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-[#386641]/80">
                  {currentScoreInfo.reasons.map((r, i) => (
                    <span key={i} className="bg-white/80 border border-[#386641]/15 px-2 py-0.5 rounded-md">
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Next Candidate Button */}
            <button
              type="button"
              onClick={handleNextCandidate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C1121F] hover:bg-[#a50f1a] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 shrink-0"
            >
              <Shuffle className="w-4 h-4" />
              <span>🎲 次の候補を試す</span>
            </button>
          </div>
        )}

        {/* Step 3: Template Selector & Options */}
        {analyzedPhotos.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#386641] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#DDA15E]" />
                <span>全テンプレートから選択</span>
              </label>
              <span className="text-[11px] text-[#386641]/60">
                スコアの高い順に並んでいます
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {candidateScores.map((scoreItem, idx) => {
                const tpl = scoreItem.template;
                const isSelected = currentTemplate?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-[#386641] text-[#FDF0D5] border-[#386641] shadow-xs"
                        : "bg-white text-[#386641] border-[#386641]/10 hover:border-[#DDA15E] hover:bg-[#FDF0D5]/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full font-bold text-xs">
                      <span>{tpl.name.split(" ")[0]}</span>
                      <span
                        className={`text-[10px] px-1.5 rounded-sm ${
                          isSelected ? "bg-white/20 text-white" : "bg-[#386641]/10 text-[#386641]"
                        }`}
                      >
                        {scoreItem.score}点
                      </span>
                    </div>
                    <span
                      className={`text-[10px] mt-1 line-clamp-1 ${
                        isSelected ? "text-[#FDF0D5]/80" : "text-[#386641]/60"
                      }`}
                    >
                      {tpl.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Title & Date Customizer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#386641]">
                <Layers className="w-3.5 h-3.5 text-[#386641]/60" />
                <span>タイトル & 日付スタンプ:</span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="タイトル（例: Paris Trip）"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-[#386641]/20 focus:outline-hidden focus:border-[#386641] max-w-[160px] sm:max-w-xs"
                />
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#386641] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDateStamp}
                    onChange={(e) => setIncludeDateStamp(e.target.checked)}
                    className="rounded text-[#386641] focus:ring-0"
                  />
                  <span>日付スタンプを入れる</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Workspace & Actions */}
        {analyzedPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 sm:p-16 border-2 border-dashed border-[#DDA15E]/50 rounded-3xl bg-[#FDF0D5]/20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#DDA15E]/20 flex items-center justify-center mb-3">
              <Camera className="w-8 h-8 text-[#386641]" />
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-[#386641]">
              旅の写真を読み込んでみよう
            </h3>
            <p className="text-xs sm:text-sm text-[#386641]/70 max-w-sm mt-1">
              写真を選択すると、端末内で縦横比や明るさを自動分析し、ぴったりのコラージュテンプレートを自動選択します。
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Action Bar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 p-2 bg-[#FDF0D5]/50 border border-[#DDA15E]/30 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNextCandidate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#386641] border border-[#386641]/20 rounded-xl text-xs font-bold hover:bg-[#386641]/5 transition active:scale-95 shadow-2xs"
                >
                  <Shuffle className="w-3.5 h-3.5 text-[#C1121F]" />
                  <span>🎲 別の配置・候補を試す</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 ${
                    isSavedFeedback
                      ? "bg-[#386641] text-white"
                      : "bg-[#003049] text-white hover:bg-[#002235]"
                  }`}
                >
                  {isSavedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> 保存しました！
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> 端末に保存
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#C1121F] hover:bg-[#a50f1a] text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>画像を書き出し</span>
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative max-w-full overflow-hidden p-3 sm:p-6 bg-[#386641]/5 rounded-3xl border border-[#DDA15E]/30 shadow-inner flex justify-center">
              <canvas
                ref={canvasRef}
                className="max-h-[68vh] w-auto max-w-full rounded-2xl shadow-xl border border-black/5"
              />
            </div>
          </div>
        )}
      </div>

      {/* Saved Collages Modal */}
      {showSavedModal && (
        <SavedCollagesModal
          collages={savedCollages}
          onClose={() => setShowSavedModal(false)}
          onDelete={handleDelete}
          onSelect={(c) => {
            // Find template matching background or default
            const tpl = COLLAGE_TEMPLATES.find((t) => t.background === c.layout.background) || COLLAGE_TEMPLATES[0];
            setCurrentTemplate(tpl);
            setShowSavedModal(false);
          }}
        />
      )}
    </div>
  );
}
