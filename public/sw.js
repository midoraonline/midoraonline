/* eslint-disable no-restricted-globals */
/**
 * Midora Web Push service worker.
 *
 * Handles two events:
 *   - `push`             — display a notification with payload from FastAPI
 *   - `notificationclick`— focus (or open) the linked tab
 *
 * Payload shape (sent by notifications/push_service.py):
 *   { "title": string, "body": string, "url": string?, "tag": string? }
 */

const NOTIFICATION_ICON = "/icons/notification-icon.png";
const NOTIFICATION_BADGE = "/icons/notification-badge.png";

self.addEventListener("install", (event) => {
  // Activate immediately on install rather than waiting for the next
  // navigation — safe because the SW does nothing but relay pushes.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Midora", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Midora";
  const body = data.body || "";
  const url = data.url || "/";
  const tag = data.tag || undefined;

  const options = {
    body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    data: { url },
    tag,
    // Only show one bubble per tag (e.g. per-conversation) so a rapid stream
    // of messages doesn't stack up.
    renotify: !!tag,
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Prefer focusing an existing tab already on the target URL.
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.pathname + url.search === targetUrl && "focus" in client) {
            return client.focus();
          }
        } catch {
          // ignore malformed URLs
        }
      }

      // Otherwise, focus any existing tab and navigate it there.
      for (const client of allClients) {
        if ("focus" in client && "navigate" in client) {
          await client.focus();
          return client.navigate(targetUrl);
        }
      }

      // No open tabs — open a new one.
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
