import Link from "next/link";
import {
  Utensils,
  MapPin,
  Calendar,
  HardDrive,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Plane,
  Luggage,
  PieChart,
  Camera,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDF0D5] text-[#386641] font-sans selection:bg-[#DDA15E]/30">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-[#386641]/10 bg-[#FDF0D5]/90 backdrop-blur-md sticky top-0 z-50">
        <span className="text-2xl font-bold tracking-wider text-[#386641] font-brand">
          Marcaderno
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/photo-lab"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-2 text-[#003049] bg-[#003049]/10 hover:bg-[#003049]/15 rounded-xl transition"
          >
            <span>🔬</span>
            <span>写真AIラボ</span>
          </Link>
          <Link
            href="/collage"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 text-[#386641]/80 hover:text-[#386641] hover:bg-[#386641]/5 rounded-xl transition"
          >
            <Camera className="w-4 h-4 text-[#C1121F]" />
            <span>コラージュ</span>
          </Link>
          <Link
            href="/trips"
            className="text-xs sm:text-sm font-semibold px-4 py-2 text-[#386641]/70 hover:text-[#386641] transition"
          >
            プラン一覧
          </Link>
          <Link
            href="/trips/new"
            className="text-xs sm:text-sm font-bold px-5 py-2.5 bg-[#C1121F] text-white rounded-full hover:bg-[#a50f1a] transition shadow-xs flex items-center gap-1.5"
          >
            <Plane className="w-3.5 h-3.5" />
            + 新しい旅を計画
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#003049]/10 border border-[#003049]/20 text-[#003049] text-xs font-bold mb-6">
          <HardDrive className="w-3.5 h-3.5 text-[#003049]" />
          <span>電波が届かない場所でも安心・オフライン対応</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#386641] mb-4 leading-snug">
          <span className="inline-block">行きたいお店も観光地も。</span>{" "}
          <span className="inline-block text-[#386641]/70">旅のスケジュールを手のひらに。</span>
        </h1>

        <p className="text-[#386641]/80 max-w-xl text-sm sm:text-base leading-relaxed mb-8">
          食べたいグルメや観光スポットをストックして、タイムラインで旅程をサクサク組み立て。
          飛行機内や旅先の圏外でも、保存したしおりをオフラインで快適に確認できます。
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/trips/new"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#C1121F] text-white rounded-2xl text-sm font-bold hover:bg-[#a50f1a] transition shadow-md flex items-center justify-center gap-2"
          >
            <Plane className="w-4 h-4" />
            旅のプランを作る
          </Link>
          <Link
            href="/collage"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#003049] text-white rounded-2xl text-sm font-bold hover:bg-[#002235] transition shadow-md flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-[#DDA15E]" />
            写真コラージュを作る
          </Link>
          <Link
            href="/trips"
            className="w-full sm:w-auto px-6 py-3.5 bg-white/80 border border-[#386641]/20 text-[#386641] rounded-2xl text-sm font-bold hover:bg-white hover:border-[#386641]/40 transition shadow-xs flex items-center justify-center gap-2"
          >
            保存したプランを見る <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#386641]">
            スムーズな旅行計画をサポートする機能
          </h2>
          <p className="text-[#386641]/60 text-xs sm:text-sm mt-2">
            個人利用に特化した、シンプルで使いやすい旅のオールインワンツール
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white/90 border border-[#DDA15E]/30 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-[#DDA15E]/20 text-[#386641] flex items-center justify-center mb-4">
              <Utensils className="w-6 h-6 text-[#DDA15E]" />
            </div>
            <h3 className="font-bold text-base text-[#386641] mb-2">
              行きたいお店・スポット管理
            </h3>
            <p className="text-[#386641]/70 text-xs sm:text-sm leading-relaxed">
              ご飯屋さんやカフェ、観光地をカテゴリ別に記録。予算や営業時間、Googleマップリンク、要予約メモを一元管理できます。
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/90 border border-[#DDA15E]/30 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-[#386641]/10 text-[#386641] flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-[#386641]" />
            </div>
            <h3 className="font-bold text-base text-[#386641] mb-2">
              旅程タイムライン
            </h3>
            <p className="text-[#386641]/70 text-xs sm:text-sm leading-relaxed">
              Day 1、Day 2 と日ごとの時間割を作成。新幹線や飛行機の便名・所要時間、訪問スポットを時間軸で分かりやすく整理。
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/90 border border-[#DDA15E]/30 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-[#003049]/15 text-[#003049] flex items-center justify-center mb-4">
              <HardDrive className="w-6 h-6 text-[#003049]" />
            </div>
            <h3 className="font-bold text-base text-[#386641] mb-2">
              完全オフライン対応
            </h3>
            <p className="text-[#386641]/70 text-xs sm:text-sm leading-relaxed">
              端末内DB（IndexedDB）への自動キャッシュ＆単一HTMLしおり出力。ネットが繋がらない機内や海外でも100%閲覧できます。
            </p>
          </div>

          {/* Feature 4: Collage */}
          <Link
            href="/collage"
            className="group bg-white/90 border border-[#DDA15E]/30 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-[#DDA15E] transition flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#C1121F]/10 text-[#C1121F] flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Camera className="w-6 h-6 text-[#C1121F]" />
              </div>
              <h3 className="font-bold text-base text-[#386641] mb-2 flex items-center gap-1.5">
                <span>自動旅行コラージュ</span>
                <span className="text-[10px] bg-[#C1121F] text-white px-2 py-0.5 rounded-full font-bold">New</span>
              </h3>
              <p className="text-[#386641]/70 text-xs sm:text-sm leading-relaxed">
                旅行中の写真を選ぶだけ。ポラロイドやテープ風など10種のスタイルで、圏外でもスクラップブック画像を自動生成。
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#386641]/10 flex items-center gap-1 text-xs font-bold text-[#C1121F]">
              <span>試してみる</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>

        {/* Additional highlight banner */}
        <div className="mt-8 bg-[#386641] text-[#FDF0D5] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF0D5]/15 text-[#DDA15E] text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>荷物・予算もこれ1つで</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#FDF0D5]">
              持ち物チェックリスト & 予算管理も完備
            </h3>
            <p className="text-[#FDF0D5]/80 text-xs sm:text-sm mt-2 max-w-lg leading-relaxed">
              忘れ物防止の定番持ち物テンプレートや、カテゴリ別の費用集計グラフで、旅の準備から当日までしっかりサポートします。
            </p>
          </div>

          <Link
            href="/trips/new"
            className="px-8 py-3.5 bg-[#C1121F] hover:bg-[#a50f1a] text-white font-bold rounded-2xl text-sm transition whitespace-nowrap shadow-xs"
          >
            今すぐプランを作る
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#386641]/10 py-8 text-center text-xs text-[#386641]/50">
        <p>© 2026 Marcaderno. Built with Next.js, TypeScript & Prisma.</p>
      </footer>
    </main>
  );
}