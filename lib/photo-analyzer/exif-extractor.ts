// lib/photo-analyzer/exif-extractor.ts
import { ExifMetadata } from "@/types/photo-analysis";

/**
 * Pure TypeScript EXIF and GPS extractor (100% offline, zero external dependencies).
 * Extracts DateTimeOriginal, GPSLatitude, GPSLongitude, Make, and Model directly from JPEG EXIF APP1 segment.
 */
export async function extractExif(file: File | Blob): Promise<ExifMetadata> {
  const result: ExifMetadata = {
    takenAt: null,
    latitude: null,
    longitude: null,
    make: null,
    model: null,
    hasExif: false,
  };

  try {
    const buffer = await file.slice(0, 128 * 1024).arrayBuffer(); // First 128KB is enough for EXIF header
    const view = new DataView(buffer);

    // Verify JPEG SOI (0xFFD8)
    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
      return result;
    }

    let offset = 2;
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      if (marker === 0xffe1) {
        // APP1 Marker (EXIF)
        const segmentLength = view.getUint16(offset, false);
        offset += 2;

        // Verify "Exif\0\0"
        const exifHeader = view.getUint32(offset, false);
        if (exifHeader === 0x45786966 && view.getUint16(offset + 4, false) === 0x0000) {
          result.hasExif = true;
          parseTiffBlock(view, offset + 6, result);
        }
        break;
      } else if ((marker & 0xff00) === 0xff00) {
        // Skip marker segment
        const segmentLength = view.getUint16(offset, false);
        offset += segmentLength;
      } else {
        break;
      }
    }
  } catch (err) {
    // Fail safely without throwing
    console.debug("EXIF parsing skipped:", err);
  }

  return result;
}

function parseTiffBlock(view: DataView, tiffStart: number, out: ExifMetadata) {
  try {
    const byteOrder = view.getUint16(tiffStart, false);
    const littleEndian = byteOrder === 0x4949; // "II" vs "MM"

    const firstIFDOffset = view.getUint32(tiffStart + 4, littleEndian);
    if (firstIFDOffset < 8) return;

    let gpsIFDOffset: number | null = null;
    let exifIFDOffset: number | null = null;

    // Parse IFD0
    const ifd0Start = tiffStart + firstIFDOffset;
    if (ifd0Start + 2 > view.byteLength) return;
    const entriesCount = view.getUint16(ifd0Start, littleEndian);

    for (let i = 0; i < entriesCount; i++) {
      const entryOffset = ifd0Start + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;
      const tag = view.getUint16(entryOffset, littleEndian);

      if (tag === 0x010f) {
        // Make
        out.make = readAsciiString(view, tiffStart, entryOffset, littleEndian);
      } else if (tag === 0x0110) {
        // Model
        out.model = readAsciiString(view, tiffStart, entryOffset, littleEndian);
      } else if (tag === 0x8769) {
        // Exif IFD Pointer
        exifIFDOffset = view.getUint32(entryOffset + 8, littleEndian);
      } else if (tag === 0x8825) {
        // GPS IFD Pointer
        gpsIFDOffset = view.getUint32(entryOffset + 8, littleEndian);
      }
    }

    // Parse Exif IFD (for DateTimeOriginal)
    if (exifIFDOffset) {
      const exifStart = tiffStart + exifIFDOffset;
      if (exifStart + 2 <= view.byteLength) {
        const count = view.getUint16(exifStart, littleEndian);
        for (let i = 0; i < count; i++) {
          const entryOffset = exifStart + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) break;
          const tag = view.getUint16(entryOffset, littleEndian);
          if (tag === 0x9003 || tag === 0x9004) {
            // DateTimeOriginal / DateTimeDigitized
            const dateStr = readAsciiString(view, tiffStart, entryOffset, littleEndian);
            if (dateStr) {
              out.takenAt = formatExifDate(dateStr);
            }
          }
        }
      }
    }

    // Parse GPS IFD
    if (gpsIFDOffset) {
      const gpsStart = tiffStart + gpsIFDOffset;
      if (gpsStart + 2 <= view.byteLength) {
        const count = view.getUint16(gpsStart, littleEndian);
        let latRef: string | null = null;
        let latValues: number[] | null = null;
        let lonRef: string | null = null;
        let lonValues: number[] | null = null;

        for (let i = 0; i < count; i++) {
          const entryOffset = gpsStart + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) break;
          const tag = view.getUint16(entryOffset, littleEndian);

          if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
          if (tag === 0x0002) latValues = readRationals(view, tiffStart, entryOffset, 3, littleEndian);
          if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(entryOffset + 8));
          if (tag === 0x0004) lonValues = readRationals(view, tiffStart, entryOffset, 3, littleEndian);
        }

        if (latValues && latRef) {
          const deg = latValues[0] + latValues[1] / 60 + latValues[2] / 3600;
          out.latitude = latRef === "S" ? -deg : deg;
        }
        if (lonValues && lonRef) {
          const deg = lonValues[0] + lonValues[1] / 60 + lonValues[2] / 3600;
          out.longitude = lonRef === "W" ? -deg : deg;
        }
      }
    }
  } catch (e) {
    // Ignore internal parsing error
  }
}

function readAsciiString(view: DataView, tiffStart: number, entryOffset: number, littleEndian: boolean): string | null {
  const count = view.getUint32(entryOffset + 4, littleEndian);
  if (count <= 0 || count > 500) return null;

  let valOffset = entryOffset + 8;
  if (count > 4) {
    valOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
  }

  if (valOffset + count > view.byteLength) return null;

  let str = "";
  for (let i = 0; i < count - 1; i++) {
    const charCode = view.getUint8(valOffset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim() || null;
}

function readRationals(
  view: DataView,
  tiffStart: number,
  entryOffset: number,
  count: number,
  littleEndian: boolean
): number[] | null {
  const offset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
  if (offset + count * 8 > view.byteLength) return null;

  const res: number[] = [];
  for (let i = 0; i < count; i++) {
    const num = view.getUint32(offset + i * 8, littleEndian);
    const den = view.getUint32(offset + i * 8 + 4, littleEndian);
    res.push(den === 0 ? 0 : num / den);
  }
  return res;
}

function formatExifDate(exifDateStr: string): string | null {
  // Format: "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
  try {
    const parts = exifDateStr.trim().split(" ");
    if (parts.length === 2) {
      const datePart = parts[0].replace(/:/g, "-");
      const iso = `${datePart}T${parts[1]}`;
      if (!isNaN(Date.parse(iso))) {
        return iso;
      }
    }
  } catch {}
  return null;
}
