"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat, apiProducts } from "@/lib/api";
import type { Conversation, NativeMessage } from "@/lib/api/chat";
import type { Product } from "@/lib/api/products";
import {
  productImageUrls,
  productPriceUgx,
} from "@/lib/api/products";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import {
  useBroadcast,
  usePresence,
  useRealtimeTable,
} from "@/lib/realtime/hooks";

type Props = {
  conversation: Conversation;
  onBack?: () => void;
};

type TypingSignal = { user_id: string; at: number };

type PresenceState = { user_id: string };

const TYPING_TIMEOUT_MS = 4_000;
const TYPING_DEBOUNCE_MS = 800;
const MAX_TEXTAREA_HEIGHT = 140;
const NEAR_BOTTOM_PX = 96;

const BUYER_QUICK_REPLIES = [
  "Is this still available?",
  "What's the best price?",
  "Where are you located?",
  "Can you deliver?",
];

const SELLER_QUICK_REPLIES = [
  "Thanks for reaching out!",
  "Yes, it's still available.",
  "How can I help?",
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function MessageStatus({ msg, mine }: { msg: NativeMessage; mine: boolean }) {
  if (!mine) return null;
  const icon = msg.read_at ? "done_all" : "done";
  const tone = msg.read_at ? "text-white" : "text-white/70";
  return (
    <span className={`ml-1 inline-flex items-center gap-0.5 ${tone}`}>
      <MaterialSymbol name={icon} className="!text-[12px]" />
      <span className="sr-only">{msg.read_at ? "Read" : "Sent"}</span>
    </span>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md bg-foreground/[0.06] px-3.5 py-2.5">
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
          <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
          <span className="size-1.5 rounded-full bg-foreground/40 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function autosize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
}

/** Compact product summary shown at the top of a product-scoped conversation. */
function ProductContextCard({ product }: { product: Product }) {
  const imgs = productImageUrls(product).filter((u) => !u.match(/\.(mp4|webm|mov|m4v)/i));
  const cover = imgs[0];
  const price = productPriceUgx(product);
  return (
    <Link
      href={`/products/${product.id}`}
      className="dm-focus mx-3 mt-2 flex items-center gap-3 rounded-xl border border-border bg-surface-subtle p-2 transition-colors hover:bg-foreground/[0.05]"
    >
      {cover ? (
        <Image
          src={cover}
          alt={product.title}
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <MaterialSymbol name="sell" className="!text-lg" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          About this listing
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold">{product.title}</p>
        {price ? (
          <p className="text-xs font-medium text-accent">
            UGX {price.toLocaleString()}
          </p>
        ) : null}
      </div>
      <MaterialSymbol name="chevron_right" className="!text-lg shrink-0 text-muted" />
    </Link>
  );
}

export default function ChatThread({ conversation, onBack }: Props) {
  const session = useAppSession();
  const [messages, setMessages] = useState<NativeMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [pendingNew, setPendingNew] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingClearRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef(0);
  const nearBottomRef = useRef(true);

  const isBuyer = session.user?.id === conversation.buyer_id;
  const otherUser = isBuyer ? conversation.seller : conversation.buyer;
  const otherUserId = isBuyer ? conversation.seller_id : conversation.buyer_id;

  // -- container-scoped scroll helpers ------------------------------------
  const isNearBottom = useCallback((): boolean => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    // Use direct scrollTop assignment so we never scroll the whole window
    // (window scroll was pushing users into the site footer on open).
    if (behavior === "smooth" && "scrollTo" in el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    nearBottomRef.current = isNearBottom();
    if (nearBottomRef.current) setPendingNew(0);
  }, [isNearBottom]);

  // -- history load -------------------------------------------------------
  const fetchMessages = useCallback(async () => {
    try {
      const msgs = await apiChat.listNativeMessages(conversation.id);
      setMessages(msgs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    setLoading(true);
    setPendingNew(0);
    nearBottomRef.current = true;
    void fetchMessages();
    apiChat.markConversationRead(conversation.id).catch(() => {});
  }, [fetchMessages, conversation.id]);

  // After initial history render, jump to bottom instantly (no smooth scroll,
  // no window-level scroll — this fixes the "page scrolls to footer" bug).
  useEffect(() => {
    if (!loading) scrollToBottom("auto");
  }, [loading, conversation.id, scrollToBottom]);

  // Focus the composer once the conversation opens.
  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, [conversation.id]);

  // -- product context ----------------------------------------------------
  useEffect(() => {
    if (!conversation.product_id) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    apiProducts
      .getProduct(conversation.product_id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      });
    return () => {
      cancelled = true;
    };
  }, [conversation.product_id]);

  // -- realtime messages --------------------------------------------------
  useRealtimeTable(
    {
      table: "messages",
      filter: `conversation_id=eq.${conversation.id}`,
      channel: `chat-thread-${conversation.id}`,
      event: "*",
    },
    (payload) => {
      const event = payload.eventType;
      if (event === "INSERT" || event === "UPDATE") {
        const row = payload.new as unknown as NativeMessage;
        if (!row || !row.id) return;
        setMessages((prev) => {
          const i = prev.findIndex((m) => m.id === row.id);
          if (i >= 0) {
            const next = prev.slice();
            next[i] = { ...prev[i], ...row };
            return next;
          }
          return [...prev, row];
        });
        if (event === "INSERT") {
          const mine = row.sender_id === session.user?.id;
          if (!mine) {
            apiChat.markConversationRead(conversation.id).catch(() => {});
            if (!nearBottomRef.current) setPendingNew((n) => n + 1);
          }
        }
      } else if (event === "DELETE") {
        const removed = payload.old as unknown as { id?: string };
        if (removed?.id) {
          setMessages((prev) => prev.filter((m) => m.id !== removed.id));
        }
      }
    },
  );

  // -- presence -----------------------------------------------------------
  const presenceState = useMemo<PresenceState | null>(
    () => (session.user ? { user_id: session.user.id } : null),
    [session.user],
  );
  const presenceSnapshot = usePresence({
    channel: `chat-presence-${conversation.id}`,
    state: presenceState,
    enabled: !!session.user,
  });
  const otherOnline = useMemo(() => {
    for (const list of Object.values(presenceSnapshot)) {
      for (const s of list) {
        if (s?.user_id && s.user_id === otherUserId) return true;
      }
    }
    return false;
  }, [presenceSnapshot, otherUserId]);

  // -- typing indicator via broadcast ------------------------------------
  const sendTypingBroadcast = useBroadcast<TypingSignal>({
    channel: `chat-typing-${conversation.id}`,
    event: "typing",
    enabled: !!session.user,
    onMessage: (payload) => {
      if (!payload?.user_id || payload.user_id === session.user?.id) return;
      setOtherTyping(true);
      if (typingClearRef.current !== null) {
        window.clearTimeout(typingClearRef.current);
      }
      typingClearRef.current = window.setTimeout(() => {
        setOtherTyping(false);
        typingClearRef.current = null;
      }, TYPING_TIMEOUT_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (typingClearRef.current !== null) {
        window.clearTimeout(typingClearRef.current);
      }
    };
  }, []);

  const emitTyping = useCallback(() => {
    if (!session.user) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_DEBOUNCE_MS) return;
    lastTypingSentRef.current = now;
    sendTypingBroadcast({ user_id: session.user.id, at: now });
  }, [sendTypingBroadcast, session.user]);

  // -- auto-scroll only when user is at the bottom -----------------------
  useEffect(() => {
    if (nearBottomRef.current) {
      scrollToBottom("smooth");
      setPendingNew(0);
    }
  }, [messages, otherTyping, scrollToBottom]);

  // -- send --------------------------------------------------------------
  const doSend = useCallback(
    async (text: string) => {
      const value = text.trim();
      if (!value || sending) return;
      setSending(true);
      try {
        const msg = await apiChat.sendNativeMessage(conversation.id, value);
        if ("id" in msg) {
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
        }
        nearBottomRef.current = true;
        setPendingNew(0);
      } catch {
        // caller re-populates the composer
      } finally {
        setSending(false);
      }
    },
    [conversation.id, sending],
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput("");
    if (textareaRef.current) autosize(textareaRef.current);
    const before = text;
    try {
      await doSend(text);
    } catch {
      setInput(before);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autosize(e.target);
    if (e.target.value.length > 0) emitTyping();
  };

  const grouped = useMemo(() => {
    const out: { date: string; msgs: NativeMessage[] }[] = [];
    let currentDate = "";
    for (const msg of messages) {
      const d = formatDate(msg.created_at);
      if (d !== currentDate) {
        currentDate = d;
        out.push({ date: d, msgs: [msg] });
      } else {
        out[out.length - 1].msgs.push(msg);
      }
    }
    return out;
  }, [messages]);

  const quickReplies = isBuyer ? BUYER_QUICK_REPLIES : SELLER_QUICK_REPLIES;

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-foreground/[0.06] bg-background/95 px-4 py-3 backdrop-blur">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="dm-focus -ml-1 rounded-lg p-1 hover:bg-foreground/[0.06] sm:hidden"
            aria-label="Back to conversations"
          >
            <MaterialSymbol name="arrow_back" className="!text-lg" />
          </button>
        )}
        <div className="relative shrink-0">
          <div className="grid size-9 place-items-center rounded-full bg-foreground/[0.06] text-sm font-bold text-muted">
            {(otherUser?.full_name?.charAt(0) || "?").toUpperCase()}
          </div>
          <span
            aria-label={otherOnline ? "Online" : "Offline"}
            className={[
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background",
              otherOnline ? "bg-emerald-500" : "bg-foreground/25",
            ].join(" ")}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {otherUser?.full_name || "Unknown"}
          </p>
          <p className="text-[11px] text-muted">
            {otherTyping
              ? "typing…"
              : otherOnline
                ? "Online"
                : conversation.product_id
                  ? "Product inquiry"
                  : "General chat"}
          </p>
        </div>
      </div>

      {/* Product context (product-scoped conversations) */}
      {product ? <ProductContextCard product={product} /> : null}

      {/* Body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted">
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-accent/10 text-accent">
              <MaterialSymbol name="waving_hand" className="!text-2xl" />
            </span>
            <div className="max-w-sm">
              <p className="text-sm font-semibold">Say hi to {otherUser?.full_name?.split(" ")[0] || "them"}</p>
              <p className="mt-1 text-xs text-muted">
                Messages are delivered in real time. Keep conversations
                on-platform for safety.
              </p>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void doSend(q)}
                  className="dm-focus rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="mb-3 flex justify-center">
                <span className="rounded-full bg-foreground/[0.05] px-3 py-1 text-[10px] font-medium text-muted">
                  {group.date}
                </span>
              </div>
              {group.msgs.map((msg, i) => {
                const mine = msg.sender_id === session.user?.id;
                const prev = group.msgs[i - 1];
                const startsBlock = !prev || prev.sender_id !== msg.sender_id;
                return (
                  <div
                    key={msg.id}
                    className={[
                      "flex",
                      mine ? "justify-end" : "justify-start",
                      startsBlock ? "mt-3" : "mt-0.5",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                        mine
                          ? "bg-accent text-white"
                          : "bg-foreground/[0.06] text-foreground",
                        mine
                          ? startsBlock
                            ? "rounded-br-md"
                            : "rounded-br-md rounded-tr-md"
                          : startsBlock
                            ? "rounded-bl-md"
                            : "rounded-bl-md rounded-tl-md",
                      ].join(" ")}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <div
                        className={[
                          "mt-1 flex items-center gap-1 text-[10px]",
                          mine ? "justify-end text-white/70" : "text-muted",
                        ].join(" ")}
                      >
                        <span>{formatTime(msg.created_at)}</span>
                        <MessageStatus msg={msg} mine={mine} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {otherTyping ? <TypingBubble /> : null}
        <div ref={bottomAnchorRef} />
      </div>

      {/* "New messages" pill when user has scrolled up */}
      {pendingNew > 0 ? (
        <button
          type="button"
          onClick={() => {
            scrollToBottom("smooth");
            nearBottomRef.current = true;
            setPendingNew(0);
          }}
          className="dm-focus absolute bottom-[72px] left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:brightness-95"
        >
          {pendingNew} new message{pendingNew === 1 ? "" : "s"} ↓
        </button>
      ) : null}

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-foreground/[0.06] bg-background px-3 py-2.5"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend(e);
            }
          }}
          placeholder="Type a message…"
          rows={1}
          maxLength={2000}
          className="dm-focus min-h-[40px] max-h-[140px] flex-1 resize-none rounded-2xl bg-foreground/[0.04] px-3.5 py-2.5 text-sm outline-none ring-1 ring-foreground/[0.08] transition placeholder:text-muted focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="dm-focus grid size-10 shrink-0 place-items-center rounded-full bg-accent text-white transition hover:brightness-95 disabled:opacity-40"
          aria-label="Send message"
        >
          <MaterialSymbol name="send" className="!text-lg" />
        </button>
      </form>
    </div>
  );
}
