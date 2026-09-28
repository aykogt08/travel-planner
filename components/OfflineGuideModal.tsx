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
    <div className="fixed inset-0 z-50 bg-[#003049]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#DDA15E]/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#003049]/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#003049]/5 text-[#003049]">
              <HardDrive className="w-5 h-5 text-[#003049]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#003049]">オフライン利用 & しおり出力ガイド</h3>
              <p className="text-xs text-[#003049]/70">
                飛行機内や電波のない場所での動作と活用方法
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#003049]/40 hover:text-[#003049] p-1.5 rounded-full hover:bg-[#003049]/5"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 text-sm">
          {/* Section: Can / Cannot comparison */}
          <div className="bg-[#FDF0D5]/40 border border-[#DDA15E]/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#003049]" />
              <h4 className="font-bold text-[#003049] text-xs sm:text-sm">
                オフライン・オンライン対応状況
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* オフラインでできること */}
              <div className="bg-white/95 border border-[#386641]/30 rounded-xl p-3.5 shadow-2xs">
                <div className="font-bold text-[#386641] flex items-center gap-1.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#386641]" />
                  <span>✈️ 機内・オフラインでできること</span>
                </div>
                <ul className="flex flex-col gap-1.5 text-[#003049]/80 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#386641] font-bold">✓</span>
                    <span>タイムライン・宿・移動の閲覧</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#386641] font-bold">✓</span>
                    <span>スポットの新規追加・編集・メモ確認</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#386641] font-bold">✓</span>
                    <span>タイムラインへの予定追加・完了チェック</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#386641] font-bold">✓</span>
                    <span>持ち物チェック（タップで完了更新）</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#386641] font-bold">✓</span>
                    <span>やりたいことの追加・ステータス更新（「やった」「最高だった」等）</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#386641] font-bold">✓</span>
                    <span>旅のお題閲覧・「今日これやりたい」抽出</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#386641] font-bold">✓</span>
                    <span>ダウンロードしたHTMLしおりの完全閲覧</span>
                  </li>
                </ul>
              </div>

              {/* オンラインが必要なこと */}
              <div className="bg-white/95 border border-[#DDA15E]/40 rounded-xl p-3.5 shadow-2xs">
                <div className="font-bold text-[#003049] flex items-center gap-1.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#DDA15E]" />
                  <span>🌐 オンライン（通信）が必要なこと</span>
                </div>
                <ul className="flex flex-col gap-1.5 text-[#003049]/80 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C1121F] font-bold">•</span>
                    <span>初めて見るプランの初回読み込み</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C1121F] font-bold">•</span>
                    <span>Googleマップや公式サイトへの外部リンク移動</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C1121F] font-bold">•</span>
                    <span>別端末とのリアルタイムデータ共有</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C1121F] font-bold">•</span>
                    <span>サーバへの恒久保存（通信復帰時に自動反映）</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-[#003049]/80 bg-white/80 border border-[#DDA15E]/30 rounded-xl p-2.5 leading-relaxed">
              💡 <strong>機内で安心して使うコツ:</strong> 出発前（Wi-Fiがある場所）で一度このプランページを開いておくか、下の「しおり(HTML)をダウンロード」で保存しておくと、電波ゼロでも快適に使えます。
            </div>
          </div>
          {/* Method 1: Download Standalone HTML */}
          <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#003049] text-white mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#003049] text-sm">
                  1. 自立型「旅のしおり(HTML)」を保存
                </h4>
                <p className="text-xs text-[#003049]/70 mt-1 leading-relaxed">
                  CSSやデザインが1つのファイルに埋め込まれたHTMLファイルをダウンロードします。
                  スマートフォンの「ファイル」アプリに保存しておけば、<strong>通信が完全に遮断された環境（機内モードや海外SIMなし）でも100%閲覧可能</strong>です。
                </p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="mt-2 w-full py-3 bg-[#C1121F] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#C1121F]/90 transition flex items-center justify-center gap-2 shadow-xs"
            >
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
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
          <div className="bg-white/95 border border-[#DDA15E]/30 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#003049] text-white mt-0.5">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#003049] text-sm">2. 印刷 / PDFとして保存</h4>
                <p className="text-xs text-[#003049]/70 mt-1 leading-relaxed">
                  印刷用に最適化されたレイアウトで紙にプリントアウトしたり、PDFファイルとしてスマホやタブレットに保管できます。
                </p>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="mt-2 w-full py-2.5 bg-[#FDF0D5]/50 border border-[#DDA15E]/40 text-[#003049] rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#FDF0D5] transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#003049]" />
              しおりを印刷 / PDF保存
            </button>
          </div>

          {/* Method 3: PWA Home screen installation */}
          <div className="bg-[#DDA15E]/15 border border-[#DDA15E]/40 rounded-2xl p-5 flex flex-col gap-2.5">
            <div className="flex items-start gap-2 text-[#003049]">
              <Smartphone className="w-4 h-4 mt-0.5 text-[#DDA15E]" />
              <span className="font-bold text-xs">スマホのホーム画面に追加（PWA対応）</span>
            </div>
            <p className="text-xs text-[#003049]/80 leading-relaxed">
              ブラウザ（SafariまたはChrome）のメニューから<strong>「ホーム画面に追加」</strong>
              を行うと、ネイティブアプリのように全画面で起動でき、ブラウザ内キャッシュ（IndexedDB）からオフライン時でも高速に読み込まれます。
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[#003049]/60 hover:text-[#003049] text-xs font-semibold text-center"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
