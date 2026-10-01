// lib/photo-analyzer/hash-util.ts

/**
 * Calculates a SHA-256 hex digest of a File or Blob using native Web Crypto API.
 * 100% on-device and offline.
 */
export async function computePhotoHash(file: File | Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    // Fallback pseudo-hash from file attributes if crypto subtle is unavailable
    const fallback = `${(file as File).name || "blob"}_${file.size}_${file.type}`;
    return `fallback_${btoa(fallback).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`;
  }
}

/**
 * Quick 64-bit perceptual image hash (dHash) for finding duplicates and near-identical photos
 * Resizes image to 9x8 grayscale canvas and computes adjacent gradient bits.
 */
export async function computeDHash(img: HTMLImageElement): Promise<string> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "";

    ctx.drawImage(img, 0, 0, 9, 8);
    const imgData = ctx.getImageData(0, 0, 9, 8).data;

    let hash = "";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const leftIdx = (row * 9 + col) * 4;
        const rightIdx = (row * 9 + col + 1) * 4;

        const leftLum = imgData[leftIdx] * 0.299 + imgData[leftIdx + 1] * 0.587 + imgData[leftIdx + 2] * 0.114;
        const rightLum = imgData[rightIdx] * 0.299 + imgData[rightIdx + 1] * 0.587 + imgData[rightIdx + 2] * 0.114;

        hash += leftLum > rightLum ? "1" : "0";
      }
    }

    // Convert 64 bits to 16 hex characters
    let hex = "";
    for (let i = 0; i < hash.length; i += 4) {
      hex += parseInt(hash.substring(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch {
    return "";
  }
}

/**
 * Computes Hamming distance between two 16-character hex dHashes (0-64).
 * A distance <= 5 usually denotes duplicate or near-identical photos.
 */
export function compareDHashes(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const valA = parseInt(hashA[i], 16);
    const valB = parseInt(hashB[i], 16);
    let xor = valA ^ valB;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}
