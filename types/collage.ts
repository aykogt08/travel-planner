// types/collage.ts
export interface PhotoItem {
  id: string; // unique identifier
  src: string; // Blob URL or base64 data URL
  caption?: string;
  date?: string; // ISO string
  location?: string; // city name
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export type CollageStyle = "polaroid" | "vintage" | "minimal" | "journal" | "tape" | "retro" | "watercolor" | "sketch" | "night" | "seasonal";

export interface CollageElement {
  photoId: string;
  x: number; // percentage of canvas width (0-100)
  y: number; // percentage of canvas height (0-100)
  width: number; // percentage of canvas width
  height: number; // percentage of canvas height
  rotation: number; // degrees
  zIndex: number;
  style: CollageStyle;
}

export interface CollageLayout {
  elements: CollageElement[];
  background: string; // CSS background (texture name)
  aspect: "4:5" | "9:16" | "1:1";
  theme: CollageStyle;
}

import { PhotoFeatures } from "./collage-template";

export interface SavedCollagePhoto {
  features: PhotoFeatures;
  dataUrl: string;
}

export interface FreeformSticker {
  id: string;
  photoId: string;
  x: number; // percentage of canvas width (0-100)
  y: number; // percentage of canvas height (0-100)
  scale: number; // scale multiplier, default 1.0
  rotation: number; // rotation in degrees (-180 to 180)
  width: number; // percentage width
  height: number; // percentage height
  zIndex: number;
}

export interface SavedCollage {
  id: string; // uuid
  layout: CollageLayout;
  createdAt: string; // ISO timestamp
  thumbnail: string; // data URL for preview
  templateId?: string;
  customTitle?: string;
  cityName?: string;
  cityFlag?: string;
  visitDate?: string;
  tripId?: number;
  syncStatus?: "synced" | "pending_sync";
  includeDateStamp?: boolean;
  showTitle?: boolean;
  showWatermark?: boolean;
  showStamp?: boolean;
  savedPhotos?: SavedCollagePhoto[];
  freeformStickers?: FreeformSticker[];
}



