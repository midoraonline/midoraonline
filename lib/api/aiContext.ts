import { apiFetch } from "./base";

export type AiContextEntry = {
  id: string;
  shop_id: string;
  key?: string | null;
  value?: string | null;
  created_at?: string;
};

export function listAiContext(token: string, shopId: string) {
  return apiFetch<AiContextEntry[]>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/ai-context`,
    { token }
  );
}

export function createAiContext(
  token: string,
  shopId: string,
  body: { key?: string; value: string }
) {
  return apiFetch<AiContextEntry>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/ai-context`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }
  );
}

