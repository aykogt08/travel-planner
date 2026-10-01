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

  const photoCount = photos.length;
  const portraitCount = photos.filter((p) => p.orientation === "portrait").length;
  const landscapeCount = photos.filter((p) => p.orientation === "landscape").length;
  const squareCount = photos.filter((p) => p.orientation === "square").length;
  const isLandscapeHeavy = landscapeCount >= portraitCount && landscapeCount >= 2;
  const avgBrightness =
    photos.reduce((sum, p) => sum + p.brightness, 0) / (photos.length || 1);

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

  // Available pools by orientation
  const pool = [...photos];
  const landscapePool = pool.filter((p) => p.orientation === "landscape");
  const portraitPool = pool.filter((p) => p.orientation === "portrait");
  const squarePool = pool.filter((p) => p.orientation === "square");

  // Helper to pick best fitting photo from pool
  const pickPhotoForSlot = (slot: TemplateSlot): PhotoFeatures => {
    let chosen: PhotoFeatures | undefined;

    // If slot is designed for cutout sticker, pick sticker first
    if (slot.role === "cutout") {
      chosen = pool.find((p) => p.isCutoutSticker && !assignedPhotoIds.has(p.id));
    }

    if (!chosen && slot.preferredOrientation === "landscape") {
      chosen = landscapePool.find((p) => !p.isCutoutSticker && !assignedPhotoIds.has(p.id));
    } else if (!chosen && slot.preferredOrientation === "portrait") {
      chosen = portraitPool.find((p) => !p.isCutoutSticker && !assignedPhotoIds.has(p.id));
    } else if (!chosen && slot.preferredOrientation === "square") {
      chosen = squarePool.find((p) => !p.isCutoutSticker && !assignedPhotoIds.has(p.id));
    }

    // Fallback: pick any unassigned non-sticker photo
    if (!chosen) {
      chosen = pool.find((p) => !p.isCutoutSticker && !assignedPhotoIds.has(p.id));
    }

    // Fallback: pick any unassigned photo
    if (!chosen) {
      chosen = pool.find((p) => !assignedPhotoIds.has(p.id));
    }

    // If all photos already assigned, pick from pool by index
    if (!chosen) {
      chosen = pool[assignments.length % pool.length];
    }

    assignedPhotoIds.add(chosen.id);
    return chosen;
  };

  // 1. Assign photos to defined template slots
  template.slots.forEach((slot) => {
    if (assignedPhotoIds.size >= photos.length && slot.optional) return;

    const photo = pickPhotoForSlot(slot);

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

  // 2. Dynamic overflow: Ensure NO PHOTO is omitted
  const remainingPhotos = photos.filter((p) => !assignedPhotoIds.has(p.id));

  if (remainingPhotos.length > 0) {
    const overflowPositions = [
      { x: 0.05, y: 0.74, w: 0.43, h: 0.22, rot: -1, pref: "landscape" as const },
      { x: 0.52, y: 0.74, w: 0.43, h: 0.22, rot: 1, pref: "landscape" as const },
      { x: 0.28, y: 0.74, w: 0.44, h: 0.22, rot: 0, pref: "landscape" as const },
    ];

    const stickerPositions = [
      { x: 0.58, y: 0.52, w: 0.36, h: 0.36, rot: 5 },
      { x: 0.08, y: 0.28, w: 0.34, h: 0.34, rot: -6 },
      { x: 0.32, y: 0.60, w: 0.35, h: 0.35, rot: 2 },
      { x: 0.60, y: 0.12, w: 0.32, h: 0.32, rot: -4 },
    ];
    let stickerIndex = 0;

    remainingPhotos.forEach((photo, i) => {
      const isSticker = photo.isCutoutSticker;
      let slotX: number;
      let slotY: number;
      let slotW: number;
      let slotH: number;
      let slotRot: number;

      if (isSticker) {
        const sPos = stickerPositions[stickerIndex % stickerPositions.length];
        stickerIndex++;
        slotX = sPos.x;
        slotY = sPos.y;
        slotW = sPos.w;
        slotH = sPos.h;
        slotRot = sPos.rot;
      } else {
        const pos = overflowPositions[i % overflowPositions.length];
        slotX = pos.x;
        slotY = pos.y;
        slotW = pos.w;
        slotH = pos.h;
        slotRot = pos.rot;
      }

      const extraSlot: TemplateSlot = {
        role: isSticker ? "cutout" : "subPhoto",
        x: slotX,
        y: slotY,
        width: slotW,
        height: slotH,
        rotationRange: [slotRot - 2, slotRot + 2],
        zIndex: isSticker ? 30 + i : 10 + i,
        preferredOrientation: photo.orientation,
        frameStyle: isSticker ? "none" : template.style === "polaroid" ? "polaroid" : "tape",
      };

      assignments.push({
        slot: extraSlot,
        photo,
        rotation: slotRot,
      });
    });
  }

  return assignments;
}
