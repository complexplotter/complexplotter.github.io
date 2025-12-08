importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.2.0/workbox-sw.js');

const CORE_FILES = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/style.css',
    '/complex.png'
];

const CACHE_VERSION = 'v1'; 
const CACHE_NAME = 'static-assets-' + CACHE_VERSION;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CORE_FILES);
        })
    );
});

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-assets',
  })
);

workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'html-cache',
  })
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image', 
  new workbox.strategies.NetworkFirst({
    cacheName: 'image-cache',
  })
);