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
 * Returns sorted list of templates with matching reasons.
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
  const avgBrightness =
    photos.reduce((sum, p) => sum + p.brightness, 0) / (photos.length || 1);

  const scored: TemplateMatchScore[] = COLLAGE_TEMPLATES.map((tpl) => {
    let score = 50; // base score
    const reasons: string[] = [];

    // 1. Photo Count Compatibility
    const requiredSlots = tpl.slots.filter((s) => !s.optional).length;
    const totalSlots = tpl.slots.length;

    if (photoCount >= tpl.supportedPhotoCount.min && photoCount <= tpl.supportedPhotoCount.max) {
      score += 25;
      reasons.push(`写真枚数(${photoCount}枚)が最適構成と一致`);
      if (photoCount === totalSlots) {
        score += 10;
        reasons.push(`全スロットがピッタリ埋まるベスト枚数`);
      }
    } else if (photoCount < requiredSlots) {
      score -= 35; // missing slots
    } else {
      score -= 15; // exceeds max supported count
    }

    // 2. Orientation Alignment
    let orientationMatches = 0;
    const sortedPhotos = [...photos].sort((a, b) => (b.width * b.height) - (a.width * a.height));

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
        reasons.push(`縦向き写真の構成にフィット`);
      } else {
        reasons.push(`横向き写真の比率にマッチ`);
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
 * Assigns photos into template slots with deterministic, pleasant jitter within rotationRange.
 */
export function assignPhotosToTemplate(
  template: CollageTemplate,
  photos: PhotoFeatures[],
  seedOffset: number = 0
): MappedSlotAssignment[] {
  if (photos.length === 0) return [];

  // Sort photos: prioritize main candidates for main slots
  const sorted = [...photos];
  const assignments: MappedSlotAssignment[] = [];

  template.slots.forEach((slot, idx) => {
    // If photos are fewer than slots, only fill available or repeat nicely
    if (idx >= sorted.length && slot.optional) return;
    const photo = sorted[idx % sorted.length];

    // Controlled pseudo-random jitter within rotationRange
    // Based on photo ID hash + seedOffset so it's reproducible yet tweakable
    const minRot = slot.rotationRange[0];
    const maxRot = slot.rotationRange[1];
    const range = maxRot - minRot;

    // Simple deterministic hash
    const charCodeSum = photo.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pseudoRand = ((charCodeSum * 9301 + 49297 + seedOffset * 1013) % 233280) / 233280;
    const rotation = minRot + pseudoRand * range;

    assignments.push({
      slot,
      photo,
      rotation,
    });
  });

  return assignments;
}
