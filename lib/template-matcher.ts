// lib/template-matcher.ts
import {
  PhotoFeatures,
  CollageTemplate,
  TemplateMatchScore,
  TemplateSlot,
} from "@/types/collage-template";
import { COLLAGE_TEMPLATES } from "./collage-templates";

export interface MappedSlotAssignment {
  slot: TemplateSlot;
  photo: PhotoFeatures;
  rotation: number; // calculated jitter within rotationRange
}

/**
 * Deterministically evaluates and scores all templates based on user's photo features.
 * Gives strong weight to landscape photos if the user has many horizontal photos.
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

  const scored: TemplateMatchScore[] = COLLAGE_TEMPLATES.map((tpl) => {
    let score = 50; // base score
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

    return {
      template: tpl,
      rawScore: score,
      score: Math.max(10, Math.min(99, score)),
      reasons,
    };
  });

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
    // If slot is designed explicitly for a cutout sticker
    if (slot.role === "cutout") {
      const sticker = cutoutStickers.find((s) => !assignedPhotoIds.has(s.id));
      if (sticker) {
        assignedPhotoIds.add(sticker.id);
        assignments.push({
          slot,
          photo: sticker,
          rotation: slot.rotationRange[0] || 0,
        });
      }
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

  // 3. Dynamic overlay for all remaining cutout stickers (Always top layer, no white box!)
  const remainingStickers = cutoutStickers.filter((p) => !assignedPhotoIds.has(p.id));
  if (remainingStickers.length > 0) {
    const stickerPositions = [
      { x: 0.68, y: 0.68, w: 0.26, h: 0.26, rot: 5 },   // Bottom right
      { x: 0.05, y: 0.06, w: 0.25, h: 0.25, rot: -6 },  // Top left
      { x: 0.68, y: 0.06, w: 0.25, h: 0.25, rot: 4 },   // Top right
      { x: 0.05, y: 0.68, w: 0.26, h: 0.26, rot: -4 },  // Bottom left
      { x: 0.38, y: 0.38, w: 0.26, h: 0.26, rot: 3 },   // Center accent
      { x: 0.72, y: 0.38, w: 0.24, h: 0.24, rot: -5 },  // Middle right
      { x: 0.04, y: 0.38, w: 0.24, h: 0.24, rot: 6 },   // Middle left
      { x: 0.38, y: 0.70, w: 0.25, h: 0.25, rot: -2 },  // Bottom center
      { x: 0.38, y: 0.05, w: 0.25, h: 0.25, rot: 2 },   // Top center
    ];

    remainingStickers.forEach((photo, i) => {
      const sPos = stickerPositions[i % stickerPositions.length];
      const extraSlot: TemplateSlot = {
        role: "cutout",
        x: sPos.x,
        y: sPos.y,
        width: sPos.w,
        height: sPos.h,
        rotationRange: [sPos.rot - 2, sPos.rot + 2],
        zIndex: 50 + i, // Always above regular photos
        preferredOrientation: photo.orientation,
        frameStyle: "none", // Strictly borderless
      };

      assignments.push({
        slot: extraSlot,
        photo,
        rotation: sPos.rot,
      });
      assignedPhotoIds.add(photo.id);
    });
  }

  return assignments;
}
