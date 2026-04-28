/* Service Worker — Network-First mit Hard-Refresh fuer kritische Dateien */
const CACHE = "meister-lernen-v10";

// Diese Dateien NIE aus Cache liefern, wenn Netz verfuegbar ist.
// (Sie aendern sich beim Deploy und muessen frisch sein.)
const ALWAYS_FRESH = ["index.html", "questions.json", "service-worker.js"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const isCritical = ALWAYS_FRESH.some(p => url.pathname.endsWith("/" + p) || url.pathname.endsWith(p));
  // HTML-Navigationen sind ebenfalls kritisch
  const isNavigation = e.request.mode === "navigate" ||
    (e.request.headers.get("accept") || "").includes("text/html");

  if (isCritical || isNavigation) {
    // Network-only mit Cache-Fallback nur bei Offline
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Sonstige Assets: stale-while-revalidate
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
