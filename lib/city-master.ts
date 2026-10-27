export interface CityMasterItem {
  id: string;
  name: string;
  flag: string;
  country: string;
}

export const DEFAULT_CITIES: CityMasterItem[] = [
  { id: "city-paris", name: "パリ", flag: "🇫🇷", country: "フランス" },
  { id: "city-lisbon", name: "リスボン", flag: "🇵🇹", country: "ポルトガル" },
  { id: "city-porto", name: "ポルト", flag: "🇵🇹", country: "ポルトガル" },
  { id: "city-madrid", name: "マドリード", flag: "🇪🇸", country: "スペイン" },
  { id: "city-barcelona", name: "バルセロナ", flag: "🇪🇸", country: "スペイン" },
  { id: "city-san-sebastian", name: "サン・セバスチャン", flag: "🇪🇸", country: "スペイン" },
  { id: "city-bilbao", name: "ビルバオ", flag: "🇪🇸", country: "スペイン" },
  { id: "city-santiago", name: "サンティアゴ", flag: "🇪🇸", country: "スペイン" },
  { id: "city-venice", name: "ベネチア", flag: "🇮🇹", country: "イタリア" },
  { id: "city-rome", name: "ローマ", flag: "🇮🇹", country: "イタリア" },
  { id: "city-florence", name: "フィレンツェ", flag: "🇮🇹", country: "イタリア" },
  { id: "city-milan", name: "ミラノ", flag: "🇮🇹", country: "イタリア" },
  { id: "city-napoli", name: "ナポリ", flag: "🇮🇹", country: "イタリア" },
  { id: "city-budapest", name: "ブダペスト", flag: "🇭🇺", country: "ハンガリー" },
  { id: "city-prague", name: "プラハ", flag: "🇨🇿", country: "チェコ" },
  { id: "city-vienna", name: "ウィーン", flag: "🇦🇹", country: "オーストリア" },
  { id: "city-tokyo", name: "東京", flag: "🇯🇵", country: "日本" },
  { id: "city-europe", name: "ヨーロッパ周遊", flag: "🇪🇺", country: "ヨーロッパ" },
];

const STORAGE_KEY = "travel_planner_city_master";

export function loadCityMaster(): CityMasterItem[] {
  if (typeof window === "undefined") return DEFAULT_CITIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CITIES;
    const customList: CityMasterItem[] = JSON.parse(raw);
    // Merge: default cities + user custom cities (avoid duplicate names)
    const map = new Map<string, CityMasterItem>();
    DEFAULT_CITIES.forEach((c) => map.set(c.name, c));
    customList.forEach((c) => map.set(c.name, c));
    return Array.from(map.values());
  } catch (e) {
    console.error("Failed to load city master from localStorage", e);
    return DEFAULT_CITIES;
  }
}

export function saveCustomCity(city: Omit<CityMasterItem, "id"> & { id?: string }): CityMasterItem[] {
  if (typeof window === "undefined") return DEFAULT_CITIES;
  try {
    const current = loadCityMaster();
    const id = city.id || `city-custom-${Date.now()}`;
    const newCity: CityMasterItem = {
      id,
      name: city.name.trim(),
      flag: city.flag.trim() || "🌍",
      country: city.country.trim() || "海外",
    };

    const existingIdx = current.findIndex((c) => c.name === newCity.name || c.id === id);
    let updated: CityMasterItem[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = newCity;
    } else {
      // Insert before "ヨーロッパ周遊"
      const europeIdx = current.findIndex((c) => c.name === "ヨーロッパ周遊");
      if (europeIdx >= 0) {
        updated = [...current.slice(0, europeIdx), newCity, ...current.slice(europeIdx)];
      } else {
        updated = [...current, newCity];
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save custom city", e);
    return DEFAULT_CITIES;
  }
}

export function deleteCustomCity(cityNameOrId: string): CityMasterItem[] {
  if (typeof window === "undefined") return DEFAULT_CITIES;
  try {
    const current = loadCityMaster();
    const updated = current.filter((c) => c.id !== cityNameOrId && c.name !== cityNameOrId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to delete custom city", e);
    return DEFAULT_CITIES;
  }
}
