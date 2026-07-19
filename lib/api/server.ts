import "server-only";

import { ApiError } from "@/lib/api/base";
import { apiProducts, apiShops } from "@/lib/api";
import type { Product, LikedProductsResponse } from "@/lib/api/products";
import type {
  Shop,
  Paginated,
  MerchantStats,
  EngagementShop,
  ShopEngagement,
  Verification,
} from "@/lib/api/shops";
import type {
  AdminShop,
  AdminSubscription,
  AdminVerification,
  AdminStatsOverview,
  AdminReport,
  AdminComment,
  AdminFeedback,
  AdminConversation,
  AdminListingProduct,
  VerificationStatus,
} from "@/lib/api/admin";
import type { Conversation } from "@/lib/api/chat";
import type { Lead } from "@/lib/api/leads";
import { safeServerFetch, serverApiFetch } from "@/lib/api/serverFetch";

/**
 * Server-side data access layer.
 *
 * All helpers here are server-only. They:
 *   • forward the caller's `midora_access` cookie as a Bearer header to FastAPI
 *     (auth-gated endpoints), or hit the public endpoint anonymously,
 *   • return `null` on 401 / 403 / 404 / 5xx so Server Components can render a
 *     graceful empty state without throwing,
 *   • are organised by consumer: `publicApi`, `merchantApi`, `customerApi`,
 *     `adminApi`, `chatApi`.
 *
 * Legacy top-level helpers (getShopBySlug, listPublicShops, etc.) are kept for
 * existing SSR pages that already imported them.
 */

// ---------------------------------------------------------------------------
// Legacy helpers (kept for backward compatibility with existing SSR pages).
// ---------------------------------------------------------------------------

async function nullIfNotFound<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

async function nullIfUnavailable<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status >= 500)) return null;
    throw e;
  }
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  return nullIfNotFound(apiShops.bySlug(slug));
}

export async function getShopBySlugForMetadata(slug: string): Promise<Shop | null> {
  return nullIfUnavailable(apiShops.bySlug(slug));
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  return nullIfNotFound(apiShops.getShop(shopId));
}

export async function listPublicShops(opts?: {
  search?: string;
  shop_type?: string;
}): Promise<Shop[]> {
  return apiShops.listAllPublic(opts);
}

// The listing endpoint omits contact fields (whatsapp_number, shop_email).
// This fetches each shop's full record in parallel to hydrate those fields.
export async function listPublicShopsWithContacts(opts?: {
  search?: string;
  shop_type?: string;
}): Promise<Shop[]> {
  const partial = await listPublicShops(opts);
  const full = await Promise.all(
    partial.map((s) => nullIfNotFound(apiShops.getShop(s.id))),
  );
  return full.map((f, i) => (f ? { ...partial[i], ...f } : partial[i]));
}

export async function getProductById(productId: string): Promise<Product | null> {
  return nullIfNotFound(apiProducts.getProduct(productId));
}

export async function listShopProducts(shopId: string): Promise<Product[]> {
  const res = await apiProducts.listShopProducts(shopId);
  return res.items ?? [];
}

// ---------------------------------------------------------------------------
// Public API (anonymous / anyone).
// ---------------------------------------------------------------------------

export const publicApi = {
  shopBySlug: (slug: string) => nullIfNotFound(apiShops.bySlug(slug)),
  shopBySlugSoft: (slug: string) => nullIfUnavailable(apiShops.bySlug(slug)),
  shopById: (shopId: string) => nullIfNotFound(apiShops.getShop(shopId)),
  listShops: (opts?: { search?: string; shop_type?: string }) =>
    apiShops.listAllPublic(opts),
  productById: (productId: string) => nullIfNotFound(apiProducts.getProduct(productId)),
  shopProducts: async (shopId: string): Promise<Product[]> => {
    const res = await safeServerFetch(apiProducts.listShopProducts(shopId));
    return res?.items ?? [];
  },
};

// ---------------------------------------------------------------------------
// Merchant API (needs auth cookie).
// ---------------------------------------------------------------------------

export const merchantApi = {
  myShops: () =>
    safeServerFetch(serverApiFetch<Paginated<Shop>>("/api/v1/shops/me")),

  myStats: () => safeServerFetch(serverApiFetch<MerchantStats>("/api/v1/shops/me/stats")),

  shopById: (shopId: string) =>
    safeServerFetch(
      serverApiFetch<Shop>(`/api/v1/shops/${encodeURIComponent(shopId)}`),
    ),

  shopEngagement: (shopId: string) =>
    safeServerFetch(
      serverApiFetch<ShopEngagement>(
        `/api/v1/shops/${encodeURIComponent(shopId)}/engagement`,
      ),
    ),

  shopProducts: async (
    shopId: string,
    opts?: { includeUnpublished?: boolean },
  ): Promise<Product[]> => {
    const qs = opts?.includeUnpublished ? "?include_unpublished=true" : "";
    const res = await safeServerFetch(
      serverApiFetch<{ items: Product[] }>(
        `/api/v1/products/shop/${encodeURIComponent(shopId)}${qs}`,
      ),
    );
    return res?.items ?? [];
  },

  shopLeads: (
    shopId: string,
    opts?: { page?: number; limit?: number; status?: string },
  ) => {
    const params = new URLSearchParams();
    if (opts?.page) params.set("page", String(opts.page));
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.status) params.set("status", opts.status);
    const qs = params.toString();
    return safeServerFetch(
      serverApiFetch<{
        items: Lead[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      }>(`/api/v1/shops/${encodeURIComponent(shopId)}/leads${qs ? `?${qs}` : ""}`),
    );
  },

  shopLeadStats: (shopId: string) =>
    safeServerFetch(
      serverApiFetch<{ total_leads: number; today_leads: number; new_leads: number }>(
        `/api/v1/shops/${encodeURIComponent(shopId)}/leads/stats`,
      ),
    ),

  shopVerification: (shopId: string) =>
    safeServerFetch(
      serverApiFetch<Verification>(
        `/api/v1/shops/${encodeURIComponent(shopId)}/verification`,
      ),
    ),
};

// ---------------------------------------------------------------------------
// Customer API (needs auth cookie).
// ---------------------------------------------------------------------------

export const customerApi = {
  followedShops: () =>
    safeServerFetch(
      serverApiFetch<{ items: EngagementShop[]; total: number }>(
        "/api/v1/shops/me/followed",
      ),
    ),

  likedShops: () =>
    safeServerFetch(
      serverApiFetch<{ items: EngagementShop[]; total: number }>(
        "/api/v1/shops/me/liked",
      ),
    ),

  likedProducts: (opts?: { limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.page) params.set("page", String(opts.page));
    const qs = params.toString();
    return safeServerFetch(
      serverApiFetch<LikedProductsResponse>(
        `/api/v1/products/me/liked${qs ? `?${qs}` : ""}`,
      ),
    );
  },
};

// ---------------------------------------------------------------------------
// Admin API (auth cookie; role check happens server-side in FastAPI).
// ---------------------------------------------------------------------------

export const adminApi = {
  statsOverview: () =>
    safeServerFetch(serverApiFetch<AdminStatsOverview>("/api/v1/admin/stats/overview")),

  listShops: () =>
    safeServerFetch(serverApiFetch<Paginated<AdminShop>>("/api/v1/admin/shops/")),

  listSubscriptions: () =>
    safeServerFetch(
      serverApiFetch<Paginated<AdminSubscription>>("/api/v1/admin/subscriptions/"),
    ),

  listVerifications: (opts?: {
    status?: VerificationStatus | "all";
    limit?: number;
    includeUnverified?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (opts?.status) params.set("status", opts.status);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.includeUnverified) params.set("include_unverified", "true");
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return safeServerFetch(
      serverApiFetch<{ items: AdminVerification[] }>(
        `/api/v1/admin/shops/verifications${suffix}`,
      ),
    );
  },

  listReports: (opts?: { resolved?: boolean; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (opts?.resolved !== undefined) params.set("resolved", String(opts.resolved));
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.page) params.set("page", String(opts.page));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return safeServerFetch(
      serverApiFetch<{ items: AdminReport[]; total: number }>(
        `/api/v1/admin/reports${suffix}`,
      ),
    );
  },

  listComments: (opts?: { flagged?: boolean; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.flagged !== undefined) params.set("flagged", String(opts.flagged));
    if (opts?.limit) params.set("limit", String(opts.limit));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return safeServerFetch(
      serverApiFetch<{ product_comments: AdminComment[]; shop_comments: AdminComment[] }>(
        `/api/v1/admin/comments${suffix}`,
      ),
    );
  },

  listFeedback: (limit = 100) =>
    safeServerFetch(
      serverApiFetch<{ items: AdminFeedback[] }>(
        `/api/v1/admin/feedback?limit=${limit}`,
      ),
    ),

  listListings: (opts?: { status?: string; limit?: number; page?: number }) => {
    const params = new URLSearchParams();
    if (opts?.status) params.set("status", opts.status);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.page) params.set("page", String(opts.page));
    return safeServerFetch(
      serverApiFetch<{
        items: AdminListingProduct[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      }>(`/api/v1/admin/listings?${params.toString()}`),
    );
  },

  listConversations: (limit = 100) =>
    safeServerFetch(
      serverApiFetch<{ items: AdminConversation[]; total: number }>(
        `/api/v1/admin/chat/conversations?limit=${limit}`,
      ),
    ),

  messageCount: () =>
    safeServerFetch(
      serverApiFetch<{ count: number }>("/api/v1/admin/chat/messages/count"),
    ),
};

// ---------------------------------------------------------------------------
// Native chat API (auth cookie).
// ---------------------------------------------------------------------------

export const chatApi = {
  listConversations: () =>
    safeServerFetch(serverApiFetch<Conversation[]>("/api/v1/chat/conversations")),

  unreadCount: () =>
    safeServerFetch(
      serverApiFetch<{ unread_count: number }>("/api/v1/chat/unread"),
    ),
};
