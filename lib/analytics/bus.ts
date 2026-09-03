import { AnalyticsEvents, EventKey, EventListener } from './types';

export class AnalyticsEventEmitter {
  private listeners: {
    [K in EventKey]?: Set<EventListener<K>>;
  } = {};

  on<K extends EventKey>(event: K, listener: EventListener<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as Set<EventListener<any>> as any;
    }

    const eventListeners = this.listeners[event] as Set<EventListener<K>>;
    eventListeners.add(listener);

    return () => {
      const listeners = this.listeners[event] as Set<EventListener<K>> | undefined;
      listeners?.delete(listener);
    };
  }

  async emit<K extends EventKey>(event: K, payload: AnalyticsEvents[K]): Promise<void> {
    const eventListeners = this.listeners[event] as Set<EventListener<K>> | undefined;
    if (!eventListeners) return;

    const promises = Array.from(eventListeners).map((listener) => {
      try {
        return Promise.resolve(listener(payload));
      } catch (error) {
        console.error(`[Analytics Error] Listener for '${event}' failed:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

export const analyticsBus = new AnalyticsEventEmitter();