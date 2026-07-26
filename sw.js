// ---- Firebase Cloud Messaging (achtergrondmeldingen) ----
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");
try {
  firebase.initializeApp({
    apiKey: "AIzaSyBiYoUzcPabkq-3CS7-aopWot-0RcuSdF0",
    projectId: "mo9-rood",
    messagingSenderId: "205548091567",
    appId: "1:205548091567:web:6a7d4de55d90187e05bc5a"
  });
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(payload => {
    const d = payload.data || {};
    const title = d.title || "MO9 Rood";
    self.registration.showNotification(title, {
      body: d.body || "",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: d.tag || "mo9",
      data: { url: d.url || "./aanwezigheid.html" }
    });
  });
} catch (e) { /* messaging niet beschikbaar */ }

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || "./aanwezigheid.html";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
      for (const c of cs) { if (c.url.includes("aanwezigheid.html") && "focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

// ---- PWA-cache (offline schil) ----
const CACHE = "mo9-rood-v3";
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
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
      }
      return res;
    }).catch(() => caches.match(req).then(r => {
      if (r) return r;
      if (req.mode === "navigate") return caches.match("./aanwezigheid.html");
      return Response.error();
    }))
  );
});
