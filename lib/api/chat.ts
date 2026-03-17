import { apiFetch } from "./base";

export type ChatSession = {
  id: string;
  shop_id?: string | null;
  intent?: string | null;
  created_at?: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

export function createSession(body: { shop_id?: string; intent?: string }, token?: string) {
  return apiFetch<ChatSession>("/api/v1/chat/sessions", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}

export function listSessions(opts?: { shop_id?: string; token?: string }) {
  const params = new URLSearchParams();
  if (opts?.shop_id) params.set("shop_id", opts.shop_id);
  const qs = params.toString();
  return apiFetch<ChatSession[]>(
    `/api/v1/chat/sessions${qs ? `?${qs}` : ""}`,
    opts?.token ? { token: opts.token } : {}
  );
}

export function sendMessage(
  sessionId: string,
  body: { content: string },
  token?: string
) {
  return apiFetch<{ reply?: string; message?: ChatMessage }>(
    `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }
  );
}

export function listMessages(sessionId: string, token?: string) {
  return apiFetch<ChatMessage[]>(
    `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    token ? { token } : {}
  );
}

