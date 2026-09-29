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

export interface SavedCollage {
  id: string; // uuid
  layout: CollageLayout;
  createdAt: string; // ISO timestamp
  thumbnail: string; // data URL for preview
}
