"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Camera } from "lucide-react";
import PhotoLabView from "@/components/photo-lab/PhotoLabView";

export default function PhotoLabPage() {
  return (
    <main className="min-h-screen bg-[#FDF0D5] text-[#386641] font-sans selection:bg-[#DDA15E]/30 pb-20">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-12 py-3.5 sm:py-5 border-b border-[#386641]/10 bg-[#FDF0D5]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#386641]/70 hover:text-[#386641] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ホームへ</span>
          </Link>
          <span className="text-[#386641]/30">/</span>
          <span className="text-xs sm:text-sm font-bold text-[#386641] flex items-center gap-1.5">
            <span>🔬 写真AIラボ</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#003049]/10 text-[#003049]">
              MediaPipe
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/collage"
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold px-3 py-1.5 text-[#386641]/80 hover:text-[#386641] hover:bg-[#386641]/5 rounded-xl transition"
          >
            <Camera className="w-3.5 h-3.5 text-[#C1121F]" />
            <span>コラージュ</span>
          </Link>
          <Link
            href="/trips"
            className="text-xs sm:text-sm font-semibold px-3 py-1.5 text-[#386641]/70 hover:text-[#386641] transition"
          >
            プラン一覧
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-8 pt-4 sm:pt-8">
        <PhotoLabView />
      </div>
    </main>
  );
}
