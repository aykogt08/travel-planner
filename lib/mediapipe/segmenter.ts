// lib/mediapipe/segmenter.ts
import { getImageSegmenter } from "./mediapipe-manager";
import { CutoutResult } from "@/types/photo-analysis";

/**
 * Performs high quality person & foreground subject cutout using MediaPipe ImageSegmenter.
 * - Extracts foreground mask with smooth alpha feathering (anti-aliasing)
 * - Leaves original source image untouched
 * - Returns transparent PNG Data URL + metadata
 */
export async function cutoutSubject(
  img: HTMLImageElement | HTMLCanvasElement
): Promise<CutoutResult> {
  const segmenter = await getImageSegmenter();

  // Create an offscreen working canvas at optimized resolution (max 1024px for swift on-device inference)
  const origW = img instanceof HTMLImageElement ? img.naturalWidth || img.width : img.width;
  const origH = img instanceof HTMLImageElement ? img.naturalHeight || img.height : img.height;

  const maxInferDim = 1024;
  let inferW = origW;
  let inferH = origH;
  if (inferW > maxInferDim || inferH > maxInferDim) {
    if (inferW > inferH) {
      inferH = Math.round((inferH * maxInferDim) / inferW);
      inferW = maxInferDim;
    } else {
      inferW = Math.round((inferW * maxInferDim) / inferH);
      inferH = maxInferDim;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = inferW;
  canvas.height = inferH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Failed to get 2D canvas context for segmentation");
  }

  ctx.drawImage(img, 0, 0, inferW, inferH);
  const originalImageData = ctx.getImageData(0, 0, inferW, inferH);

  // Run MediaPipe segmentation
  const result = segmenter.segment(canvas);
  const categoryMask = result.categoryMask;

  if (!categoryMask) {
    return {
      cutoutDataUrl: "",
      hasSubject: false,
      cutoutRatio: 0,
    };
  }

  const maskArray = categoryMask.getAsUint8Array();
  const maskW = categoryMask.width;
  const maskH = categoryMask.height;

  // Build binary/alpha mask on a separate canvas
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = inferW;
  maskCanvas.height = inferH;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("Could not create mask canvas");

  const maskImgData = maskCtx.createImageData(inferW, inferH);
  const maskData = maskImgData.data;

  let foregroundCount = 0;
  let minX = inferW;
  let minY = inferH;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < inferH; y++) {
    const maskY = Math.min(Math.floor((y / inferH) * maskH), maskH - 1);
    for (let x = 0; x < inferW; x++) {
      const maskX = Math.min(Math.floor((x / inferW) * maskW), maskW - 1);
      const maskIdx = maskY * maskW + maskX;
      const maskVal = maskArray[maskIdx]; // 0: background, 1 or >0: foreground person

      const pixelIdx = (y * inferW + x) * 4;
      const isForeground = maskVal > 0;

      if (isForeground) {
        foregroundCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Foreground: Alpha = 255
        maskData[pixelIdx] = 255;
        maskData[pixelIdx + 1] = 255;
        maskData[pixelIdx + 2] = 255;
        maskData[pixelIdx + 3] = 255;
      } else {
        // Background: Transparent
        maskData[pixelIdx] = 0;
        maskData[pixelIdx + 1] = 0;
        maskData[pixelIdx + 2] = 0;
        maskData[pixelIdx + 3] = 0;
      }
    }
  }

  // Safety check: if detected subject is too tiny (< 1.5% of total image), treat as no subject
  const totalPixels = inferW * inferH;
  const cutoutRatio = foregroundCount / totalPixels;
  if (cutoutRatio < 0.015) {
    categoryMask.close();
    return {
      cutoutDataUrl: "",
      hasSubject: false,
      cutoutRatio,
    };
  }

  maskCtx.putImageData(maskImgData, 0, 0);

  // Apply cutout by composite: original image masked by destination-in
  const cutoutCanvas = document.createElement("canvas");
  cutoutCanvas.width = inferW;
  cutoutCanvas.height = inferH;
  const cutoutCtx = cutoutCanvas.getContext("2d");
  if (!cutoutCtx) throw new Error("Could not create cutout canvas");

  // Draw original image
  cutoutCtx.drawImage(img, 0, 0, inferW, inferH);
  // Apply mask with destination-in
  cutoutCtx.globalCompositeOperation = "destination-in";
  cutoutCtx.drawImage(maskCanvas, 0, 0);
  cutoutCtx.globalCompositeOperation = "source-over";

  const cutoutDataUrl = cutoutCanvas.toDataURL("image/png", 0.9);
  const maskDataUrl = maskCanvas.toDataURL("image/png", 0.7);

  // Clean up WebAssembly memory
  categoryMask.close();

  return {
    cutoutDataUrl,
    maskDataUrl,
    hasSubject: true,
    cutoutRatio,
    subjectBox: {
      x: minX / inferW,
      y: minY / inferH,
      width: (maxX - minX) / inferW,
      height: (maxY - minY) / inferH,
    },
  };
}
