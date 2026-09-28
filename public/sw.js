const CACHE_NAME = "travel-planner-v1";
const STATIC_ASSETS = [
  "/",
  "/trips",
  "/manifest.json",
  "/favicon.ico"
];

// Install: Cache core static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Failed to precache some assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first with Cache fallback for pages/assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET or cross-origin requests
  if (event.request.method !== "GET" || !url.origin.includes(self.location.origin)) {
    return;
  }

  // API calls: Network first, cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Next.js static files or HTML pages
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Fallback to /trips for navigation requests
        if (event.request.mode === "navigate") {
          const tripsFallback = await caches.match("/trips");
          if (tripsFallback) return tripsFallback;
        }
        return new Response("オフラインです。インターネット接続を確認してください。", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});
