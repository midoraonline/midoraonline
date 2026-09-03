/**
 * Public entry point for emitting analytics events from any component.
 *
 * `track('shop:viewed', { shopId })` — call site never touches sessionId,
 * the wire format, or the ingest endpoint. Zero-config for most cases.
 *
 * Actor ID is bound server-side from the auth cookie; the optional
 * `actorId` field on the payload is ignored by ingest and only exists for
 * server-side subscribers that want to react in-process.
 */
import { analyticsBus } from './bus';
import { getAnalyticsSessionId } from './session';
import type { AnalyticsEvents, EventKey } from './types';

type PayloadWithoutSession<K extends EventKey> = Omit<
  AnalyticsEvents[K],
  'sessionId' | 'actorId'
> &
  Partial<Pick<AnalyticsEvents[K], 'actorId'>>;

export function track<K extends EventKey>(
  event: K,
  payload: PayloadWithoutSession<K>,
): void {
  const sessionId = getAnalyticsSessionId();
  const enriched = { ...payload, sessionId } as AnalyticsEvents[K];
  void analyticsBus.emit(event, enriched);
}

export { analyticsBus } from './bus';
export type { AnalyticsEvents, EventKey } from './types';
