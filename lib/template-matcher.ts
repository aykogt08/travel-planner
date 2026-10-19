// lib/template-matcher.ts
import {
  PhotoFeatures,
  CollageTemplate,
  TemplateMatchScore,
  TemplateSlot,
} from "@/types/collage-template";
import { COLLAGE_TEMPLATES } from "./collage-templates";
import { getDynamicTemplatesForCount } from "./dynamic-layout";

export interface MappedSlotAssignment {
  slot: TemplateSlot;
  photo: PhotoFeatures;
  rotation: number; // calculated jitter within rotationRange
}

/**
 * Deterministically evaluates and scores all templates based on user's photo features.
 * Gives strong weight to landscape photos if the user has many horizontal photos.
 * Automatically generates and includes dynamic layout patterns for 7+ photos.
 */
export function scoreTemplatesForPhotos(
  photos: PhotoFeatures[],
  preferredAspect?: "4:5" | "1:1" | "9:16"
): TemplateMatchScore[] {
  if (!photos || photos.length === 0) return [];

  // Base template matching primarily on regular photos so cutout stickers act as overlay accents
  const regularPhotos = photos.filter((p) => !p.isCutoutSticker);
  const effectivePhotos = regularPhotos.length > 0 ? regularPhotos : photos;
  const photoCount = effectivePhotos.length;
  const portraitCount = effectivePhotos.filter((p) => p.orientation === "portrait").length;
  const landscapeCount = effectivePhotos.filter((p) => p.orientation === "landscape").length;
  const squareCount = effectivePhotos.filter((p) => p.orientation === "square").length;
  const isLandscapeHeavy = landscapeCount >= portraitCount && landscapeCount >= 2;
  const avgBrightness =
    effectivePhotos.reduce((sum, p) => sum + p.brightness, 0) / (effectivePhotos.length || 1);

  // Generate dynamic layouts for 7+ photos so they appear in "すべてのデザインから選ぶ"
  const dynamicTemplates =
    photoCount >= 7 ? getDynamicTemplatesForCount(photoCount, preferredAspect || "4:5") : [];
  const allTemplates = [...dynamicTemplates, ...COLLAGE_TEMPLATES];

  const scored: (TemplateMatchScore & { rawScore: number })[] = [];

  for (const tpl of allTemplates) {
    // Rule 1: Cinema Story is strictly for 3 photos only
    if (tpl.id === "cinema_story_001" && photoCount !== 3) {
      continue;
    }

    // Rule 2: Panorama Landscape is strictly for 3 photos only
    if (tpl.id === "landscape_panorama_001" && photoCount !== 3) {
      continue;
    }

    // Rule 3: 横写真スクラップ, 横写真フォトウォール, スクラップブック are strictly for <= 6 photos
    if (
      (tpl.id === "landscape_scrapbook_001" ||
        tpl.id === "landscape_gallery_001" ||
        tpl.id === "scrapbook_001" ||
        tpl.id === "scrapbook_212_001" ||
        tpl.id === "scrapbook_deluxe_001") &&
      photoCount > 6
    ) {
      continue;
    }

    // Rule 4: ミニマル・マルチ is strictly for <= 5 photos
    if (tpl.id === "minimal_multi_001" && photoCount > 5) {
      continue;
    }

    // Rule 5: For 7+ photos, exclude templates whose max photo capacity is less than 7
    if (photoCount >= 7 && tpl.supportedPhotoCount.max < 7) {
      continue;
    }

    // Rule 6: For small photo sets, exclude templates that require significantly more photos
    if (photoCount < tpl.supportedPhotoCount.min && tpl.supportedPhotoCount.min - photoCount >= 2) {
      continue;
    }

    let score = tpl.id.startsWith("dynamic_") ? 82 : 50; // Dynamic templates get higher base compatibility
    const reasons: string[] = [];

    // 1. Photo Count Compatibility (Strong weight)
    const minCount = tpl.supportedPhotoCount.min;
    const maxCount = tpl.supportedPhotoCount.max;
    const totalSlots = tpl.slots.length;

    if (photoCount >= minCount && photoCount <= maxCount) {
      score += 35;
      reasons.push(`選択枚数(${photoCount}枚)にジャストフィット`);

      if (photoCount <= totalSlots) {
        score += 10;
        reasons.push(`全${photoCount}枚が綺麗に配置される構成`);
      }
    } else if (photoCount < minCount) {
      const diff = minCount - photoCount;
      score -= diff * 15;
    } else {
      const diff = photoCount - maxCount;
      score -= diff * 10;
    }

    // Bonus for 3-photo specialized templates
    if (photoCount === 3 && (tpl.id === "cinema_story_001" || tpl.id === "landscape_panorama_001")) {
      score += 25;
      reasons.push(`3枚写真専用の最適化レイアウト`);
    }

    // Bonus for 5-photo specialized 2-1-2 scrapbook
    if (photoCount === 5 && tpl.id === "scrapbook_212_001") {
      score += 25;
      reasons.push(`上から2-1-2に整然と並ぶ5枚専用スクラップ`);
    }

    // 2. Landscape / Portrait Orientation Alignment (Special Emphasis!)
    const landscapeSlotsCount = tpl.slots.filter(
      (s) => s.preferredOrientation === "landscape"
    ).length;
    const portraitSlotsCount = tpl.slots.filter(
      (s) => s.preferredOrientation === "portrait"
    ).length;

    if (isLandscapeHeavy) {
      if (tpl.id.startsWith("landscape_")) {
        score += 45;
        reasons.push(`横写真専用に設計されたワイドレイアウト`);
      } else if (landscapeSlotsCount >= 2) {
        score += 25;
        reasons.push(`横向き写真を活かすレイアウト`);
      }
      if (tpl.slots[0]?.preferredOrientation === "landscape") {
        score += 15;
        reasons.push(`主役の横写真を大迫力で配置`);
      }
      // If template is portrait-focused, penalize when landscape-heavy
      if (portraitSlotsCount > landscapeSlotsCount) {
        score -= 20;
      }
    } else if (portraitCount > landscapeCount) {
      if (portraitSlotsCount >= 2) {
        score += 30;
        reasons.push(`縦向き写真の構成にフィット`);
      }
      if (tpl.id.startsWith("landscape_")) {
        score -= 20;
      }
    }

    // General orientation match score
    let orientationMatches = 0;
    tpl.slots.forEach((slot, idx) => {
      const p = photos[idx % photos.length];
      if (slot.preferredOrientation === p.orientation) orientationMatches += 2;
      else if (slot.preferredOrientation === "any") orientationMatches += 1;
    });
    score += Math.min(20, orientationMatches * 3);

    // 3. Preferred Aspect Matching
    if (preferredAspect && tpl.aspect === preferredAspect) {
      score += 15;
      reasons.push(`指定のアスペクト比 (${preferredAspect}) に完全合致`);
    }

    // 4. Lighting / Atmosphere matching
    if (avgBrightness < 0.38 && tpl.background === "dark") {
      score += 10;
      reasons.push(`夜景・ダークトーンの写真にマッチ`);
    } else if (avgBrightness >= 0.5 && (tpl.background === "craft" || tpl.background === "notebook")) {
      score += 10;
      reasons.push(`明るい旅の思い出に合うスクラップ調`);
    }

    scored.push({
      template: tpl,
      rawScore: score,
      score: Math.max(10, Math.min(99, score)),
      reasons,
    });
  }

  // Sort descending by raw score
  return scored
    .sort((a, b) => (b as any).rawScore - (a as any).rawScore)
    .map(({ template, score, reasons }) => ({ template, score, reasons }));
}

/**
 * Assigns photos into template slots intelligently based on orientation matching.
 * Landscape photos go into landscape slots; portrait photos go into portrait slots.
 * Guarantees 100% of user's selected photos are placed on the canvas.
 */
export function assignPhotosToTemplate(
  template: CollageTemplate,
  photos: PhotoFeatures[],
  seedOffset: number = 0
): MappedSlotAssignment[] {
  if (photos.length === 0) return [];

  const assignments: MappedSlotAssignment[] = [];
  const assignedPhotoIds = new Set<string>();

  const regularPhotos = photos.filter((p) => !p.isCutoutSticker);
  const cutoutStickers = photos.filter((p) => p.isCutoutSticker);

  // Available regular photo pools by orientation
  const landscapePool = regularPhotos.filter((p) => p.orientation === "landscape");
  const portraitPool = regularPhotos.filter((p) => p.orientation === "portrait");
  const squarePool = regularPhotos.filter((p) => p.orientation === "square");

  // Helper to pick best fitting regular photo from pool
  const pickRegularPhotoForSlot = (slot: TemplateSlot): PhotoFeatures | undefined => {
    let chosen: PhotoFeatures | undefined;

    if (slot.preferredOrientation === "landscape") {
      chosen = landscapePool.find((p) => !assignedPhotoIds.has(p.id));
    } else if (slot.preferredOrientation === "portrait") {
      chosen = portraitPool.find((p) => !assignedPhotoIds.has(p.id));
    } else if (slot.preferredOrientation === "square") {
      chosen = squarePool.find((p) => !assignedPhotoIds.has(p.id));
    }

    // Fallback: pick any unassigned regular photo
    if (!chosen) {
      chosen = regularPhotos.find((p) => !assignedPhotoIds.has(p.id));
    }

    if (chosen) {
      assignedPhotoIds.add(chosen.id);
    }
    return chosen;
  };

  // 1. Assign regular photos to defined template slots
  template.slots.forEach((slot) => {
    // If slot is designed explicitly for a cutout sticker, skip it
    // because stickers are now fully managed by the freeform gesture system (Option A).
    if (slot.role === "cutout") {
      return;
    }


    // Normal photo slot: only assign regular photos!
    const photo = pickRegularPhotoForSlot(slot);
    if (!photo) return; // No regular photo left for this slot, leave unrendered

    // Controlled pseudo-random jitter within rotationRange
    const minRot = slot.rotationRange[0];
    const maxRot = slot.rotationRange[1];
    const range = maxRot - minRot;

    const charCodeSum = photo.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pseudoRand = ((charCodeSum * 9301 + 49297 + seedOffset * 1013) % 233280) / 233280;
    const rotation = minRot + pseudoRand * range;

    assignments.push({
      slot,
      photo,
      rotation,
    });
  });

  // 2. Dynamic overflow for remaining regular photos
  const remainingRegular = regularPhotos.filter((p) => !assignedPhotoIds.has(p.id));
  if (remainingRegular.length > 0) {
    const overflowPositions = [
      { x: 0.05, y: 0.74, w: 0.43, h: 0.22, rot: -1, pref: "landscape" as const },
      { x: 0.52, y: 0.74, w: 0.43, h: 0.22, rot: 1, pref: "landscape" as const },
      { x: 0.28, y: 0.74, w: 0.44, h: 0.22, rot: 0, pref: "landscape" as const },
    ];

    remainingRegular.forEach((photo, i) => {
      const pos = overflowPositions[i % overflowPositions.length];
      const extraSlot: TemplateSlot = {
        role: "subPhoto",
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        rotationRange: [pos.rot - 2, pos.rot + 2],
        zIndex: 10 + i,
        preferredOrientation: photo.orientation,
        frameStyle: template.style === "polaroid" ? "polaroid" : "tape",
      };

      assignments.push({
        slot: extraSlot,
        photo,
        rotation: pos.rot,
      });
      assignedPhotoIds.add(photo.id);
    });
  }

  // 3. Cutout stickers are now fully managed by FreeformStickerLayer / Option A freeform layout,
  // so we no longer generate duplicate fixed-position slots here.
  return assignments;
}

