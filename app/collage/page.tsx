"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import CollageStudio from "@/components/collage/CollageStudio";

export default function CollagePage() {
  return (
    <main className="min-h-screen bg-[#FDF0D5] text-[#386641] font-sans selection:bg-[#DDA15E]/30 pb-16">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-[#386641]/10 bg-[#FDF0D5]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#386641]/70 hover:text-[#386641] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ホームへ</span>
          </Link>
          <span className="text-[#386641]/30">/</span>
          <span className="text-sm font-bold text-[#386641]">コラージュスタジオ</span>
        </div>

        <Link
          href="/trips"
          className="text-xs sm:text-sm font-semibold px-4 py-2 text-[#386641]/70 hover:text-[#386641] transition"
        >
          プラン一覧
        </Link>
      </nav>

      {/* Main Studio View */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <CollageStudio />
      </div>
    </main>
  );
}
