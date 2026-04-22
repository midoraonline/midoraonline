import { apiFetch } from "./base";

export type OrderStatus = string;

export type Order = {
  id: string;
  status: OrderStatus;
  created_at?: string;
};

export type Paginated<T> = {
  items: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

// NOTE: Orders are currently mounted at `/api/v1/`.

export function createOrder(body: Record<string, unknown>, token?: string | null) {
  return apiFetch<Order>("/api/v1/", {
    method: "POST",
    token,
    body,
  });
}

export function listOrders(token?: string | null) {
  return apiFetch<Paginated<Order>>("/api/v1/", { token });
}

export function updateOrder(
  orderId: string,
  body: Partial<{ status: OrderStatus }>,
  token?: string | null,
) {
  return apiFetch<Order>(`/api/v1/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    token,
    body,
  });
}
