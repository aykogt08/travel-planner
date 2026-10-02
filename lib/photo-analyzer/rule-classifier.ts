// lib/photo-analyzer/rule-classifier.ts
import { PhotoCategory, DetectedEntity } from "@/types/photo-analysis";

/**
 * Maps MediaPipe / Computer Vision labels to one of the 14 core travel categories.
 */
const LABEL_CATEGORY_MAP: Record<string, PhotoCategory> = {
  // Person
  person: "person",
  human: "person",
  man: "person",
  woman: "person",
  boy: "person",
  girl: "person",
  face: "person",
  crowd: "person",
  selfie: "person",

  // Food
  food: "food",
  dish: "food",
  meal: "food",
  plate: "food",
  bowl: "food",
  pizza: "food",
  burger: "food",
  cake: "food",
  dessert: "food",
  bread: "food",
  coffee: "food",
  tea: "food",
  cup: "food",
  wine: "food",
  beer: "food",
  drink: "food",
  dining: "food",
  fruit: "food",
  vegetable: "food",
  sandwich: "food",
  soup: "food",
  pasta: "food",
  sushi: "food",

  // Animal
  animal: "animal",
  dog: "animal",
  cat: "animal",
  bird: "animal",
  horse: "animal",
  sheep: "animal",
  cow: "animal",
  elephant: "animal",
  bear: "animal",
  zebra: "animal",
  giraffe: "animal",
  fish: "animal",

  // Transportation
  airplane: "transportation",
  aeroplane: "transportation",
  train: "transportation",
  railway: "transportation",
  subway: "transportation",
  bus: "transportation",
  boat: "transportation",
  ship: "transportation",
  car: "transportation",
  vehicle: "transportation",
  automobile: "transportation",
  motorcycle: "transportation",
  bicycle: "transportation",
  station: "transportation",
  airport: "transportation",

  // Architecture & Building
  building: "architecture",
  house: "architecture",
  castle: "architecture",
  church: "architecture",
  cathedral: "architecture",
  temple: "architecture",
  tower: "architecture",
  monument: "architecture",
  bridge: "architecture",
  palace: "architecture",
  museum: "architecture",
  skyscraper: "architecture",

  // Street
  street: "street",
  road: "street",
  alley: "street",
  sidewalk: "street",
  town: "street",
  city: "street",
  market: "street",
  shop: "street",
  store: "street",

  // Nature
  plant: "nature",
  tree: "nature",
  flower: "nature",
  grass: "nature",
  leaf: "nature",
  garden: "nature",
  forest: "nature",
  sea: "nature",
  ocean: "nature",
  beach: "nature",
  lake: "nature",
  river: "nature",
  mountain: "nature",

  // Landscape
  landscape: "landscape",
  scenery: "landscape",
  sky: "landscape",
  cloud: "landscape",
  sunset: "landscape",
  sunrise: "landscape",
  horizon: "landscape",
  view: "landscape",
  valley: "landscape",

  // Hotel & Indoor Room
  hotel: "hotel",
  bed: "hotel",
  bedroom: "hotel",
  room: "hotel",
  sofa: "hotel",
  couch: "hotel",
  lobby: "hotel",
  resort: "hotel",

  // Event
  festival: "event",
  concert: "event",
  stage: "event",
  party: "event",
  fireworks: "event",
  night: "event",

  // Object
  souvenir: "object",
  bag: "object",
  backpack: "object",
  handbag: "object",
  suitcase: "object",
  luggage: "object",
  bottle: "object",
  chair: "object",
  table: "object",
  book: "object",
  watch: "object",

  // Document & Screenshot
  document: "document",
  paper: "document",
  receipt: "document",
  ticket: "document",
  map: "document",
  menu: "document",
  text: "document",
  sign: "document",
  screenshot: "screenshot",
  display: "screenshot",
  screen: "screenshot",
  monitor: "screenshot",
  cellphone: "screenshot",
  phone: "screenshot",
};

export interface RuleClassificationInput {
  detectedLabels: { label: string; score: number }[];
  personCount: number;
  hasCutoutSubject: boolean;
  aspectRatio: number;
  width: number;
  height: number;
  isBright?: boolean;
}

/**
 * Clean rule engine that separates raw AI vision results from application-level travel taxonomy.
 */
export function classifyPhotoByRules(input: RuleClassificationInput): {
  primaryCategory: PhotoCategory;
  secondaryCategories: PhotoCategory[];
  detectedEntities: DetectedEntity[];
  hasPerson: boolean;
  hasFood: boolean;
  hasAnimal: boolean;
  hasBuilding: boolean;
  hasVehicle: boolean;
  isIndoor: boolean;
  isOutdoor: boolean;
} {
  const detectedEntities: DetectedEntity[] = [];
  const categoryScores: Record<PhotoCategory, number> = {
    person: 0,
    food: 0,
    landscape: 0,
    architecture: 0,
    animal: 0,
    transportation: 0,
    hotel: 0,
    street: 0,
    nature: 0,
    event: 0,
    object: 0,
    document: 0,
    screenshot: 0,
    other: 0,
  };

  // 1. Map raw detected labels to travel categories
  for (const item of input.detectedLabels) {
    const rawLabel = item.label.toLowerCase().trim();
    let matchedCat: PhotoCategory = "other";

    for (const [key, cat] of Object.entries(LABEL_CATEGORY_MAP)) {
      if (rawLabel.includes(key) || key.includes(rawLabel)) {
        matchedCat = cat;
        break;
      }
    }

    if (matchedCat !== "other") {
      categoryScores[matchedCat] += item.score;
      detectedEntities.push({
        label: item.label,
        category: matchedCat,
        score: item.score,
      });
    }
  }

  // 2. Incorporate structural and segmentation cues
  if (input.personCount > 0) {
    categoryScores["person"] += input.personCount * 0.8 + 0.5;
  }

  // Detect mobile screenshot heuristic (typical phone aspect ratio e.g. 19.5:9, 16:9 tall with screen labels)
  const isTypicalMobileScreen =
    (input.aspectRatio < 0.55 || input.aspectRatio > 1.8) &&
    (categoryScores["screenshot"] > 0.4 || categoryScores["document"] > 0.4);
  if (isTypicalMobileScreen) {
    categoryScores["screenshot"] += 1.2;
  }

  // High aspect ratio landscape with sky/nature cues
  if (input.aspectRatio > 1.4 && (categoryScores["nature"] > 0 || categoryScores["architecture"] > 0)) {
    categoryScores["landscape"] += 0.4;
  }

  // 3. Flags determination
  const hasPerson = input.personCount > 0;
  const hasFood = categoryScores["food"] > 0.5;
  const hasAnimal = categoryScores["animal"] > 0.5;
  const hasBuilding = categoryScores["architecture"] > 0.5;
  const hasVehicle = categoryScores["transportation"] > 0.5;

  const isIndoor = hasFood || categoryScores["hotel"] > 0.6 || categoryScores["document"] > 0.6;
  const isOutdoor =
    categoryScores["landscape"] > 0.5 ||
    categoryScores["nature"] > 0.5 ||
    categoryScores["street"] > 0.5 ||
    categoryScores["architecture"] > 0.5;

  // 4. Primary & Secondary Category resolution
  const sortedCategories = (Object.keys(categoryScores) as PhotoCategory[])
    .filter((cat) => categoryScores[cat] > 0.3)
    .sort((a, b) => categoryScores[b] - categoryScores[a]);

  let primaryCategory: PhotoCategory = "other";
  const secondaryCategories: PhotoCategory[] = [];

  if (sortedCategories.length > 0) {
    primaryCategory = sortedCategories[0];
    for (let i = 1; i < sortedCategories.length; i++) {
      if (sortedCategories[i] !== primaryCategory && !secondaryCategories.includes(sortedCategories[i])) {
        secondaryCategories.push(sortedCategories[i]);
      }
      if (secondaryCategories.length >= 3) break;
    }
  } else if (hasPerson) {
    primaryCategory = "person";
  } else if (input.aspectRatio > 1.3) {
    primaryCategory = "landscape";
  }

  return {
    primaryCategory,
    secondaryCategories,
    detectedEntities,
    hasPerson,
    hasFood,
    hasAnimal,
    hasBuilding,
    hasVehicle,
    isIndoor,
    isOutdoor,
  };
}
