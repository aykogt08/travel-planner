// lib/mediapipe/mediapipe-manager.ts
import { FilesetResolver, ImageSegmenter, ObjectDetector } from "@mediapipe/tasks-vision";

/**
 * Robust on-device MediaPipe Tasks Vision runtime manager.
 * - 100% offline & local execution via WebAssembly
 * - Singletons for ImageSegmenter and ObjectDetector
 * - Efficient caching of WASM binaries
 */

const WASM_CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const SEGMENTER_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";
const DETECTOR_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite";

let visionWasmFileset: any = null;
let cachedSegmenter: ImageSegmenter | null = null;
let cachedDetector: ObjectDetector | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

export async function getMediaPipeVision(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("MediaPipe can only run in a browser environment");
  }

  if (visionWasmFileset) return visionWasmFileset;

  if (isInitializing && initPromise) {
    await initPromise;
    return visionWasmFileset;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      visionWasmFileset = await FilesetResolver.forVisionTasks(WASM_CDN_URL);
    } catch (err) {
      console.error("Failed to load MediaPipe Vision WASM resolver:", err);
      throw err;
    } finally {
      isInitializing = false;
    }
  })();

  await initPromise;
  return visionWasmFileset;
}

/**
 * Returns cached or newly created ImageSegmenter (Selfie & Subject Segmenter)
 */
export async function getImageSegmenter(): Promise<ImageSegmenter> {
  if (cachedSegmenter) return cachedSegmenter;

  const wasm = await getMediaPipeVision();
  cachedSegmenter = await ImageSegmenter.createFromOptions(wasm, {
    baseOptions: {
      modelAssetPath: SEGMENTER_MODEL_URL,
      delegate: "GPU", // Will automatically fall back to CPU if WebGL/GPU is unavailable
    },
    runningMode: "IMAGE",
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });

  return cachedSegmenter;
}

/**
 * Returns cached or newly created ObjectDetector (EfficientDet Lite for travel subjects)
 */
export async function getObjectDetector(): Promise<ObjectDetector> {
  if (cachedDetector) return cachedDetector;

  const wasm = await getMediaPipeVision();
  cachedDetector = await ObjectDetector.createFromOptions(wasm, {
    baseOptions: {
      modelAssetPath: DETECTOR_MODEL_URL,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    maxResults: 8,
    scoreThreshold: 0.35,
  });

  return cachedDetector;
}
