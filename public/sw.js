const CACHE_NAME = "carego-v1";

// インストール: 認証不要な静的アセットのみキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/manifest.json",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
      ]);
    }),
  );
  self.skipWaiting();
});

// アクティベート: 古いキャッシュを削除
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

// フェッチ: ネットワーク優先、失敗時にキャッシュ
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // API・認証ルートはキャッシュしない（ネットワークに委譲）
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname === "/login"
  )
    return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.status < 300) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

// プッシュ通知受信
self.addEventListener("push", (event) => {
  let data = { title: "CareGo", body: "チェックインの時間です" };
  try {
    if (event.data) data = event.data.json();
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title || "CareGo", {
      body: data.body || "チェックインの時間です",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/checkin" },
      requireInteraction: false,
    }),
  );
});

// 通知クリック: チェックインページに遷移
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/checkin";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      }),
  );
});
