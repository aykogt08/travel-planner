// types/collage-template.ts

export type PhotoOrientation = "portrait" | "landscape" | "square";

export interface PhotoFeatures {
  id: string;
  src: string;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  orientation: PhotoOrientation;
  brightness: number; // 0.0 (dark) - 1.0 (bright)
  isMainCandidate?: boolean; // high quality / clear aspect
  hasTransparency?: boolean; // image contains transparent pixels (cutout sticker)
  isCutoutSticker?: boolean;
}

export type SlotRole = "mainPhoto" | "secondaryPhoto" | "subPhoto" | "cutout" | "background" | "sticker";

export interface TemplateSlot {
  role: SlotRole;
  x: number; // normalized coordinate (0.0 - 1.0)
  y: number; // normalized coordinate (0.0 - 1.0)
  width: number; // normalized width (0.0 - 1.0)
  height: number; // normalized height (0.0 - 1.0)
  rotationRange: [number, number]; // e.g. [-4, 4] in degrees
  zIndex: number;
  preferredOrientation?: PhotoOrientation | "any";
  cropMode?: "cover" | "contain";
  frameStyle?: "polaroid" | "tape" | "clean" | "vintage" | "film" | "none";
  optional?: boolean;
}

export type TemplateStyle =
  | "scrapbook"
  | "magazine"
  | "polaroid"
  | "messy"
  | "minimal"
  | "photo_diary";

export interface CollageTemplate {
  id: string;
  name: string;
  style: TemplateStyle;
  supportedPhotoCount: {
    min: number;
    max: number;
  };
  aspect: "4:5" | "1:1" | "9:16";
  background: "craft" | "notebook" | "dark" | "clean" | "watercolor" | "magazine_white";
  slots: TemplateSlot[];
  description: string;
}

export interface TemplateMatchScore {
  template: CollageTemplate;
  score: number;
  reasons: string[];
}
