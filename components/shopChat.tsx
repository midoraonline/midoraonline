"use client";

import { useEffect, useState } from "react";
import { apiChat } from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export default function ShopChat({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName?: string;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("midora_access_token");
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const token = getToken();
        if (!token) {
          setError("Please log in to use the in-shop concierge.");
          setInitializing(false);
          return;
        }

        // If the user navigates to a different shop, make sure UI state resets
        // so messages always match the active concierge session.
        setInitializing(true);
        setError(null);
        setMessages([]);
        setSessionId(null);

        const session = await apiChat.createSession(
          { shop_id: shopId },
          token
        );
        if (cancelled) return;
        setSessionId(session.id);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not start chat session. Please try again later."
        );
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !input.trim()) return;
    const content = input.trim();
    const userId = `local-user-${Date.now()}`;
    const pendingAssistantId = `local-ai-pending-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    setInput("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      {
        id: userId,
        role: "user",
        content,
      },
      {
        id: pendingAssistantId,
        role: "assistant",
        content: "Thinking…",
      },
    ]);
    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Please log in to send messages.");
      }
      const res = await apiChat.sendMessage(
        sessionId,
        { message: content },
        token
      );
      const replyText = res.message ?? "";
      setMessages((prev) => {
        const hasPending = prev.some((m) => m.id === pendingAssistantId);
        if (!hasPending) return prev;
        if (replyText) {
          return prev.map((m) =>
            m.id === pendingAssistantId
              ? {
                  ...m,
                  content: replyText,
                }
              : m
          );
        }
        return prev.filter((m) => m.id !== pendingAssistantId);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The AI assistant could not reply."
      );
      setMessages((prev) =>
        prev.filter((m) => m.id !== pendingAssistantId)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dm-card p-4 sm:p-5 flex flex-col gap-3 max-h-[420px]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold tracking-tight">
            Ask{" "}
            <span className="text-foreground/90">
              {shopName ?? "this shop"}
            </span>
          </p>
          <p className="text-xs text-muted">
            AI concierge powered by Midora Online.
          </p>
        </div>
      </div>

      <div className="mt-1 flex-1 min-h-[160px] max-h-[260px] overflow-y-auto rounded-2xl border border-border bg-background px-3 py-2 space-y-2">
        {initializing ? (
          <p className="text-xs text-muted">Starting chat session…</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted">
            Ask about products, availability, or shop policies.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={
                  "max-w-[80%] rounded-2xl px-3 py-2 text-xs " +
                  (m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/5 text-foreground/90")
                }
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSend} className="mt-1 flex items-center gap-2">
        <input
          className="h-9 flex-1 rounded-2xl border border-border bg-surface px-3 text-xs dm-focus"
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={initializing || loading}
        />
        <button
          type="submit"
          disabled={initializing || loading || !input.trim()}
          className="h-9 px-3 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold dm-focus disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}

