"use client";

import React, { useState, useEffect, useRef } from "react";
import { PhotoFeatures, CollageTemplate, TemplateMatchScore } from "@/types/collage-template";
import { SavedCollage, SavedCollagePhoto } from "@/types/collage";
import { batchAnalyzePhotos } from "@/lib/photo-analyzer";
import { scoreTemplatesForPhotos, assignPhotosToTemplate, MappedSlotAssignment } from "@/lib/template-matcher";
import { renderTemplateCollageToCanvas } from "@/lib/collage-engine";
import { COLLAGE_TEMPLATES } from "@/lib/collage-templates";
import { saveCollage, getAllCollages, deleteCollage, syncPendingCollages } from "@/lib/collage-storage";
import { KNOWN_CITIES, KnownCity } from "@/constants/cities";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
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
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Scissors,
  ClipboardPaste,
  Wifi,
  WifiOff,
  MapPin,
  Calendar as CalendarIcon,
} from "lucide-react";

interface CollageStudioProps {
  tripId?: number;
  tripTitle?: string;
  tripDates?: string;
  defaultPlaces?: { name: string }[];
}

export default function CollageStudio({
  tripId,
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

  // Accordion UI State for Mobile Optimization
  const [isTemplateListOpen, setIsTemplateListOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Customization Options
  const [customTitle, setCustomTitle] = useState(tripTitle || "");
  const [includeDateStamp, setIncludeDateStamp] = useState(true);
  const [selectedCity, setSelectedCity] = useState<KnownCity | null>(null);
  const [visitDate, setVisitDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Online / Offline Status
  const isOnline = useOnlineStatus();

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

  // When coming back online, auto-sync any pending collages
  useEffect(() => {
    if (isOnline) {
      (async () => {
        try {
          const syncedCount = await syncPendingCollages();
          if (syncedCount > 0) {
            const list = await getAllCollages();
            setSavedCollages(list);
            showToast(`☁️ ${syncedCount}件のコラージュを同期完了しました！`);
          }
        } catch (e) {
          console.error("Auto sync failed", e);
        }
      })();
    }
  }, [isOnline]);

  // Sync title from prop
  useEffect(() => {
    if (tripTitle) setCustomTitle(tripTitle);
  }, [tripTitle]);

  // Handle City Selection
  const handleSelectCity = (city: KnownCity) => {
    if (selectedCity?.name === city.name) {
      // Toggle off
      setSelectedCity(null);
      if (customTitle === `${city.flag} ${city.name}の思い出` || customTitle === `${city.name}の思い出`) {
        setCustomTitle(tripTitle || "");
      }
    } else {
      setSelectedCity(city);
      setCustomTitle(`${city.flag} ${city.name}の思い出`);
    }
  };

  // Mutable refs to prevent state loss during rapid consecutive pastes
  const photosRef = useRef<PhotoFeatures[]>([]);
  const imagesMapRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    photosRef.current = analyzedPhotos;
  }, [analyzedPhotos]);
  useEffect(() => {
    imagesMapRef.current = imagesMap;
  }, [imagesMap]);

  // Toast feedback for paste/copy actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add photos or stickers incrementally (up to 15)
  const handleAddPhotos = async (newFiles: (File | Blob)[], isFromPaste = false) => {
    if (newFiles.length === 0) return;

    setIsAnalyzing(true);
    try {
      const { featuresList: newFeatures, imagesMap: newMap } = await batchAnalyzePhotos(newFiles);
      if (newFeatures.length === 0) {
        setIsAnalyzing(false);
        return;
      }

      // If added via paste/clipboard button, guarantee it is treated as a cutout sticker
      if (isFromPaste) {
        newFeatures.forEach((f) => {
          f.isCutoutSticker = true;
          f.hasTransparency = true;
        });
      } else {
        // Files from photo picker must always be treated as regular photos
        newFeatures.forEach((f) => {
          f.isCutoutSticker = false;
        });
      }

      const prevPhotos = photosRef.current;
      const prevMap = imagesMapRef.current;

      const combinedPhotos = [...prevPhotos, ...newFeatures].slice(0, 15);
      const combinedMap = { ...prevMap, ...newMap };

      photosRef.current = combinedPhotos;
      imagesMapRef.current = combinedMap;

      setAnalyzedPhotos(combinedPhotos);
      setImagesMap(combinedMap);

      // Re-score templates (strictly based on regular photos!)
      const scores = scoreTemplatesForPhotos(combinedPhotos);
      setCandidateScores(scores);

      // Keep the current template if already set, otherwise pick top score
      let activeTemplate = currentTemplate;
      if (!activeTemplate && scores.length > 0) {
        activeTemplate = scores[0].template;
        setCurrentTemplate(activeTemplate);
        setCandidateIndex(0);
      } else if (activeTemplate) {
        const idx = scores.findIndex((s) => s.template.id === activeTemplate?.id);
        if (idx !== -1) setCandidateIndex(idx);
      }

      if (activeTemplate) {
        const assignments = assignPhotosToTemplate(activeTemplate, combinedPhotos, jitterSeed);
        setCurrentAssignments(assignments);
      }

      if (isFromPaste) {
        const cutoutCount = newFeatures.filter((f) => f.isCutoutSticker).length;
        if (cutoutCount > 0) {
          showToast(`✂️ 切抜ステッカー (${cutoutCount}枚) を貼り付けました！`);
        } else {
          showToast(`📋 写真 (${newFeatures.length}枚) を貼り付けました！`);
        }
      }
    } catch (err) {
      console.error("Analysis or paste failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Photo File Picker
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleAddPhotos(Array.from(files), false);
    e.target.value = "";
  };

  // Handle Paste Directly from Clipboard (e.g. iPhone Subject Cutout)
  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      alert("お使いのブラウザではボタンからの直接貼り付けに対応していません。画面長押しまたはキーボード(Cmd+V)からペーストしてください。");
      return;
    }

    setIsAnalyzing(true);
    try {
      const clipboardItems = await navigator.clipboard.read();
      const files: File[] = [];

      for (const item of clipboardItems) {
        const imgType = item.types.find((t) => t.startsWith("image/"));
        if (imgType) {
          const blob = await item.getType(imgType);
          const file = new File([blob], `sticker_${Date.now()}.png`, { type: imgType });
          files.push(file);
        }
      }

      if (files.length === 0) {
        alert("クリップボードに画像が見つかりませんでした。\n\n【使い方】\niPhoneの写真アプリ等で人物や物を長押しして「コピー」してから、もう一度このボタンを押してください。");
        return;
      }

      await handleAddPhotos(files, true);
    } catch (err: any) {
      console.warn("Clipboard read failed", err);
      if (err.name === "NotAllowedError") {
        alert("クリップボードへのアクセスが許可されませんでした。Safariの確認ポップアップで「ペーストを許可」をタップしてください。");
      } else {
        alert("貼り付けに失敗しました。iPhoneの写真アプリで被写体を長押し「コピー」してから再度お試しください。");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Global paste event listener (Cmd+V or Safari context menu paste)
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));
      if (imageItems.length === 0) return;

      e.preventDefault();
      const files: File[] = [];
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
      if (files.length > 0) {
        await handleAddPhotos(files, true);
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, []);

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

  // Switch to next scored candidate template & tweak jitter
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
    setIsTemplateListOpen(false); // Auto close accordion after selection on mobile
  };

  // Shuffle photos assignment within the current template (same layout, different photo order)
  const handleShufflePhotosOnly = () => {
    if (!currentTemplate || analyzedPhotos.length === 0) return;

    // Shuffle the photo order
    const shuffled = [...analyzedPhotos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setAnalyzedPhotos(shuffled);
    const nextSeed = jitterSeed + 1;
    setJitterSeed(nextSeed);

    const assignments = assignPhotosToTemplate(currentTemplate, shuffled, nextSeed);
    setCurrentAssignments(assignments);
  };

  // Remove a single photo from selection
  const handleRemovePhoto = (id: string) => {
    const target = photosRef.current.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.src);
    const updatedPhotos = photosRef.current.filter((p) => p.id !== id);
    const updatedImagesMap = { ...imagesMapRef.current };
    delete updatedImagesMap[id];

    photosRef.current = updatedPhotos;
    imagesMapRef.current = updatedImagesMap;

    setAnalyzedPhotos(updatedPhotos);
    setImagesMap(updatedImagesMap);

    if (updatedPhotos.length > 0) {
      const scores = scoreTemplatesForPhotos(updatedPhotos);
      setCandidateScores(scores);
      const best = scores[0].template;
      setCurrentTemplate(best);
      const assignments = assignPhotosToTemplate(best, updatedPhotos, jitterSeed);
      setCurrentAssignments(assignments);
    } else {
      handleClearPhotos();
    }
  };

  // Save to IndexedDB
  const handleSave = async () => {
    if (!currentTemplate || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const thumbnail = canvas.toDataURL("image/png", 0.7);

    // Build lightweight image snapshots for full re-editability
    const savedPhotos: SavedCollagePhoto[] = [];
    for (const photo of analyzedPhotos) {
      const img = imagesMap[photo.id];
      if (!img) continue;

      let dataUrl = "";
      try {
        const maxDim = 1200;
        let w = img.naturalWidth || img.width || 800;
        let h = img.naturalHeight || img.height || 600;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const offCanvas = document.createElement("canvas");
        offCanvas.width = w;
        offCanvas.height = h;
        const offCtx = offCanvas.getContext("2d");
        if (offCtx) {
          offCtx.drawImage(img, 0, 0, w, h);
          const mimeType = photo.isCutoutSticker || photo.hasTransparency ? "image/png" : "image/jpeg";
          dataUrl = offCanvas.toDataURL(mimeType, 0.85);
        }
      } catch (e) {
        console.warn("Failed to serialize photo", photo.id, e);
      }

      if (dataUrl) {
        savedPhotos.push({
          features: {
            ...photo,
            src: dataUrl,
          },
          dataUrl,
        });
      }
    }

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
          style: (a.photo.isCutoutSticker || a.slot.frameStyle === "none") ? ("none" as any) : (currentTemplate.style as any),
        })),
        background: currentTemplate.background,
        aspect: currentTemplate.aspect,
        theme: currentTemplate.style as any,
      },
      thumbnail,
      templateId: currentTemplate.id,
      customTitle,
      cityName: selectedCity?.name,
      cityFlag: selectedCity?.flag,
      visitDate,
      tripId,
      syncStatus: isOnline ? "synced" : "pending_sync",
      includeDateStamp,
      savedPhotos,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveCollage(saved);
      setSavedCollages((prev) => [saved, ...prev]);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2000);
      if (isOnline) {
        showToast("💾 コラージュを保存しました！");
      } else {
        showToast("📡 オフラインで保存しました（オンライン時に自動同期されます）");
      }
    } catch (err) {
      alert("保存中にエラーが発生しました。");
    }
  };

  // Re-edit saved collage (Restore canvas, photos, stickers, and template)
  const handleReEditCollage = async (collage: SavedCollage) => {
    if (collage.savedPhotos && collage.savedPhotos.length > 0) {
      setIsAnalyzing(true);
      try {
        const newImagesMap: Record<string, HTMLImageElement> = {};
        const newAnalyzedPhotos: PhotoFeatures[] = [];

        await Promise.all(
          collage.savedPhotos.map((sp) => {
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                newImagesMap[sp.features.id] = img;
                newAnalyzedPhotos.push(sp.features);
                resolve();
              };
              img.onerror = () => {
                console.warn("Failed to restore image", sp.features.id);
                resolve();
              };
              img.src = sp.dataUrl;
            });
          })
        );

        if (newAnalyzedPhotos.length > 0) {
          // Revoke any previous object URLs to prevent memory leaks
          analyzedPhotos.forEach((p) => {
            if (p.src.startsWith("blob:")) URL.revokeObjectURL(p.src);
          });

          setAnalyzedPhotos(newAnalyzedPhotos);
          setImagesMap(newImagesMap);
          photosRef.current = newAnalyzedPhotos;
          imagesMapRef.current = newImagesMap;

          if (collage.customTitle !== undefined) {
            setCustomTitle(collage.customTitle);
          }
          if (collage.includeDateStamp !== undefined) {
            setIncludeDateStamp(collage.includeDateStamp);
          }
          if (collage.cityName) {
            const foundCity = KNOWN_CITIES.find((c) => c.name === collage.cityName);
            setSelectedCity(foundCity || { name: collage.cityName, flag: collage.cityFlag || "📍", country: "", keywords: [] });
          } else {
            setSelectedCity(null);
          }
          if (collage.visitDate) {
            setVisitDate(collage.visitDate);
          }

          const targetTemplate =
            COLLAGE_TEMPLATES.find((t) => t.id === collage.templateId) ||
            COLLAGE_TEMPLATES.find((t) => t.background === collage.layout.background) ||
            COLLAGE_TEMPLATES[0];

          const scores = scoreTemplatesForPhotos(newAnalyzedPhotos);
          setCandidateScores(scores);
          setCurrentTemplate(targetTemplate);

          const assignments = assignPhotosToTemplate(targetTemplate, newAnalyzedPhotos, jitterSeed);
          setCurrentAssignments(assignments);

          setShowSavedModal(false);
          showToast("✨ コラージュをスタジオに復元しました！自由に再編集できます");
          return;
        }
      } catch (e) {
        console.error("Failed to restore collage photos", e);
      } finally {
        setIsAnalyzing(false);
      }
    }

    // Fallback if no saved photos (e.g. legacy data)
    const fallbackTemplate =
      COLLAGE_TEMPLATES.find((t) => t.id === collage.templateId) ||
      COLLAGE_TEMPLATES.find((t) => t.background === collage.layout.background) ||
      COLLAGE_TEMPLATES[0];
    setCurrentTemplate(fallbackTemplate);
    setShowSavedModal(false);
    showToast("⚠️ 旧バージョンのデータのため、テンプレートのみ復元しました");
  };

  // Download directly or native share (Mobile/iOS Safari friendly)
  const handleDownload = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    try {
      // 1. Convert Canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.95)
      );
      if (!blob) throw new Error("Canvas blob conversion failed");

      const fileName = `Marcaderno_${currentTemplate?.style || "collage"}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // 2. Web Share API (Ideal for iPhone / Mobile: opens native "Save Image" / AirDrop / SNS)
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Marcaderno コラージュ",
          text: "旅の思い出コラージュです！",
        });
        return;
      }

      // 3. Desktop / Standard Download fallback
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Native share cancelled or failed, falling back to data URL open", err);
        // Direct open fallback for older iOS
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const win = window.open();
          if (win) {
            win.document.write(
              `<div style="display:flex;flex-direction:column;align-items:center;padding:16px;background:#fdf0d5;min-height:100vh;">
                <p style="font-family:sans-serif;font-weight:bold;color:#386641;margin-bottom:12px;">画像を長押しして「写真に追加」で保存できます</p>
                <img src="${dataUrl}" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
              </div>`
            );
          } else {
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `Marcaderno_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } catch (fallbackErr) {
          alert("画像の保存に失敗しました。画面のスクリーンショットをお試しください。");
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCollage(id);
    setSavedCollages((prev) => prev.filter((c) => c.id !== id));
  };

  // Reset
  const handleClearPhotos = () => {
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.src));
    photosRef.current = [];
    imagesMapRef.current = {};
    setAnalyzedPhotos([]);
    setImagesMap({});
    setCandidateScores([]);
    setCurrentTemplate(null);
    setCurrentAssignments([]);
    setCandidateIndex(0);
    setIsTemplateListOpen(false);
  };

  const currentScoreInfo = candidateScores[candidateIndex];

  return (
    <div className="bg-white/95 border border-[#DDA15E]/30 rounded-3xl p-3 sm:p-8 shadow-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#386641]/10">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl">📸</span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#386641]">
              自動旅行コラージュ
            </h2>
            {isOnline ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#386641]/10 text-[#386641] border border-[#386641]/20 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-[#386641]" />
                オンライン
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/20 flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-[#C1121F]" />
                オフライン（端末保存）
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-sm text-[#386641]/70 mt-0.5">
            写真を選ぶと、縦横比や向きを端末内で自動分析して最適なレイアウトを生成します。
          </p>
        </div>

        {/* Saved collages quick button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setShowSavedModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FDF0D5] text-[#386641] border border-[#DDA15E]/40 hover:bg-[#FDF0D5]/80 transition shadow-2xs"
          >
            <FolderHeart className="w-3.5 h-3.5 text-[#C1121F]" />
            <span className="hidden sm:inline">保存済み</span>
            <span className="bg-[#386641]/10 px-1.5 py-0.2 rounded-full text-[10px]">
              {savedCollages.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="mt-4 flex flex-col gap-4">
        {/* Step 1: Photos Picker & Analysis Feedback */}
        <div className="flex flex-col gap-2.5 bg-[#FDF0D5]/40 p-3 sm:p-4 rounded-2xl border border-[#DDA15E]/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Photo picker */}
              <label className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#C1121F] hover:bg-[#a50f1a] text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95">
                <Camera className="w-4 h-4" />
                <span>写真を追加</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFilesSelected}
                />
              </label>

              {/* One-tap paste button */}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#003049] hover:bg-[#002233] text-[#FDF0D5] text-xs sm:text-sm font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95 border border-[#003049]"
                title="iPhoneの写真アプリで長押しコピーした被写体をワンタップで追加"
              >
                <ClipboardPaste className="w-4 h-4 text-[#DDA15E]" />
                <span>ワンタップで貼る</span>
              </button>

              {isAnalyzing && (
                <span className="text-xs font-bold text-[#386641] animate-pulse">
                  🔍 処理中...
                </span>
              )}

              {analyzedPhotos.length > 0 && !isAnalyzing && (
                <span className="text-[11px] sm:text-xs text-[#386641] bg-white/70 px-2 py-1 rounded-lg border border-[#386641]/10">
                  <b>{analyzedPhotos.length}枚</b> (横:{analyzedPhotos.filter((p) => p.orientation === "landscape" && !p.isCutoutSticker).length} / 縦:{analyzedPhotos.filter((p) => p.orientation === "portrait" && !p.isCutoutSticker).length}
                  {analyzedPhotos.some((p) => p.isCutoutSticker) && ` / ✂️切抜:${analyzedPhotos.filter((p) => p.isCutoutSticker).length}`}
                  )
                </span>
              )}
            </div>

            {analyzedPhotos.length > 0 && (
              <button
                onClick={handleClearPhotos}
                className="text-xs text-[#386641]/60 hover:text-[#C1121F] flex items-center gap-1 transition p-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 選定をクリア
              </button>
            )}
          </div>

          <p className="text-[11px] text-[#386641]/80 flex items-center gap-1.5">
            <span className="text-xs">💡</span>
            <span>iPhoneの写真アプリで人物や物を長押しして<b>「コピー」</b>→<b>「ワンタップで貼る」</b>を押すだけでステッカーが貼れます！</span>
          </p>
        </div>

        {/* Selected Photos Tray with remove button (Compact scroll) */}
        {analyzedPhotos.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {analyzedPhotos.map((p, idx) => (
              <div
                key={p.id}
                className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border border-[#DDA15E]/50 shadow-2xs group bg-white/50"
              >
                <img src={p.src} alt="" className="w-full h-full object-contain p-0.5" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(p.id)}
                  className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-[#C1121F] text-white rounded-full p-0.5 transition"
                  title="この写真を外す"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className={`absolute bottom-0.5 left-0.5 text-[8px] font-bold px-1 rounded-xs flex items-center gap-0.5 ${
                  p.isCutoutSticker ? "bg-[#C1121F] text-white" : "bg-[#386641]/90 text-[#FDF0D5]"
                }`}>
                  {p.isCutoutSticker ? (
                    <>
                      <Scissors className="w-2.5 h-2.5" />
                      <span>切抜</span>
                    </>
                  ) : (
                    p.orientation === "landscape" ? "横" : p.orientation === "portrait" ? "縦" : "正"
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* If no photos selected, show empty prompt */}
        {analyzedPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 sm:p-12 border-2 border-dashed border-[#DDA15E]/50 rounded-3xl bg-[#FDF0D5]/20 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#DDA15E]/20 flex items-center justify-center">
              <Camera className="w-7 h-7 text-[#386641]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#386641]">
                旅行の写真を選んでみよう
              </h3>
              <p className="text-xs text-[#386641]/70 max-w-xs mt-1">
                写真を選ぶだけで、横写真・縦写真を自動判別して最適なコラージュを1秒で作成します。
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
              <label className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C1121F] hover:bg-[#a50f1a] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95">
                <Camera className="w-4 h-4" />
                <span>写真を選ぶ</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFilesSelected}
                />
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#003049] hover:bg-[#002233] text-[#FDF0D5] text-xs font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95"
              >
                <ClipboardPaste className="w-4 h-4 text-[#DDA15E]" />
                <span>ワンタップで貼る</span>
              </button>
            </div>
          </div>
        ) : (
          /* Mobile-First Layout: Result Preview at Top! */
          <div className="flex flex-col gap-3">
            {/* Step 2: Scoring Recommendation & Quick Action Bar */}
            {currentTemplate && currentScoreInfo && (
              <div className="bg-[#386641]/8 border border-[#386641]/15 rounded-2xl p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#386641] text-[#FDF0D5] flex items-center justify-center shrink-0 shadow-2xs">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-[#386641] truncate">
                          {currentTemplate.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#C1121F] text-white shrink-0">
                          相性 {currentScoreInfo.score}点
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#386641]/60 shrink-0">
                    候補 {candidateIndex + 1}/{candidateScores.length}
                  </span>
                </div>

                {/* Reasons tags */}
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#386641]/80">
                  {currentScoreInfo.reasons.map((r, i) => (
                    <span key={i} className="bg-white/80 border border-[#386641]/15 px-1.5 py-0.5 rounded-md">
                      ✓ {r}
                    </span>
                  ))}
                </div>

                {/* Primary Quick Actions for Thumb Operation */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#386641]/10">
                  <button
                    type="button"
                    onClick={handleShufflePhotosOnly}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#386641]/20 text-[#386641] hover:bg-[#386641]/5 text-xs font-bold rounded-xl shadow-2xs transition active:scale-95 min-h-[42px]"
                    title="同じデザインのまま写真の並び順だけを入れ替えます"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#386641]" />
                    <span>🔀 写真をシャッフル</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextCandidate}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FDF0D5] text-[#386641] border border-[#DDA15E]/40 hover:bg-[#FDF0D5]/80 text-xs font-bold rounded-xl shadow-2xs transition active:scale-95 min-h-[42px]"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-[#C1121F]" />
                    <span>🎲 別の候補デザイン</span>
                  </button>
                </div>
              </div>
            )}

            {/* Canvas Preview Container (Placed high for immediate viewing) */}
            <div className="relative max-w-full overflow-hidden p-2 sm:p-5 bg-[#386641]/5 rounded-3xl border border-[#DDA15E]/30 shadow-inner flex justify-center">
              <canvas
                ref={canvasRef}
                className="max-h-[58vh] sm:max-h-[68vh] w-auto max-w-full rounded-2xl shadow-xl border border-black/5"
              />
            </div>

            {/* Export & Save Action Bar (Prominent Thumb Touch Zone) */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-[#FDF0D5]/60 border border-[#DDA15E]/30 rounded-2xl">
              <button
                type="button"
                onClick={handleSave}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 min-h-[44px] ${
                  isSavedFeedback
                    ? "bg-[#386641] text-white"
                    : "bg-[#003049] text-white hover:bg-[#002235]"
                }`}
              >
                {isSavedFeedback ? (
                  <>
                    <Check className="w-4 h-4" /> 保存完了！
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> 端末に保存
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#C1121F] hover:bg-[#a50f1a] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs active:scale-95 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>画像を保存 / 共有</span>
              </button>
            </div>

            {/* Accordion 1: Collapsible Full Template Selector (Clean & Space Saving) */}
            <div className="border border-[#DDA15E]/30 rounded-2xl overflow-hidden bg-white/80">
              <button
                type="button"
                onClick={() => setIsTemplateListOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[#FDF0D5]/30 transition"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DDA15E]" />
                  <span className="text-xs font-bold text-[#386641]">
                    すべてのデザインから選ぶ (全{candidateScores.length}種)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#386641]/70 font-semibold">
                  <span>{isTemplateListOpen ? "閉じる" : "一覧を開く"}</span>
                  {isTemplateListOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isTemplateListOpen && (
                <div className="p-3 pt-0 border-t border-[#386641]/10 mt-1 animate-in fade-in duration-200">
                  <p className="text-[10px] text-[#386641]/60 mb-2">
                    ※ 写真構成との相性スコアが高い順に並んでいます
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                    {candidateScores.map((scoreItem) => {
                      const tpl = scoreItem.template;
                      const isSelected = currentTemplate?.id === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tpl)}
                          className={`flex flex-col items-start p-2 rounded-xl border text-left transition ${
                            isSelected
                              ? "bg-[#386641] text-[#FDF0D5] border-[#386641] shadow-xs"
                              : "bg-white text-[#386641] border-[#386641]/10 hover:border-[#DDA15E] hover:bg-[#FDF0D5]/20"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full font-bold text-[11px]">
                            <span className="truncate">{tpl.name.split(" ")[0]}</span>
                            <span
                              className={`text-[9px] px-1 rounded-xs shrink-0 ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "bg-[#386641]/10 text-[#386641]"
                              }`}
                            >
                              {scoreItem.score}点
                            </span>
                          </div>
                          <span
                            className={`text-[9px] mt-0.5 line-clamp-1 ${
                              isSelected ? "text-[#FDF0D5]/80" : "text-[#386641]/60"
                            }`}
                          >
                            {tpl.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Collapsible Title & Date Customizer */}
            <div className="border border-[#DDA15E]/30 rounded-2xl overflow-hidden bg-white/80">
              <button
                type="button"
                onClick={() => setIsCustomizerOpen((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[#FDF0D5]/30 transition"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#386641]/60" />
                  <span className="text-xs font-bold text-[#386641]">
                    タイトル・日付スタンプを編集
                  </span>
                  {customTitle && (
                    <span className="text-[10px] text-[#386641]/60 bg-[#386641]/5 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                      {customTitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#386641]/70 font-semibold">
                  <span>{isCustomizerOpen ? "閉じる" : "変更"}</span>
                  {isCustomizerOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isCustomizerOpen && (
                <div className="p-3 pt-0 border-t border-[#386641]/10 mt-1 flex flex-col gap-3 animate-in fade-in duration-200">
                  {/* City Selection Chips */}
                  <div>
                    <label className="text-[11px] font-bold text-[#386641]/80 flex items-center gap-1 mb-1.5">
                      <MapPin className="w-3 h-3 text-[#C1121F]" />
                      <span>都市をタグ付け（ワンタップで選べます）</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {KNOWN_CITIES.map((city) => {
                        const isSelected = selectedCity?.name === city.name;
                        return (
                          <button
                            key={city.name}
                            type="button"
                            onClick={() => handleSelectCity(city)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs ${
                              isSelected
                                ? "bg-[#386641] text-white shadow-xs scale-102"
                                : "bg-[#FDF0D5]/70 hover:bg-[#FDF0D5] text-[#386641] border border-[#DDA15E]/40"
                            }`}
                          >
                            <span>{city.flag}</span>
                            <span>{city.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title & Date Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-[#386641]/10">
                    <input
                      type="text"
                      placeholder="タイトル（例: 🇫🇷 パリの思い出）"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-[#386641]/20 focus:outline-hidden focus:border-[#386641] w-full sm:max-w-xs"
                    />

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#386641]/60" />
                        <input
                          type="date"
                          value={visitDate}
                          onChange={(e) => setVisitDate(e.target.value)}
                          className="px-2 py-1 text-xs rounded-xl border border-[#386641]/20 focus:outline-hidden text-[#386641] font-semibold"
                        />
                      </div>

                      <label className="flex items-center gap-1.5 text-xs font-bold text-[#386641] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeDateStamp}
                          onChange={(e) => setIncludeDateStamp(e.target.checked)}
                          className="rounded text-[#386641] focus:ring-0"
                        />
                        <span>日付スタンプ</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
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
          onReEdit={handleReEditCollage}
          tripTitle={tripTitle}
        />
      )}

      {/* Floating Toast Notification for Paste / Actions */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#003049] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-[#DDA15E]/40 text-xs sm:text-sm font-bold flex items-center gap-2 pointer-events-none transition-all animate-bounce">
          <Sparkles className="w-4 h-4 text-[#DDA15E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
