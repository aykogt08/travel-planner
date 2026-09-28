import { Trip } from "@/types/trip";

const CATEGORY_NAMES: Record<string, string> = {
  FOOD: "🍽️ ご飯・グルメ",
  SIGHTSEEING: "🏛️ 観光スポット",
  CAFE: "☕ カフェ・甘味",
  HOTEL: "🏨 宿泊・ホテル",
  SHOPPING: "🛍️ ショッピング",
  ACTIVITY: "🎟️ アクティビティ",
  TRANSPORT: "🚆 移動・交通",
  OTHER: "🔖 その他",
};

const TRANSPORT_NAMES: Record<string, string> = {
  WALK: "🚶 徒歩",
  TRAIN: "🚆 電車・新幹線",
  BUS: "🚌 バス",
  CAR: "🚗 車・レンタカー",
  FLIGHT: "✈️ 飛行機",
  SHIP: "🚢 船・フェリー",
  TAXI: "🚕 タクシー",
  OTHER: "その他",
};

export function generateOfflineHtmlBookmark(trip: Trip): string {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return "-";
    return `¥${val.toLocaleString()}`;
  };

  // Project schedules (expanding hotel checkin / checkout)
  interface ExportTimelineItem {
    dateStr: string;
    timeStr: string;
    title: string;
    category: string;
    transportType?: string | null;
    flightNumber?: string | null;
    duration?: number | null;
    fromPlace?: string | null;
    toPlace?: string | null;
    memo?: string | null;
    cost?: number | null;
    isHotelCheckIn?: boolean;
    isHotelCheckOut?: boolean;
    stayDetails?: string;
  }

  const scheduleGroups: Record<string, ExportTimelineItem[]> = {};

  trip.schedules.forEach((s) => {
    const sDate = s.date.split("T")[0];
    const sOutDate = s.checkOutDate ? s.checkOutDate.split("T")[0] : null;

    if (s.category === "HOTEL") {
      let nights = 1;
      if (sOutDate && sOutDate > sDate) {
        nights = Math.ceil(
          (new Date(sOutDate).getTime() - new Date(sDate).getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      const stayRangeText = sOutDate
        ? `${formatDate(sDate)} 〜 ${formatDate(sOutDate)} (${nights}泊)`
        : `${formatDate(sDate)} (日帰り・1日)`;

      // Check-in item
      if (!scheduleGroups[sDate]) scheduleGroups[sDate] = [];
      scheduleGroups[sDate].push({
        dateStr: sDate,
        timeStr: s.startTime || "15:00",
        title: `🏨 ${s.title} (チェックイン)`,
        category: "HOTEL",
        isHotelCheckIn: true,
        stayDetails: `チェックイン: ${s.startTime || "15:00"} → チェックアウト: ${sOutDate ? formatDate(sOutDate) : "翌日"} ${s.endTime || "11:00"} [${nights}泊]${s.hasBreakfast ? " 【☕ 朝食付き】" : " 【素泊まり】"}`,
        memo: s.memo,
        cost: s.cost,
      });

      // Check-out item
      if (sOutDate && sOutDate !== sDate) {
        if (!scheduleGroups[sOutDate]) scheduleGroups[sOutDate] = [];
        scheduleGroups[sOutDate].push({
          dateStr: sOutDate,
          timeStr: s.endTime || "11:00",
          title: `🏨 ${s.title} (チェックアウト)`,
          category: "HOTEL",
          isHotelCheckOut: true,
          stayDetails: `👋 チェックアウト・出発 (宿泊期間: ${stayRangeText})`,
          memo: s.memo,
        });
      }
    } else {
      if (!scheduleGroups[sDate]) scheduleGroups[sDate] = [];
      scheduleGroups[sDate].push({
        dateStr: sDate,
        timeStr: s.startTime || "",
        title: s.title,
        category: s.category,
        transportType: s.transportType,
        flightNumber: s.flightNumber,
        duration: s.duration,
        fromPlace: s.fromPlace,
        toPlace: s.toPlace,
        memo: s.memo,
        cost: s.cost,
      });
    }
  });

  // Sort dates
  const sortedDates = Object.keys(scheduleGroups).sort();

  // Group places by category
  const placeGroups: Record<string, typeof trip.places> = {};
  trip.places.forEach((p) => {
    const cat = p.category || "OTHER";
    if (!placeGroups[cat]) placeGroups[cat] = [];
    placeGroups[cat].push(p);
  });

  // Packing list
  const packedCount = trip.packingList.filter((p) => p.isPacked).length;
  const totalPacking = trip.packingList.length;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>✈️ 旅のしおり - ${trip.title}</title>
  <style>
    :root {
      --primary: #292524;
      --accent: #f97316;
      --bg: #fafaf9;
      --card-bg: #ffffff;
      --border: #e7e5e4;
      --text: #1c1917;
      --text-muted: #78716c;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 16px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border);
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .header {
      background: #1c1917;
      color: white;
      padding: 32px 24px;
      text-align: center;
      position: relative;
    }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: #fff;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .title { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { font-size: 14px; opacity: 0.85; margin-bottom: 12px; }
    .dates { font-size: 13px; opacity: 0.75; }
    .nav-bar {
      display: flex;
      justify-content: center;
      gap: 12px;
      background: #f5f5f4;
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }
    .btn-action {
      background: var(--primary);
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .section { padding: 24px; border-bottom: 1px solid var(--border); }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-left: 4px solid var(--accent);
      padding-left: 8px;
    }
    .day-header {
      font-size: 15px;
      font-weight: 700;
      background: #f5f5f4;
      padding: 8px 12px;
      border-radius: 8px;
      margin: 16px 0 12px;
    }
    .timeline { position: relative; padding-left: 20px; border-left: 2px solid var(--border); margin-left: 8px; }
    .timeline-item {
      position: relative;
      margin-bottom: 16px;
      padding-left: 12px;
    }
    .timeline-item::before {
      content: "";
      position: absolute;
      left: -27px;
      top: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid white;
    }
    .timeline-time {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
    }
    .timeline-title { font-size: 15px; font-weight: 600; }
    .timeline-desc { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .card {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      background: #fff;
    }
    .card-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .card-meta { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
    .card-memo { font-size: 13px; color: #444; background: #fdfdfd; padding: 6px; border-radius: 6px; margin-top: 6px; border: 1px dashed var(--border); }
    .tag {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f5f5f4;
      color: #57534e;
      margin-right: 4px;
    }
    .packing-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
    }
    .packing-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      padding: 6px 10px;
      background: #fafaf9;
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      background: #f5f5f4;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border: none; }
      .nav-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">📴 オフライン対応 旅のしおり</div>
      <h1 class="title">${trip.title}</h1>
      ${trip.destination ? `<div class="subtitle">📍 目的地: ${trip.destination}</div>` : ""}
      <div class="dates">📅 ${formatDate(trip.startDate)} 〜 ${formatDate(trip.endDate)}</div>
      ${trip.budget ? `<div class="dates" style="margin-top: 4px;">💰 目安予算: ${formatCurrency(trip.budget)}</div>` : ""}
    </div>

    <div class="nav-bar">
      <button class="btn-action" onclick="window.print()">🖨️ しおりを印刷 / PDF保存</button>
      <button class="btn-action" onclick="alert('このファイルはオフライン環境でも閲覧可能です！スマホのファイルアプリに保存してお使いいただけます。')">ℹ️ オフライン閲覧ガイド</button>
    </div>

    ${trip.description ? `
    <div class="section">
      <div class="section-title">📝 旅のメモ・概要</div>
      <p style="font-size: 14px; white-space: pre-wrap;">${trip.description}</p>
    </div>
    ` : ""}

    <!-- タイムライン / 日程 -->
    <div class="section">
      <div class="section-title">🗓️ 旅程タイムライン</div>
      ${sortedDates.length === 0 ? `<p style="font-size: 13px; color: var(--text-muted);">まだスケジュールが登録されていません。</p>` : ""}
      ${sortedDates.map((dateStr, idx) => `
        <div class="day-header">Day ${idx + 1} (${formatDate(dateStr)})</div>
        <div class="timeline">
          ${scheduleGroups[dateStr]
            .sort((a, b) => a.timeStr.localeCompare(b.timeStr))
            .map((s) => `
            <div class="timeline-item">
              <div class="timeline-time">${s.timeStr || "時間指定なし"}</div>
              <div class="timeline-title">${s.title}</div>
              ${s.stayDetails ? `<div class="timeline-desc" style="color: #4338ca; background: #eef2ff; padding: 4px 8px; border-radius: 6px; margin: 4px 0; font-size: 12px; display: inline-block;">🏨 ${s.stayDetails}</div>` : ""}
              ${s.transportType ? `<div class="timeline-desc">${TRANSPORT_NAMES[s.transportType] || s.transportType} ${s.flightNumber ? `(${s.flightNumber})` : ""} ${s.duration ? `所要 ${s.duration}分` : ""}</div>` : ""}
              ${s.fromPlace || s.toPlace ? `<div class="timeline-desc">📍 ${s.fromPlace || ""} → ${s.toPlace || ""}</div>` : ""}
              ${s.memo ? `<div class="card-memo">💡 ${s.memo}</div>` : ""}
              ${s.cost ? `<div class="timeline-desc" style="color: var(--accent); font-weight: 600;">費用: ${formatCurrency(s.cost)}</div>` : ""}
            </div>
          `).join("")}
        </div>
      `).join("")}
    </div>

    <!-- ご飯・観光地スポット一覧 -->
    <div class="section">
      <div class="section-title">📍 行き先・飲食店・観光地リスト</div>
      ${trip.places.length === 0 ? `<p style="font-size: 13px; color: var(--text-muted);">まだスポットが登録されていません。</p>` : ""}
      ${Object.keys(placeGroups).map((cat) => `
        <h4 style="font-size: 14px; margin: 12px 0 8px; color: #444;">${CATEGORY_NAMES[cat] || cat}</h4>
        <div class="card-grid">
          ${placeGroups[cat].map((p) => `
            <div class="card">
              <div class="card-title">${p.name} ${p.visited ? "✅ (訪問済)" : ""}</div>
              <div class="card-meta">
                ${p.cost ? `<span class="tag">${p.category === "HOTEL" ? "宿泊費" : "予算"}: ${formatCurrency(p.cost)}</span>` : ""}
                ${p.reservationStatus === "BOOKED" ? `<span class="tag" style="background: #dcfce7; color: #166534;">予約済</span>` : ""}
                ${p.reservationStatus === "NEED_BOOKING" ? `<span class="tag" style="background: #fee2e2; color: #991b1b;">要予約</span>` : ""}
                ${p.category === "HOTEL" ? (p.hasBreakfast ? `<span class="tag" style="background: #fef3c7; color: #92400e;">☕ 朝食付き</span>` : `<span class="tag">素泊まり</span>`) : ""}
              </div>
              ${p.category === "HOTEL" && (p.checkInDate || p.checkOutDate) ? `
                <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 6px 8px; margin: 6px 0; font-size: 11px; color: #3730a3;">
                  🏨 <strong>宿泊:</strong> IN: ${p.checkInDate ? formatDate(p.checkInDate) : "-"}${p.checkInTime ? ` (${p.checkInTime})` : ""} 〜 OUT: ${p.checkOutDate ? formatDate(p.checkOutDate) : "-"}${p.checkOutTime ? ` (${p.checkOutTime})` : ""}${p.hasBreakfast ? " 【☕ 朝食付き】" : ""}
                </div>
              ` : ""}
              ${p.businessHours && p.category !== "HOTEL" ? `<div class="card-meta">⏰ ${p.businessHours}</div>` : ""}
              ${p.address ? `<div class="card-meta">📍 ${p.address}</div>` : ""}
              ${p.mapUrl ? `<div class="card-meta"><a href="${p.mapUrl}" target="_blank" style="color: #2563eb;">🗺️ Google マップを開く</a></div>` : ""}
              ${p.websiteUrl ? `<div class="card-meta"><a href="${p.websiteUrl}" target="_blank" style="color: #2563eb;">🔗 公式サイト・食べログ</a></div>` : ""}
              ${p.memo ? `<div class="card-memo">💬 ${p.memo}</div>` : ""}
            </div>
          `).join("")}
        </div>
      `).join("")}
    </div>

    <!-- 持ち物チェックリスト -->
    ${trip.packingList.length > 0 ? `
    <div class="section">
      <div class="section-title">🎒 持ち物リスト (${packedCount}/${totalPacking} 準備完了)</div>
      <div class="packing-list">
        ${trip.packingList.map((item) => `
          <div class="packing-item">
            <input type="checkbox" ${item.isPacked ? "checked" : ""} disabled>
            <span style="${item.isPacked ? "text-decoration: line-through; opacity: 0.6;" : ""}">${item.name}</span>
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    <!-- やりたいことコレクション -->
    ${trip.wishes && trip.wishes.length > 0 ? `
    <div class="section">
      <div class="section-title">✨ やりたいことコレクション (${trip.wishes.length}個)</div>
      <div class="card-grid">
        ${trip.wishes.map((w) => {
          let withWhomArr: string[] = [];
          try {
            withWhomArr = w.withWhom ? JSON.parse(w.withWhom) : [];
          } catch {
            withWhomArr = w.withWhom ? [w.withWhom] : [];
          }
          const isBest = w.status === "BEST";
          const statusLabels: Record<string, string> = {
            IDEA: "思いついた",
            CANDIDATE: "候補",
            DONE: "やった",
            BEST: "★ 最高だった",
            NORMAL: "普通だった",
            SKIPPED: "やらなかった",
          };
          return `
            <div class="card" style="${isBest ? "border: 2px solid #f59e0b; background: #fffbeb;" : ""}">
              <div class="card-title">${w.title}</div>
              <div class="card-meta">
                <span class="tag" style="${isBest ? "background: #fef3c7; color: #92400e; font-weight: bold;" : ""}">${statusLabels[w.status] || w.status}</span>
                ${w.city ? `<span class="tag">${w.city}</span>` : ""}
                ${withWhomArr.map((person) => `<span class="tag">${person}</span>`).join("")}
                <span class="tag">やりたい度: ${w.priority}</span>
              </div>
              ${w.memo ? `<div class="card-memo">💬 ${w.memo}</div>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </div>
    ` : ""}

    <div class="footer">
      生成日時: ${new Date().toLocaleString("ja-JP")} | ✈️ Marcaderno オフライン版しおり
    </div>
  </div>
</body>
</html>`;
}

// Download helper
export function downloadOfflineBookmark(trip: Trip): void {
  const html = generateOfflineHtmlBookmark(trip);
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `旅のしおり_${trip.title || "trip"}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
