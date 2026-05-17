// Service Worker — Giovannillo's Pizza
// Handles web push notifications for the admin panel

self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: "Giovannillo's", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || "Giovannillo's", {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: '/entrada.html' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/entrada.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      for (const w of wins) {
        if (w.url.endsWith('/entrada.html') && 'focus' in w) return w.focus();
      }
      return clients.openWindow(url);
    })
  );
});
