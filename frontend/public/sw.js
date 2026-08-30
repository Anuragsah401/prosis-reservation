/**
 * Seat Booking — Progressive Web App Service Worker
 * Version: 1.0.0
 */

const CACHE_NAME = "seatbooking-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.webmanifest",
  "/manifest.json",
  "/favicon.svg",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon.png"
];

// Install Event: Pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[PWA SW] Pre-cache failed for some assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[PWA SW] Removing old cache:", key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Caching Strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignore non-GET requests and cross-origin tracking/analytics
  if (request.method !== "GET") return;

  // 2. API requests: Network First with graceful error handling (Never serve stale reservation updates when online)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              error: "Network unavailable",
              offline: true,
              message: "You are currently offline. Live restaurant updates will resume when reconnected."
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" }
            }
          );
        })
    );
    return;
  }

  // 3. Navigation requests (HTML pages): Network First, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/");
          return fallback || fetch(request);
        })
    );
    return;
  }

  // 4. Static assets (JS, CSS, images, icons, fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Message Event: Skip waiting when client prompts update
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
