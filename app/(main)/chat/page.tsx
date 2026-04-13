"use client";

import { useSearchParams } from "next/navigation";
import ShopChat from "@/components/shopChat";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shop_id");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 sm:space-y-10">
      <section className="dm-card p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-muted">Chat agent</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          In-shop concierge (Gemini)
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Talk directly to the AI assistant for this shop. Ask about products,
          availability, or policies.
        </p>
        {shopId ? (
          <p className="mt-4 text-xs text-muted">
            Chatting with shop ID:{" "}
            <span className="font-mono text-foreground/90">{shopId}</span>.
          </p>
        ) : (
          <p className="mt-4 text-sm text-red-600">
            No shop selected. Open chat from a specific shop page.
          </p>
        )}
      </section>

      {shopId ? <ShopChat shopId={shopId} /> : null}
    </div>
  );
}
