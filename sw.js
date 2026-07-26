const CACHE = "mo9-rood-v2";
const SHELL = ["./aanwezigheid.html", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // Firebase/Google altijd live
  e.respondWith(
    fetch(req).then(res => {
      // Alleen geldige (200) antwoorden bewaren — nooit een 404 of fout onthouden.
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
      }
      return res;
    }).catch(() => caches.match(req).then(r => {
      if (r) return r;
      // Alleen bij paginanavigatie terugvallen op de app; anders de fout laten zien.
      if (req.mode === "navigate") return caches.match("./aanwezigheid.html");
      return Response.error();
    }))
  );
});
