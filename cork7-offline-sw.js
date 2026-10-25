'use strict';

// Cork7-only offline cache. Never cache API/authentication, POST, WebSocket,
// or multiplayer traffic. Version bump forces installed clients to refresh it.
const CACHE_NAME = 'nd-cork7-static-v2';
const SHELL_PATHS = [
  'cork7.html',
  'cork7-start.html',
  'cork7-bridge.js',
  'cork7-standalone.js',
  'cork7-neon-friends.js',
  'cork7-neon-friends.css',
  'cork7-assets/_next/static/css/index.DBvX0VVq.css',
  'cork7-assets/_next/static/css/game-client.Dazi9g4y.css',
  'cork7-assets/_next/static/chunks/framework-D_rUT4EX.js',
  'cork7-assets/_next/static/chunks/nd-standalone-vite-preload.js',
  'cork7-assets/_next/static/chunks/game-client-ND-preload-20261022.js',
  'cork7-assets/_next/static/chunks/game-client-ND-standalone.js'
];

function isCork7Path(pathname) {
  return SHELL_PATHS.some((path) => pathname.endsWith('/' + path) || pathname === '/' + path) ||
    pathname.includes('/cork7-assets/');
}

function isStaticAsset(url, request) {
  if (!isCork7Path(url.pathname) &&
      !/\.(?:js|mjs|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp3|ogg|wav|mp4|webm|glb|gltf|bin|ktx2?|hdr|basis|wasm)$/i.test(url.pathname) &&
      !/\/(?:models|textures)\//i.test(url.pathname)) return false;
  for (const key of url.searchParams.keys()) {
    if (/(?:token|auth|session|signature|secret|api.?key|credential)/i.test(key)) return false;
  }
  if (request.mode === 'navigate' && url.origin !== self.location.origin) return false;
  return request.method === 'GET' && !request.headers.has('range');
}

async function cacheResponse(cache, request, response) {
  if (!response || (!response.ok && response.type !== 'opaque') || response.status === 206) return false;
  try {
    await cache.put(request, response.clone());
    return true;
  } catch (_) {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Fetch each known first-party shell dependency explicitly. One missing
    // asset must not prevent the worker from installing; failed paths are
    // exposed to the readiness UI through the cache inventory.
    await Promise.all(SHELL_PATHS.map(async (path) => {
      try {
        const url = new URL(path, self.registration.scope);
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
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const response = await fetch(request);
    await cacheResponse(cache, request, response);
    return response;
  })());
});
