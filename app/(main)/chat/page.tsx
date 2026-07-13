"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatList from "@/components/chat/ChatList";
import ChatThread from "@/components/chat/ChatThread";
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
      // ignore
    }
  }, []);

  useEffect(() => {
    if (convId) {
      fetchConversation(convId);
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

  if (!session.isAuthenticated) {
    return (
      <div className="mx-auto max-w-md text-center py-20">
        <MaterialSymbol name="chat" className="!text-5xl mb-4 mx-auto opacity-30" />
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="mt-2 text-sm text-muted">Sign in to message sellers</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="dm-btn-accent dm-focus mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-foreground/[0.06] bg-background sm:h-[calc(100vh-8rem)]">
      <div className="flex h-full flex-col sm:flex-row">
        <div className={`w-full border-r border-foreground/[0.06] sm:w-80 sm:block ${showList ? "block" : "hidden sm:block"}`}>
          <div className="border-b border-foreground/[0.06] px-4 py-3">
            <h2 className="text-sm font-semibold">Messages</h2>
          </div>
          <div className="overflow-y-auto" style={{ height: "calc(100% - 49px)" }}>
            <ChatList activeId={convId ?? undefined} onSelect={handleSelect} />
          </div>
        </div>

        <div className={`flex-1 ${showList ? "hidden sm:flex" : "flex"} flex-col`}>
          {activeConv ? (
            <ChatThread conversation={activeConv} onBack={handleBack} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-sm text-muted">
              <MaterialSymbol name="chat" className="!text-4xl mb-3 opacity-30" />
              <p>Select a conversation</p>
              <p className="text-xs mt-1">Message sellers from product pages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}
