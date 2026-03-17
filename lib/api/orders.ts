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

export function createOrder(token: string, body: Record<string, unknown>) {
  return apiFetch<Order>("/api/v1/", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function listOrders(token: string) {
  return apiFetch<Paginated<Order>>("/api/v1/", { token });
}

export function updateOrder(
  token: string,
  orderId: string,
  body: Partial<{ status: OrderStatus }>
) {
  return apiFetch<Order>(`/api/v1/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(body),
  });
}

