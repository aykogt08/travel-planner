"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  ClipboardPaste,
  Sparkles,
  Check,
  AlertTriangle,
  X,
  Plane,
  Hotel,
  Train,
  Bus,
  Car,
  Ship,
  Calendar,
  Clock,
  Key,
  ChevronRight,
  ExternalLink,
  Info,
  CheckCircle2,
  Plus,
  Camera,
  Loader2,
} from "lucide-react";
import {
  PRESET_PAYMENT_METHODS,
  PRESET_BOOKING_SITES,
  ReservationStatus,
} from "@/types/trip";
import { normalizeNumberInput } from "@/lib/utils";

interface ExtractedBooking {
  bookingType: "FLIGHT" | "TRAIN" | "BUS" | "SHIP" | "HOTEL" | "CAR" | "ACTIVITY" | "OTHER";
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  checkOutDate: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  fromPlace: string | null;
  toPlace: string | null;
  flightNumber: string | null;
  bookingNumber: string | null;
  bookingSite: string | null;
  cancelDeadline: string | null;
  cost: number | null;
  currency: string | null;
  paymentMethod: string | null;
  hasBreakfast: boolean | null;
  memo: string | null;
}

interface BookingScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  onBookingAdded: (type: "SCHEDULE" | "PLACE", item: any) => void;
  isOffline?: boolean;
}

export default function BookingScanModal({
  isOpen,
  onClose,
  tripId,
  tripStartDate,
  tripEndDate,
  onBookingAdded,
  isOffline = false,
}: BookingScanModalProps) {
  // Step states: "INPUT" | "ANALYZING" | "RESULT"
  const [step, setStep] = useState<"INPUT" | "ANALYZING" | "RESULT">("INPUT");

  // Image states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");

  // API Key states
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  // Form states for Extracted Data
  const [formData, setFormData] = useState<{
    bookingType: string;
    targetDestination: "SCHEDULE" | "PLACE";
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    checkOutDate: string;
    flightNumber: string;
    fromPlace: string;
    toPlace: string;
    bookingNumber: string;
    bookingSite: string;
    paymentMethod: string;
    cancelDeadline: string;
    cost: string;
    hasBreakfast: boolean;
    memo: string;
    reservationStatus: ReservationStatus;
  }>({
    bookingType: "FLIGHT",
    targetDestination: "SCHEDULE",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    checkOutDate: "",
    flightNumber: "",
    fromPlace: "",
    toPlace: "",
    bookingNumber: "",
    bookingSite: "",
    paymentMethod: "",
    cancelDeadline: "",
    cost: "",
    hasBreakfast: false,
    memo: "",
    reservationStatus: "BOOKED",
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-screenshot merge states
  const [scannedCount, setScannedCount] = useState<number>(1);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeSuccessMessage, setMergeSuccessMessage] = useState<string | null>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved API Key from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("GEMINI_API_KEY");
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("INPUT");
      setImagePreview(null);
      setImageBase64(null);
      setErrorMessage(null);
      setUsedModel(null);
      setScannedCount(1);
      setIsMerging(false);
      setMergeSuccessMessage(null);
    }
  }, [isOpen]);

  // Global paste handler when modal is open (INPUT step or RESULT step)
  useEffect(() => {
    if (!isOpen || (step !== "INPUT" && step !== "RESULT")) return;

    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imgItem = items.find((item) => item.type.startsWith("image/"));
      if (imgItem) {
        e.preventDefault();
        const file = imgItem.getAsFile();
        if (file) {
          if (step === "INPUT") {
            processImageFile(file);
          } else if (step === "RESULT") {
            handleAddAdditionalScreenshot(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, step, formData, scannedCount]);

const compressImageForAi = (file: File): Promise<{ base64: string; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const rawUrl = e.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            base64: rawUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, ""),
          });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.80);
        const base64 = dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
        resolve({ dataUrl, base64 });
      };
      img.onerror = () => {
        const rawUrl = e.target?.result as string;
        resolve({
          dataUrl: rawUrl,
          base64: rawUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, ""),
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  const processImageFile = async (file: File) => {
    setErrorMessage(null);
    setMimeType("image/jpeg");
    try {
      const { dataUrl, base64 } = await compressImageForAi(file);
      setImagePreview(dataUrl);
      setImageBase64(base64);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        setImagePreview(raw);
        setImageBase64(raw.replace(/^data:image\/[a-zA-Z]+;base64,/, ""));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      alert("お使いのブラウザではボタンからの直接貼り付けに対応していません。Cmd+V (Ctrl+V) キーで貼り付けてください。");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith("image/"));
        if (imgType) {
          const blob = await item.getType(imgType);
          const file = new File([blob], `screenshot_${Date.now()}.png`, { type: imgType });
          await processImageFile(file);
          return;
        }
      }
      alert("クリップボードに画像が見つかりませんでした。スクショをコピーしてからもう一度お試しください。");
    } catch (err: any) {
      console.warn("Clipboard read failed:", err);
      alert("クリップボードからの読み取りが許可されませんでした。キーボードの Cmd+V (Ctrl+V) をお試しください。");
    }
  };

  // Add additional screenshot and merge into current formData
  const handleAddAdditionalScreenshot = async (file: File) => {
    setIsMerging(true);
    setErrorMessage(null);
    setMergeSuccessMessage(null);

    const activeKey =
      apiKey.trim() ||
      (typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") || "" : "");

    try {
      const { base64 } = await compressImageForAi(file);

      const res = await fetch("/api/ai/scan-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: "image/jpeg",
          apiKey: activeKey || undefined,
          currentData: formData, // Send current form state to AI for merging!
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`サーバー通信エラー (HTTP ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.message || data.details || "追加スクショの解析に失敗しました");
      }

      const merged: ExtractedBooking = data.result;
      if (data.modelUsed) {
        setUsedModel(String(data.modelUsed).replace(/^models\//, ""));
      }

      // Merge into formData (preserve existing values unless new info was found)
      setFormData((prev) => ({
        ...prev,
        bookingType: merged.bookingType || prev.bookingType,
        title: merged.title || prev.title,
        date: merged.date || prev.date,
        startTime: merged.startTime || prev.startTime,
        endTime: merged.endTime || prev.endTime,
        checkOutDate: merged.checkOutDate || prev.checkOutDate,
        flightNumber: merged.flightNumber || prev.flightNumber,
        fromPlace: merged.fromPlace || prev.fromPlace,
        toPlace: merged.toPlace || prev.toPlace,
        bookingNumber: merged.bookingNumber || prev.bookingNumber,
        bookingSite: merged.bookingSite || prev.bookingSite,
        paymentMethod: merged.paymentMethod || prev.paymentMethod,
        cancelDeadline: merged.cancelDeadline || prev.cancelDeadline,
        cost:
          merged.cost !== null && merged.cost !== undefined
            ? String(merged.cost)
            : prev.cost,
        hasBreakfast:
          merged.hasBreakfast !== null && merged.hasBreakfast !== undefined
            ? merged.hasBreakfast
            : prev.hasBreakfast,
        memo: merged.memo || prev.memo,
      }));

      const newCount = scannedCount + 1;
      setScannedCount(newCount);
      setMergeSuccessMessage(`🎉 ${newCount}枚目のスクショを解析し、情報を更新・補完しました！`);
      setTimeout(() => setMergeSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Additional scan failed:", err);
      setErrorMessage(err.message || "追加スクショの解析に失敗しました。");
    } finally {
      setIsMerging(false);
    }
  };

  const handlePasteAdditionalFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      alert("お使いのブラウザではボタンからの直接貼り付けに対応していません。Cmd+V (Ctrl+V) キーで貼り付けてください。");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith("image/"));
        if (imgType) {
          const blob = await item.getType(imgType);
          const file = new File([blob], `screenshot_add_${Date.now()}.png`, { type: imgType });
          await handleAddAdditionalScreenshot(file);
          return;
        }
      }
      alert("クリップボードに画像が見つかりませんでした。スクショをコピーしてからもう一度お試しください。");
    } catch (err: any) {
      console.warn("Clipboard read failed:", err);
      alert("クリップボードからの読み取りが許可されませんでした。キーボードの Cmd+V (Ctrl+V) をお試しください。");
    }
  };

  // Analyze image via secure serverless endpoint with dynamic model discovery
  const handleStartAnalysis = async () => {
    if (!imageBase64) return;
    setStep("ANALYZING");
    setErrorMessage(null);

    const activeKey =
      apiKey.trim() ||
      (typeof window !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") || "" : "");

    try {
      const res = await fetch("/api/ai/scan-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: "image/jpeg",
          apiKey: activeKey || undefined,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(
          `サーバー通信エラー (HTTP ${res.status})。Vercelのデプロイが完了しているかご確認ください。`
        );
      }

      if (!res.ok) {
        if (data.error === "GEMINI_API_KEY_REQUIRED" || data.error === "API_KEY_INVALID") {
          setShowApiKeyInput(true);
        }
        const errorLines = [
          data.message,
          data.modelUsed ? `【使用モデル】: ${data.modelUsed}` : null,
          data.details ? `【詳細】: ${typeof data.details === "object" ? JSON.stringify(data.details, null, 2) : data.details}` : null,
          data.discoveryInfo ? `【モデル探索情報】: ${JSON.stringify(data.discoveryInfo, null, 2)}` : null,
        ].filter(Boolean);
        throw new Error(errorLines.join("\n\n"));
      }

      const extracted: ExtractedBooking = data.result;
      if (data.modelUsed) {
        setUsedModel(String(data.modelUsed).replace(/^models\//, ""));
      }

      // Populate form
      const isHotel = extracted.bookingType === "HOTEL";
      const defaultDate =
        extracted.date ||
        (tripStartDate ? tripStartDate.split("T")[0] : new Date().toISOString().split("T")[0]);

      setFormData({
        bookingType: extracted.bookingType || "FLIGHT",
        targetDestination: isHotel ? "PLACE" : "SCHEDULE",
        title: extracted.title || (isHotel ? "宿泊予約" : "交通予約"),
        date: defaultDate,
        startTime: extracted.startTime || (isHotel ? extracted.checkInTime || "15:00" : ""),
        endTime: extracted.endTime || (isHotel ? extracted.checkOutTime || "11:00" : ""),
        checkOutDate: extracted.checkOutDate || "",
        flightNumber: extracted.flightNumber || "",
        fromPlace: extracted.fromPlace || "",
        toPlace: extracted.toPlace || "",
        bookingNumber: extracted.bookingNumber || "",
        bookingSite: extracted.bookingSite || "",
        paymentMethod: extracted.paymentMethod || "",
        cancelDeadline: extracted.cancelDeadline || "",
        cost: extracted.cost !== null && extracted.cost !== undefined ? String(extracted.cost) : "",
        hasBreakfast: extracted.hasBreakfast === true,
        memo: extracted.memo || "",
        reservationStatus: "BOOKED",
      });

      // Save API key if it worked and was entered
      if (apiKey.trim() && typeof window !== "undefined") {
        localStorage.setItem("GEMINI_API_KEY", apiKey.trim());
      }

      setStep("RESULT");
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setErrorMessage(err.message || "画像の解析に失敗しました。もう一度お試しください。");
      setStep("INPUT");
    }
  };

  // Submit and save to database
  const handleSaveToTrip = async () => {
    if (!formData.title.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    setIsSubmitting(true);
    const costNumber = formData.cost ? Number(formData.cost) : null;

    try {
      if (formData.targetDestination === "PLACE") {
        // Create as Place (Hotel Spot)
        const payload = {
          name: formData.title.trim(),
          category: "HOTEL",
          memo: formData.memo || null,
          checkInDate: formData.date || null,
          checkOutDate: formData.checkOutDate || null,
          checkInTime: formData.startTime || null,
          checkOutTime: formData.endTime || null,
          cost: costNumber,
          reservationStatus: formData.reservationStatus,
          bookingNumber: formData.bookingNumber || null,
          bookingSite: formData.bookingSite || null,
          paymentMethod: formData.paymentMethod || null,
          cancelDeadline: formData.cancelDeadline || null,
          hasBreakfast: formData.hasBreakfast,
          tripId,
        };

        let createdPlace;
        if (!isOffline) {
          const res = await fetch("/api/places", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            createdPlace = await res.json();
          }
        }

        const finalPlace = createdPlace || {
          id: Date.now(),
          ...payload,
          rating: 0,
          visited: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onBookingAdded("PLACE", finalPlace);
      } else {
        // Create as Schedule (Flight / Train / Hotel stay in timeline)
        const isHotel = formData.bookingType === "HOTEL";
        const transportType = isHotel
          ? null
          : formData.bookingType === "FLIGHT"
          ? "FLIGHT"
          : formData.bookingType === "TRAIN"
          ? "TRAIN"
          : formData.bookingType === "BUS"
          ? "BUS"
          : formData.bookingType === "CAR"
          ? "CAR"
          : formData.bookingType === "SHIP"
          ? "SHIP"
          : "OTHER";

        const payload = {
          date: formData.date || new Date().toISOString().split("T")[0],
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          checkOutDate: formData.checkOutDate || null,
          title: formData.title.trim(),
          category: isHotel ? "HOTEL" : "TRANSPORT",
          transportType,
          flightNumber: formData.flightNumber || null,
          fromPlace: formData.fromPlace || null,
          toPlace: formData.toPlace || null,
          cost: costNumber,
          memo: formData.memo || null,
          reservationStatus: formData.reservationStatus,
          bookingNumber: formData.bookingNumber || null,
          bookingSite: formData.bookingSite || null,
          paymentMethod: formData.paymentMethod || null,
          cancelDeadline: formData.cancelDeadline || null,
          hasBreakfast: formData.hasBreakfast,
          tripId,
        };

        let createdSchedule;
        if (!isOffline) {
          const res = await fetch("/api/schedules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            createdSchedule = await res.json();
          }
        }

        const finalSchedule = createdSchedule || {
          id: Date.now(),
          ...payload,
          duration: null,
          isCompleted: false,
          placeId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onBookingAdded("SCHEDULE", finalSchedule);
      }

      onClose();
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#386641]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white/95 border border-[#DDA15E]/40 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#386641]/10 flex items-center justify-between bg-[#FDF0D5]/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#386641] flex items-center gap-1.5">
                <span>予約スクショからAI自動入力</span>
                <span className="text-[10px] bg-[#C1121F] text-white px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini
                </span>
              </h2>
              <p className="text-[11px] text-[#386641]/70">
                航空券やホテルの予約確認画面から、日時・便名・予約番号・キャンセル期限を抽出します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#386641]/60 hover:text-[#386641] hover:bg-black/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* API Key setting box */}
          {(showApiKeyInput || !apiKey) && (
            <div className="p-3.5 rounded-2xl bg-[#FDF0D5]/60 border border-[#DDA15E]/40 text-xs text-[#386641] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#DDA15E]" />
                  <span>Gemini APIキー設定（完全無料）</span>
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#C1121F] font-bold hover:underline flex items-center gap-0.5"
                >
                  <span>キーを無料で取得</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-[#386641]/70">
                Google AI Studioで発行したAPIキーを入力すると、この端末のブラウザに保存され、すぐに無料で使い始められます。
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy...（APIキーを入力）"
                  className="flex-1 bg-white border border-[#386641]/20 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (apiKey.trim()) {
                      localStorage.setItem("GEMINI_API_KEY", apiKey.trim());
                      alert("APIキーを保存しました！");
                      setShowApiKeyInput(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#386641] hover:bg-[#2b5033] text-white text-xs font-bold rounded-xl transition shadow-2xs"
                >
                  保存
                </button>
              </div>
            </div>
          )}

          {/* Error Message with detailed diagnostic box */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#C1121F]/10 border border-[#C1121F]/20 text-[#C1121F] text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>エラーが発生しました</span>
              </div>
              <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono bg-white/85 p-3 rounded-xl border border-[#C1121F]/15 overflow-x-auto max-h-56 text-[#C1121F]">
                {errorMessage}
              </pre>
            </div>
          )}

          {/* STEP 1: Image Input */}
          {step === "INPUT" && (
            <div className="flex flex-col gap-4">
              {/* Dropzone / Preview */}
              <div className="border-2 border-dashed border-[#DDA15E]/60 rounded-3xl p-6 bg-[#FDF0D5]/20 flex flex-col items-center justify-center text-center gap-3 transition hover:bg-[#FDF0D5]/40 min-h-[220px]">
                {imagePreview ? (
                  <div className="relative max-h-64 max-w-full rounded-2xl overflow-hidden border border-[#386641]/15 shadow-sm group">
                    <img
                      src={imagePreview}
                      alt="Uploaded Screenshot"
                      className="max-h-64 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageBase64(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-[#C1121F] text-white p-1 rounded-full transition"
                      title="画像を削除"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[#DDA15E]/20 flex items-center justify-center text-[#386641]">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-[#386641]">
                        予約確認画面のスクショを選択または貼り付け
                      </h3>
                      <p className="text-xs text-[#386641]/70 max-w-sm mt-1">
                        航空券、新幹線、Booking.com、楽天トラベルなどの完了画面・eチケットに対応しています。
                      </p>
                    </div>
                  </>
                )}

                {/* Upload action buttons */}
                <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                  <label className="flex items-center gap-1.5 px-4 py-2.5 bg-[#386641] hover:bg-[#2b5033] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>写真・ファイルから選ぶ</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#003049] hover:bg-[#002233] text-[#FDF0D5] text-xs font-bold rounded-xl cursor-pointer shadow-xs transition active:scale-95"
                    title="クリップボードの画像を貼り付け"
                  >
                    <ClipboardPaste className="w-4 h-4 text-[#DDA15E]" />
                    <span>クリップボードから貼る</span>
                  </button>
                </div>
              </div>

              {/* Start Analysis Button */}
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  className="w-full py-3 bg-[#C1121F] hover:bg-[#a50f1a] text-white font-extrabold text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AIで予約情報を読み取る</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* STEP 2: Analyzing State */}
          {step === "ANALYZING" && (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#386641]/20 border-t-[#C1121F] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#DDA15E] absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#386641]">
                  Gemini AIが予約スクショを解析中...
                </h3>
                <p className="text-xs text-[#386641]/70 mt-1 max-w-xs">
                  フライトの日時、便名、ホテル名、予約番号、キャンセル期限などを読み取っています
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Result Preview & Edit Form */}
          {step === "RESULT" && (
            <div className="flex flex-col gap-4">
              {/* Used Model Badge */}
              {usedModel && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#386641]/10 border border-[#386641]/20 text-xs text-[#386641]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#386641]" />
                    <span>AI解析が完了しました</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] bg-white/90 px-2.5 py-0.5 rounded-lg border border-[#386641]/15 font-semibold text-[#386641]">
                    <span className="text-[10px] text-[#386641]/70 font-sans font-normal">使用モデル:</span>
                    <span>{usedModel}</span>
                  </div>
                </div>
              )}

              {/* Merge Success Alert */}
              {mergeSuccessMessage && (
                <div className="p-3 rounded-2xl bg-[#386641]/15 border border-[#386641]/30 text-[#386641] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#386641] shrink-0" />
                  <span>{mergeSuccessMessage}</span>
                </div>
              )}

              {/* Hidden file input for additional screenshot */}
              <input
                ref={additionalFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleAddAdditionalScreenshot(file);
                    e.target.value = "";
                  }
                }}
              />

              {/* Additional Screenshot Merge Card */}
              <div className="p-3.5 rounded-2xl bg-[#FDF0D5]/50 border border-dashed border-[#DDA15E] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#386641]/10 flex items-center justify-center text-[#386641] shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#386641] flex items-center gap-2">
                      <span>もう1枚スクショを追加して情報を補完</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#386641]/15 text-[#386641] rounded-full font-mono font-semibold">
                        現在 {scannedCount} 枚読込済
                      </span>
                    </div>
                    <p className="text-[11px] text-[#386641]/70 mt-0.5">
                      1枚に収まらなかった続き（座席・手荷物・予約番号など）をマージできます (Cmd+Vでも貼付可)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => additionalFileInputRef.current?.click()}
                    disabled={isMerging}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#386641] hover:bg-[#2b5033] text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isMerging ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>マージ解析中...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>追加スクショを選択</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handlePasteAdditionalFromClipboard}
                    disabled={isMerging}
                    className="px-2.5 py-1.5 bg-white hover:bg-[#FDF0D5] text-[#386641] text-xs font-bold rounded-xl border border-[#386641]/20 transition shadow-2xs flex items-center gap-1 disabled:opacity-50"
                    title="クリップボードから追加スクショを貼り付け"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>貼付</span>
                  </button>
                </div>
              </div>

              {/* Top Banner with Type and Target selector */}
              <div className="p-3.5 rounded-2xl bg-[#FDF0D5]/70 border border-[#DDA15E]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#386641]">種別:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { type: "FLIGHT", label: "✈️ フライト" },
                      { type: "TRAIN", label: "🚄 新幹線・電車" },
                      { type: "HOTEL", label: "🏨 ホテル" },
                      { type: "BUS", label: "🚌 バス" },
                      { type: "CAR", label: "🚗 レンタカー" },
                      { type: "OTHER", label: "🎟 その他" },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          const isHotel = item.type === "HOTEL";
                          setFormData({
                            ...formData,
                            bookingType: item.type,
                            targetDestination: isHotel ? "PLACE" : "SCHEDULE",
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          formData.bookingType === item.type
                            ? "bg-[#C1121F] text-white shadow-2xs"
                            : "bg-white/80 text-[#386641] hover:bg-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Destination Switcher */}
                <div className="flex items-center gap-1.5 text-xs text-[#386641]">
                  <span className="font-semibold text-[11px] text-[#386641]/70">登録先:</span>
                  <select
                    value={formData.targetDestination}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetDestination: e.target.value as "SCHEDULE" | "PLACE",
                      })
                    }
                    className="bg-white border border-[#386641]/20 rounded-lg px-2 py-1 text-xs font-bold text-[#386641] focus:outline-none"
                  >
                    <option value="SCHEDULE">🗓 タイムライン日程</option>
                    <option value="PLACE">🏨 宿泊スポット一覧</option>
                  </select>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-[#386641]">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">
                    タイトル・予約名 <span className="text-[#C1121F]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-sm font-bold text-[#386641] focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                    placeholder="例: ANA 008便 成田 → ホノルル"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block font-bold mb-1">
                    {formData.bookingType === "HOTEL" ? "チェックイン日" : "日付"} <span className="text-[#C1121F]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                  />
                </div>

                {/* Check-out Date (Hotel) or Flight Number */}
                {formData.bookingType === "HOTEL" ? (
                  <div>
                    <label className="block font-bold mb-1">チェックアウト日</label>
                    <input
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                      className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold mb-1">便名・列車名</label>
                    <input
                      type="text"
                      value={formData.flightNumber}
                      onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                      className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                      placeholder="例: NH008 / のぞみ25号"
                    />
                  </div>
                )}

                {/* Times */}
                <div>
                  <label className="block font-bold mb-1">
                    {formData.bookingType === "HOTEL" ? "チェックイン可能時刻" : "出発時刻"}
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {formData.bookingType === "HOTEL" ? "チェックアウト時刻" : "到着時刻"}
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                  />
                </div>

                {/* Departure & Arrival (Transport only) */}
                {formData.bookingType !== "HOTEL" && (
                  <>
                    <div>
                      <label className="block font-bold mb-1">出発地・駅・空港</label>
                      <input
                        type="text"
                        value={formData.fromPlace}
                        onChange={(e) => setFormData({ ...formData, fromPlace: e.target.value })}
                        className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                        placeholder="例: 成田空港 第1T (NRT)"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">到着地・駅・空港</label>
                      <input
                        type="text"
                        value={formData.toPlace}
                        onChange={(e) => setFormData({ ...formData, toPlace: e.target.value })}
                        className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                        placeholder="例: ホノルル空港 (HNL)"
                      />
                    </div>
                  </>
                )}

                {/* Booking Number */}
                <div>
                  <label className="block font-bold mb-1">予約番号 / 予約コード</label>
                  <input
                    type="text"
                    value={formData.bookingNumber}
                    onChange={(e) => setFormData({ ...formData, bookingNumber: e.target.value })}
                    className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                    placeholder="例: ABC123XYZ"
                  />
                </div>

                {/* Booking Site */}
                <div>
                  <label className="block font-bold mb-1">予約サイト・会社</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={formData.bookingSite}
                      onChange={(e) => setFormData({ ...formData, bookingSite: e.target.value })}
                      className="flex-1 bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                      placeholder="例: ANA公式, Booking.com"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setFormData({ ...formData, bookingSite: e.target.value });
                      }}
                      className="bg-white border border-[#386641]/20 rounded-xl px-2 text-xs text-[#386641]"
                      defaultValue=""
                    >
                      <option value="" disabled>プリセット</option>
                      {PRESET_BOOKING_SITES.map((site) => (
                        <option key={site} value={site}>{site}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cancel Deadline */}
                <div>
                  <label className="block font-bold mb-1 text-[#C1121F]">
                    無料キャンセル期限
                  </label>
                  <input
                    type="text"
                    value={formData.cancelDeadline}
                    onChange={(e) => setFormData({ ...formData, cancelDeadline: e.target.value })}
                    className="w-full bg-white border border-[#C1121F]/30 rounded-xl px-3 py-2 text-xs text-[#C1121F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C1121F]/20"
                    placeholder="例: 2026-03-18 23:59"
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block font-bold mb-1">費用・金額 (円)</label>
                  <input
                    type="text"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: normalizeNumberInput(e.target.value) })
                    }
                    className="w-full bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                    placeholder="例: 35000"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-bold mb-1">支払方法・利用カード</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="flex-1 bg-white border border-[#386641]/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                      placeholder="例: 楽天カード, 現地決済"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setFormData({ ...formData, paymentMethod: e.target.value });
                      }}
                      className="bg-white border border-[#386641]/20 rounded-xl px-2 text-xs text-[#386641]"
                      defaultValue=""
                    >
                      <option value="" disabled>プリセット</option>
                      {PRESET_PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Breakfast toggle for hotel */}
                {formData.bookingType === "HOTEL" && (
                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                      <input
                        type="checkbox"
                        checked={formData.hasBreakfast}
                        onChange={(e) =>
                          setFormData({ ...formData, hasBreakfast: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#386641] accent-[#386641]"
                      />
                      <span>🍳 朝食付き</span>
                    </label>
                  </div>
                )}

                {/* Memo */}
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">メモ・特記事項</label>
                  <textarea
                    rows={2}
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    className="w-full bg-white border border-[#386641]/20 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#386641]/20"
                    placeholder="座席番号、受託手荷物、部屋タイプなど"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#386641]/10">
                <button
                  type="button"
                  onClick={() => setStep("INPUT")}
                  className="px-4 py-2.5 rounded-xl border border-[#386641]/20 text-[#386641] text-xs font-bold hover:bg-[#386641]/5 transition"
                >
                  🔄 別の画像を読み取る
                </button>

                <button
                  type="button"
                  onClick={handleSaveToTrip}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#386641] hover:bg-[#2b5033] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {formData.targetDestination === "PLACE" ? "ホテル一覧に追加" : "タイムラインに登録する"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
