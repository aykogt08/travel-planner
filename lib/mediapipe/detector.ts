// lib/mediapipe/detector.ts
import { getObjectDetector } from "./mediapipe-manager";

export interface DetectionResult {
  labels: { label: string; score: number }[];
  personCount: number;
}

/**
 * Detects common objects and persons in a photo using MediaPipe ObjectDetector (EfficientDet Lite).
 * 100% on-device inference without server communication.
 */
export async function detectObjects(
  img: HTMLImageElement | HTMLCanvasElement
): Promise<DetectionResult> {
  const detector = await getObjectDetector();

  // Create appropriately sized offscreen canvas
  const origW = img instanceof HTMLImageElement ? img.naturalWidth || img.width : img.width;
  const origH = img instanceof HTMLImageElement ? img.naturalHeight || img.height : img.height;

  const maxDim = 800;
  let targetW = origW;
  let targetH = origH;
  if (targetW > maxDim || targetH > maxDim) {
    if (targetW > targetH) {
      targetH = Math.round((targetH * maxDim) / targetW);
      targetW = maxDim;
    } else {
      targetW = Math.round((targetW * maxDim) / targetH);
      targetW = maxDim;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context for object detection");

  ctx.drawImage(img, 0, 0, targetW, targetH);

  const result = detector.detect(canvas);

  const labels: { label: string; score: number }[] = [];
  let personCount = 0;

  if (result.detections) {
    for (const detection of result.detections) {
      if (detection.categories && detection.categories.length > 0) {
        const topCat = detection.categories[0];
        const catName = topCat.categoryName.toLowerCase();
        labels.push({
          label: topCat.categoryName,
          score: topCat.score,
        });

        if (catName === "person" || catName === "human") {
          personCount++;
        }
      }
    }
  }

  return { labels, personCount };
}
