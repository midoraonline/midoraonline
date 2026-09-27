import type { Product, ProductStatus } from "@/lib/api/products";
import { fetchCategoryFields } from "@/lib/api/categoryFields";

const STOCK_KEYS = new Set(["stock", "stock_quantity", "quantity"]);
const NO_STOCK_TYPES = new Set(["service", "job", "opportunity", "property"]);

export type CloseStatus = Extract<ProductStatus, "sold" | "unavailable" | "filled" | "closed" | "hidden">;

export function listingRequiresStock(itemType?: string | null): boolean {
  return !NO_STOCK_TYPES.has((itemType ?? "product").toLowerCase());
}

export function primaryCloseAction(itemType?: string | null): {
  status: Exclude<CloseStatus, "hidden">;
  label: string;
  done: string;
  title: string;
  message: string;
} {
  const kind = (itemType ?? "product").toLowerCase();
  if (kind === "service") {
    return {
      status: "unavailable",
      label: "Mark unavailable",
      done: "Marked unavailable",
      title: "Mark this service unavailable?",
      message: "It leaves the public feed.",
    };
  }
  if (kind === "job" || kind === "opportunity") {
    return {
      status: "filled",
      label: "Mark filled",
      done: "Marked filled",
      title: "Mark this opportunity filled?",
      message: "It leaves the public feed.",
    };
  }
  if (kind === "property") {
    return {
      status: "closed",
      label: "Mark closed",
      done: "Marked closed",
      title: "Mark this listing closed?",
      message: "It leaves the public feed.",
    };
  }
  return {
    status: "sold",
    label: "Mark sold",
    done: "Marked sold",
    title: "Mark this listing sold?",
    message: "It leaves the public feed, and stock is set to 0.",
  };
}

export function isRestockStatus(status: string | null | undefined): boolean {
  return status === "sold" || status === "unavailable" || status === "filled" || status === "closed" || status === "expired";
}

export function withdrawListingPatch(status: CloseStatus) {
  return {
    status,
    is_published: false as const,
    stock_quantity: 0,
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
  return listingRequiresStock(product.item_type);
}

/** Physical products ask for stock unless the category fields say otherwise. */
export async function categoryNeedsStock(product: Pick<Product, "item_type" | "category">): Promise<boolean> {
  if (!listingRequiresStock(product.item_type)) return false;
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
