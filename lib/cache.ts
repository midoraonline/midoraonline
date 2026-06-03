export const CACHE_TAGS = {
  SHOPS: "shops",
  PRODUCTS: "products",
  MOST_VIEWED: "most-viewed",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const TTL = {
  HOME_FEED: 900,
  SHOP: 300,
  PRODUCTS: 300,
  MOST_VIEWED: 600,
  DASHBOARD: 120,
} as const;
