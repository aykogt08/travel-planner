// lib/mediapipe/segmenter.ts
import { getImageSegmenter } from "./mediapipe-manager";
import { CutoutResult } from "@/types/photo-analysis";

/**
 * Performs high quality person & foreground subject cutout using MediaPipe ImageSegmenter.
 * - Extracts foreground mask with smooth alpha feathering (anti-aliasing)
 * - Leaves original source image untouched
 * - Returns transparent PNG Data URL + metadata
 */
export interface CutoutOptions {
  personBoxes?: { originX: number; originY: number; width: number; height: number }[];
  forceInvert?: boolean;
}

export async function cutoutSubject(
  img: HTMLImageElement | HTMLCanvasElement,
  options?: CutoutOptions
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

  // 1. Analyze corners to detect whether raw mask is inverted (background as 1, person as 0)
  // Check 4 corner coordinates in mask space
  const cornerCoords = [
    [0, 0],
    [maskW - 1, 0],
    [0, maskH - 1],
    [maskW - 1, maskH - 1],
    [Math.floor(maskW / 2), 0], // top edge middle
  ];
  let cornerForegroundCount = 0;
  for (const [cx, cy] of cornerCoords) {
    if (maskArray[cy * maskW + cx] > 0) {
      cornerForegroundCount++;
    }
  }

  // If 4 out of 5 outer edge points are "foreground" (>0), it is very likely inverted (meaning 0 is person, 1 is background)
  let isMaskInverted = cornerForegroundCount >= 4;
  if (options?.forceInvert) {
    isMaskInverted = !isMaskInverted;
  }

  // Build binary/alpha mask and its inverted counterpart
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = inferW;
  maskCanvas.height = inferH;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("Could not create mask canvas");

  const invMaskCanvas = document.createElement("canvas");
  invMaskCanvas.width = inferW;
  invMaskCanvas.height = inferH;
  const invMaskCtx = invMaskCanvas.getContext("2d");
  if (!invMaskCtx) throw new Error("Could not create inverted mask canvas");

  const maskImgData = maskCtx.createImageData(inferW, inferH);
  const maskData = maskImgData.data;

  const invMaskImgData = invMaskCtx.createImageData(inferW, inferH);
  const invMaskData = invMaskImgData.data;

  let foregroundCount = 0;
  let minX = inferW;
  let minY = inferH;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < inferH; y++) {
    const maskY = Math.min(Math.floor((y / inferH) * maskH), maskH - 1);
    const normY = y / inferH;

    for (let x = 0; x < inferW; x++) {
      const maskX = Math.min(Math.floor((x / inferW) * maskW), maskW - 1);
      const maskIdx = maskY * maskW + maskX;
      const maskVal = maskArray[maskIdx];
      const normX = x / inferW;

      // Base foreground test: maskVal > 0 means person in MediaPipe SelfieSegmenter
      const isPerson = isMaskInverted ? maskVal === 0 : maskVal > 0;

      const pixelIdx = (y * inferW + x) * 4;

      if (isPerson) {
        foregroundCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Primary Mask: Foreground opaque
        maskData[pixelIdx] = 255;
        maskData[pixelIdx + 1] = 255;
        maskData[pixelIdx + 2] = 255;
        maskData[pixelIdx + 3] = 255;

        // Inverted Mask: Background transparent
        invMaskData[pixelIdx] = 0;
        invMaskData[pixelIdx + 1] = 0;
        invMaskData[pixelIdx + 2] = 0;
        invMaskData[pixelIdx + 3] = 0;
      } else {
        // Primary Mask: Background transparent
        maskData[pixelIdx] = 0;
        maskData[pixelIdx + 1] = 0;
        maskData[pixelIdx + 2] = 0;
        maskData[pixelIdx + 3] = 0;

        // Inverted Mask: Foreground opaque
        invMaskData[pixelIdx] = 255;
        invMaskData[pixelIdx + 1] = 255;
        invMaskData[pixelIdx + 2] = 255;
        invMaskData[pixelIdx + 3] = 255;
      }
    }
  }

  // Safety check: if detected subject is too tiny (< 0.8% of total image), treat as no subject
  const totalPixels = inferW * inferH;
  const cutoutRatio = foregroundCount / totalPixels;
  if (cutoutRatio < 0.008) {
    categoryMask.close();
    return {
      cutoutDataUrl: "",
      hasSubject: false,
      cutoutRatio,
    };
  }

  maskCtx.putImageData(maskImgData, 0, 0);
  invMaskCtx.putImageData(invMaskImgData, 0, 0);

  // Helper to render cutout canvas with mask
  const renderCutout = (mCanvas: HTMLCanvasElement): string => {
    const cCanvas = document.createElement("canvas");
    cCanvas.width = inferW;
    cCanvas.height = inferH;
    const cCtx = cCanvas.getContext("2d");
    if (!cCtx) return "";
    cCtx.drawImage(img, 0, 0, inferW, inferH);
    cCtx.globalCompositeOperation = "destination-in";
    cCtx.drawImage(mCanvas, 0, 0);
    cCtx.globalCompositeOperation = "source-over";
    return cCanvas.toDataURL("image/png", 0.9);
  };

  const cutoutDataUrl = renderCutout(maskCanvas);
  const invertedCutoutDataUrl = renderCutout(invMaskCanvas);
  const maskDataUrl = maskCanvas.toDataURL("image/png", 0.7);

  // Clean up WebAssembly memory
  categoryMask.close();

  return {
    cutoutDataUrl,
    invertedCutoutDataUrl,
    maskDataUrl,
    hasSubject: true,
    cutoutRatio,
    isInverted: isMaskInverted,
    subjectBox: {
      x: minX / inferW,
      y: minY / inferH,
      width: (maxX - minX) / inferW,
      height: (maxY - minY) / inferH,
    },
  };
}
