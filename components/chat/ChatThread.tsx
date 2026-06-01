"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import type { Conversation, NativeMessage } from "@/lib/api/chat";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  conversation: Conversation;
  onBack?: () => void;
};

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

export default function ChatThread({ conversation, onBack }: Props) {
  const session = useAppSession();
  const [messages, setMessages] = useState<NativeMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isBuyer = session.user?.id === conversation.buyer_id;
  const otherUser = isBuyer ? conversation.seller : conversation.buyer;

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
    fetchMessages();
    // Mark as read
    apiChat.markConversationRead(conversation.id).catch(() => {});
  }, [fetchMessages, conversation.id]);

  // Poll for new messages every 3s
  useEffect(() => {
    const id = setInterval(fetchMessages, 3000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const msg = await apiChat.sendNativeMessage(conversation.id, text);
      if ("id" in msg) {
        setMessages((prev) => [...prev, msg]);
      }
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted">
        Loading messages...
      </div>
    );
  }

  // Group messages by date
  const grouped: { date: string; msgs: NativeMessage[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    if (d !== currentDate) {
      currentDate = d;
      grouped.push({ date: d, msgs: [msg] });
    } else {
      grouped[grouped.length - 1].msgs.push(msg);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-foreground/[0.06] px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="dm-focus -ml-1 rounded-lg p-1 hover:bg-foreground/[0.06]">
            <MaterialSymbol name="arrow_back" className="!text-lg" />
          </button>
        )}
        <div className="size-9 rounded-full bg-foreground/[0.06] flex items-center justify-center text-sm font-bold text-muted shrink-0">
          {(otherUser?.full_name?.charAt(0) || "?").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{otherUser?.full_name || "Unknown"}</p>
          <p className="text-[11px] text-muted">
            {conversation.product_id ? "Product inquiry" : "General chat"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {grouped.map((group) => (
          <div key={group.date}>
            <div className="flex justify-center mb-3">
              <span className="rounded-full bg-foreground/[0.05] px-3 py-1 text-[10px] font-medium text-muted">
                {group.date}
              </span>
            </div>
            {group.msgs.map((msg) => {
              const mine = msg.sender_id === session.user?.id;
              return (
                <div key={msg.id} className={`flex mb-3 ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      mine
                        ? "bg-accent text-white rounded-br-md"
                        : "bg-foreground/[0.06] text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-muted"}`}>
                      {formatTime(msg.created_at)}
                      {mine && (msg.read_at ? " · Read" : " · Sent")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-foreground/[0.06] px-4 py-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Type a message..."
          rows={1}
          maxLength={2000}
          className="min-h-[40px] flex-1 resize-none rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-sm outline-none ring-1 ring-foreground/[0.08] transition-[ring] placeholder:text-muted focus:ring-accent/40 dm-focus"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white transition-[filter] hover:brightness-95 disabled:opacity-40 dm-focus"
        >
          <MaterialSymbol name="send" className="!text-lg" />
        </button>
      </form>
    </div>
  );
}
