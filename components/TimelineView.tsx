"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Schedule, Place, TransportType, ScheduleCategory, ReservationStatus, PRESET_PAYMENT_METHODS, PRESET_BOOKING_SITES } from "@/types/trip";
import { normalizeNumberInput } from "@/lib/utils";
import {
  Clock,
  MapPin,
  CircleDollarSign,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Footprints,
  Train,
  Bus,
  Car,
  Plane,
  Ship,
  Sparkles,
  Calendar,
  Utensils,
  Landmark,
  Hotel,
  LogOut,
  LogIn,
  Moon,
  Users,
  Divide,
  Coffee,
  ChevronRight,
  ChevronUp,
  Compass,
  ArrowRight,
  ArrowUp,
  LayoutGrid,
  ListOrdered,
  X,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "./PlacesManager";
import BookingScanModal from "./bookings/BookingScanModal";
import { CityMasterItem, loadCityMaster } from "@/lib/city-master";
import CityMasterModal from "./CityMasterModal";

interface TimelineViewProps {
  tripId: number;
  schedules: Schedule[];
  places: Place[];
  startDate: string | null;
  endDate: string | null;
  onSchedulesChange: (schedules: Schedule[]) => void;
  onPlacesChange?: (places: Place[]) => void;
  isOffline?: boolean;
  initialDateTab?: string | null;
  onInitialDateTabHandled?: () => void;
}

export const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  WALK: <Footprints className="w-3.5 h-3.5 text-[#003049]" />,
  TRAIN: <Train className="w-3.5 h-3.5 text-[#386641]" />,
  BUS: <Bus className="w-3.5 h-3.5 text-[#386641]" />,
  CAR: <Car className="w-3.5 h-3.5 text-[#386641]" />,
  FLIGHT: <Plane className="w-3.5 h-3.5 text-[#386641]" />,
  SHIP: <Ship className="w-3.5 h-3.5 text-[#386641]" />,
  TAXI: <Car className="w-3.5 h-3.5 text-[#386641]" />,
};

export const TRANSPORT_LABELS: Record<string, string> = {
  WALK: "徒歩",
  TRAIN: "電車・新幹線",
  BUS: "バス",
  CAR: "車・レンタカー",
  FLIGHT: "飛行機",
  SHIP: "船・フェリー",
  TAXI: "タクシー",
};

export interface TimelineEventItem {
  key: string;
  schedule: Schedule;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // "15:00"
  type: "NORMAL" | "HOTEL_CHECKIN" | "HOTEL_CHECKOUT";
  hotelNights?: number;
  hotelStayRangeText?: string;
}


export interface CityLegItem {
  id: string;
  name: string;
  flag: string;
  country: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  customMemo?: string;
  cityName?: string;
}

export interface CityLeg {
  id: string;
  name: string;
  flag: string;
  country: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dates: string[];
  dayIndices: number[]; // 1-based index (e.g. [1, 2])
  schedulesCount: number;
  highlightTitles: string[];
  customMemo?: string;
  isCustomized?: boolean;
  cityName?: string;
  cities?: { name: string; flag: string; country: string }[];
}

export const PRESET_GROUP_ICONS = [
  { icon: "👥", label: "グループ" },
  { icon: "👤", label: "一人旅" },
  { icon: "👨‍👩‍👧", label: "家族" },
  { icon: "✈️", label: "移動" },
  { icon: "🍷", label: "観光" },
  { icon: "🇵🇹", label: "ポルトガル" },
  { icon: "🇪🇸", label: "スペイン" },
  { icon: "🇫🇷", label: "フランス" },
  { icon: "🇮🇹", label: "イタリア" },
  { icon: "🇩🇪", label: "ドイツ" },
  { icon: "🇬🇧", label: "イギリス" },
  { icon: "🇯🇵", label: "日本" },
];

export const PRESET_FLAGS = [
  { flag: "🇫🇷", country: "フランス" },
  { flag: "🇵🇹", country: "ポルトガル" },
  { flag: "🇪🇸", country: "スペイン" },
  { flag: "🇮🇹", country: "イタリア" },
  { flag: "🇭🇺", country: "ハンガリー" },
  { flag: "🇨🇿", country: "チェコ" },
  { flag: "🇦🇹", country: "オーストリア" },
  { flag: "🇩🇪", country: "ドイツ" },
  { flag: "🇬🇧", country: "イギリス" },
  { flag: "🇨🇭", country: "スイス" },
  { flag: "🇯🇵", country: "日本" },
  { flag: "🇪🇺", country: "ヨーロッパ" },
];

export default function TimelineView({
  tripId,
  schedules,
  places,
  startDate,
  endDate,
  onSchedulesChange,
  onPlacesChange,
  isOffline = false,
  initialDateTab,
  onInitialDateTabHandled,
}: TimelineViewProps) {
  const [selectedDateTab, setSelectedDateTab] = useState<string>("ALL");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("ALL");
  const [timelineViewMode, setTimelineViewMode] = useState<"TIMELINE" | "CITY_SUMMARY">("TIMELINE");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor window scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle booking added from AI scanner
  const handleBookingAdded = (type: "SCHEDULE" | "PLACE", item: any) => {
    if (type === "SCHEDULE") {
      onSchedulesChange([...schedules, item]);
    } else if (type === "PLACE" && onPlacesChange) {
      onPlacesChange([...places, item]);
    }
  };

  // City Master list & modal
  const [cityMasterList, setCityMasterList] = useState<CityMasterItem[]>(() => loadCityMaster());
  const [isCityMasterOpen, setIsCityMasterOpen] = useState(false);
  const [assigningCityDate, setAssigningCityDate] = useState<string | null>(null);

  // Day-specific city overrides: dateStr -> cityName
  const [dayCityOverrides, setDayCityOverrides] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`trip_day_cities_${tripId}`);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  const handleSetDayCity = async (dateStr: string, cityName: string) => {
    const prev = dayCityOverrides;
    const updated = { ...prev, [dateStr]: cityName };
    setDayCityOverrides(updated);
    setAssigningCityDate(null);
    try {
      localStorage.setItem(`trip_day_cities_${tripId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (!isOffline) {
      try {
        const res = await fetch(`/api/trips/${tripId}/day-cities`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) {
          throw new Error("Failed to save day city override");
        }
      } catch (e) {
        console.error("Failed to save day city override to DB", e);
        setDayCityOverrides(prev);
        try {
          localStorage.setItem(`trip_day_cities_${tripId}`, JSON.stringify(prev));
        } catch {}
        setToastError("都市の変更の保存に失敗しました。もう一度お試しください。");
      }
    }
  };

  // State for error toast notification
  const [toastError, setToastError] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastError) {
      const timer = setTimeout(() => setToastError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastError]);

  // State for in-app confirmation modal
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Helper to normalize legs (ensure trimmed name)
  const normalizeCityLegs = (legs: CityLegItem[]): CityLegItem[] => {
    return legs.map((item) => {
      const name = item.name?.trim() || "";
      return {
        ...item,
        name,
      };
    });
  };

  // Custom City Legs management (null = using auto-generated)
  const [customCityLegs, setCustomCityLegs] = useState<CityLegItem[] | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`trip_custom_city_legs_${tripId}`);
        if (stored) {
          const parsed: CityLegItem[] = JSON.parse(stored);
          const normalized = normalizeCityLegs(parsed);
          return normalized;
        }
      } catch (e) {
        console.error("Failed to load custom city legs from localStorage", e);
      }
    }
    return null;
  });
  const [editingCityLeg, setEditingCityLeg] = useState<CityLeg | null>(null);
  const [isCreatingCityLeg, setIsCreatingCityLeg] = useState<boolean>(false);

  // Sync custom city legs and day-cities with DB (with one-time localStorage migration)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isOffline) {
        if (typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem(`trip_custom_city_legs_${tripId}`);
            if (stored) setCustomCityLegs(normalizeCityLegs(JSON.parse(stored)));
            const dayCitiesStored = localStorage.getItem(`trip_day_cities_${tripId}`);
            if (dayCitiesStored) setDayCityOverrides(JSON.parse(dayCitiesStored));
          } catch (e) {
            console.error("Failed to load data from localStorage", e);
          }
        }
        return;
      }

      try {
        // 1. Fetch groups from DB
        const groupsRes = await fetch(`/api/trips/${tripId}/groups`);
        if (groupsRes.ok) {
          const dbGroups: CityLegItem[] = await groupsRes.json();
          if (!isMounted) return;

          if (dbGroups.length > 0) {
            const normalized = normalizeCityLegs(dbGroups);
            setCustomCityLegs(normalized);
            try {
              localStorage.setItem(`trip_custom_city_legs_${tripId}`, JSON.stringify(normalized));
            } catch {}
          } else {
            // DB is empty, check if legacy localStorage exists to migrate
            const localStored = localStorage.getItem(`trip_custom_city_legs_${tripId}`);
            if (localStored) {
              try {
                const parsed: CityLegItem[] = JSON.parse(localStored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const normalized = normalizeCityLegs(parsed);
                  setCustomCityLegs(normalized);
                  await fetch(`/api/trips/${tripId}/groups`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(normalized),
                  });
                }
              } catch (err) {
                console.error("Failed to migrate legacy groups to DB", err);
              }
            }
          }
        }

        // 2. Fetch day-cities from DB
        const citiesRes = await fetch(`/api/trips/${tripId}/day-cities`);
        if (citiesRes.ok) {
          const dbCities: Record<string, string> = await citiesRes.json();
          if (!isMounted) return;

          if (Object.keys(dbCities).length > 0) {
            setDayCityOverrides(dbCities);
            try {
              localStorage.setItem(`trip_day_cities_${tripId}`, JSON.stringify(dbCities));
            } catch {}
          } else {
            const localStoredCities = localStorage.getItem(`trip_day_cities_${tripId}`);
            if (localStoredCities) {
              try {
                const parsedCities = JSON.parse(localStoredCities);
                if (parsedCities && Object.keys(parsedCities).length > 0) {
                  setDayCityOverrides(parsedCities);
                  await fetch(`/api/trips/${tripId}/day-cities`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(parsedCities),
                  });
                }
              } catch (err) {
                console.error("Failed to migrate legacy day cities to DB", err);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load groups/day-cities from DB", e);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [tripId, isOffline]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
  };

  // Helper: get city and companion for a given day (NO KEYWORD GUESSING)
  const getDayMetadata = useCallback(
    (dateStr: string, _daySchedules: Schedule[]) => {
      // 1. City: check dayCityOverrides first, then fallback to Europe/default
      const overrideCityName = dayCityOverrides[dateStr];
      let city = cityMasterList.find((c) => c.name === overrideCityName);
      if (!city) {
        city = cityMasterList.find((c) => c.name === "ヨーロッパ周遊") || cityMasterList[0];
      }

      // Companion: no keyword guessing! Explicitly managed via groups (CityLegs)
      return { city, companion: null as string | null };
    },
    [dayCityOverrides, cityMasterList]
  );

  // Calculate day list from trip start/end date & schedules (including checkOutDate)
  const getDateList = () => {
    const datesSet = new Set<string>();

    // From schedules & hotel checkout dates
    schedules.forEach((s) => {
      datesSet.add(s.date.split("T")[0]);
      if (s.checkOutDate) {
        datesSet.add(s.checkOutDate.split("T")[0]);
      }
    });

    // From trip range
    if (startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(startDate);
      const cur = new Date(start);
      while (cur <= end) {
        datesSet.add(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }

    return Array.from(datesSet).sort();
  };

  const datesList = getDateList();

  // Raw pre-calculated metadata before manual overrides
  const rawDayMetaMap = useMemo(() => {
    const map = new Map<string, { city: CityMasterItem; companion: string | null }>();
    datesList.forEach((dateStr) => {
      const dayScheds = schedules.filter((s) => s.date.split("T")[0] === dateStr);
      map.set(dateStr, getDayMetadata(dateStr, dayScheds));
    });
    return map;
  }, [datesList, schedules, getDayMetadata]);

  // Auto-group continuous days into initial Group Leg items: No automatic guessing of groups/companions
  const autoGeneratedCityLegItems: CityLegItem[] = useMemo(() => {
    return [];
  }, []);

  // Final calculated City Legs (using customCityLegs if present, else auto-generated)
  const cityLegs: CityLeg[] = useMemo(() => {
    const baseItems: CityLegItem[] =
      customCityLegs !== null ? customCityLegs : autoGeneratedCityLegItems;
    if (!baseItems || baseItems.length === 0) return [];

    // Sort by startDate
    const sorted = [...baseItems].sort((a, b) => a.startDate.localeCompare(b.startDate));

    return sorted.map((item) => {
      // Calculate date list for this leg
      const legDates: string[] = [];
      const cur = new Date(item.startDate);
      const end = new Date(item.endDate);
      while (cur <= end) {
        legDates.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }

      // Day indices
      const dayIndices = legDates
        .map((d) => datesList.indexOf(d) + 1)
        .filter((idx) => idx > 0);

      // Schedules in this leg
      const legSchedules = schedules.filter((s) => legDates.includes(s.date.split("T")[0]));
      const highlights = Array.from(
        new Set(
          legSchedules
            .filter((s) => s.category !== "HOTEL")
            .map((s) => s.title)
            .slice(0, 3)
        )
      );

      // Collect cities visited in this leg
      const legCities: { name: string; flag: string; country: string }[] = [];
      const seenCity = new Set<string>();
      legDates.forEach((d) => {
        const raw = rawDayMetaMap.get(d);
        if (raw?.city && raw.city.name !== "ヨーロッパ周遊" && !seenCity.has(raw.city.name)) {
          seenCity.add(raw.city.name);
          legCities.push({ name: raw.city.name, flag: raw.city.flag, country: raw.city.country });
        }
      });

      return {
        id: item.id,
        name: item.name,
        flag: item.flag || "👥",
        country: item.country,
        startDate: item.startDate,
        endDate: item.endDate,
        dates: legDates,
        dayIndices: dayIndices.length > 0 ? dayIndices : [1],
        schedulesCount: legSchedules.length,
        highlightTitles: highlights,
        customMemo: item.customMemo,
        isCustomized: customCityLegs !== null,
        cityName: item.cityName || (legCities.length > 0 ? legCities.map((c) => c.name).join("・") : undefined),
        cities: legCities,
      };
    });
  }, [customCityLegs, autoGeneratedCityLegItems, datesList, schedules, rawDayMetaMap]);

  // Effective day metadata mapping reflecting cityLegs and dayCityOverrides
  const dayMetaMap = useMemo(() => {
    const map = new Map<string, { city: { name: string; flag: string; country: string }; groupName: string | null }>();
    datesList.forEach((d) => {
      const raw = rawDayMetaMap.get(d);
      if (raw) {
        map.set(d, {
          city: { name: raw.city.name, flag: raw.city.flag, country: raw.city.country },
          groupName: null,
        });
      }
    });

    cityLegs.forEach((leg) => {
      leg.dates.forEach((d) => {
        const existing = map.get(d);
        const overrideCityName = dayCityOverrides[d];
        const masterCity = overrideCityName ? cityMasterList.find((c) => c.name === overrideCityName) : null;
        const fallbackCity = leg.cityName ? cityMasterList.find((c) => c.name === leg.cityName) : null;

        const effectiveCity = masterCity
          ? { name: masterCity.name, flag: masterCity.flag, country: masterCity.country }
          : existing && existing.city.name !== "ヨーロッパ周遊"
          ? existing.city
          : fallbackCity
          ? { name: fallbackCity.name, flag: fallbackCity.flag, country: fallbackCity.country }
          : existing
          ? existing.city
          : { name: leg.name, flag: leg.flag, country: leg.country };

        map.set(d, {
          city: effectiveCity,
          groupName: leg.name,
        });
      });
    });

    return map;
  }, [cityLegs, datesList, rawDayMetaMap, dayCityOverrides, cityMasterList]);

  // Handle jumping to initial date tab when specified from outside (e.g. added from spots)
  useEffect(() => {
    if (initialDateTab) {
      setSelectedDateTab(initialDateTab);
      const meta = dayMetaMap.get(initialDateTab);
      if (meta && selectedCityFilter !== "ALL" && meta.city.name !== selectedCityFilter) {
        setSelectedCityFilter(meta.city.name);
      }
      if (onInitialDateTabHandled) {
        onInitialDateTabHandled();
      }
    }
  }, [initialDateTab, dayMetaMap, selectedCityFilter, onInitialDateTabHandled]);

  // Smooth scroll active date tab into view in the horizontal date tab bar
  useEffect(() => {
    if (selectedDateTab && selectedDateTab !== "ALL") {
      const timer = setTimeout(() => {
        const btn = document.getElementById(`date-tab-btn-${selectedDateTab}`);
        if (btn) {
          btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [selectedDateTab]);

  // Delete a city leg from summary
  const handleDeleteCityLeg = (legId: string) => {
    const targetLeg = cityLegs.find((l) => l.id === legId);
    if (!targetLeg) return;

    setConfirmModalConfig({
      title: "グループの削除",
      message: `「${targetLeg.flag} ${targetLeg.name}」(${targetLeg.startDate} 〜 ${targetLeg.endDate}) をグループまとめから削除しますか？\n\n※この期間に登録されている予定やホテルは削除されません。`,
      confirmLabel: "削除する",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModalConfig(null);
        const prev = customCityLegs;
        const currentItems = customCityLegs !== null ? customCityLegs : autoGeneratedCityLegItems;
        const updated = currentItems.filter((item) => item.id !== legId);
        setCustomCityLegs(updated);

        try {
          localStorage.setItem(`trip_custom_city_legs_${tripId}`, JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save custom city legs", e);
        }

        if (!isOffline) {
          try {
            const res = await fetch(`/api/trips/${tripId}/groups`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            });
            if (res.ok) {
              const saved: CityLegItem[] = await res.json();
              setCustomCityLegs(saved);
              try {
                localStorage.setItem(`trip_custom_city_legs_${tripId}`, JSON.stringify(saved));
              } catch {}
            } else {
              throw new Error("Failed to delete group");
            }
          } catch (e) {
            console.error("Failed to delete group in DB", e);
            setCustomCityLegs(prev);
            try {
              if (prev !== null) {
                localStorage.setItem(`trip_custom_city_legs_${tripId}`, JSON.stringify(prev));
              } else {
                localStorage.removeItem(`trip_custom_city_legs_${tripId}`);
              }
            } catch {}
            setToastError("グループの削除に失敗しました。もう一度お試しください。");
          }
        }
      },
    });
  };

  // Save (create or update) a city leg
  const handleSaveCityLeg = async (item: CityLegItem) => {
    const normalizedItem: CityLegItem = {
      ...item,
      name: item.name.trim(),
    };
    const prev = customCityLegs;
    const currentItems = customCityLegs !== null ? [...customCityLegs] : [...autoGeneratedCityLegItems];
    const existingIndex = currentItems.findIndex((l) => l.id === normalizedItem.id);

    let updated: CityLegItem[];
    if (existingIndex >= 0) {
      updated = [...currentItems];
      updated[existingIndex] = normalizedItem;
    } else {
      updated = [...currentItems, normalizedItem];
    }

    updated.sort((a, b) => a.startDate.localeCompare(b.startDate));
    setCustomCityLegs(updated);

    try {
      localStorage.setItem(`trip_custom_city_legs_${tripId}`, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save custom city legs to localStorage", e);
    }

    if (!isOffline) {
      try {
        const res = await fetch(`/api/trips/${tripId}/groups`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (res.ok) {
          const saved: CityLegItem[] = await res.json();
          setCustomCityLegs(saved);
          try {
            localStorage.setItem(`trip_custom_city_legs_${tripId}`, JSON.stringify(saved));
          } catch {}
        } else {
          throw new Error("Failed to save group");
        }
      } catch (e) {
        console.error("Failed to save group to DB", e);
        setCustomCityLegs(prev);
        try {
          if (prev !== null) {
            localStorage.setItem(`trip_custom_city_legs_${tripId}`, JSON.stringify(prev));
          } else {
            localStorage.removeItem(`trip_custom_city_legs_${tripId}`);
          }
        } catch {}
        setToastError("グループ情報の保存に失敗しました。もう一度お試しください。");
      }
    }

    setEditingCityLeg(null);
    setIsCreatingCityLeg(false);
  };

  // Reset customization to auto-detection (resets both groups and day-cities)
  const handleResetAllCityLegs = () => {
    setConfirmModalConfig({
      title: "グループと都市のリセット",
      message: "グループまとめと、日ごとに設定した都市をリセットして自動判定に戻しますか？\n\n※ご自身で行った追加・変更内容はリセットされます。",
      confirmLabel: "リセットする",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModalConfig(null);
        const prevLegs = customCityLegs;
        const prevCities = dayCityOverrides;

        setCustomCityLegs(null);
        setDayCityOverrides({});
        try {
          localStorage.removeItem(`trip_custom_city_legs_${tripId}`);
          localStorage.removeItem(`trip_day_cities_${tripId}`);
          localStorage.removeItem(`trip_city_overrides_${tripId}`);
        } catch (e) {
          console.error(e);
        }

        if (!isOffline) {
          try {
            const [res1, res2] = await Promise.all([
              fetch(`/api/trips/${tripId}/groups`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([]),
              }),
              fetch(`/api/trips/${tripId}/day-cities`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              }),
            ]);
            if (!res1.ok || !res2.ok) {
              throw new Error("Failed to reset");
            }
          } catch (e) {
            console.error("Failed to reset groups/cities in DB", e);
            setCustomCityLegs(prevLegs);
            setDayCityOverrides(prevCities);
            try {
              if (prevLegs !== null) {
                localStorage.setItem(`trip_custom_city_legs_${tripId}`, JSON.stringify(prevLegs));
              }
              localStorage.setItem(`trip_day_cities_${tripId}`, JSON.stringify(prevCities));
            } catch {}
            setToastError("リセットに失敗しました。もう一度お試しください。");
          }
        }
      },
    });
  };

  // Unique city list for quick filter pills
  const uniqueCitiesList = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; flag: string; count: number }[] = [];
    cityLegs.forEach((leg) => {
      if (!seen.has(leg.name)) {
        seen.add(leg.name);
        const totalDays = cityLegs.filter((l) => l.name === leg.name).reduce((acc, l) => acc + l.dates.length, 0);
        list.push({ name: leg.name, flag: leg.flag, count: totalDays });
      }
    });
    return list;
  }, [cityLegs]);

  // Filter visible dates by selectedCityFilter (supports group ID/name or city name)
  const visibleDatesList = useMemo(() => {
    if (selectedCityFilter === "ALL") return datesList;
    const targetLeg = cityLegs.find((l) => l.id === selectedCityFilter || l.name === selectedCityFilter);
    if (targetLeg) {
      return datesList.filter((d) => targetLeg.dates.includes(d));
    }
    return datesList.filter((d) => {
      const meta = dayMetaMap.get(d);
      return meta?.city.name === selectedCityFilter || meta?.groupName === selectedCityFilter;
    });
  }, [datesList, selectedCityFilter, cityLegs, dayMetaMap]);

  // Helper: Project schedules into timeline event cards (expanding Hotel check-in & check-out)
  const allTimelineItems: TimelineEventItem[] = [];

  schedules.forEach((s) => {
    const sDate = s.date.split("T")[0];
    const sOutDate = s.checkOutDate ? s.checkOutDate.split("T")[0] : null;

    if (s.category === "HOTEL") {
      let nights = 1;
      if (sOutDate && sOutDate > sDate) {
        nights = Math.ceil(
          (new Date(sOutDate).getTime() - new Date(sDate).getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      const stayRangeText = sOutDate
        ? `${formatDate(sDate)} 〜 ${formatDate(sOutDate)} (${nights}泊)`
        : `${formatDate(sDate)} (日帰り・1日)`;

      // Check-in Event
      allTimelineItems.push({
        key: `${s.id}-checkin`,
        schedule: s,
        dateStr: sDate,
        timeStr: s.startTime || "15:00",
        type: "HOTEL_CHECKIN",
        hotelNights: nights,
        hotelStayRangeText: stayRangeText,
      });

      // Check-out Event (if checkout date is different from check-in date)
      if (sOutDate && sOutDate !== sDate) {
        allTimelineItems.push({
          key: `${s.id}-checkout`,
          schedule: s,
          dateStr: sOutDate,
          timeStr: s.endTime || "11:00",
          type: "HOTEL_CHECKOUT",
          hotelNights: nights,
          hotelStayRangeText: stayRangeText,
        });
      }
    } else {
      allTimelineItems.push({
        key: String(s.id),
        schedule: s,
        dateStr: sDate,
        timeStr: s.startTime || "",
        type: "NORMAL",
      });
    }
  });

  // Filter items for selected tab and sort chronologically
  const filteredTimelineItems = allTimelineItems
    .filter((item) => {
      if (selectedDateTab === "ALL") return true;
      return item.dateStr === selectedDateTab;
    })
    .sort((a, b) => {
      const dateDiff = new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.timeStr.localeCompare(b.timeStr);
    });

  // Intermediate staying hotels (e.g. Day 2 of a 2-night stay)
  const activeStayingHotels =
    selectedDateTab !== "ALL"
      ? schedules.filter((s) => {
          if (s.category !== "HOTEL" || !s.checkOutDate) return false;
          const sDate = s.date.split("T")[0];
          const sOutDate = s.checkOutDate.split("T")[0];
          return sDate < selectedDateTab && selectedDateTab < sOutDate;
        })
      : [];

  // Form state
  const defaultInitialDate = () => {
    if (selectedDateTab !== "ALL") return selectedDateTab;
    if (startDate) return startDate.split("T")[0];
    return new Date().toISOString().split("T")[0];
  };

  const [form, setForm] = useState({
    date: defaultInitialDate(),
    startTime: "10:00",
    endTime: "11:30",
    checkOutDate: "",
    title: "",
    category: "SIGHTSEEING" as ScheduleCategory,
    transportType: "" as TransportType | "",
    flightNumber: "",
    duration: "",
    fromPlace: "",
    toPlace: "",
    cost: "",
    memo: "",
    placeId: "" as string,
    hasBreakfast: false,
    reservationStatus: "NONE" as ReservationStatus,
    bookingNumber: "",
    paymentMethod: "",
    cancelDeadline: "",
    bookingSite: "",
  });

  const [splitMode, setSplitMode] = useState(false);
  const [splitPeople, setSplitPeople] = useState("2");

  const resetForm = (targetDate?: string) => {
    const baseDate =
      targetDate ||
      (selectedDateTab !== "ALL"
        ? selectedDateTab
        : startDate
        ? startDate.split("T")[0]
        : new Date().toISOString().split("T")[0]);

    // Calculate default next day for hotel
    const nextDay = new Date(baseDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const defaultOutDate = nextDay.toISOString().split("T")[0];

    setForm({
      date: baseDate,
      startTime: "10:00",
      endTime: "11:30",
      checkOutDate: defaultOutDate,
      title: "",
      category: "SIGHTSEEING",
      transportType: "",
      flightNumber: "",
      duration: "",
      fromPlace: "",
      toPlace: "",
      cost: "",
      memo: "",
      placeId: "",
      hasBreakfast: false,
      reservationStatus: "NONE",
      bookingNumber: "",
      paymentMethod: "",
      cancelDeadline: "",
      bookingSite: "",
    });
    setSplitMode(false);
    setSplitPeople("2");
    setEditingSchedule(null);
  };

  const handleOpenAddModal = (date?: string, category: ScheduleCategory = "SIGHTSEEING") => {
    resetForm(date);
    const baseDate =
      date ||
      (selectedDateTab !== "ALL"
        ? selectedDateTab
        : startDate
        ? startDate.split("T")[0]
        : new Date().toISOString().split("T")[0]);

    const nextDay = new Date(baseDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const defaultOutDate = nextDay.toISOString().split("T")[0];

    setForm((prev) => ({
      ...prev,
      category,
      startTime: category === "HOTEL" ? "15:00" : "10:00",
      endTime: category === "HOTEL" ? "11:00" : "11:30",
      checkOutDate: defaultOutDate,
      hasBreakfast: false,
      reservationStatus: category === "HOTEL" || category === "TRANSPORT" ? "NEED_BOOKING" : "NONE",
    }));
    setShowAddModal(true);
  };

  const handleOpenEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    const sDate = schedule.date.split("T")[0];
    let sOutDate = schedule.checkOutDate ? schedule.checkOutDate.split("T")[0] : "";
    if (schedule.category === "HOTEL" && !sOutDate) {
      const nextDay = new Date(sDate);
      nextDay.setDate(nextDay.getDate() + 1);
      sOutDate = nextDay.toISOString().split("T")[0];
    }

    setForm({
      date: sDate,
      startTime: schedule.startTime || (schedule.category === "HOTEL" ? "15:00" : ""),
      endTime: schedule.endTime || (schedule.category === "HOTEL" ? "11:00" : ""),
      checkOutDate: sOutDate,
      title: schedule.title,
      category: (schedule.category as ScheduleCategory) || "SIGHTSEEING",
      transportType: (schedule.transportType as TransportType) || "",
      flightNumber: schedule.flightNumber || "",
      duration: schedule.duration ? String(schedule.duration) : "",
      fromPlace: schedule.fromPlace || "",
      toPlace: schedule.toPlace || "",
      cost: schedule.cost ? String(schedule.cost) : "",
      memo: schedule.memo || "",
      placeId: schedule.placeId && places.some((p) => p.id === schedule.placeId) ? String(schedule.placeId) : "",
      hasBreakfast: Boolean(schedule.hasBreakfast),
      reservationStatus: (schedule.reservationStatus as ReservationStatus) || "NONE",
      bookingNumber: schedule.bookingNumber || "",
      paymentMethod: schedule.paymentMethod || "",
      cancelDeadline: schedule.cancelDeadline || "",
      bookingSite: schedule.bookingSite || "",
    });
    setShowAddModal(true);
  };

  const handleCategoryChange = (newCat: ScheduleCategory) => {
    setForm((prev) => {
      if (newCat === "HOTEL") {
        const nextDay = new Date(prev.date);
        nextDay.setDate(nextDay.getDate() + 1);
        return {
          ...prev,
          category: newCat,
          startTime: prev.startTime === "10:00" ? "15:00" : prev.startTime || "15:00",
          endTime: prev.endTime === "11:30" ? "11:00" : prev.endTime || "11:00",
          checkOutDate: prev.checkOutDate || nextDay.toISOString().split("T")[0],
          reservationStatus: prev.reservationStatus === "NONE" ? "NEED_BOOKING" : prev.reservationStatus,
        };
      }
      return {
        ...prev,
        category: newCat,
      };
    });
  };

  const handleSaveSchedule = async () => {
    if (!form.title.trim() || !form.date) {
      return alert("タイトルと日付を入力してください");
    }

    const isHotel = form.category === "HOTEL";
    let costValue = form.cost ? Number(form.cost) : null;
    if (costValue && splitMode) {
      const people = Number(splitPeople) || 1;
      costValue = Math.ceil(costValue / people);
    }
    const payload = {
      date: form.date,
      startTime: form.startTime || (isHotel ? "15:00" : null),
      endTime: form.endTime || (isHotel ? "11:00" : null),
      checkOutDate: isHotel && form.checkOutDate ? form.checkOutDate : null,
      title: form.title.trim(),
      category: form.category,
      transportType: form.transportType || null,
      flightNumber: form.flightNumber.trim() || null,
      duration: form.duration ? Number(form.duration) : null,
      fromPlace: form.fromPlace.trim() || null,
      toPlace: form.toPlace.trim() || null,
      cost: costValue,
      memo: form.memo.trim() || null,
      hasBreakfast: isHotel ? Boolean(form.hasBreakfast) : false,
      placeId: form.placeId ? Number(form.placeId) : null,
      reservationStatus: form.reservationStatus,
      bookingNumber: form.bookingNumber.trim() || null,
      paymentMethod: form.paymentMethod.trim() || null,
      cancelDeadline: form.cancelDeadline || null,
      bookingSite: form.bookingSite.trim() || null,
      tripId,
    };

    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);

    try {
      if (editingSchedule) {
        let updated: Schedule | null = null;
        if (!isOfflineMode) {
          try {
            const res = await fetch(`/api/schedules/${editingSchedule.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              updated = await res.json();
            }
          } catch (e) {
            console.warn("Online schedule update failed, fallback to offline:", e);
          }
        }

        if (!updated) {
          updated = {
            ...editingSchedule,
            ...payload,
            date: payload.date,
            updatedAt: new Date().toISOString(),
          };
        }

        onSchedulesChange(schedules.map((s) => (s.id === updated!.id ? updated! : s)));
        setSelectedDateTab(form.date);
        const updateMeta = dayMetaMap.get(form.date);
        if (selectedCityFilter !== "ALL" && updateMeta && updateMeta.city.name !== selectedCityFilter) {
          setSelectedCityFilter(updateMeta.city.name);
        }
        setShowAddModal(false);
        resetForm();
      } else {
        let created: Schedule | null = null;
        if (!isOfflineMode) {
          try {
            const res = await fetch("/api/schedules", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              created = await res.json();
            }
          } catch (e) {
            console.warn("Online schedule create failed, fallback to offline:", e);
          }
        }

        const finalCreated: Schedule = created || {
          id: Date.now(),
          ...payload,
          date: payload.date,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onSchedulesChange([...schedules, finalCreated]);
        setSelectedDateTab(form.date);
        const createMeta = dayMetaMap.get(form.date);
        if (selectedCityFilter !== "ALL" && createMeta && createMeta.city.name !== selectedCityFilter) {
          setSelectedCityFilter(createMeta.city.name);
        }
        setShowAddModal(false);
        resetForm();
      }
    } catch (err) {
      console.error("Save schedule error:", err);
      // Fallback local update
      const fallbackSchedule: Schedule = {
        id: editingSchedule ? editingSchedule.id : Date.now(),
        ...payload,
        date: payload.date,
        isCompleted: editingSchedule ? editingSchedule.isCompleted : false,
        createdAt: editingSchedule ? editingSchedule.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (editingSchedule) {
        onSchedulesChange(schedules.map((s) => (s.id === fallbackSchedule.id ? fallbackSchedule : s)));
      } else {
        onSchedulesChange([...schedules, fallbackSchedule]);
      }
      setSelectedDateTab(form.date);
      const fallbackMeta = dayMetaMap.get(form.date);
      if (selectedCityFilter !== "ALL" && fallbackMeta && fallbackMeta.city.name !== selectedCityFilter) {
        setSelectedCityFilter(fallbackMeta.city.name);
      }
      setShowAddModal(false);
      resetForm();
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("このスケジュールを削除しますか？")) return;
    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    if (!isOfflineMode) {
      fetch(`/api/schedules/${id}`, { method: "DELETE" }).catch((e) => console.warn(e));
    }
    onSchedulesChange(schedules.filter((s) => s.id !== id));
  };

  const handleToggleComplete = async (schedule: Schedule) => {
    const nextCompleted = !schedule.isCompleted;
    const isOfflineMode = isOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    if (!isOfflineMode) {
      fetch(`/api/schedules/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextCompleted }),
      }).catch((e) => console.warn(e));
    }
    onSchedulesChange(schedules.map((s) => (s.id === schedule.id ? { ...s, isCompleted: nextCompleted } : s)));
  };

  const handleSelectPlace = (placeIdStr: string) => {
    setForm((prev) => {
      const p = places.find((item) => item.id === Number(placeIdStr));
      if (p) {
        const isHotel = p.category === "HOTEL";
        const nextDate = isHotel && p.checkInDate ? p.checkInDate : prev.date;
        let nextCheckOutDate = prev.checkOutDate;
        if (isHotel) {
          if (p.checkOutDate) {
            nextCheckOutDate = p.checkOutDate;
          } else {
            const nextD = new Date(nextDate);
            nextD.setDate(nextD.getDate() + 1);
            nextCheckOutDate = nextD.toISOString().split("T")[0];
          }
        }

        return {
          ...prev,
          placeId: placeIdStr,
          title: prev.title || p.name,
          category: (isHotel ? "HOTEL" : (p.category as ScheduleCategory)) || prev.category,
          date: nextDate,
          checkOutDate: nextCheckOutDate,
          startTime: isHotel ? p.checkInTime || "15:00" : prev.startTime,
          endTime: isHotel ? p.checkOutTime || "11:00" : prev.endTime,
          cost: prev.cost || (p.cost ? String(p.cost) : ""),
          memo: prev.memo || (p.memo ? p.memo : ""),
          hasBreakfast: isHotel ? Boolean(p.hasBreakfast) : prev.hasBreakfast,
        };
      }
      return { ...prev, placeId: placeIdStr };
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-full min-w-0">
      {/* Header & View Mode Switcher & Add Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 p-3.5 sm:p-4 rounded-2xl border border-[#DDA15E]/30 shadow-2xs w-full max-w-full min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[#386641] flex items-center gap-2">
              <span>🗓️ 旅程タイムライン</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#386641]">
                {schedules.length} 件の予定
              </span>
            </h2>
          </div>
          <p className="text-[#386641]/70 text-xs mt-1">
            Day 1〜{datesList.length} の日別タイムラインと、都市・エリア別のまとめを切り替えて確認できます。
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full sm:w-auto">
          {/* View mode toggle */}
          <div className="flex items-center bg-[#386641]/5 p-1 rounded-xl border border-[#386641]/10 max-w-full overflow-x-auto">
            <button
              onClick={() => setTimelineViewMode("TIMELINE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                timelineViewMode === "TIMELINE"
                  ? "bg-[#386641] text-[#FDF0D5] shadow-xs"
                  : "text-[#386641]/70 hover:text-[#386641]"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              日別タイムライン
            </button>
            <button
              onClick={() => setTimelineViewMode("CITY_SUMMARY")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                timelineViewMode === "CITY_SUMMARY"
                  ? "bg-[#386641] text-[#FDF0D5] shadow-xs"
                  : "text-[#386641]/70 hover:text-[#386641]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">グループ別まとめ</span>
              <span className="sm:hidden">グループ別</span> ({cityLegs.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCityMasterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FDF0D5] text-[#386641] border border-[#DDA15E]/50 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#FDF0D5]/80 transition shadow-2xs cursor-pointer"
            title="都市マスターの登録・管理"
          >
            <MapPin className="w-4 h-4 text-[#386641]" />
            <span className="hidden sm:inline">都市マスター</span>
            <span className="sm:hidden">都市</span>
          </button>
          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FDF0D5] text-[#386641] border border-[#DDA15E]/50 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#FDF0D5]/80 transition shadow-2xs cursor-pointer"
            title="航空券やホテルのスクショから自動入力"
          >
            <Sparkles className="w-4 h-4 text-[#C1121F]" />
            <span className="hidden sm:inline">スクショから自動入力</span>
            <span className="sm:hidden">スクショ</span>
          </button>
          <button
            onClick={() => handleOpenAddModal(undefined, "HOTEL")}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/40 rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#DDA15E]/30 transition shadow-2xs"
          >
            <Hotel className="w-4 h-4 text-[#DDA15E]" />
            宿泊を追加
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C1121F] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#a50f1a] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            予定を追加
          </button>
        </div>
      </div>

      {/* Group Summary Cards View */}
      {timelineViewMode === "CITY_SUMMARY" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#386641] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#003049]" />
                全行程グループ一覧 ({cityLegs.length} グループ / 計 {datesList.length} 日間)
              </span>
              {customCityLegs !== null && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#003049]/10 text-[#003049] border border-[#003049]/20">
                  カスタム設定中
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {customCityLegs !== null && (
                <button
                  type="button"
                  onClick={handleResetAllCityLegs}
                  className="flex items-center gap-1 text-[11px] text-[#C1121F] hover:underline font-semibold px-2 py-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  自動判定に戻す
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCreatingCityLeg(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003049] text-white rounded-xl text-xs font-semibold hover:bg-[#2b4f32] transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                グループを追加
              </button>
            </div>
          </div>

          {cityLegs.length === 0 ? (
            <div className="bg-white/80 border border-[#DDA15E]/30 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
              <Users className="w-8 h-8 text-[#386641]/40" />
              <p className="text-sm font-semibold text-[#386641]">
                表示できるグループがありません
              </p>
              <p className="text-xs text-[#386641]/60 max-w-sm">
                不要なグループをすべて削除したか、初期化されています。「グループを追加」ボタンから手動で登録するか、初期判定に復元してください。
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCityLeg(true)}
                  className="px-4 py-2 bg-[#003049] text-white rounded-xl text-xs font-semibold hover:bg-[#2b4f32] transition"
                >
                  ＋ グループを追加
                </button>
                {customCityLegs !== null && (
                  <button
                    type="button"
                    onClick={handleResetAllCityLegs}
                    className="px-4 py-2 bg-white border border-[#386641]/20 text-[#386641] rounded-xl text-xs font-semibold hover:bg-white/80 transition"
                  >
                    自動判定に戻す
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {cityLegs.map((leg, idx) => {
                const dayRangeText =
                  leg.dayIndices.length > 1
                    ? `Day ${leg.dayIndices[0]}〜${leg.dayIndices[leg.dayIndices.length - 1]}`
                    : `Day ${leg.dayIndices[0]}`;
                const dateRangeText =
                  leg.startDate === leg.endDate
                    ? formatDate(leg.startDate)
                    : `${formatDate(leg.startDate)} 〜 ${formatDate(leg.endDate)}`;

                return (
                  <div
                    key={leg.id}
                    onClick={() => {
                      setSelectedCityFilter(leg.id);
                      setSelectedDateTab(leg.startDate);
                      setTimelineViewMode("TIMELINE");
                    }}
                    className="group bg-white/95 border border-[#DDA15E]/30 hover:border-[#386641] rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Header: Flag, Group Name, Day Range & Actions */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{leg.flag}</span>
                          <div>
                            <h3 className="font-bold text-base text-[#386641] group-hover:text-[#C1121F] transition flex items-center gap-1.5">
                              {leg.name}
                              {leg.country && (
                                <span className="text-[11px] font-normal text-[#386641]/60">
                                  ({leg.country})
                                </span>
                              )}
                            </h3>
                            <div className="text-[11px] font-semibold text-[#386641]/70">
                              {dayRangeText} ・ {leg.dates.length}日間
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#386641]/10 text-[#386641]">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCityLeg(leg);
                            }}
                            title="このグループ情報を編集"
                            className="p-1 rounded-lg text-[#386641]/50 hover:text-[#386641] hover:bg-[#386641]/5 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCityLeg(leg.id);
                            }}
                            title="このグループカードを削除"
                            className="p-1 rounded-lg text-[#386641]/40 hover:text-[#C1121F] hover:bg-[#C1121F]/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Date range */}
                      <div className="flex items-center gap-2 flex-wrap mb-2 text-xs">
                        <span className="text-[#386641]/70 font-medium">
                          {dateRangeText}
                        </span>
                      </div>

                      {/* Visited Cities Pills if present */}
                      {(leg.cities && leg.cities.length > 0) || leg.cityName ? (
                        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                          <span className="text-[10px] font-bold text-[#386641]/60">訪問都市:</span>
                          {leg.cities && leg.cities.length > 0 ? (
                            leg.cities.map((c, ci) => (
                              <span
                                key={ci}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#386641]/10 text-[#386641] text-[11px] font-medium"
                              >
                                <span>{c.flag}</span>
                                <span>{c.name}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#386641]/80 font-medium">
                              {leg.cityName}
                            </span>
                          )}
                        </div>
                      ) : null}

                      {/* Custom Memo if present */}
                      {leg.customMemo && (
                        <div className="bg-[#386641]/5 border-l-2 border-[#386641] rounded-r-xl px-2.5 py-1.5 mb-2.5 text-xs text-[#386641]">
                          <div className="text-[10px] font-bold text-[#386641]/60 mb-0.5">グループメモ:</div>
                          <div className="whitespace-pre-wrap">{leg.customMemo}</div>
                        </div>
                      )}

                      {/* Highlights */}
                      {leg.highlightTitles.length > 0 && (
                        <div className="bg-[#FDF0D5]/50 rounded-xl p-2.5 mb-3 border border-[#DDA15E]/20">
                          <div className="text-[10px] font-bold text-[#386641]/60 mb-1">
                            主なスケジュール:
                          </div>
                          <ul className="text-xs text-[#386641] space-y-1">
                            {leg.highlightTitles.map((title, i) => (
                              <li key={i} className="truncate flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#DDA15E]" />
                                {title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer link & quick edit */}
                    <div className="pt-2 border-t border-[#386641]/10 flex items-center justify-between text-xs font-semibold text-[#386641]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCityLeg(leg);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-[#386641]/60 hover:text-[#C1121F] transition font-medium"
                      >
                        <Edit2 className="w-3 h-3" />
                        グループ情報を編集
                      </button>
                      <span className="inline-flex items-center gap-1 text-[11px] group-hover:text-[#C1121F] transition">
                        <span>{leg.schedulesCount} 件の予定</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Group Quick Filter Pills */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#386641]/70 px-0.5">
              <span className="font-bold flex items-center gap-1.5 text-[#386641]">
                <Users className="w-3.5 h-3.5 text-[#003049]" />
                グループ・区間で絞り込み:
              </span>
              {selectedCityFilter !== "ALL" && (
                <div className="flex items-center gap-3">
                  {(() => {
                    const activeLeg = cityLegs.find((l) => l.id === selectedCityFilter || l.name === selectedCityFilter);
                    if (!activeLeg) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => setEditingCityLeg(activeLeg)}
                        className="text-xs text-[#386641] hover:text-[#C1121F] font-semibold flex items-center gap-1 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        このグループ情報を編集
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => setSelectedCityFilter("ALL")}
                    className="text-xs text-[#C1121F] hover:underline font-semibold"
                  >
                    絞り込み解除
                  </button>
                </div>
              )}
            </div>

            <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCityFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  selectedCityFilter === "ALL"
                    ? "bg-[#386641] text-[#FDF0D5] border-[#386641] shadow-xs"
                    : "bg-white/90 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                }`}
              >
                👥 すべてのグループ ({datesList.length}日)
              </button>

              {cityLegs.map((leg) => {
                const isSelected = selectedCityFilter === leg.id || selectedCityFilter === leg.name;
                return (
                  <button
                    key={leg.id}
                    onClick={() => {
                      setSelectedCityFilter(leg.id);
                      if (selectedDateTab !== "ALL" && !leg.dates.includes(selectedDateTab)) {
                        setSelectedDateTab(leg.startDate);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      isSelected
                        ? "bg-[#386641] text-[#FDF0D5] border-[#386641] shadow-xs"
                        : "bg-white/90 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <span>{leg.flag}</span>
                    <span>{leg.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#386641]/10 text-[#386641]/70"
                      }`}
                    >
                      {leg.dates.length}日
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date filter tabs (Day 1, Day 2...) */}
          <div className="w-full max-w-full min-w-0 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedDateTab("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedDateTab === "ALL"
                  ? "bg-[#386641] text-[#FDF0D5] border-[#386641] shadow-xs"
                  : "bg-white/90 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
              }`}
            >
              全日程 ({allTimelineItems.length})
            </button>

            {visibleDatesList.map((dateStr) => {
              const originalIndex = datesList.indexOf(dateStr);
              const isSelected = selectedDateTab === dateStr;
              const count = allTimelineItems.filter((item) => item.dateStr === dateStr).length;
              const meta = dayMetaMap.get(dateStr);

              return (
                <button
                  key={dateStr}
                  id={`date-tab-btn-${dateStr}`}
                  onClick={() => setSelectedDateTab(dateStr)}
                  className={`flex flex-col items-start px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                    isSelected
                      ? "bg-[#386641] text-[#FDF0D5] border-[#386641] shadow-xs"
                      : "bg-white/90 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>
                      Day {originalIndex + 1} ({formatDate(dateStr)})
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#386641]/10 text-[#386641]/70"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  {meta && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssigningCityDate(dateStr);
                      }}
                      title="この日の都市を変更（都市マスターから選択）"
                      className="flex items-center gap-1 text-[10px] font-normal opacity-85 mt-0.5 hover:opacity-100 hover:text-[#C1121F] transition cursor-pointer group/city"
                    >
                      <span>{meta.city.flag}</span>
                      <span className="font-semibold">{meta.city.name}</span>
                      {meta.groupName && (
                        <span className="opacity-75">・{meta.groupName}</span>
                      )}
                      <Edit2 className="w-2.5 h-2.5 opacity-60 ml-0.5 group-hover/city:opacity-100" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Staying Hotel Banner (for multi-day stays) */}
          {activeStayingHotels.length > 0 && (
            <div className="flex flex-col gap-2">
              {activeStayingHotels.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-2xl bg-[#DDA15E]/15 border border-[#DDA15E]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#DDA15E]/20 text-[#386641]">
                      <Hotel className="w-4 h-4 text-[#DDA15E]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#386641] flex items-center gap-1.5 flex-wrap">
                        <span>宿泊中: {h.title}</span>
                        {h.hasBreakfast && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/40 inline-flex items-center gap-1">
                            <Coffee className="w-2.5 h-2.5 text-[#DDA15E]" />
                            朝食付き
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#386641]/70 mt-0.5">
                        チェックイン: {formatDate(h.date)} {h.startTime || "15:00"} 〜 チェックアウト: {formatDate(h.checkOutDate!)} {h.endTime || "11:00"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#DDA15E]/30 text-[#386641]">
                      連泊滞在中
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(h)}
                      className="text-xs text-[#386641] hover:underline font-medium px-1"
                    >
                      宿の詳細
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* Timeline List */}
      {filteredTimelineItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/90 border border-dashed border-[#DDA15E]/40 rounded-2xl">
          <div className="text-4xl mb-3"></div>
          <h3 className="text-[#386641] font-semibold text-sm">予定がありません</h3>
          <p className="text-[#386641]/60 text-xs mt-1 max-w-sm mx-auto">
            {selectedDateTab === "ALL"
              ? "予定を追加して旅のスケジュールを組み立てましょう。"
              : `${formatDate(selectedDateTab)} の予定はまだありません。`}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => handleOpenAddModal(selectedDateTab !== "ALL" ? selectedDateTab : undefined)}
              className="px-4 py-2 bg-[#C1121F] text-white rounded-xl text-xs font-semibold hover:bg-[#a50f1a] transition"
            >
              + この日に予定を追加
            </button>
            <button
              onClick={() => handleOpenAddModal(selectedDateTab !== "ALL" ? selectedDateTab : undefined, "HOTEL")}
              className="px-4 py-2 bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/40 rounded-xl text-xs font-semibold hover:bg-[#DDA15E]/30 transition"
            >
              宿泊を追加
            </button>
          </div>
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-6 md:pl-8 border-l-2 border-[#DDA15E]/40 flex flex-col gap-5 sm:gap-6 ml-1.5 sm:ml-2 my-2 w-full max-w-full min-w-0">
          {filteredTimelineItems.map((item) => {
            const schedule = item.schedule;
            const place = places.find((p) => p.id === schedule.placeId);
            const isTransport = schedule.category === "TRANSPORT" || schedule.transportType;
            const isCheckIn = item.type === "HOTEL_CHECKIN";
            const isCheckOut = item.type === "HOTEL_CHECKOUT";

            // Node Dot color
            let dotBgClass = "bg-[#C1121F]";
            if (schedule.isCompleted) {
              dotBgClass = "bg-[#003049]";
            } else if (isCheckIn || isCheckOut) {
              dotBgClass = "bg-[#DDA15E]";
            } else if (isTransport) {
              dotBgClass = "bg-[#386641]";
            }

            // Card border & background styling
            let cardClasses = "border-[#DDA15E]/30 bg-white/95";
            if (schedule.isCompleted) {
              cardClasses = "border-[#386641]/10 bg-white/60 opacity-75";
            } else if (isCheckIn) {
              cardClasses = "border-[#DDA15E]/60 bg-[#DDA15E]/10 hover:border-[#DDA15E]";
            } else if (isCheckOut) {
              cardClasses = "border-[#DDA15E]/40 bg-[#DDA15E]/5 hover:border-[#DDA15E]";
            } else if (isTransport) {
              cardClasses = "border-[#386641]/20 bg-[#386641]/5 hover:border-[#386641]/30";
            }

            return (
              <div key={item.key} className="relative group min-w-0 w-full">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[23px] sm:-left-[31px] md:-left-[39px] top-4 w-4 h-4 rounded-full border-3 border-white shadow-xs transition-transform group-hover:scale-125 ${dotBgClass}`}
                />

                {/* Timeline Card */}
                <div
                  className={`border rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-xs transition hover:shadow-md min-w-0 w-full ${cardClasses}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Time & Title info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {/* Time badge */}
                        {isCheckIn ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#386641] bg-[#DDA15E]/20 px-2.5 py-1 rounded-lg">
                            <LogIn className="w-3.5 h-3.5 text-[#DDA15E]" />
                            チェックイン {item.timeStr}
                          </span>
                        ) : isCheckOut ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#386641] bg-[#DDA15E]/20 px-2.5 py-1 rounded-lg">
                            <LogOut className="w-3.5 h-3.5 text-[#DDA15E]" />
                            チェックアウト {item.timeStr}
                          </span>
                        ) : isTransport ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#386641] bg-[#386641]/10 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-[#386641]" />
                            {schedule.startTime || "時間指定なし"}
                            {schedule.endTime ? ` 〜 ${schedule.endTime}` : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#386641] bg-[#386641]/10 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-[#386641]" />
                            {schedule.startTime || "時間指定なし"}
                            {schedule.endTime ? ` 〜 ${schedule.endTime}` : ""}
                          </span>
                        )}

                        {/* Category badge */}
                        {isCheckIn ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.8 rounded-lg bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/40">
                            <Hotel className="w-3.5 h-3.5 text-[#DDA15E]" />
                            宿泊・チェックイン
                          </span>
                        ) : isCheckOut ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.8 rounded-lg bg-[#DDA15E]/15 text-[#386641] border border-[#DDA15E]/30">
                            <Hotel className="w-3.5 h-3.5 text-[#DDA15E]" />
                            宿泊・チェックアウト
                          </span>
                        ) : isTransport && schedule.transportType ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.8 rounded-lg bg-[#386641]/10 text-[#386641] border border-[#386641]/20">
                            {TRANSPORT_ICONS[schedule.transportType] || TRANSPORT_ICONS.WALK}
                            {TRANSPORT_LABELS[schedule.transportType] || schedule.transportType}
                            {schedule.flightNumber ? ` (${schedule.flightNumber})` : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.8 rounded-lg bg-[#386641]/5 text-[#386641] border border-[#386641]/10">
                            {CATEGORY_ICONS[schedule.category] || CATEGORY_ICONS.SIGHTSEEING}
                            {CATEGORY_LABELS[schedule.category] || schedule.category}
                          </span>
                        )}

                        {/* Hotel Nights badge */}
                        {(isCheckIn || isCheckOut) && item.hotelNights && item.hotelNights > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDA15E]/30 text-[#386641]">
                            <Moon className="w-3 h-3" />
                            {item.hotelNights}泊{item.hotelNights + 1}日
                          </span>
                        )}

                        {/* Hotel Breakfast badge */}
                        {(isCheckIn || isCheckOut) && (
                          schedule.hasBreakfast ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/40">
                              <Coffee className="w-3 h-3 text-[#DDA15E]" />
                              朝食付き
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-[#386641]/60 bg-[#386641]/10 px-2 py-0.5 rounded-full">
                              素泊まり
                            </span>
                          )
                        )}

                        {/* Reservation and Booking Badges */}
                        {schedule.reservationStatus === "BOOKED" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#003049]/15 text-[#003049] border border-[#003049]/30">
                            ✓ 予約済み
                          </span>
                        )}
                        {schedule.reservationStatus === "NEED_BOOKING" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#C1121F]/15 text-[#C1121F] border border-[#C1121F]/30">
                            ⚠️ 要予約
                          </span>
                        )}

                        {schedule.bookingSite && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#386641]/10 text-[#386641]">
                            🏢 {schedule.bookingSite}
                          </span>
                        )}

                        {schedule.bookingNumber && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                            #{schedule.bookingNumber}
                          </span>
                        )}

                        {schedule.paymentMethod && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FDF0D5] text-[#386641] border border-[#DDA15E]/40">
                            💳 {schedule.paymentMethod}
                          </span>
                        )}

                        {schedule.cancelDeadline && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/30">
                            ⏰ {new Date(schedule.cancelDeadline).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}までキャンセル無料
                          </span>
                        )}

                        {selectedDateTab === "ALL" && (
                          <span className="text-[11px] text-[#386641]/50 font-medium ml-auto sm:ml-0">
                            {formatDate(item.dateStr)}
                          </span>
                        )}
                      </div>

                      {/* Title with complete toggle */}
                      <div className="flex items-start gap-2 my-1">
                        <button
                          onClick={() => handleToggleComplete(schedule)}
                          className="mt-0.5 text-[#386641]/30 hover:text-[#003049] transition"
                          title={schedule.isCompleted ? "未完了に戻す" : "完了にする"}
                        >
                          {schedule.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-[#003049] fill-[#003049]/10" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#386641]/30" />
                          )}
                        </button>
                        <h4
                          className={`text-base font-bold text-[#386641] tracking-tight ${
                            schedule.isCompleted ? "line-through text-[#386641]/40" : ""
                          }`}
                        >
                          {schedule.title}
                          {isCheckOut ? " (チェックアウト)" : ""}
                        </h4>
                      </div>

                      {/* Hotel stay detail sub-banner */}
                      {isCheckIn && (
                        <div className="my-1.5 pl-0 sm:pl-7">
                          <div className="inline-flex max-w-full flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-[#DDA15E]/15 border border-[#DDA15E]/30 text-xs text-[#386641] font-medium">
                            <Hotel className="w-3.5 h-3.5 text-[#DDA15E] shrink-0" />
                            <span className="break-all sm:break-normal">
                              チェックイン: {item.timeStr} → チェックアウト:{" "}
                              {schedule.checkOutDate ? formatDate(schedule.checkOutDate) : "翌日"}{" "}
                              {schedule.endTime || "11:00"}
                            </span>
                          </div>
                        </div>
                      )}

                      {isCheckOut && (
                        <div className="my-1.5 pl-0 sm:pl-7">
                          <div className="inline-flex max-w-full flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-[#DDA15E]/10 border border-[#DDA15E]/30 text-xs text-[#386641] font-medium">
                            <LogOut className="w-3.5 h-3.5 text-[#DDA15E] shrink-0" />
                            <span className="break-all sm:break-normal">
                              👋 チェックアウト・出発 (滞在期間: {item.hotelStayRangeText})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Transit Details (From -> To, Duration) */}
                      {(schedule.fromPlace || schedule.toPlace || schedule.duration) && (
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-[#386641]/70 mt-1 pl-0 sm:pl-7">
                          {schedule.fromPlace || schedule.toPlace ? (
                            <span className="font-medium text-[#386641] break-all sm:break-normal">
                              {schedule.fromPlace || "出発地"} → {schedule.toPlace || "目的地"}
                            </span>
                          ) : null}
                          {schedule.duration ? (
                            <span className="text-[#386641]/50">所要約 {schedule.duration} 分</span>
                          ) : null}
                        </div>
                      )}

                      {/* Linked Place details if any */}
                      {place && (
                        <div className="mt-2 pl-0 sm:pl-7 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs min-w-0">
                          <span className="text-[#386641]/60 font-medium">登録スポット:</span>
                          <span className="text-[#386641] bg-[#386641]/5 px-2 py-0.5 rounded-md font-medium break-all">
                            {place.name}
                          </span>
                          {place.address && (
                            <span className="text-[#386641]/50 truncate max-w-xs">({place.address})</span>
                          )}
                        </div>
                      )}

                      {/* Memo & Cost */}
                      <div className="mt-2 pl-0 sm:pl-7 flex flex-col gap-1 min-w-0">
                        {schedule.memo && (
                          <div className="p-2.5 rounded-xl bg-[#FDF0D5]/50 border border-[#DDA15E]/30 text-xs text-[#386641]/80 leading-relaxed break-words">
                            {schedule.memo}
                          </div>
                        )}
                        {/* Only show cost on check-in event to prevent double counting display for hotels */}
                        {!isCheckOut && schedule.cost !== null && schedule.cost !== undefined && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-[#386641] mt-1">
                            <CircleDollarSign className="w-3.5 h-3.5 text-[#DDA15E]" />
                            <span>
                              {schedule.category === "HOTEL" ? "宿泊費" : "費用"}: ¥
                              {schedule.cost.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions (Edit / Delete operate on parent schedule) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(schedule)}
                        className="p-1.5 text-[#386641]/40 hover:text-[#386641] rounded-lg hover:bg-[#386641]/10 transition"
                        title="編集"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="p-1.5 text-[#386641]/40 hover:text-[#C1121F] rounded-lg hover:bg-[#C1121F]/10 transition"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Add / Edit Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#386641]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#DDA15E]/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#386641]/10 mb-4">
              <h3 className="text-lg font-bold text-[#386641]">
                {editingSchedule
                  ? form.category === "HOTEL"
                    ? "宿泊・ホテル予定を編集"
                    : "予定を編集"
                  : form.category === "HOTEL"
                  ? "新しい宿泊を追加"
                  : "新しい予定を追加"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#386641]/40 hover:text-[#386641] p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm">
              {/* Linked Spot selector */}
              {places.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#386641] mb-1">
                    登録済みスポットから選択 (任意)
                  </label>
                  <select
                    value={form.placeId}
                    onChange={(e) => handleSelectPlace(e.target.value)}
                    className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
                  >
                    <option value="">選択しない（直接入力）</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        {CATEGORY_LABELS[p.category]
                          ? `[${CATEGORY_LABELS[p.category].split("・")[0]}] `
                          : ""}{p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#386641] mb-1">
                  {form.category === "HOTEL" ? "ホテル・宿名" : "予定タイトル"}{" "}
                  <span className="text-[#C1121F]">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    form.category === "HOTEL"
                      ? "例: ホテル グランヴィア京都"
                      : "例: 清水寺 観光、新幹線 東京発、祇園でディナー"
                  }
                  className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-[#386641] mb-1">
                  カテゴリ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("SIGHTSEEING")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "SIGHTSEEING"
                        ? "bg-[#003049] text-white border-[#003049] shadow-xs"
                        : "bg-white/80 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>観光</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("FOOD")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "FOOD"
                        ? "bg-[#DDA15E] text-white border-[#DDA15E] shadow-xs"
                        : "bg-white/80 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>グルメ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("HOTEL")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "HOTEL"
                        ? "bg-[#DDA15E] text-white border-[#DDA15E] shadow-xs"
                        : "bg-[#DDA15E]/15 text-[#386641] border-[#DDA15E]/40 hover:bg-[#DDA15E]/25"
                    }`}
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>宿泊・宿</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("TRANSPORT")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "TRANSPORT"
                        ? "bg-[#386641] text-white border-[#386641] shadow-xs"
                        : "bg-white/80 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <Train className="w-3.5 h-3.5" />
                    <span>移動・交通</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("ACTIVITY")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "ACTIVITY"
                        ? "bg-[#003049] text-white border-[#003049] shadow-xs"
                        : "bg-white/80 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>体験</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("OTHER")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      form.category === "OTHER"
                        ? "bg-[#386641] text-white border-[#386641] shadow-xs"
                        : "bg-white/80 text-[#386641] border-[#DDA15E]/30 hover:bg-white"
                    }`}
                  >
                    <span>🔖 その他</span>
                  </button>
                </div>
              </div>

              {/* HOTEL DEDICATED PANEL */}
              {form.category === "HOTEL" ? (
                <div className="p-4 rounded-2xl bg-[#DDA15E]/10 border border-[#DDA15E]/30 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#386641] flex items-center gap-1.5">
                      <Hotel className="w-4 h-4 text-[#DDA15E]" />
                      宿泊日程 & チェックイン・チェックアウト時刻
                    </span>
                    {form.date && form.checkOutDate && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DDA15E]/20 text-[#386641]">
                        {(() => {
                          const start = new Date(form.date);
                          const end = new Date(form.checkOutDate);
                          const diff = Math.ceil(
                            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                          );
                          return diff > 0 ? `${diff}泊${diff + 1}日` : "日帰り・1日";
                        })()}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#386641]/70">
                    💡 入力されたチェックイン時刻とチェックアウト時刻が、それぞれの日のタイムラインに自動挿入されます。
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Check In */}
                    <div className="p-3 bg-white/90 rounded-xl border border-[#DDA15E]/20 flex flex-col gap-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#386641]">
                        <LogIn className="w-3.5 h-3.5 text-[#DDA15E]" />
                        <span>チェックイン</span>
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#386641]/70 mb-1">
                          チェックイン日 <span className="text-[#C1121F]">*</span>
                        </label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className="w-full border border-[#386641]/20 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-[#386641]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#386641]/70 mb-1">
                          チェックイン時刻
                        </label>
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                          className="w-full border border-[#386641]/20 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-[#386641]/20"
                        />
                      </div>
                    </div>

                    {/* Check Out */}
                    <div className="p-3 bg-white/90 rounded-xl border border-[#DDA15E]/20 flex flex-col gap-2">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#386641]">
                        <LogOut className="w-3.5 h-3.5 text-[#DDA15E]" />
                        <span>チェックアウト</span>
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#386641]/70 mb-1">
                          チェックアウト日
                        </label>
                        <input
                          type="date"
                          value={form.checkOutDate}
                          onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
                          className="w-full border border-[#386641]/20 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-[#386641]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#386641]/70 mb-1">
                          チェックアウト時刻
                        </label>
                        <input
                          type="time"
                          value={form.endTime}
                          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                          className="w-full border border-[#386641]/20 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-[#386641]/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Breakfast Option */}
                  <div className="pt-2 border-t border-[#DDA15E]/20 flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-[#386641] block">朝食プラン</label>
                      <p className="text-[10px] text-[#386641]/60">朝食が含まれているか選択</p>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#DDA15E]/30">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, hasBreakfast: false })}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                          !form.hasBreakfast
                            ? "bg-[#386641]/10 text-[#386641] shadow-xs font-semibold"
                            : "text-[#386641]/50 hover:text-[#386641]"
                        }`}
                      >
                        素泊まり
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, hasBreakfast: true })}
                        className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg font-semibold transition ${
                          form.hasBreakfast
                            ? "bg-[#DDA15E]/20 text-[#386641] border border-[#DDA15E]/40 shadow-xs"
                            : "text-[#386641]/50 hover:text-[#386641]"
                        }`}
                      >
                        <Coffee className="w-3.5 h-3.5 text-[#DDA15E]" />
                        朝食付き
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* NON-HOTEL: Date, Start Time, End Time */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#386641] mb-1">
                      日付 <span className="text-[#C1121F]">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#386641] mb-1">
                      開始時刻
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#386641] mb-1">
                      終了時刻
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
                    />
                  </div>
                </div>
              )}

              {/* Transport selection (if category is TRANSPORT or user wants to add transport info) */}
              {form.category === "TRANSPORT" && (
                <div className="p-3.5 rounded-2xl bg-[#386641]/5 border border-[#386641]/15 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#386641]">移動手段 & 詳細</span>
                  </div>

                  <div>
                    <label className="block text-xs text-[#386641]/70 mb-1">移動手段の種類</label>
                    <select
                      value={form.transportType}
                      onChange={(e) =>
                        setForm({ ...form, transportType: e.target.value as TransportType | "" })
                      }
                      className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 text-xs bg-white"
                    >
                      <option value="TRAIN">🚆 電車・新幹線</option>
                      <option value="FLIGHT">✈️ 飛行機</option>
                      <option value="BUS">🚌 バス</option>
                      <option value="CAR">🚗 車・レンタカー</option>
                      <option value="WALK">🚶 徒歩</option>
                      <option value="TAXI">🚕 タクシー</option>
                      <option value="SHIP">🚢 船・フェリー</option>
                      <option value="">その他</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#386641]/70 mb-1">出発地</label>
                      <input
                        value={form.fromPlace}
                        onChange={(e) => setForm({ ...form, fromPlace: e.target.value })}
                        placeholder="例: 東京駅"
                        className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#386641]/70 mb-1">到着地</label>
                      <input
                        value={form.toPlace}
                        onChange={(e) => setForm({ ...form, toPlace: e.target.value })}
                        placeholder="例: 京都駅"
                        className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#386641]/70 mb-1">便名・列車番号</label>
                      <input
                        value={form.flightNumber}
                        onChange={(e) => setForm({ ...form, flightNumber: e.target.value })}
                        placeholder="例: のぞみ12号, NH025"
                        className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#386641]/70 mb-1">所要時間 (分)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.duration}
                        onChange={(e) =>
                          setForm({ ...form, duration: normalizeNumberInput(e.target.value) })
                        }
                        placeholder="例: 135"
                        className="w-full border border-[#386641]/20 rounded-xl px-3 py-2 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Cost with Full-width number normalization + Split bill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#386641]">
                    {form.category === "HOTEL" ? "宿泊費用 (円)" : "費用・チケット代 (円)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setSplitMode(!splitMode)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      splitMode
                        ? "bg-[#DDA15E]/20 border-[#DDA15E]/50 text-[#386641] font-bold"
                        : "bg-[#386641]/5 border-[#386641]/15 text-[#386641]/70 hover:bg-[#386641]/10"
                    }`}
                  >
                    <Divide className="w-3 h-3" />
                    割り勘
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cost}
                  onChange={(e) =>
                    setForm({ ...form, cost: normalizeNumberInput(e.target.value) })
                  }
                  placeholder={splitMode ? "合計金額を入力" : "例: 15000（全角入力も自動変換されます）"}
                  className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
                />
                {splitMode && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#DDA15E]/15 border border-[#DDA15E]/30 rounded-xl px-3 py-2">
                      <Users className="w-3.5 h-3.5 text-[#DDA15E]" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={splitPeople}
                        onChange={(e) => setSplitPeople(normalizeNumberInput(e.target.value))}
                        className="w-10 text-center text-sm bg-transparent focus:outline-none font-semibold text-[#386641]"
                      />
                      <span className="text-xs text-[#386641]">人</span>
                    </div>
                    <div className="flex-1 text-right">
                      {form.cost && Number(splitPeople) > 0 ? (
                        <p className="text-sm">
                          <span className="text-[#386641]/60">1人あたり </span>
                          <span className="font-bold text-[#386641]">
                            ¥{Math.ceil(Number(form.cost) / (Number(splitPeople) || 1)).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#386641]/50 ml-1">（保存される金額）</span>
                        </p>
                      ) : (
                        <p className="text-xs text-[#386641]/50">金額を入力すると1人分が計算されます</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Booking and Reservation management */}
              <div className="p-3.5 rounded-2xl bg-[#003049]/5 border border-[#003049]/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#003049] flex items-center gap-1.5">
                    📋 予約・支払い・キャンセル管理
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#003049]/80 mb-1">
                      予約ステータス
                    </label>
                    <select
                      value={form.reservationStatus}
                      onChange={(e) =>
                        setForm({ ...form, reservationStatus: e.target.value as ReservationStatus })
                      }
                      className="w-full border border-[#003049]/30 rounded-xl px-3 py-2 text-xs bg-white text-[#386641] focus:outline-none focus:ring-2 focus:ring-[#003049]"
                    >
                      <option value="NONE">予約不要</option>
                      <option value="NEED_BOOKING">⚠️ 要予約</option>
                      <option value="BOOKED">✓ 予約済み</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003049]/80 mb-1">
                      予約サイト / 手配先
                    </label>
                    <input
                      list="timeline-booking-sites"
                      value={form.bookingSite}
                      onChange={(e) => setForm({ ...form, bookingSite: e.target.value })}
                      placeholder="例: スマートEX, Booking.com, JAL"
                      className="w-full border border-[#003049]/30 rounded-xl px-3 py-2 text-xs bg-white text-[#386641] focus:outline-none focus:ring-2 focus:ring-[#003049]"
                    />
                    <datalist id="timeline-booking-sites">
                      {PRESET_BOOKING_SITES.map((site) => (
                        <option key={site} value={site} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#003049]/80 mb-1">
                      予約番号 / 照会番号
                    </label>
                    <input
                      value={form.bookingNumber}
                      onChange={(e) => setForm({ ...form, bookingNumber: e.target.value })}
                      placeholder="例: EX-12345"
                      className="w-full border border-[#003049]/30 rounded-xl px-3 py-2 text-xs bg-white text-[#386641] focus:outline-none focus:ring-2 focus:ring-[#003049]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003049]/80 mb-1">
                      支払いカード / 方法
                    </label>
                    <input
                      list="timeline-payment-methods"
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      placeholder="例: 楽天カード, 現地払い"
                      className="w-full border border-[#003049]/30 rounded-xl px-3 py-2 text-xs bg-white text-[#386641] focus:outline-none focus:ring-2 focus:ring-[#003049]"
                    />
                    <datalist id="timeline-payment-methods">
                      {PRESET_PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#003049]/80 mb-1">
                      無料キャンセル期日
                    </label>
                    <input
                      type="date"
                      value={form.cancelDeadline}
                      onChange={(e) => setForm({ ...form, cancelDeadline: e.target.value })}
                      className="w-full border border-[#003049]/30 rounded-xl px-3 py-2 text-xs bg-white text-[#386641] focus:outline-none focus:ring-2 focus:ring-[#003049]"
                    />
                  </div>
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-semibold text-[#386641] mb-1">
                  メモ・予約情報
                </label>
                <textarea
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder={
                    form.category === "HOTEL"
                      ? "例: 予約番号 #12345、朝食付きプラン、荷物預かり可能"
                      : "例: 10分前にホーム集合。QRチケットを提示。"
                  }
                  rows={2}
                  className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641] resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#386641]/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[#386641]/70 hover:text-[#386641] text-xs font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-5 py-2.5 bg-[#C1121F] text-white rounded-xl text-xs font-semibold hover:bg-[#a50f1a] transition"
                >
                  {editingSchedule ? "変更を保存" : "予定を追加"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* City Leg Modal (Create or Edit) */}
      {(editingCityLeg || isCreatingCityLeg) && (
        <CityLegModal
          leg={editingCityLeg}
          onClose={() => {
            setEditingCityLeg(null);
            setIsCreatingCityLeg(false);
          }}
          onSave={handleSaveCityLeg}
          formatDate={formatDate}
          tripStartDate={startDate}
          tripEndDate={endDate}
          datesList={datesList}
          cityMasterList={cityMasterList}
          existingLegs={customCityLegs !== null ? customCityLegs : autoGeneratedCityLegItems}
        />
      )}

      {/* City Master Modal */}
      {(isCityMasterOpen || Boolean(assigningCityDate)) && (
        <CityMasterModal
          cities={cityMasterList}
          onCitiesChange={(newCities) => setCityMasterList(newCities)}
          onClose={() => {
            setIsCityMasterOpen(false);
            setAssigningCityDate(null);
          }}
          onSelectCity={
            assigningCityDate
              ? (city) => handleSetDayCity(assigningCityDate, city.name)
              : undefined
          }
        />
      )}

      {/* AI Booking Scanner Modal */}
      <BookingScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        tripId={tripId}
        tripStartDate={startDate}
        tripEndDate={endDate}
        onBookingAdded={handleBookingAdded}
        isOffline={isOffline}
      />

      {/* Floating Action Buttons */}
      {!showAddModal && !editingSchedule && !isScanModalOpen && !editingCityLeg && !isCreatingCityLeg && (
        <div
          className="fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-40 flex items-end gap-2.5 pointer-events-none"
          style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
        >
          {/* Backdrop when FAB menu is open */}
          {isFabMenuOpen && (
            <div
              className="fixed inset-0 z-30 pointer-events-auto"
              onClick={() => setIsFabMenuOpen(false)}
            />
          )}

          {/* Scroll to Top Button */}
          {showScrollTop && (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1.5 px-3 py-3 sm:px-4 sm:py-3.5 bg-white/95 text-[#386641] border border-[#386641]/25 hover:border-[#DDA15E] rounded-full shadow-xl hover:bg-[#FDF0D5] hover:text-[#003049] transition-all hover:scale-105 active:scale-95 pointer-events-auto cursor-pointer animate-in fade-in zoom-in-90 duration-200 backdrop-blur-xs"
              title="一番上に戻る"
              aria-label="一番上に戻る"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#386641] stroke-[2.5]" />
              <span className="text-xs font-bold text-[#386641] hidden sm:inline">上へ</span>
            </button>
          )}

          {/* Add Schedule FAB & Dropdown */}
          <div className="flex flex-col items-end gap-2 pointer-events-none">
            {/* Sub menu options */}
            {isFabMenuOpen && (
              <div className="relative z-40 flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsScanModalOpen(true);
                    setIsFabMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#FDF0D5] text-[#386641] border border-[#DDA15E]/60 rounded-full shadow-lg text-xs font-bold hover:bg-[#FDF0D5]/90 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C1121F]" />
                  <span>スクショから自動入力</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAddModal(selectedDateTab !== "ALL" ? selectedDateTab : undefined, "HOTEL");
                    setIsFabMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white text-[#386641] border border-[#DDA15E]/40 rounded-full shadow-lg text-xs font-bold hover:bg-stone-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Hotel className="w-3.5 h-3.5 text-[#DDA15E]" />
                  <span>宿泊を追加</span>
                </button>
              </div>
            )}

            {/* Main Floating Button */}
            <div className="relative z-40 flex items-center shadow-xl rounded-full bg-[#C1121F] text-white border border-white/20 hover:shadow-2xl transition-all pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setIsFabMenuOpen(false);
                  handleOpenAddModal(selectedDateTab !== "ALL" ? selectedDateTab : undefined);
                }}
                className="flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-[#a50f1a] rounded-l-full font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
                title="予定を追加"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                <span>予定を追加</span>
              </button>
              <div className="w-[1px] h-6 bg-white/25" />
              <button
                type="button"
                onClick={() => setIsFabMenuOpen((prev) => !prev)}
                className="px-2.5 py-3 sm:px-3 sm:py-3.5 hover:bg-[#a50f1a] rounded-r-full font-bold text-xs transition-all cursor-pointer flex items-center justify-center"
                title="その他の追加オプション（宿泊・スクショ）"
                aria-label="その他の追加オプション"
              >
                <ChevronUp
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isFabMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast Notification */}
      {toastError && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-[#C1121F] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top-3 fade-in duration-200 pointer-events-auto">
          <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          <span className="text-xs font-medium leading-tight flex-1">{toastError}</span>
          <button
            type="button"
            onClick={() => setToastError(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalConfig && (
        <ConfirmModal
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmLabel={confirmModalConfig.confirmLabel}
          isDestructive={confirmModalConfig.isDestructive}
          onConfirm={confirmModalConfig.onConfirm}
          onClose={() => setConfirmModalConfig(null)}
        />
      )}
    </div>
  );
}

interface CityLegModalProps {
  leg?: CityLeg | null;
  onClose: () => void;
  onSave: (item: CityLegItem) => void;
  formatDate: (d: string) => string;
  tripStartDate: string | null;
  tripEndDate: string | null;
  datesList: string[];
  cityMasterList?: CityMasterItem[];
  existingLegs?: CityLegItem[];
}

function CityLegModal({
  leg,
  onClose,
  onSave,
  formatDate,
  tripStartDate,
  tripEndDate,
  datesList,
  cityMasterList = [],
  existingLegs = [],
}: CityLegModalProps) {
  const isEditing = Boolean(leg);
  const minDate = tripStartDate || (datesList.length > 0 ? datesList[0] : "");
  const maxDate = tripEndDate || (datesList.length > 0 ? datesList[datesList.length - 1] : "");

  const [name, setName] = useState(leg?.name || "");
  const [flag, setFlag] = useState(leg?.flag || "👥");
  const [country, setCountry] = useState(leg?.country || "");
  const [cityName, setCityName] = useState(leg?.cityName || "");
  const [startDate, setStartDate] = useState(
    leg?.startDate || (datesList.length > 0 ? datesList[0] : "")
  );
  const [endDate, setEndDate] = useState(
    leg?.endDate || leg?.startDate || (datesList.length > 0 ? datesList[0] : "")
  );
  const [memo, setMemo] = useState(leg?.customMemo || "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Clear validation when user edits inputs
  const clearValidation = () => {
    if (validationError) setValidationError(null);
    if (validationWarning) {
      setValidationWarning(null);
      setWarningDismissed(false);
    }
  };

  // Calculate day range
  const calcDayIndices = () => {
    if (!startDate || !endDate) return "";
    const startIdx = datesList.indexOf(startDate);
    const endIdx = datesList.indexOf(endDate);
    if (startIdx >= 0 && endIdx >= 0) {
      const daysCount = endIdx - startIdx + 1;
      return startIdx === endIdx
        ? `Day ${startIdx + 1} (${daysCount}日間)`
        : `Day ${startIdx + 1} 〜 Day ${endIdx + 1} (${daysCount}日間)`;
    }
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return `${diffDays}日間`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    // Ensure startDate <= endDate
    const realStart = startDate <= endDate ? startDate : endDate;
    const realEnd = startDate <= endDate ? endDate : startDate;

    const otherLegs = existingLegs.filter((l) => l.id !== leg?.id);

    // 1. Check Overlap (Error: blocks saving)
    const overlapped = otherLegs.find((l) => !(realEnd < l.startDate || realStart > l.endDate));
    if (overlapped) {
      setValidationError(
        `「${overlapped.flag} ${overlapped.name}」(${formatDate(overlapped.startDate)} 〜 ${formatDate(overlapped.endDate)}) と期間が重なっています。日程を調整してください。`
      );
      return;
    }

    // 2. Check Gaps (Warning: does not block saving if clicked again)
    const coveredDates = new Set<string>();
    datesList.forEach((d) => {
      if (d >= realStart && d <= realEnd) coveredDates.add(d);
    });
    otherLegs.forEach((l) => {
      datesList.forEach((d) => {
        if (d >= l.startDate && d <= l.endDate) coveredDates.add(d);
      });
    });
    const uncoveredDates = datesList.filter((d) => !coveredDates.has(d));
    if (uncoveredDates.length > 0 && !warningDismissed) {
      setValidationWarning(
        `旅行日程の中に、どのグループにも属さない日（${uncoveredDates.length}日間）があります。このまま保存する場合は、もう一度「${isEditing ? "変更を保存" : "グループを追加"}」を押してください。`
      );
      setWarningDismissed(true);
      return;
    }

    const id = leg?.id || `leg-custom-${Date.now()}`;
    const cleanName = name.trim();
    onSave({
      id,
      name: cleanName,
      flag: flag.trim() || "👥",
      country: country.trim(),
      cityName: cityName.trim() || undefined,
      startDate: realStart,
      endDate: realEnd,
      customMemo: memo.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[#FDF0D5] border border-[#DDA15E]/40 rounded-2xl p-5 max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#386641]/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#386641] text-white rounded-lg">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#386641]">
                {isEditing ? "グループ・区間情報の編集" : "新しいグループ・区間を追加"}
              </h2>
              <div className="text-[11px] text-[#386641]/70 font-semibold">
                {startDate && endDate ? `${formatDate(startDate)} 〜 ${formatDate(endDate)} ・ ${calcDayIndices()}` : "滞在期間とグループを設定"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#386641]/50 hover:text-[#386641] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {/* Overlap Error Message */}
          {validationError && (
            <div className="p-3 bg-[#C1121F]/10 border border-[#C1121F]/30 rounded-xl text-[#C1121F] text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Gap Warning Message */}
          {validationWarning && (
            <div className="p-3 bg-[#DDA15E]/20 border border-[#DDA15E]/50 rounded-xl text-[#386641] text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DDA15E]" />
              <span>{validationWarning}</span>
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-[#386641] mb-1">
              グループ名・誰と <span className="text-[#C1121F]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearValidation();
              }}
              placeholder="例: まな・さくら, 一人旅, 友達グループ"
              className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
              required
            />
          </div>

          {/* Date Range Selection */}
          <div className="bg-white/70 p-3 rounded-xl border border-[#DDA15E]/30 space-y-2">
            <label className="block text-xs font-semibold text-[#386641]">
              滞在期間（日程範囲） <span className="text-[#C1121F]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] text-[#386641]/60 mb-1">開始日</span>
                <input
                  type="date"
                  value={startDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (val > endDate) setEndDate(val);
                    clearValidation();
                  }}
                  className="w-full border border-[#386641]/20 rounded-xl px-2.5 py-2 text-xs bg-white text-[#386641] font-medium focus:outline-none focus:border-[#386641]"
                  required
                />
              </div>
              <div>
                <span className="block text-[10px] text-[#386641]/60 mb-1">終了日</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || minDate}
                  max={maxDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    clearValidation();
                  }}
                  className="w-full border border-[#386641]/20 rounded-xl px-2.5 py-2 text-xs bg-white text-[#386641] font-medium focus:outline-none focus:border-[#386641]"
                  required
                />
              </div>
            </div>
            <div className="text-[11px] font-semibold text-[#003049] flex items-center justify-between pt-1">
              <span>選択期間: {calcDayIndices()}</span>
              {startDate && endDate && (
                <span className="text-[10px] text-[#386641]/60">
                  {formatDate(startDate)} 〜 {formatDate(endDate)}
                </span>
              )}
            </div>
          </div>

          {/* Visited Cities / Areas */}
          <div>
            <label className="block text-xs font-semibold text-[#386641] mb-1">
              訪問都市・エリア（任意）
            </label>
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="例: リスボン・シントラ, マドリード＆トレド, ベネチア"
              className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
            />
            {cityMasterList.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-[#386641]/60 font-semibold mr-0.5">都市候補:</span>
                {cityMasterList.slice(0, 10).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCityName(c.name);
                      if (c.country && !country) setCountry(c.country);
                      if (c.flag && (!flag || flag === "👥")) setFlag(c.flag);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#386641]/15 text-[#386641] text-[10px] font-medium hover:bg-[#FDF0D5] hover:border-[#DDA15E] transition"
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-[#386641]/60">
              このグループ期間中に訪問する都市のメモです。カード上にバッジとして表示されます。
            </p>
          </div>

          {/* Icon & Country */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#386641] mb-1">
                アイコン（絵文字）
              </label>
              <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="例: 👥"
                className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white text-center focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#386641] mb-1">
                主な国・地域（任意）
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="例: スペイン, ポルトガル, ヨーロッパ"
                className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641]"
              />
            </div>
          </div>

          {/* Area / Group Memo */}
          <div>
            <label className="block text-xs font-semibold text-[#386641] mb-1">
              グループメモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: バル巡りとピンチョスを満喫！のんびり美術館鑑賞。"
              rows={2}
              className="w-full border border-[#386641]/20 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#386641]/20 focus:border-[#386641] resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#386641]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-[#386641]/70 hover:text-[#386641] text-xs font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C1121F] text-white rounded-xl text-xs font-semibold hover:bg-[#a50f1a] transition shadow-xs"
            >
              {isEditing ? "変更を保存" : "グループを追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// In-app Confirmation Modal
function ConfirmModal({
  title,
  message,
  confirmLabel,
  isDestructive = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FDF0D5] border border-[#DDA15E]/40 rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-bold text-[#386641] flex items-center gap-1.5">
            {isDestructive && <AlertCircle className="w-4 h-4 text-[#C1121F]" />}
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#386641]/50 hover:text-[#386641] rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[#386641]/80 leading-relaxed whitespace-pre-line">
          {message}
        </p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#386641]/10">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-[#386641]/70 hover:text-[#386641] text-xs font-medium"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 text-white rounded-xl text-xs font-semibold shadow-xs transition ${
              isDestructive
                ? "bg-[#C1121F] hover:bg-[#a50f1a]"
                : "bg-[#386641] hover:bg-[#2c5234]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

