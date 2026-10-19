// lib/dynamic-layout.ts
import { CollageTemplate, TemplateSlot } from "@/types/collage-template";

export type DynamicGridStyle = "modern_clean" | "travel_journal" | "polaroid_grid";

interface RowConfig {
  count: number;
  heightRatio: number;
}

/**
 * 写真枚数に応じた最適な行構成（行ごとの写真枚数と高さ比率）を算出
 */
function getRowDistribution(photoCount: number): RowConfig[] {
  if (photoCount <= 1) return [{ count: 1, heightRatio: 1.0 }];
  if (photoCount === 2) return [{ count: 1, heightRatio: 1.0 }, { count: 1, heightRatio: 1.0 }];
  if (photoCount === 3) return [{ count: 1, heightRatio: 1.2 }, { count: 2, heightRatio: 1.0 }];
  if (photoCount === 4) return [{ count: 2, heightRatio: 1.0 }, { count: 2, heightRatio: 1.0 }];
  if (photoCount === 5) return [{ count: 2, heightRatio: 1.1 }, { count: 3, heightRatio: 1.0 }];
  if (photoCount === 6) return [{ count: 3, heightRatio: 1.0 }, { count: 3, heightRatio: 1.0 }];
  
  // 7枚以上 (多枚数対応)
  if (photoCount === 7) {
    // 3 - 2 - 2
    return [
      { count: 3, heightRatio: 1.0 },
      { count: 2, heightRatio: 1.15 },
      { count: 2, heightRatio: 1.15 },
    ];
  }
  if (photoCount === 8) {
    // 3 - 3 - 2
    return [
      { count: 3, heightRatio: 1.0 },
      { count: 3, heightRatio: 1.0 },
      { count: 2, heightRatio: 1.15 },
    ];
  }
  if (photoCount === 9) {
    // 3 - 3 - 3
    return [
      { count: 3, heightRatio: 1.0 },
      { count: 3, heightRatio: 1.0 },
      { count: 3, heightRatio: 1.0 },
    ];
  }
  if (photoCount === 10) {
    // 3 - 4 - 3
    return [
      { count: 3, heightRatio: 1.0 },
      { count: 4, heightRatio: 0.9 },
      { count: 3, heightRatio: 1.0 },
    ];
  }
  if (photoCount === 11) {
    // 4 - 4 - 3
    return [
      { count: 4, heightRatio: 1.0 },
      { count: 4, heightRatio: 1.0 },
      { count: 3, heightRatio: 1.1 },
    ];
  }
  if (photoCount === 12) {
    // 4 - 4 - 4
    return [
      { count: 4, heightRatio: 1.0 },
      { count: 4, heightRatio: 1.0 },
      { count: 4, heightRatio: 1.0 },
    ];
  }
  if (photoCount === 13) {
    // 4 - 3 - 3 - 3
    return [
      { count: 4, heightRatio: 0.9 },
      { count: 3, heightRatio: 1.0 },
      { count: 3, heightRatio: 1.0 },
      { count: 3, heightRatio: 1.0 },
    ];
  }
  if (photoCount === 14) {
    // 4 - 4 - 3 - 3
    return [
      { count: 4, heightRatio: 1.0 },
      { count: 4, heightRatio: 1.0 },
      { count: 3, heightRatio: 1.05 },
      { count: 3, heightRatio: 1.05 },
    ];
  }
  
  // 15枚以上: 4 - 4 - 4 - 3
  return [
    { count: 4, heightRatio: 1.0 },
    { count: 4, heightRatio: 1.0 },
    { count: 4, heightRatio: 1.0 },
    { count: Math.max(photoCount - 12, 1), heightRatio: 1.0 },
  ];
}

/**
 * 枚数に応じた重複のない動的テンプレートスロットを生成
 */
export function generateDynamicTemplate(
  photoCount: number,
  aspect: "4:5" | "9:16" | "1:1" = "4:5",
  gridStyle: DynamicGridStyle = "travel_journal"
): CollageTemplate {
  const safeCount = Math.min(Math.max(photoCount, 1), 16);
  const rows = getRowDistribution(safeCount);

  // キャンバスの有効領域 (上下左右のマージン)
  const marginX = 0.04;
  const marginTop = 0.07; // タイトル・ヘッダー用余白
  const marginBottom = 0.05;
  const availableWidth = 1.0 - marginX * 2;
  const availableHeight = 1.0 - marginTop - marginBottom;

  const totalHeightRatio = rows.reduce((sum, r) => sum + r.heightRatio, 0);
  const gap = safeCount > 8 ? 0.015 : 0.02; // 写真間の隙間

  const slots: TemplateSlot[] = [];
  let currentY = marginTop;
  let slotIndex = 0;

  rows.forEach((row) => {
    // 行の高さを比率から計算 (gapを考慮)
    const totalGapsY = (rows.length - 1) * gap;
    const netHeight = availableHeight - totalGapsY;
    const rowHeight = (row.heightRatio / totalHeightRatio) * netHeight;

    const totalGapsX = (row.count - 1) * gap;
    const netWidth = availableWidth - totalGapsX;
    const colWidth = netWidth / row.count;

    let currentX = marginX;

    for (let c = 0; c < row.count; c++) {
      if (slotIndex >= safeCount) break;

      // 自然なわずかな傾き（多枚数の場合は見やすさのため0度または微小）
      const rotRange: [number, number] =
        gridStyle === "modern_clean" || safeCount >= 8
          ? [0, 0]
          : slotIndex % 2 === 0
          ? [-1.5, 1.5]
          : [-2, 2];

      const frameStyle =
        gridStyle === "polaroid_grid"
          ? "polaroid"
          : gridStyle === "modern_clean"
          ? "clean"
          : "tape";

      slots.push({
        role: slotIndex === 0 ? "mainPhoto" : slotIndex < 3 ? "secondaryPhoto" : "subPhoto",
        x: Number(currentX.toFixed(4)),
        y: Number(currentY.toFixed(4)),
        width: Number(colWidth.toFixed(4)),
        height: Number(rowHeight.toFixed(4)),
        rotationRange: rotRange,
        zIndex: 5 + slotIndex,
        preferredOrientation: "any",
        cropMode: "cover",
        frameStyle: frameStyle,
      });

      currentX += colWidth + gap;
      slotIndex++;
    }

    currentY += rowHeight + gap;
  });

  const backgroundTheme =
    gridStyle === "travel_journal" ? "notebook" : gridStyle === "polaroid_grid" ? "craft" : "clean";

  const styleNames: Record<DynamicGridStyle, string> = {
    travel_journal: `スマートモザイク (手帳風)`,
    modern_clean: `クリーン・マルチグリッド`,
    polaroid_grid: `ポラロイド・タイル`,
  };

  const styleDescs: Record<DynamicGridStyle, string> = {
    travel_journal: `${safeCount}枚の写真をノート風の手帳にマスキングテープで貼った温かみのある配置`,
    modern_clean: `${safeCount}枚の写真を傾きのない均等余白で並べた洗練されたモダンギャラリー`,
    polaroid_grid: `${safeCount}枚の写真をポラロイドフレームにしてクラフト紙に並べた手作り感ある配置`,
  };

  return {
    id: `dynamic_${gridStyle}_${safeCount}_${aspect}`,
    name: styleNames[gridStyle] || `スマートモザイク (${safeCount}枚)`,
    style: gridStyle === "modern_clean" ? "minimal" : gridStyle === "polaroid_grid" ? "polaroid" : "photo_diary",
    supportedPhotoCount: { min: safeCount, max: safeCount },
    aspect,
    background: backgroundTheme,
    slots,
    description: styleDescs[gridStyle] || `${safeCount}枚の写真を重複なくすっきり均等配置する自動レイアウト`,
  };
}

/**
 * 主役写真を上部に大きく1枚配置し、下部に残り写真をタイル状に並べるダイナミックレイアウト
 */
export function generateFeaturedHeaderTemplate(
  photoCount: number,
  aspect: "4:5" | "9:16" | "1:1" = "4:5"
): CollageTemplate {
  const safeCount = Math.min(Math.max(photoCount, 4), 16);
  const remainingCount = safeCount - 1;

  const marginX = 0.04;
  const marginTop = 0.07;
  const availableWidth = 1.0 - marginX * 2;

  // Header main photo (takes ~36% of canvas height)
  const headerHeight = 0.35;
  const gap = 0.02;

  const slots: TemplateSlot[] = [
    {
      role: "mainPhoto",
      x: marginX,
      y: marginTop,
      width: availableWidth,
      height: headerHeight,
      rotationRange: [0, 0],
      zIndex: 5,
      preferredOrientation: "landscape",
      cropMode: "cover",
      frameStyle: "tape",
    },
  ];

  // Distribute remaining photos in rows below
  const subRows = getRowDistribution(remainingCount);
  const subTotalHeightRatio = subRows.reduce((sum, r) => sum + r.heightRatio, 0);
  const subAvailableHeight = 1.0 - (marginTop + headerHeight + gap) - 0.05;
  const subTotalGapsY = (subRows.length - 1) * gap;
  const subNetHeight = subAvailableHeight - subTotalGapsY;

  let currentY = marginTop + headerHeight + gap;
  let slotIndex = 1;

  subRows.forEach((row) => {
    const rowHeight = (row.heightRatio / subTotalHeightRatio) * subNetHeight;
    const totalGapsX = (row.count - 1) * gap;
    const colWidth = (availableWidth - totalGapsX) / row.count;

    let currentX = marginX;
    for (let c = 0; c < row.count; c++) {
      if (slotIndex >= safeCount) break;
      slots.push({
        role: "subPhoto",
        x: Number(currentX.toFixed(4)),
        y: Number(currentY.toFixed(4)),
        width: Number(colWidth.toFixed(4)),
        height: Number(rowHeight.toFixed(4)),
        rotationRange: slotIndex % 2 === 0 ? [-1.5, 1.5] : [-2, 2],
        zIndex: 5 + slotIndex,
        preferredOrientation: "any",
        cropMode: "cover",
        frameStyle: "tape",
      });
      currentX += colWidth + gap;
      slotIndex++;
    }
    currentY += rowHeight + gap;
  });

  return {
    id: `dynamic_featured_${safeCount}_${aspect}`,
    name: `フィーチャー・トップ (主役1枚+タイル)`,
    style: "scrapbook",
    supportedPhotoCount: { min: safeCount, max: safeCount },
    aspect,
    background: "craft",
    slots,
    description: `上部に主役写真を大きく1枚、下部に残り${remainingCount}枚を並べたメリハリ構成`,
  };
}

/**
 * 写真枚数に応じた全ての動的レイアウトバリエーションを生成
 */
export function getDynamicTemplatesForCount(
  photoCount: number,
  aspect: "4:5" | "9:16" | "1:1" = "4:5"
): CollageTemplate[] {
  const templates: CollageTemplate[] = [
    generateDynamicTemplate(photoCount, aspect, "travel_journal"),
    generateDynamicTemplate(photoCount, aspect, "modern_clean"),
    generateDynamicTemplate(photoCount, aspect, "polaroid_grid"),
  ];

  if (photoCount >= 5) {
    templates.push(generateFeaturedHeaderTemplate(photoCount, aspect));
  }

  return templates;
}
