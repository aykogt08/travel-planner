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
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-amber-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-stone-200 bg-stone-50/80 backdrop-blur-md sticky top-0 z-50">
        <span className="text-xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
          <span>✈️ TravelPlanner</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/trips"
            className="text-xs sm:text-sm font-semibold px-4 py-2 text-stone-600 hover:text-stone-900 transition"
          >
            プラン一覧
          </Link>
          <Link
            href="/trips/new"
            className="text-xs sm:text-sm font-bold px-5 py-2.5 bg-stone-900 text-white rounded-full hover:bg-stone-700 transition shadow-xs flex items-center gap-1.5"
          >
            <Plane className="w-3.5 h-3.5" />
            + 新しい旅を計画
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold mb-6">
          <HardDrive className="w-3.5 h-3.5 text-stone-500" />
          <span>電波が届かない場所でも安心・オフライン対応</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900 mb-4 leading-snug">
          <span className="inline-block">行きたいお店も観光地も。</span>{" "}
          <span className="inline-block text-stone-600">旅のスケジュールを手のひらに。</span>
        </h1>

        <p className="text-stone-600 max-w-xl text-sm sm:text-base leading-relaxed mb-8">
          食べたいグルメや観光スポットをストックして、タイムラインで旅程をサクサク組み立て。
          飛行機内や旅先の圏外でも、保存したしおりをオフラインで快適に確認できます。
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/trips/new"
            className="w-full sm:w-auto px-8 py-3.5 bg-stone-900 text-white rounded-2xl text-sm font-bold hover:bg-stone-700 transition shadow-md flex items-center justify-center gap-2"
          >
            <Plane className="w-4 h-4" />
            旅のプランを作る
          </Link>
          <Link
            href="/trips"
            className="w-full sm:w-auto px-8 py-3.5 bg-white border border-stone-200 text-stone-800 rounded-2xl text-sm font-bold hover:bg-stone-100 transition shadow-xs flex items-center justify-center gap-2"
          >
            保存したプランを見る <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            スムーズな旅行計画をサポートする機能
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-2">
            個人利用に特化した、シンプルで使いやすい旅のオールインワンツール
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mb-4">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-2">
              行きたいお店・スポット管理
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
              ご飯屋さんやカフェ、観光地をカテゴリ別に記録。予算や営業時間、Googleマップリンク、要予約メモを一元管理できます。
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-2">
              旅程タイムライン
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
              Day 1、Day 2 と日ごとの時間割を作成。新幹線や飛行機の便名・所要時間、訪問スポットを時間軸で分かりやすく整理。
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mb-4">
              <HardDrive className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-2">
              完全オフライン対応
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
              端末内DB（IndexedDB）への自動キャッシュ＆単一HTMLしおり出力。ネットが繋がらない機内や海外でも100%閲覧できます。
            </p>
          </div>
        </div>

        {/* Additional highlight banner */}
        <div className="mt-8 bg-stone-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 text-amber-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>荷物・予算もこれ1つで</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              持ち物チェックリスト & 予算管理も完備
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm mt-2 max-w-lg leading-relaxed">
              忘れ物防止の定番持ち物テンプレートや、カテゴリ別の費用集計グラフで、旅の準備から当日までしっかりサポートします。
            </p>
          </div>

          <Link
            href="/trips/new"
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl text-sm transition whitespace-nowrap shadow-xs"
          >
            今すぐプランを作る
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-400">
        <p>© 2026 TravelPlanner. Built with Next.js, TypeScript & Prisma.</p>
      </footer>
    </main>
  );
}