"use client";

import { useState } from "react";
import { Trip } from "@/types/trip";
import { downloadOfflineBookmark } from "@/lib/export-bookmark";
import {
  Download,
  Printer,
  Smartphone,
  CheckCircle2,
  HardDrive,
  Share2,
  Info,
} from "lucide-react";

interface OfflineGuideModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

export default function OfflineGuideModal({
  trip,
  isOpen,
  onClose,
}: OfflineGuideModalProps) {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadOfflineBookmark(trip);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 5000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-stone-100 text-stone-700">
              <HardDrive className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-800">オフライン利用 & しおり出力ガイド</h3>
              <p className="text-xs text-stone-500">
                飛行機内や電波のない場所での動作と活用方法
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 text-sm">
          {/* Section: Can / Cannot comparison */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-stone-500" />
              <h4 className="font-bold text-stone-800 text-xs sm:text-sm">
                オフライン・オンライン対応状況
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* オフラインでできること */}
              <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>✈️ 機内・オフラインでできること</span>
                </div>
                <ul className="flex flex-col gap-1.5 text-stone-600 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>タイムライン・宿・移動の閲覧</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>スポット一覧・メモ・住所の確認</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>持ち物チェック（タップで完了更新）</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>やりたいことの追加・ステータス更新（「やった」「最高だった」等）</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>旅のお題閲覧・「今日これやりたい」抽出</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>ダウンロードしたHTMLしおりの完全閲覧</span>
                  </li>
                </ul>
              </div>

              {/* オンラインが必要なこと */}
              <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-2xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>🌐 オンライン（通信）が必要なこと</span>
                </div>
                <ul className="flex flex-col gap-1.5 text-stone-600 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>初めて見るプランの初回読み込み</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Googleマップや公式サイトへの外部リンク移動</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>別端末とのリアルタイムデータ共有</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>サーバへの恒久保存（通信復帰時に自動反映）</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-stone-600 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 leading-relaxed">
              💡 <strong>機内で安心して使うコツ:</strong> 出発前（Wi-Fiがある場所）で一度このプランページを開いておくか、下の「しおり(HTML)をダウンロード」で保存しておくと、電波ゼロでも快適に使えます。
            </div>
          </div>
          {/* Method 1: Download Standalone HTML */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-stone-900 text-white mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-stone-900 text-sm">
                  1. 自立型「旅のしおり(HTML)」を保存
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  CSSやデザインが1つのファイルに埋め込まれたHTMLファイルをダウンロードします。
                  スマートフォンの「ファイル」アプリに保存しておけば、<strong>通信が完全に遮断された環境（機内モードや海外SIMなし）でも100%閲覧可能</strong>です。
                </p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="mt-2 w-full py-3 bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-stone-700 transition flex items-center justify-center gap-2 shadow-xs"
            >
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  しおりをダウンロードしました！
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  しおり (HTML) をダウンロード
                </>
              )}
            </button>
          </div>

          {/* Method 2: Print / PDF */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-stone-800 text-white mt-0.5">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-stone-900 text-sm">2. 印刷 / PDFとして保存</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  印刷用に最適化されたレイアウトで紙にプリントアウトしたり、PDFファイルとしてスマホやタブレットに保管できます。
                </p>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="mt-2 w-full py-2.5 bg-white border border-stone-300 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold hover:bg-stone-100 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              しおりを印刷 / PDF保存
            </button>
          </div>

          {/* Method 3: PWA Home screen installation */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 flex flex-col gap-2.5">
            <div className="flex items-start gap-2 text-amber-900">
              <Smartphone className="w-4 h-4 mt-0.5 text-amber-700" />
              <span className="font-bold text-xs">スマホのホーム画面に追加（PWA対応）</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              ブラウザ（SafariまたはChrome）のメニューから<strong>「ホーム画面に追加」</strong>
              を行うと、ネイティブアプリのように全画面で起動でき、ブラウザ内キャッシュ（IndexedDB）からオフライン時でも高速に読み込まれます。
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-stone-500 hover:text-stone-800 text-xs font-semibold text-center"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
