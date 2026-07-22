self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Mode offline hors périmètre MVP (docs/02-prd.md §5) : ce service worker ne
// fait volontairement aucun cache applicatif, uniquement la réception des
// notifications Web Push.
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
