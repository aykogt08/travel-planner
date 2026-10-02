// lib/photo-analyzer/photo-analyzer-facade.ts
import { PhotoMetadata } from "@/types/photo-analysis";
import { extractExif } from "./exif-extractor";
import { computePhotoHash } from "./hash-util";
import { classifyPhotoByRules } from "./rule-classifier";
import { cutoutSubject } from "@/lib/mediapipe/segmenter";
import { detectObjects } from "@/lib/mediapipe/detector";

/**
 * High-level PhotoAnalyzer facade.
 * Coordinates EXIF extraction, MediaPipe on-device inference, rule-based classification, and person cutout.
 */
export class PhotoAnalyzer {
  private static cache = new Map<string, PhotoMetadata>();

  /**
   * Complete analysis pipeline for a single image file.
   */
  public static async analyze(
    file: File | Blob,
    options: {
      enableCutout?: boolean;
      onProgress?: (msg: string) => void;
    } = {}
  ): Promise<PhotoMetadata> {
    const startTime = performance.now();
    const fileName = (file as File).name || `photo_${Date.now()}.jpg`;
    const fileSize = file.size;
    const mimeType = file.type || "image/jpeg";

    options.onProgress?.("基本情報とEXIFを解析中...");

    // 1. Parallel basic steps: EXIF extraction & Hash computation
    const [exif, sha256Hash] = await Promise.all([
      extractExif(file),
      computePhotoHash(file),
    ]);

    // Check memory cache to avoid redundant analysis
    if (this.cache.has(sha256Hash)) {
      return this.cache.get(sha256Hash)!;
    }

    // 2. Load into Image element
    options.onProgress?.("画像を読み込み中...");
    const img = await this.loadImage(file);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const aspectRatio = width / (height || 1);

    // Orientation (Computed with normal math, no AI needed)
    let orientation: "portrait" | "landscape" | "square" = "square";
    if (aspectRatio > 1.15) {
      orientation = "landscape";
    } else if (aspectRatio < 0.85) {
      orientation = "portrait";
    }

    // 3. MediaPipe On-Device Object & Subject Detection
    options.onProgress?.("MediaPipe AIで被写体を検出中...");
    let detectedLabels: { label: string; score: number }[] = [];
    let detectedPersonCount = 0;
    let detectedPersonBoxes: { originX: number; originY: number; width: number; height: number }[] = [];
    try {
      const detectResult = await detectObjects(img);
      detectedLabels = detectResult.labels;
      detectedPersonCount = detectResult.personCount;
      detectedPersonBoxes = detectResult.personBoxes || [];
    } catch (detErr) {
      console.warn("MediaPipe object detection fallback:", detErr);
    }

    // 4. Person & Subject Cutout (ImageSegmenter with personBoxes assistance)
    let cutoutResult = undefined;
    let hasCutoutSubject = false;
    if (options.enableCutout !== false) {
      options.onProgress?.("人物・被写体を自動切り抜き中...");
      try {
        cutoutResult = await cutoutSubject(img, {
          personBoxes: detectedPersonBoxes,
        });
        hasCutoutSubject = cutoutResult.hasSubject;
      } catch (segErr) {
        console.warn("MediaPipe segmentation fallback:", segErr);
      }
    }

    // 5. Rule Engine Classification
    options.onProgress?.("旅行カテゴリを自動判定中...");
    const ruleResult = classifyPhotoByRules({
      detectedLabels,
      personCount: detectedPersonCount,
      hasCutoutSubject,
      aspectRatio,
      width,
      height,
    });

    const analysisTimeMs = Math.round(performance.now() - startTime);

    const metadata: PhotoMetadata = {
      photoId: crypto.randomUUID(),
      fileName,
      fileSize,
      mimeType,
      width,
      height,
      aspectRatio,
      orientation,
      primaryCategory: ruleResult.primaryCategory,
      secondaryCategories: ruleResult.secondaryCategories,
      detectedEntities: ruleResult.detectedEntities,
      hasPerson: ruleResult.hasPerson,
      personCount: detectedPersonCount,
      hasFood: ruleResult.hasFood,
      hasAnimal: ruleResult.hasAnimal,
      hasBuilding: ruleResult.hasBuilding,
      hasVehicle: ruleResult.hasVehicle,
      isIndoor: ruleResult.isIndoor,
      isOutdoor: ruleResult.isOutdoor,
      isPortrait: orientation === "portrait",
      isLandscape: orientation === "landscape",
      exif,
      sha256Hash,
      cutout: cutoutResult,
      analysisStatus: "success",
      analysisTimeMs,
      analysisVersion: "1.0",
    };

    // Store in cache
    this.cache.set(sha256Hash, metadata);
    return metadata;
  }

  /**
   * Helper to load a file into an HTMLImageElement
   */
  private static loadImage(file: File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image element"));
      };
      img.src = url;
    });
  }
}
