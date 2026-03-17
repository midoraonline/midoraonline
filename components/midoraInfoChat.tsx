"use client";

import { useState } from "react";
import { apiMidoraInfoChat } from "@/lib/api";

type InfoMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function cleanMessage(raw: string): string {
  // Remove common markdown markers like **bold**, *italic*, and stray bullets.
  return raw
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^-+\s*/gm, "")
    .trim();
}

export default function MidoraInfoChat() {
  const [messages, setMessages] = useState<InfoMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input.trim();
    setInput("");
    setError(null);

    const userMessage: InfoMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await apiMidoraInfoChat.sendMidoraInfoMessage({
        message: content,
      });
      const aiMessage: InfoMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.message,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The Midora info assistant could not reply."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dm-card p-4 sm:p-5 flex flex-col gap-3 max-h-[480px]">
      <div>
        <p className="text-sm font-semibold tracking-tight">
          Ask about Midora Online
        </p>
        <p className="text-xs text-muted max-w-xl">
          General product and platform questions only. This bot is not tied to
          any specific shop.
        </p>
      </div>

      <div className="mt-1 flex-1 min-height-[180px] max-h-[300px] overflow-y-auto rounded-2xl border border-border bg-background px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-muted">
            Ask about what Midora Online is, how it works, or how to get
            started.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user" ? "flex justify-end" : "flex justify-start"
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
                {cleanMessage(m.content)}
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
          placeholder="Ask something about Midora Online…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-9 px-3 rounded-2xl bg-foreground text-background text-xs font-semibold dm-focus disabled:opacity-60"
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}

