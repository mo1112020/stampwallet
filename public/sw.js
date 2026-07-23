// Minimal service worker for the Scanner PWA — caches the app shell for
// fast/offline startup. Deliberately does NOT cache or queue API calls
// (/api/scan, /api/scan/lookup): scanning requires a live connection
// anyway, and silently queuing writes would reintroduce the double-award
// race the server-side rate limiter and unique constraints are there to
// prevent. Offline means "clearly show nothing was saved," not "queue it
// for later."
const CACHE_NAME = "stampwallet-scanner-shell-v1";
const SHELL_URLS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls — always go to the network so scan results
  // are never served stale or queued from cache.
  if (url.pathname.startsWith("/api/")) return;

  if (event.request.method !== "GET") return;

  // Network-first for navigations (so staff always get the latest app
  // shell when online), falling back to cache when offline.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then((res) => res || caches.match("/manifest.json")))
    );
    return;
  }

  // Cache-first for static shell assets (icons, manifest).
  if (SHELL_URLS.some((path) => url.pathname === path)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
