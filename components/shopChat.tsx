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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const session = await apiChat.createSession({ shop_id: shopId }, undefined);
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
    setInput("");
    setError(null);

    const userMessage: Message = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await apiChat.sendMessage(
        sessionId,
        { content },
        undefined // optional token; public chat supported
      );
      if (res.message) {
        const aiMessage: Message = {
          id: res.message.id,
          role: res.message.role,
          content: res.message.content,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else if (res.reply) {
        const aiMessage: Message = {
          id: `local-ai-${Date.now()}`,
          role: "assistant",
          content: res.reply,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The AI assistant could not reply."
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
                    ? "bg-foreground text-background"
                    : "bg-foreground/5 text-foreground/90")
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
          className="h-9 px-3 rounded-2xl bg-foreground text-background text-xs font-semibold dm-focus disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}

