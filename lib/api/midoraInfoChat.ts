import { apiFetch } from "./base";

export type MidoraInfoChatResponse = {
  message: string;
};

export function sendMidoraInfoMessage(body: { message: string }) {
  return apiFetch<MidoraInfoChatResponse>("/api/v1/chat/midora", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
