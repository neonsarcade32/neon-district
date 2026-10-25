'use strict';

// Cork7-only offline cache. This worker never caches API, authentication,
// POST, WebSocket, or multiplayer traffic. Static assets are cached after
// successful online requests, then served from cache when disconnected.
const CACHE_NAME = 'nd-cork7-static-v1';
const SHELL_PATHS = [
  'cork7.html',
  'cork7-start.html',
  'cork7-bridge.js',
  'cork7-standalone.js',
  'cork7-neon-friends.js',
  'cork7-neon-friends.css'
];

function isCork7Path(pathname) {
  return SHELL_PATHS.some((path) => pathname.endsWith('/' + path) || pathname === '/' + path) ||
    pathname.includes('/cork7-assets/');
}

function isStaticAsset(url, request) {
  if (!isCork7Path(url.pathname) && !/\.(?:js|mjs|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp3|ogg|wav|mp4|webm|glb|gltf|bin|ktx2?|hdr|basis|wasm)$/i.test(url.pathname) &&
      !/\/(?:models|textures)\//i.test(url.pathname)) return false;

  // Do not persist likely signed or credential-bearing URLs.
  for (const key of url.searchParams.keys()) {
    if (/(?:token|auth|session|signature|secret|api.?key|credential)/i.test(key)) return false;
  }

  // Keep this cache limited to static GET resources, never navigation to
  // third-party pages or application/API payloads.
  if (request.mode === 'navigate' && url.origin !== self.location.origin) return false;
  return request.method === 'GET' && !request.headers.has('range');
}

async function cacheResponse(cache, request, response) {
  if (!response || (!response.ok && response.type !== 'opaque') || response.status === 206) return;
  try { await cache.put(request, response.clone()); } catch (_) {}
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('nd-cork7-static-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const url = new URL(request.url);
  if (!isStaticAsset(url, request)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      // Cache-first keeps already-downloaded game assets available offline.
      // Update in the background only when online; never block the game.
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(request);
          await cacheResponse(cache, request, fresh);
        } catch (_) {}
      })());
      return cached;
    }

    try {
      const response = await fetch(request);
      await cacheResponse(cache, request, response);
      return response;
    } catch (error) {
      // Never substitute HTML for a missing model/script: that hides the
      // real offline failure and usually causes a harder-to-debug parse error.
      throw error;
    }
  })());
});
