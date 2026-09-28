import { Trip } from "@/types/trip";

const DB_NAME = "TravelPlannerDB";
const STORE_TRIPS = "trips";
const STORE_SYNC_QUEUE = "sync_queue";
const DB_VERSION = 1;

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TRIPS)) {
        db.createObjectStore(STORE_TRIPS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        db.createObjectStore(STORE_SYNC_QUEUE, { autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save trip to offline storage
export async function saveTripOffline(trip: Trip): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRIPS, "readwrite");
      const store = tx.objectStore(STORE_TRIPS);
      const req = store.put(trip);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    // Fallback to localStorage
    try {
      if (typeof window !== "undefined") {
        const key = `offline_trip_${trip.id}`;
        localStorage.setItem(key, JSON.stringify(trip));
        // Also update offline trip list index
        const listKey = "offline_trips_index";
        const existing = JSON.parse(localStorage.getItem(listKey) || "[]") as number[];
        if (!existing.includes(trip.id)) {
          existing.push(trip.id);
          localStorage.setItem(listKey, JSON.stringify(existing));
        }
      }
    } catch (lsErr) {
      console.warn("Offline storage fallback failed:", lsErr);
    }
  }
}

// Save multiple trips to offline storage
export async function saveTripsOffline(trips: Trip[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRIPS, "readwrite");
      const store = tx.objectStore(STORE_TRIPS);
      trips.forEach((trip) => store.put(trip));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("offline_trips_all", JSON.stringify(trips));
      } catch (err) {
        console.warn("LocalStorage save error:", err);
      }
    }
  }
}

// Get trip from offline storage
export async function getTripOffline(id: number): Promise<Trip | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRIPS, "readonly");
      const store = tx.objectStore(STORE_TRIPS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(`offline_trip_${id}`);
        if (item) return JSON.parse(item);
        const all = localStorage.getItem("offline_trips_all");
        if (all) {
          const list = JSON.parse(all) as Trip[];
          return list.find((t) => t.id === id) || null;
        }
      } catch (err) {
        console.warn("LocalStorage load error:", err);
      }
    }
    return null;
  }
}

// Get all trips from offline storage
export async function getAllTripsOffline(): Promise<Trip[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRIPS, "readonly");
      const store = tx.objectStore(STORE_TRIPS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    if (typeof window !== "undefined") {
      try {
        const all = localStorage.getItem("offline_trips_all");
        if (all) return JSON.parse(all);
      } catch (err) {
        console.warn("LocalStorage load error:", err);
      }
    }
    return [];
  }
}

// Delete trip from offline storage
export async function deleteTripOffline(id: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRIPS, "readwrite");
      const store = tx.objectStore(STORE_TRIPS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`offline_trip_${id}`);
    }
  }
}
