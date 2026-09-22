import { apiChat } from "@/lib/api";

export const CHAT_READ_EVENT = "midora:chat-read";

/** PUT mark-read (keepalive) and tell badges to refetch from the server. */
export function persistConversationRead(conversationId: string): Promise<boolean> {
  return apiChat
    .markConversationRead(conversationId)
    .then(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(CHAT_READ_EVENT, { detail: { conversationId } }),
        );
      }
      return true;
    })
    .catch(() => false);
}
