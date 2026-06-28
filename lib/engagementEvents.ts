/** Fired after user actions that should refresh the personalized home feed. */
export const FEED_ENGAGEMENT_EVENT = "midora:feed-engagement";

export function notifyFeedEngagement(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEED_ENGAGEMENT_EVENT));
}
