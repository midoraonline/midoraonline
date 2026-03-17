"use client";

import { useSearchParams } from "next/navigation";
import ShopChat from "@/components/shopChat";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shop_id");

  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">Chat agent</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          In-shop concierge (Gemini)
        </h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">
          Talk directly to the AI assistant for this shop. Ask about products,
          availability, or policies.
        </p>
        {shopId ? (
          <p className="mt-3 text-xs text-muted">
            Chatting with shop ID:{" "}
            <span className="font-mono text-foreground/90">{shopId}</span>.
          </p>
        ) : (
          <p className="mt-3 text-xs text-red-600">
            No shop selected. Open chat from a specific shop page.
          </p>
        )}
      </section>

      {shopId ? <ShopChat shopId={shopId} /> : null}
    </div>
  );
}

