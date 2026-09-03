import { apiAnalytics } from '@/lib/api';
import type { AnalyticsEventPayload } from '@/lib/api/analytics';
import { analyticsBus } from './bus';
import { EVENT_TARGET_MAP, type AnalyticsEvents, type EventKey } from './types';

// Batch outgoing events so a burst of interactions doesn't fan out to
// one POST each. Flush on timer, on size threshold, and on tab hide.
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 25;

const queue: AnalyticsEventPayload[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let installed = false;

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush() {
  if (!queue.length) return;
  const batch = queue.splice(0, MAX_BATCH_SIZE);
  try {
    await apiAnalytics.ingestEvents(batch);
  } catch {
    // Non-blocking: analytics never breaks the app. Drop on failure —
    // do NOT re-queue, or a broken ingest endpoint would grow unboundedly.
  }
}

function toWire<K extends EventKey>(
  event: K,
  payload: AnalyticsEvents[K],
): AnalyticsEventPayload {
  const { targetType, getTargetId } = EVENT_TARGET_MAP[event];
  const { sessionId, actorId, ...rest } = payload as unknown as {
    sessionId: string;
    actorId?: string;
    [k: string]: unknown;
  };
  void actorId;
  return {
    event_type: event,
    session_id: sessionId,
    target_type: targetType,
    target_id: getTargetId(payload),
    properties: rest,
    source: 'web',
    client_ts: new Date().toISOString(),
  };
}

function enqueue<K extends EventKey>(event: K, payload: AnalyticsEvents[K]) {
  queue.push(toWire(event, payload));
  if (queue.length >= MAX_BATCH_SIZE) {
    void flush();
  } else {
    scheduleFlush();
  }
}

function flushOnHidden() {
  if (typeof document === 'undefined') return;
  if (document.visibilityState === 'hidden') void flush();
}

export function registerAnalyticsSubscribers() {
  if (installed) return;
  installed = true;

  const events: EventKey[] = Object.keys(EVENT_TARGET_MAP) as EventKey[];
  for (const key of events) {
    analyticsBus.on(key, (payload) => {
      enqueue(key, payload as AnalyticsEvents[typeof key]);
    });
  }

  if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', flushOnHidden);
    window.addEventListener('pagehide', () => void flush());
  }
}