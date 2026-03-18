/* Basic offline cache for same-origin GET requests (Vite build-friendly). */
const CACHE_NAME = "gym-tracker-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return cached ?? caches.match("/") ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Stale-while-revalidate for other same-origin GETs (assets).
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      const fetchPromise = fetch(req)
        .then(async (res) => {
          if (res && res.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => undefined);
      return cached ?? (await fetchPromise) ?? Response.error();
    })(),
  );
});

