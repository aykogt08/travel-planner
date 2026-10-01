// types/photo-analysis.ts

/**
 * 14 Core categories defined for travel photo classification
 */
export type PhotoCategory =
  | "person"          // 人物
  | "food"            // 食べ物・グルメ
  | "landscape"       // 景色・絶景
  | "architecture"    // 建物・名所・歴史遺産
  | "animal"          // 動物・ペット
  | "transportation"  // 乗り物（電車・飛行機・バス等）
  | "hotel"           // ホテル・宿泊施設・部屋
  | "street"          // 街並み・通り・路地
  | "nature"          // 自然・植物・花・海
  | "event"           // イベント・祭り・ナイトライフ
  | "object"          // 物・雑貨・お土産
  | "document"        // 書類・チケット・案内板
  | "screenshot"      // スクリーンショット
  | "other";          // その他

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, { label: string; icon: string; description: string }> = {
  person: { label: "人物", icon: "👤", description: "旅行者・セルフィー・ポートレート" },
  food: { label: "食べ物", icon: "🍴", description: "グルメ・スイーツ・食事・カフェ" },
  landscape: { label: "景色", icon: "🏞️", description: "壮大な風景・展望・パノラマ" },
  architecture: { label: "建物", icon: "🏛️", description: "歴史的建造物・教会・城・現代建築" },
  animal: { label: "動物", icon: "🐾", description: "野生動物・鳥・ペット・水族館" },
  transportation: { label: "乗り物", icon: "🚆", description: "電車・飛行機・バス・船・レンタカー" },
  hotel: { label: "ホテル", icon: "🏨", description: "宿泊先・ロビー・客室・リゾート" },
  street: { label: "街並み", icon: "🏘️", description: "街歩き・旧市街・商店街・路地" },
  nature: { label: "自然", icon: "🌿", description: "花・植物・海・山・公園" },
  event: { label: "イベント", icon: "🎪", description: "フェスティバル・ショー・花火" },
  object: { label: "物", icon: "🛍️", description: "お土産・工芸品・雑貨・小物" },
  document: { label: "書類", icon: "📄", description: "チケット・マップ・案内標識・メニュー" },
  screenshot: { label: "スクリーンショット", icon: "📱", description: "スマホ画面のキャプチャ" },
  other: { label: "その他", icon: "✨", description: "その他の写真" },
};

export interface DetectedEntity {
  label: string;
  category: PhotoCategory;
  score: number; // 0.0 - 1.0
  box?: { originX: number; originY: number; width: number; height: number };
}

export interface ExifMetadata {
  takenAt?: string | null;      // ISO string
  latitude?: number | null;
  longitude?: number | null;
  make?: string | null;         // camera brand (e.g. Apple)
  model?: string | null;        // camera model (e.g. iPhone 15 Pro)
  hasExif: boolean;
}

export interface CutoutResult {
  cutoutDataUrl: string;        // Transparent PNG of detected subject
  maskDataUrl?: string;         // Binary / grayscale mask
  subjectBox?: { x: number; y: number; width: number; height: number }; // normalized
  hasSubject: boolean;
  cutoutRatio: number;          // Subject area ratio (0.0 - 1.0)
}

export interface PhotoMetadata {
  photoId: string;
  fileName: string;
  fileSize: number;             // bytes
  mimeType: string;
  
  // Dimensions and shape (computed without AI)
  width: number;
  height: number;
  aspectRatio: number;
  orientation: "portrait" | "landscape" | "square";

  // Classification (AI detection + App rule engine)
  primaryCategory: PhotoCategory;
  secondaryCategories: PhotoCategory[];
  detectedEntities: DetectedEntity[];

  // Subject and person attributes
  hasPerson: boolean;
  personCount: number;
  hasFood: boolean;
  hasAnimal: boolean;
  hasBuilding: boolean;
  hasVehicle: boolean;
  isIndoor: boolean;
  isOutdoor: boolean;
  isPortrait: boolean;
  isLandscape: boolean;

  // EXIF & Hash
  exif: ExifMetadata;
  sha256Hash: string;

  // Cutout assets
  cutout?: CutoutResult;

  // Status and versioning
  analysisStatus: "success" | "partial" | "failed";
  errorCode?: string;
  analysisTimeMs: number;
  analysisVersion: string;
}

export interface PhotoAnalysisProgress {
  total: number;
  completed: number;
  currentFileName: string;
  isCancelled: boolean;
}
