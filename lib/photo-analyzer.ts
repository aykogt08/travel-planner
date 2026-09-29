// lib/photo-analyzer.ts
import { PhotoFeatures, PhotoOrientation } from "@/types/collage-template";

/**
 * Analyzes an image on-device using Canvas API (100% offline).
 * Extracts dimensions, orientation, aspect ratio, and average brightness.
 */
export async function analyzePhoto(
  file: File | Blob,
  id: string = crypto.randomUUID()
): Promise<{ features: PhotoFeatures; imgElement: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const aspectRatio = width / (height || 1);

      // Determine orientation
      let orientation: PhotoOrientation = "square";
      if (aspectRatio > 1.15) {
        orientation = "landscape";
      } else if (aspectRatio < 0.85) {
        orientation = "portrait";
      }

      // Analyze brightness via small offscreen canvas sample (32x32)
      let brightness = 0.5;
      try {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = 32;
        offCanvas.height = 32;
        const ctx = offCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 32, 32);
          const imageData = ctx.getImageData(0, 0, 32, 32);
          const data = imageData.data;
          let totalLuminance = 0;
          for (let i = 0; i < data.length; i += 4) {
            // Standard relative luminance calculation
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;
          }
          brightness = totalLuminance / (data.length / 4) / 255;
        }
      } catch (err) {
        // Fallback for CORS or canvas restriction
        brightness = 0.5;
      }

      const features: PhotoFeatures = {
        id,
        src: url,
        width,
        height,
        aspectRatio,
        orientation,
        brightness,
        // High resolution and good aspect ratio makes it a strong main candidate
        isMainCandidate: width >= 1200 && height >= 1200,
      };

      resolve({ features, imgElement: img });
    };

    img.onerror = (e) => reject(new Error("Failed to load image for analysis"));
    img.src = url;
  });
}

/**
 * Batch analyze multiple photo files on-device
 */
export async function batchAnalyzePhotos(
  files: (File | Blob)[]
): Promise<{ featuresList: PhotoFeatures[]; imagesMap: Record<string, HTMLImageElement> }> {
  const featuresList: PhotoFeatures[] = [];
  const imagesMap: Record<string, HTMLImageElement> = {};

  for (let i = 0; i < files.length; i++) {
    try {
      const res = await analyzePhoto(files[i]);
      featuresList.push(res.features);
      imagesMap[res.features.id] = res.imgElement;
    } catch (e) {
      console.warn("Failed to analyze photo index", i, e);
    }
  }

  return { featuresList, imagesMap };
}
