"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatList from "@/components/chat/ChatList";
import ChatThread from "@/components/chat/ChatThread";
import EnablePushBanner from "@/components/chat/EnablePushBanner";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import type { Conversation } from "@/lib/api/chat";
import { MaterialSymbol } from "@/components/MaterialSymbol";

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convId = searchParams.get("conversation");
  const session = useAppSession();
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [showList, setShowList] = useState(true);

  const fetchConversation = useCallback(async (id: string) => {
    try {
      const list = await apiChat.listConversations();
      const found = list.find((c) => c.id === id);
      if (found) setActiveConv(found);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (convId) {
      void fetchConversation(convId);
      setShowList(false);
    } else {
      setActiveConv(null);
      setShowList(true);
    }
  }, [convId, fetchConversation]);

  const handleSelect = (id: string) => {
    router.push(`/chat?conversation=${id}`, { scroll: false });
  };

  const handleBack = () => {
    router.push("/chat", { scroll: false });
    setActiveConv(null);
    setShowList(true);
  };

  if (!session.hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">
        Loading…
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

      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1">
        {/* Conversation list */}
        <aside
          className={`flex min-h-0 w-full flex-col border-border sm:w-[20rem] sm:shrink-0 sm:border-r lg:w-[22rem] ${
            showList ? "flex" : "hidden sm:flex"
          }`}
        >
          <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
            <h1 className="text-sm font-semibold tracking-tight">Messages</h1>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
            <ChatList activeId={convId ?? undefined} onSelect={handleSelect} />
          </div>
        </aside>

        {/* Thread */}
        <section
          className={`min-h-0 min-w-0 flex-1 flex-col ${
            showList ? "hidden sm:flex" : "flex"
          }`}
        >
          {activeConv ? (
            <ChatThread conversation={activeConv} onBack={handleBack} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-sm text-muted">
              <MaterialSymbol name="chat" className="mb-3 !text-4xl opacity-30" />
              <p className="font-medium text-foreground/80">Select a conversation</p>
              <p className="mt-1 max-w-xs text-xs">
                Message sellers from a product or shop page to start chatting.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted">
          Loading messages…
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
