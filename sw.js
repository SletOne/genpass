/**
 * GenPass — Service Worker
 * Cache les ressources pour un fonctionnement 100 % hors ligne.
 */

const CACHE_NAME = "genpass-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/data.js",
  "/script.js",
  "/tabler-icons.min.css",
  "/manifest.json",
  "/assets/favicon.svg",
  "/assets/logo.svg",
  "/assets/Proton_tagline.svg",
];

// Installation : pré-cache des fichiers essentiels
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch : cache-first, fallback réseau
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          // Ne cache que les requêtes GET réussies du même origin
          if (
            response.ok &&
            event.request.method === "GET" &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
      );
    }),
  );
});
