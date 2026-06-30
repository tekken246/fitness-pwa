// Per-deploy cache key so stale shells/icons are invalidated on each release.
const BUILD_ID =
  process.env.NEXT_PUBLIC_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev';

const serviceWorkerSource = `
const CACHE_NAME = 'fit-track-shell-${BUILD_ID}';
const SHELL_ASSETS = ['/offline', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only same-origin GET. Never touch API, RSC, or data requests so authenticated,
  // user-specific payloads are never served from a shared cache.
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next/data') ||
    url.searchParams.has('_rsc')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')));
    return;
  }

  // Cache only static, non-sensitive icon assets.
  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
`;

/** Serves the PWA service worker from a TypeScript route handler. */
export function GET(): Response {
  return new Response(serviceWorkerSource, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
