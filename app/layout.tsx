import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marcaderno - 旅のしおり & やりたいこと手帖",
  description:
    "ご飯のお店や観光地をスケジュール立てて記録。飛行機内や海外でもオフラインでサクサク確認できる旅行計画アプリ。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Marcaderno",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={`${cormorant.variable} antialiased bg-stone-50 text-stone-800 font-sans min-h-screen`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
