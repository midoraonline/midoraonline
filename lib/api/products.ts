import { apiFetch } from "./base";

export type Product = {
  id: string;
  shop_id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  image_url?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

export type CreateProductRequest = {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  tags?: string[];
  image_url?: string;
};

export function createProduct(token: string, shopId: string, body: CreateProductRequest) {
  return apiFetch<Product>(`/api/v1/shops/${encodeURIComponent(shopId)}/products`, {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function listShopProducts(shopId: string, opts?: { category?: string; search?: string; token?: string }) {
  const params = new URLSearchParams();
  if (opts?.category) params.set("category", opts.category);
  if (opts?.search) params.set("search", opts.search);
  const qs = params.toString();
  return apiFetch<Paginated<Product>>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/products${qs ? `?${qs}` : ""}`,
    opts?.token ? { token: opts.token } : {}
  );
}

// NOTE: The backend docs currently show these routes mounted at `/api/v1/{product_id}`.
export function getProduct(productId: string) {
  return apiFetch<Product>(`/api/v1/${encodeURIComponent(productId)}`);
}

export function updateProduct(token: string, productId: string, body: Partial<CreateProductRequest>) {
  return apiFetch<Product>(`/api/v1/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

export function deleteProduct(token: string, productId: string) {
  return apiFetch<{ deleted?: boolean }>(`/api/v1/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    token,
  });
}

export function generateFromImage(token: string, body: { image_url: string }) {
  return apiFetch<Record<string, unknown>>("/api/v1/generate-from-image", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

