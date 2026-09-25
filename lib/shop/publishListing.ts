import { apiProducts } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import type { CreateProductRequest, Product } from "@/lib/api/products";
import { rehydrateSession } from "@/lib/auth/rehydrateSession";
import { ensureShopForListing } from "@/lib/shop/personalShop";

export class ShopRequiredError extends Error {
  constructor() {
    super("Choose which shop this listing belongs to.");
    this.name = "ShopRequiredError";
  }
}

async function afterPublish(product: Product): Promise<Product> {
  try {
    await rehydrateSession();
  } catch {
    /* The listing saved. Role refresh can retry on the next navigation. */
  }
  return product;
}

function missingDirectRoute(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.status === 405);
}

/**
 * Create a listing. With a chosen shop, use the shop route. Otherwise POST
 * /api/v1/products. A 404/405 means that route is not deployed yet.
 */
export async function publishNewListing(
  body: CreateProductRequest,
  shopId?: string | null,
): Promise<Product> {
  if (shopId) {
    return afterPublish(await apiProducts.createProduct(shopId, body));
  }
  try {
    return afterPublish(await apiProducts.createListing(body));
  } catch (err) {
    if (err instanceof ApiError && err.code === "shop_required") {
      throw new ShopRequiredError();
    }
    if (!missingDirectRoute(err)) throw err;
    const fallbackShopId = await ensureShopForListing();
    return afterPublish(await apiProducts.createProduct(fallbackShopId, body));
  }
}
