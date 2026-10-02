export type PlaceCategory =
  | "FOOD"
  | "SIGHTSEEING"
  | "CAFE"
  | "HOTEL"
  | "SHOPPING"
  | "ACTIVITY"
  | "OTHER";

export type ReservationStatus = "NONE" | "NEED_BOOKING" | "BOOKED";

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, { label: string; badgeClass: string }> = {
  NONE: { label: "予約不要 / 未定", badgeClass: "bg-stone-100 text-stone-600" },
  NEED_BOOKING: { label: "⚠️ 要予約 / 手配前", badgeClass: "bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/20 font-bold" },
  BOOKED: { label: "✓ 予約済み", badgeClass: "bg-[#386641]/15 text-[#386641] border border-[#386641]/30 font-bold" },
};

export const PRESET_PAYMENT_METHODS = [
  "楽天カード",
  "三井住友VISA",
  "JCBカード",
  "エポスカード",
  "アメックス",
  "PayPay",
  "現地決済",
  "現金",
  "マイル・ポイント",
];

export const PRESET_BOOKING_SITES = [
  "Booking.com",
  "Agoda",
  "一休.com",
  "楽天トラベル",
  "じゃらん",
  "Airbnb",
  "スマートEX",
  "JAL公式",
  "ANA公式",
  "Trip.com",
  "公式サイト",
];

export type TransportType =
  | "WALK"
  | "TRAIN"
  | "BUS"
  | "CAR"
  | "FLIGHT"
  | "SHIP"
  | "TAXI"
  | "OTHER";

export type ScheduleCategory =
  | "FOOD"
  | "SIGHTSEEING"
  | "TRANSPORT"
  | "HOTEL"
  | "ACTIVITY"
  | "OTHER";

export type PackingCategory =
  | "ESSENTIAL"
  | "CLOTHES"
  | "GADGET"
  | "MEDICINE"
  | "OTHER";

export interface Place {
  id: number;
  name: string;
  category: PlaceCategory | string;
  memo: string | null;
  address: string | null;
  mapUrl: string | null;
  websiteUrl: string | null;
  cost: number | null;
  businessHours: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  reservationStatus: ReservationStatus | string;
  bookingNumber?: string | null;
  paymentMethod?: string | null;
  cancelDeadline?: string | null;
  bookingSite?: string | null;
  rating: number | null;
  hasBreakfast?: boolean | null;
  visited: boolean;
  tripId: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Schedule {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  checkOutDate?: string | null;
  title: string;
  category: ScheduleCategory | string;
  transportType: TransportType | string | null;
  flightNumber: string | null;
  duration: number | null;
  fromPlace: string | null;
  toPlace: string | null;
  cost: number | null;
  memo: string | null;
  reservationStatus?: ReservationStatus | string | null;
  bookingNumber?: string | null;
  paymentMethod?: string | null;
  cancelDeadline?: string | null;
  bookingSite?: string | null;
  hasBreakfast?: boolean | null;
  isCompleted: boolean;
  placeId: number | null;
  place?: Place | null;
  tripId: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface PackingItem {
  id: number;
  category: PackingCategory | string;
  name: string;
  isPacked: boolean;
  tripId: number;
  createdAt?: string | Date;
}

export type WishStatus =
  | "IDEA"       // 思いついた
  | "CANDIDATE"  // 候補
  | "DONE"       // やった
  | "BEST"       // 最高だった
  | "NORMAL"     // 普通だった
  | "SKIPPED";   // やらなかった

export type WishCategory =
  | "CAFE"       // カフェ
  | "SEA"        // 海・水辺
  | "WALK"       // 街歩き・散歩
  | "FOOD"       // 食事・グルメ
  | "SCENERY"    // 景色・自然
  | "ART"        // アート・建築・歴史
  | "SHOPPING"   // 買い物・市場
  | "RELAX"      // のんびり・余白
  | "TRANSIT"    // 移動・列車・空港
  | "OTHER";     // その他

export interface WishItem {
  id: number;
  title: string;
  city: string | null;
  withWhom: string | null; // e.g. JSON array or comma separated
  priority: number; // 1〜5
  status: WishStatus | string;
  category: WishCategory | string | null;
  memo: string | null;
  tripId: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Trip {
  id: number;
  title: string;
  description: string | null;
  destination: string | null;
  coverImage: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  currency: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  places: Place[];
  schedules: Schedule[];
  packingList: PackingItem[];
  wishes: WishItem[];
}
