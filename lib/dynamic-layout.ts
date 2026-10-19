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

  return {
    id: `dynamic_grid_${safeCount}_${aspect}`,
    name: `スマートモザイク (${safeCount}枚)`,
    style: "photo_diary",
    supportedPhotoCount: { min: safeCount, max: safeCount },
    aspect,
    background: backgroundTheme,
    slots,
    description: `${safeCount}枚の写真を重複なくすっきり均等配置する自動レイアウト`,
  };
}
