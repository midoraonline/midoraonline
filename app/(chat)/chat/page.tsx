"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatList from "@/components/chat/ChatList";
import ChatThread from "@/components/chat/ChatThread";
import EnablePushBanner from "@/components/chat/EnablePushBanner";
import BottomNav from "@/components/BottomNav";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import type { Conversation } from "@/lib/api/chat";
import { persistConversationRead } from "@/lib/chat/readState";
import { MaterialSymbol } from "@/components/MaterialSymbol";

function ChatShellFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 overflow-hidden">
        <aside className="hidden h-full min-h-0 w-full flex-col overflow-hidden border-border md:flex md:w-[20rem] md:shrink-0 md:border-r lg:w-[22rem]">
          <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
            <h1 className="text-sm font-semibold tracking-tight">Messages</h1>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              Loading…
            </span>
          </div>
        </aside>
        <section className="flex h-full min-h-0 min-w-0 flex-1 items-center justify-center text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="size-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Loading conversation…
          </span>
        </section>
      </div>
    </div>
  );
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlConvId = searchParams.get("conversation");
  const session = useAppSession();
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);
  const [optimisticId, setOptimisticId] = useState<string | null>(null);
  const convId = optimisticId ?? urlConvId;
  const threadOpen = Boolean(convId);
  const shownConv = activeConv && activeConv.id === convId ? activeConv : null;
  const lookupPending = threadOpen && !shownConv && resolvedFor !== convId;

  useEffect(() => {
    if (urlConvId && urlConvId === optimisticId) setOptimisticId(null);
  }, [urlConvId, optimisticId]);

  useEffect(() => {
    if (!convId) {
      setActiveConv(null);
      setResolvedFor(null);
      return;
    }
    if (!session.hydrated || !session.isAuthenticated) return;
    if (activeConv?.id === convId) {
      setResolvedFor(convId);
      void persistConversationRead(convId);
      return;
    }
    let cancelled = false;
    void persistConversationRead(convId);
    void (async () => {
      try {
        const list = await apiChat.listConversations();
        if (cancelled) return;
        setActiveConv(list.find((c) => c.id === convId) ?? null);
      } catch {
        if (!cancelled) setActiveConv(null);
      } finally {
        if (!cancelled) setResolvedFor(convId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [convId, session.hydrated, session.isAuthenticated, activeConv?.id]);

  const handleSelect = (conv: Conversation) => {
    void persistConversationRead(conv.id);
    setOptimisticId(conv.id);
    setActiveConv(conv);
    setResolvedFor(conv.id);
    router.push(`/chat?conversation=${conv.id}`, { scroll: false });
  };

  const handleBack = () => {
    setOptimisticId(null);
    setActiveConv(null);
    setResolvedFor(null);
    router.push("/chat", { scroll: false });
  };

  if (!session.hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="size-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Loading…
        </span>
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <MaterialSymbol name="chat" className="mb-4 !text-5xl opacity-30" />
        <h1 className="font-display text-xl font-semibold tracking-tight">
          Messages
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Sign in to message sellers and keep your conversations in one place.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login?next=/chat")}
          className="dm-btn-accent dm-focus mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <EnablePushBanner />

      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 overflow-hidden">
        <aside
          className={`h-full min-h-0 w-full flex-col overflow-hidden border-border md:w-[20rem] md:shrink-0 md:border-r lg:w-[22rem] ${
            threadOpen ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
            <h1 className="text-sm font-semibold tracking-tight">Messages</h1>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] pt-2 md:pb-2">
            <ChatList activeId={convId ?? undefined} onSelect={handleSelect} />
          </div>
        </aside>

        <section
          className={`h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
            threadOpen ? "flex" : "hidden md:flex"
          }`}
        >
          {shownConv ? (
            <ChatThread conversation={shownConv} onBack={handleBack} />
          ) : lookupPending ? (
            <div className="flex flex-1 flex-col">
              <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3">
                <div className="size-9 animate-pulse rounded-full bg-foreground/10" />
                <div className="h-3 w-28 animate-pulse rounded bg-foreground/10" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-foreground/[0.06]" />
                <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-accent/15" />
                <div className="h-10 w-3/5 animate-pulse rounded-2xl bg-foreground/[0.06]" />
              </div>
            </div>
          ) : threadOpen ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted">
              <p>This conversation is unavailable.</p>
              <button
                type="button"
                onClick={handleBack}
                className="dm-focus rounded-lg px-3 py-2 text-sm font-semibold text-accent"
              >
                Back to messages
              </button>
            </div>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center px-6 text-center text-sm text-muted md:flex">
              <MaterialSymbol name="chat" className="mb-3 !text-4xl opacity-30" />
              <p className="font-medium text-foreground/80">Select a conversation</p>
              <p className="mt-1 max-w-xs text-xs">
                Message sellers from a product or shop page to start chatting.
              </p>
            </div>
          )}
        </section>
      </div>

      {threadOpen ? null : <BottomNav />}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatShellFallback />}>
      <ChatPageInner />
    </Suspense>
  );
}
