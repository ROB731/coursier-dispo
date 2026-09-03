const CACHE_HORS_LIGNE = "dispo-coursier-hors-ligne-v1";
const URL_HORS_LIGNE = "/offline";

// Mode offline volontairement minimal (docs/02-prd.md §5 le mettait hors
// périmètre) : on ne met en cache QUE l'écran "Pas de connexion", pour
// éviter de servir une version périmée de l'appli. Le reste passe toujours
// par le réseau, sans jamais lire un cache applicatif.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_HORS_LIGNE)
      .then((cache) => cache.add(URL_HORS_LIGNE))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(URL_HORS_LIGNE)));
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "DISPO-COURSIER", {
      body: data.body ?? "",
      icon: "/icon-192.png",
    })
  );
});
