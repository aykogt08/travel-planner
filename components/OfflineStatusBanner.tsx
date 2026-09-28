"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, CheckCircle2, RefreshCw } from "lucide-react";

export default function OfflineStatusBanner({
  lastSynced,
  onManualSync,
  onOpenGuide,
}: {
  lastSynced?: Date | null;
  onManualSync?: () => void;
  onOpenGuide?: () => void;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md px-4 py-3 rounded-2xl shadow-lg border transition-all duration-300 flex items-center justify-between gap-3 text-xs md:text-sm ${
        isOnline
          ? "bg-emerald-900/90 text-emerald-100 border-emerald-700 backdrop-blur-md"
          : "bg-amber-950/95 text-amber-100 border-amber-800 backdrop-blur-md"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isOnline ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>オンライン (同期済み)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-300 font-medium flex-wrap">
            <WifiOff className="w-4 h-4 text-amber-300" />
            <span>オフラインモード</span>
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="underline text-amber-200 hover:text-white text-[11px] font-normal"
              >
                （利用可能機能ガイド）
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onManualSync && isOnline && (
          <button
            onClick={onManualSync}
            className="p-1 hover:bg-emerald-800 rounded transition text-emerald-200"
            title="データを同期"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => setShowBanner(false)}
          className="text-stone-400 hover:text-white px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
