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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Pre-cache the two local entry pages. Other game assets are learned
    // during a successful online play session.
    for (const path of ['cork7.html', 'cork7-start.html']) {
      try {
        const url = new URL(path, self.registration.scope);
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch (_) {}
    }
    await self.skipWaiting();
  })());
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
    // This worker's scope covers the site directory, but it must only act for
    // Cork7 pages so the rest of Neon District keeps its existing cache rules.
    const client = event.clientId ? await self.clients.get(event.clientId) : null;
    const clientPath = client ? new URL(client.url).pathname : '';
    const isCork7Navigation = request.mode === 'navigate' &&
      url.origin === self.location.origin &&
      (url.pathname.endsWith('/cork7.html') || url.pathname.endsWith('/cork7-start.html'));
    if (!isCork7Navigation && (!client ||
        (!clientPath.endsWith('/cork7.html') && !clientPath.endsWith('/cork7-start.html')))) {
      return fetch(request);
    }

    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, request.mode === 'navigate' ? {ignoreSearch:true} : undefined);
    if (cached) return cached;

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
