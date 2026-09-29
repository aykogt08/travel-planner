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
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== "undefined") {
      const online = navigator.onLine;
      setIsOnline(online);
      if (!online) {
        setShowBanner(true);
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner || isDismissed) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md px-4 py-3 rounded-2xl shadow-xl border transition-all duration-300 flex items-center justify-between gap-3 text-xs md:text-sm ${
        isOnline
          ? "bg-[#003049]/95 text-white border-[#003049] backdrop-blur-md"
          : "bg-[#386641]/95 text-white border-[#DDA15E]/50 backdrop-blur-md"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isOnline ? (
          <div className="flex items-center gap-1.5 text-white font-medium">
            <Wifi className="w-4 h-4 text-[#DDA15E]" />
            <span>オンライン (同期済み)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[#FDF0D5] font-medium flex-wrap">
            <WifiOff className="w-4 h-4 text-[#DDA15E]" />
            <span>オフラインモード</span>
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="underline text-[#DDA15E] hover:text-white text-[11px] font-normal"
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
            className="p-1 hover:bg-white/20 rounded transition text-white"
            title="データを同期"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => {
            setShowBanner(false);
            setIsDismissed(true);
          }}
          className="text-white/60 hover:text-white p-1 rounded-lg transition font-bold"
          title="閉じる"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
