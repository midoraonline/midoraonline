import { ApiError } from "./base";
import {
  getProduct,
  listMyProducts,
  productImageUrls,
  type CreateProductRequest,
  type Product,
} from "./products";

export const CLIENT_SAVE_ID_KEY = "client_save_id";

const CONFIRM_DELAYS_MS = [0, 1500, 3500];

export function listingMetaWithSaveId(
  meta: object | null | undefined,
  clientSaveId: string,
): Record<string, unknown> {
  const base =
    meta && typeof meta === "object" ? { ...(meta as Record<string, unknown>) } : {};
  base[CLIENT_SAVE_ID_KEY] = clientSaveId;
  return base;
}

export function isAmbiguousSaveError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 0 || err.code === "timeout" || err.code === "network_error") return true;
  return err.status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? "").trim() === (b ?? "").trim();
}

function metaValueEqual(sent: unknown, got: unknown): boolean {
  if (sent == null && (got == null || got === "")) return true;
  if (typeof sent === "string" || typeof got === "string") {
    return String(sent ?? "").trim() === String(got ?? "").trim();
  }
  return JSON.stringify(sent) === JSON.stringify(got);
}

function imagesMatch(sent: string[], product: Product): boolean {
  const raw = product.image_urls;
  const fromList = Array.isArray(raw)
    ? raw.map((u) => String(u).trim()).filter(Boolean)
    : null;
  if (sent.length === 0) {
    if (fromList) return fromList.length === 0;
    return !product.image_url;
  }
  const got = fromList && fromList.length ? fromList : productImageUrls(product);
  return sent.length === got.length && sent.every((url, i) => url === got[i]);
}

function listingMatchesPatch(product: Product, body: Partial<CreateProductRequest>): boolean {
  if (body.title !== undefined && !sameText(product.title, body.title)) return false;
  if (body.description !== undefined && !sameText(product.description, body.description)) return false;
  if (body.price_ugx !== undefined) {
    const got = Number(product.price_ugx ?? product.price ?? 0);
    if (!Number.isFinite(got) || Math.abs(got - body.price_ugx) > 0.5) return false;
  }
  if (body.is_published !== undefined && Boolean(product.is_published) !== body.is_published) {
    return false;
  }
  if (body.category !== undefined && !sameText(product.category, body.category)) return false;
  if (body.item_type !== undefined && (product.item_type ?? null) !== body.item_type) return false;
  if (body.stock_quantity !== undefined && Number(product.stock_quantity ?? 0) !== body.stock_quantity) {
    return false;
  }
  if (body.is_negotiable !== undefined && (product.is_negotiable !== false) !== body.is_negotiable) {
    return false;
  }
  if (body.is_online !== undefined && Boolean(product.is_online) !== body.is_online) return false;
  if (body.location_name !== undefined && !sameText(product.location_name, body.location_name)) {
    return false;
  }
  if (body.discount_price !== undefined) {
    const got = product.discount_price ?? null;
    if (body.discount_price == null) {
      if (got != null) return false;
    } else if (got == null || Math.abs(Number(got) - body.discount_price) > 0.5) {
      return false;
    }
  }
  if (body.image_urls !== undefined) {
    const sent = (Array.isArray(body.image_urls) ? body.image_urls : [body.image_urls])
      .map((u) => String(u).trim())
      .filter(Boolean);
    if (!imagesMatch(sent, product)) return false;
  }
  if (body.listing_meta) {
    const got = product.listing_meta ?? {};
    for (const [key, value] of Object.entries(body.listing_meta)) {
      if (!metaValueEqual(value, got[key])) return false;
    }
  }
  return true;
}

async function confirmAttempts<T>(load: () => Promise<T | null>): Promise<T | null> {
  for (const delay of CONFIRM_DELAYS_MS) {
    if (delay) await sleep(delay);
    try {
      const found = await load();
      if (found) return found;
    } catch {
      /* The write may still be landing. */
    }
  }
  return null;
}

export function confirmCreatedListing(
  body: CreateProductRequest,
  clientSaveId: string,
): Promise<Product | null> {
  const title = body.title.trim().toLowerCase();
  return confirmAttempts(async () => {
    const res = await listMyProducts({ limit: 40 });
    const items = res.items ?? [];
    const marked = items.find(
      (item) => String(item.listing_meta?.[CLIENT_SAVE_ID_KEY] ?? "") === clientSaveId,
    );
    if (marked) return marked;
    const cutoff = Date.now() - 2 * 60 * 1000;
    const recent = items
      .filter((item) => (item.title || "").trim().toLowerCase() === title)
      .filter((item) => {
        const created = Date.parse(item.created_at || "");
        return Number.isFinite(created) && created >= cutoff;
      })
      .sort((a, b) => Date.parse(b.created_at || "") - Date.parse(a.created_at || ""));
    return recent[0] ?? null;
  });
}

export function confirmUpdatedListing(
  productId: string,
  body: Partial<CreateProductRequest>,
): Promise<Product | null> {
  return confirmAttempts(async () => {
    const product = await getProduct(productId);
    return product && listingMatchesPatch(product, body) ? product : null;
  });
}
