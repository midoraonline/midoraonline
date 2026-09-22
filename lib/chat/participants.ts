export type UnreadSides = {
  buyer_id: string;
  seller_id: string;
  buyer_unread?: number | null;
  seller_unread?: number | null;
};

/** JWT `sub` and Postgres uuids can differ by case. */
export function sameUserId(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Unread count for the signed-in participant. 0 when the viewer isn't loaded yet. */
export function unreadForViewer(conv: UnreadSides, viewerId?: string | null): number {
  if (sameUserId(viewerId, conv.buyer_id)) return Number(conv.buyer_unread ?? 0);
  if (sameUserId(viewerId, conv.seller_id)) return Number(conv.seller_unread ?? 0);
  return 0;
}
