/* eslint-disable no-restricted-globals */
const DEFAULT_ICON = '/file.svg';

console.log('Notifications Service Worker loaded.');
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (_err) {
    payload = { title: 'QMS', body: event.data.text() };
  }

  const title = payload.title || 'QMS';
  console.log('Push notification received:', payload);
  const options = {
    body: payload.body || 'You have a new notification.',
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || payload.icon || DEFAULT_ICON,
    data: payload.data || {},
    tag: payload.tag,
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

console.log('Notifications Service Worker setup complete.');
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
