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

self.addEventListener("install", (event) => {
  // Activate immediately on install rather than waiting for the next
  // navigation — safe because the SW does nothing but relay pushes.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function absoluteUrl(path) {
  try {
    return new URL(path || "/", self.location.origin).href;
  } catch {
    return self.location.origin + "/";
  }
}

function sameDestination(clientUrl, targetHref) {
  try {
    const client = new URL(clientUrl);
    const target = new URL(targetHref);
    return client.pathname + client.search === target.pathname + target.search;
  } catch {
    return false;
  }
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Midora", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Midora";
  const body = data.body || "";
  const url = absoluteUrl(data.url || "/");
  const tag = data.tag || undefined;

  const options = {
    body,
    data: { url },
    tag,
    // Only show one bubble per tag (e.g. per-conversation) so a rapid stream
    // of messages doesn't stack up.
    renotify: !!tag,
    requireInteraction: false,
  };

  event.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const focusedOnThread = open.some(
        (client) =>
          client.focused &&
          client.visibilityState === "visible" &&
          sameDestination(client.url, url),
      );
      if (focusedOnThread) return;
      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = absoluteUrl(
    (event.notification.data && event.notification.data.url) || "/",
  );

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if (sameDestination(client.url, targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      for (const client of allClients) {
        if ("focus" in client && "navigate" in client) {
          await client.focus();
          try {
            return await client.navigate(targetUrl);
          } catch {
            break;
          }
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
