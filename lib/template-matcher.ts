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
 * Gives highest priority to templates matching the exact count of user's selected photos.
 */
export function scoreTemplatesForPhotos(
  photos: PhotoFeatures[],
  preferredAspect?: "4:5" | "1:1" | "9:16"
): TemplateMatchScore[] {
  if (!photos || photos.length === 0) return [];

  const photoCount = photos.length;
  const portraitCount = photos.filter((p) => p.orientation === "portrait").length;
  const landscapeCount = photos.filter((p) => p.orientation === "landscape").length;
  const avgBrightness =
    photos.reduce((sum, p) => sum + p.brightness, 0) / (photos.length || 1);

  const scored: TemplateMatchScore[] = COLLAGE_TEMPLATES.map((tpl) => {
    let score = 50; // base score
    const reasons: string[] = [];

    // 1. Photo Count Compatibility (Strongest weight)
    const minCount = tpl.supportedPhotoCount.min;
    const maxCount = tpl.supportedPhotoCount.max;
    const totalSlots = tpl.slots.length;

    if (photoCount >= minCount && photoCount <= maxCount) {
      score += 35;
      reasons.push(`選択枚数(${photoCount}枚)にジャストフィット`);

      // Bonus if template slots can accommodate all without overflow
      if (photoCount <= totalSlots) {
        score += 10;
        reasons.push(`全${photoCount}枚が綺麗に配置される構成`);
      }
    } else if (photoCount < minCount) {
      // Photo count is fewer than template min
      const diff = minCount - photoCount;
      score -= diff * 15;
    } else {
      // Photo count is larger than template max
      const diff = photoCount - maxCount;
      score -= diff * 10;
    }

    // 2. Orientation Alignment
    let orientationMatches = 0;
    const sortedPhotos = [...photos].sort((a, b) => b.width * b.height - a.width * a.height);

    tpl.slots.forEach((slot, idx) => {
      const photo = sortedPhotos[idx % sortedPhotos.length];
      if (!photo) return;

      if (slot.preferredOrientation === "any" || !slot.preferredOrientation) {
        orientationMatches += 1;
      } else if (slot.preferredOrientation === photo.orientation) {
        orientationMatches += 2;
      } else if (photo.orientation === "square") {
        orientationMatches += 1;
      }
    });

    const orientationScore = Math.min(25, orientationMatches * 4);
    score += orientationScore;
    if (orientationScore >= 16) {
      if (portraitCount >= landscapeCount) {
        reasons.push(`縦写真多めの構成にマッチ`);
      } else {
        reasons.push(`横写真多めの構成にマッチ`);
      }
    }

    // 3. Main photo suitability
    const mainSlot = tpl.slots.find((s) => s.role === "mainPhoto");
    if (mainSlot && photos[0]) {
      if (
        mainSlot.preferredOrientation === "any" ||
        mainSlot.preferredOrientation === photos[0].orientation
      ) {
        score += 15;
        reasons.push(`主役写真がメイン枠に綺麗に収まる構図`);
      }
    }

    // 4. Preferred Aspect Matching
    if (preferredAspect && tpl.aspect === preferredAspect) {
      score += 15;
      reasons.push(`指定のアスペクト比 (${preferredAspect}) に完全合致`);
    }

    // 5. Lighting / Atmosphere matching
    if (avgBrightness < 0.38 && tpl.background === "dark") {
      score += 10;
      reasons.push(`夜景・ダークトーンの写真にマッチ`);
    } else if (avgBrightness >= 0.5 && (tpl.background === "craft" || tpl.background === "notebook")) {
      score += 10;
      reasons.push(`明るい旅の思い出に合うスクラップ調`);
    }

    return {
      template: tpl,
      score: Math.max(10, Math.min(99, score)),
      reasons,
    };
  });

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Assigns photos into template slots.
 * IMPORTANT: Ensures that 100% of the user's selected photos are placed on the canvas.
 * If photos exceed the template's predefined slots, dynamic overflow overlay slots are generated.
 */
export function assignPhotosToTemplate(
  template: CollageTemplate,
  photos: PhotoFeatures[],
  seedOffset: number = 0
): MappedSlotAssignment[] {
  if (photos.length === 0) return [];

  const assignments: MappedSlotAssignment[] = [];
  const assignedPhotoIds = new Set<string>();

  // 1. Assign photos to defined template slots
  template.slots.forEach((slot, idx) => {
    if (idx >= photos.length) return; // No more photos to assign to this slot
    const photo = photos[idx];
    assignedPhotoIds.add(photo.id);

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

  // 2. Fallback: If user provided more photos than template has slots,
  // dynamically generate aesthetically pleasing overlay slots so NO PHOTO IS OMITTED!
  const remainingPhotos = photos.filter((p) => !assignedPhotoIds.has(p.id));

  if (remainingPhotos.length > 0) {
    const overflowPositions = [
      { x: 0.10, y: 0.70, w: 0.36, h: 0.26, rot: -4 },
      { x: 0.54, y: 0.70, w: 0.36, h: 0.26, rot: 5 },
      { x: 0.30, y: 0.55, w: 0.40, h: 0.30, rot: -2 },
      { x: 0.05, y: 0.40, w: 0.34, h: 0.28, rot: 6 },
      { x: 0.58, y: 0.40, w: 0.34, h: 0.28, rot: -5 },
    ];

    remainingPhotos.forEach((photo, i) => {
      const pos = overflowPositions[i % overflowPositions.length];
      const extraSlot: TemplateSlot = {
        role: "subPhoto",
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h,
        rotationRange: [pos.rot - 2, pos.rot + 2],
        zIndex: 10 + i,
        frameStyle: template.style === "polaroid" ? "polaroid" : "tape",
      };

      assignments.push({
        slot: extraSlot,
        photo,
        rotation: pos.rot,
      });
    });
  }

  return assignments;
}
