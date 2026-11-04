"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizontal, Sparkles } from "lucide-react";
import { apiChat } from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTERS = [
  "What do you have available?",
  "What are your prices?",
  "Do you deliver?",
];

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (/503|not configured|unavailable|rate limit/i.test(msg)) {
    return "The assistant is busy right now. Try again in a moment.";
  }
  if (/429|too many/i.test(msg)) return "Too many questions at once. Wait a moment and try again.";
  return "The assistant couldn't reply. Try again.";
}

export default function ShopChat({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName?: string;
}) {
  const sessionIdRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = null;
    setMessages([]);
    setError(null);
  }, [shopId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Guests can chat too; the session is created on the first question only.
  async function ensureSession(): Promise<string> {
    if (sessionIdRef.current) return sessionIdRef.current;
    const created = await apiChat.createSession({ shop_id: shopId });
    sessionIdRef.current = created.id;
    return created.id;
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const stamp = Date.now();
    const pendingId = `ai-${stamp}`;
    setInput("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `me-${stamp}`, role: "user", content },
      { id: pendingId, role: "assistant", content: "" },
    ]);
    setLoading(true);
    try {
      const sessionId = await ensureSession();
      const res = await apiChat.sendMessage(sessionId, { message: content });
      const reply = (res.message ?? "").trim();
      setMessages((prev) =>
        reply
          ? prev.map((m) => (m.id === pendingId ? { ...m, content: reply } : m))
          : prev.filter((m) => m.id !== pendingId),
      );
    } catch (err) {
      setError(friendlyError(err));
      setMessages((prev) => prev.filter((m) => m.id !== pendingId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={listRef}
        className="h-[min(50vh,300px)] space-y-2 overflow-y-auto rounded-2xl border border-border bg-background px-3 py-3"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-accent/10 text-accent">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <p className="max-w-[16rem] text-xs text-muted">
              Ask {shopName ?? "this shop"} about listings, prices, delivery or availability.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/5 text-foreground/90"
                }`}
              >
                {m.content || (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                    Thinking…
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          className="h-10 flex-1 rounded-2xl border border-border bg-surface px-3 text-sm dm-focus"
          placeholder="Ask a question…"
          aria-label={`Ask ${shopName ?? "this shop"}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground dm-focus disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <SendHorizontal className="size-4" aria-hidden />}
        </button>
      </form>
      <p className="text-center text-[10px] text-muted">AI answers can be wrong. Confirm details with the seller.</p>
    </div>
  );
}
