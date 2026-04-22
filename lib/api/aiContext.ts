import { apiFetch } from "./base";

export type AiContextEntry = {
  id: string;
  shop_id: string;
  context_type?: string | null;
  content?: string | null;
  key?: string | null;
  value?: string | null;
  created_at?: string;
};

export function listAiContext(shopId: string, token?: string | null) {
  return apiFetch<AiContextEntry[]>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/ai-context`,
    { token }
  );
}

/** API expects context_type (e.g. "policy") and content. */
export function createAiContext(
  shopId: string,
  body: { context_type?: string; content: string },
  token?: string | null,
) {
  return apiFetch<AiContextEntry>(
    `/api/v1/shops/${encodeURIComponent(shopId)}/ai-context`,
    {
      method: "POST",
      token,
      body,
    }
  );
}
