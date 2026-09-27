import type { Product, ProductStatus } from "@/lib/api/products";
import { fetchCategoryFields } from "@/lib/api/categoryFields";
import { normalizeListingKind } from "@/lib/listingMeta";

const STOCK_KEYS = new Set(["stock", "stock_quantity", "quantity"]);

export function withdrawListingPatch(status: Extract<ProductStatus, "sold" | "hidden">) {
  return {
    status,
    is_published: false,
    stock_quantity: null as number | null,
  };
}

export function reactivateListingPatch(stock: number | null) {
  const body: {
    status: "active";
    is_published: true;
    stock_quantity?: number;
  } = { status: "active", is_published: true };
  if (stock != null) body.stock_quantity = stock;
  return body;
}

export function stockLabel(quantity: number | null | undefined): string {
  if (quantity == null || quantity <= 0) return "none";
  return String(quantity);
}

export function showsStock(product: Pick<Product, "item_type">): boolean {
  return normalizeListingKind(product.item_type) === "product";
}

/** Physical products ask for stock unless the category fields say otherwise. */
export async function categoryNeedsStock(product: Pick<Product, "item_type" | "category">): Promise<boolean> {
  if (!showsStock(product)) return false;
  const slug = product.category?.trim();
  if (!slug) return true;
  try {
    const fields = await fetchCategoryFields(slug);
    if (!fields?.fields?.length) return true;
    const stock = fields.fields.find((field) => STOCK_KEYS.has(field.key));
    if (!stock) return false;
    return stock.required !== false;
  } catch {
    return true;
  }
}
