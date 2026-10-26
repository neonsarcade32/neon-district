'use strict';

// Cork7-only offline cache. Cache only this game's HTML and static files.
// Multiplayer/API traffic is deliberately network-only so online play keeps
// working when a connection exists and never receives stale cached responses.
const CACHE_NAME = 'nd-cork7-static-v8';
const SHELL_PATHS = [
  'cork7.html',
  'cork7-start.html',
  'cork7-bridge.js',
  'cork7-standalone.js',
  'cork7-neon-friends.js',
  'cork7-neon-friends.css',
  'cork7-assets/brand/favicon-96.png',
  'cork7-assets/_next/static/css/index.DBvX0VVq.css',
  'cork7-assets/_next/static/css/game-client.Dazi9g4y.css',
  'cork7-assets/_next/static/chunks/framework-D_rUT4EX.js',
  'cork7-assets/_next/static/chunks/nd-standalone-vite-preload.js',
  'cork7-assets/_next/static/chunks/game-client-ND-preload-20261022.js',
  'cork7-assets/_next/static/chunks/supabase-BEhtaJUq.js',
  'cork7-assets/_next/static/chunks/game-client-ND-standalone.js',
  'cork7-assets/_next/static/chunks/active-course-neonpeak-fix-20261026-v3.js',
  'cork7-assets/models/rider-v20.glb',
  'cork7-assets/models/venue-v1.glb',
  'cork7-assets/models/powder-finish-v1.glb',
  'cork7-assets/models/lift-v1.glb',
  'cork7-assets/models/rails-v2.glb',
  'cork7-assets/models/flowline/rails-v2.glb',
  'cork7-assets/models/forest-line/rails-v1.glb',
  'cork7-assets/models/shirakumo-tram-v1.glb',
  'cork7-assets/textures/rail-painted-steel-v1.webp',
];

const SHELL_SET = new Set(SHELL_PATHS.map((path) => new URL(path, self.registration.scope).pathname));
const STATIC_EXT = /\.(?:js|mjs|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp3|ogg|wav|mp4|webm|glb|gltf|bin|ktx2?|hdr|basis|wasm)$/i;

function isCork7Client(clientPath) {
  return clientPath.endsWith('/cork7.html') || clientPath.endsWith('/cork7-start.html');
}

function isCacheableStatic(url, request) {
  if (request.method !== 'GET' || request.headers.has('range')) return false;
  // Never intercept external services, login, API, presence, or multiplayer.
  if (url.origin !== self.location.origin) return false;
  for (const key of url.searchParams.keys()) {
    if (/(?:token|auth|session|signature|secret|api.?key|credential)/i.test(key)) return false;
  }
  if (request.mode === 'navigate') {
    return url.pathname.endsWith('/cork7.html') || url.pathname.endsWith('/cork7-start.html');
  }
  return url.pathname.includes('/cork7-assets/') ||
    SHELL_SET.has(url.pathname) ||
    (STATIC_EXT.test(url.pathname) && /\/cork7(?:-[^/]+)?\.(?:js|css)$/i.test(url.pathname));
}

async function putIfCacheable(cache, request, response) {
  if (!response || !response.ok || response.status === 206 || response.type === 'opaque') return;
  try { await cache.put(request, response.clone()); } catch (_) {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // A missing optional file must not block installation. Dynamic requests
    // are also cached as the player visits menus and plays a full run online.
    await Promise.all(SHELL_PATHS.map(async (path) => {
      const url = new URL(path, self.registration.scope);
      try {
        const response = await fetch(url.href, { cache: 'reload' });
        if (response.ok) await cache.put(url.href, response);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('nd-cork7-static-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (!isCacheableStatic(url, request)) return;

  event.respondWith((async () => {
    const client = event.clientId ? await self.clients.get(event.clientId) : null;
    const clientPath = client ? new URL(client.url).pathname : '';
    const isGameNavigation = request.mode === 'navigate' &&
      url.origin === self.location.origin &&
      (url.pathname.endsWith('/cork7.html') || url.pathname.endsWith('/cork7-start.html'));
    // Do not alter requests made by other pages under the same site scope.
    if (!isGameNavigation && !isCork7Client(clientPath)) return fetch(request);

    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) {
      // Return the complete cached response immediately. Versioned game assets
      // are immutable; shell updates are refreshed during worker installation.
      // Avoid late waitUntil() calls after asynchronous work, which can be
      // rejected by some service-worker implementations.
      return cached;
    }

    try {
      const response = await fetch(request);
      await putIfCacheable(cache, request, response);
      return response;
    } catch (_) {
      return new Response('This Cork7 file is not cached yet. Connect once, open Cork7, and let the game finish loading before going offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
  })());
});
