const CACHE_VERSION = 'v1';
const STATIC_CACHE = `next-static-${CACHE_VERSION}`;
const API_CACHE = `api-home-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

const ALL_CACHES = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];

// ── Install: precache the app shell root ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(['/']).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate: delete caches from previous versions ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !ALL_CACHES.includes(k)).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

// ── Fetch: route to the right strategy ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip OneSignal worker — it manages its own lifecycle
  if (url.pathname.includes('OneSignalSDKWorker')) return;

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API routes — NetworkFirst: always try network, fall back to cache
  if (/\/api\/(logs|streaks|progress|insights|notifications|plans)(\/.*)?$/.test(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE, 5_000));
    return;
  }

  // Next.js static assets (content-hashed, immutable) — CacheFirst
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Cloudinary images — CacheFirst (7 days)
  if (url.hostname === 'res.cloudinary.com') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // Local static image assets — CacheFirst (30 days)
  if (/\.(png|jpg|jpeg|webp|svg|gif|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 30 * 24 * 60 * 60));
    return;
  }
});

// ── Strategy: NetworkFirst ────────────────────────────────────────────────────
// Tries the network with a timeout; on failure serves from cache.
async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);

    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Strategy: CacheFirst ──────────────────────────────────────────────────────
// Serves from cache if fresh; otherwise fetches from network and caches result.
// maxAgeSeconds is optional — omit for immutable assets (/_next/static/).
async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    if (maxAgeSeconds !== undefined) {
      const cachedDate = cached.headers.get('date');
      const age = cachedDate
        ? (Date.now() - new Date(cachedDate).getTime()) / 1000
        : 0;
      if (age < maxAgeSeconds) return cached;
      // Cache is stale — fall through to network
    } else {
      // No expiry = immutable (/_next/static/ assets)
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    if (cached) return cached;
    return new Response(null, { status: 503 });
  }
}
