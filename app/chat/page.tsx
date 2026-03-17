"use client";

import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shop_id");

  return (
    <div className="space-y-6">
      <section className="dm-card p-6 sm:p-8">
        <p className="text-sm font-semibold text-muted">Chat agent</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          In-shop concierge (Gemini) coming soon
        </h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">
          This page will host the Midora Online AI concierge for each shop. It
          will answer questions using that shop&apos;s products, policies, and context.
        </p>
        {shopId ? (
          <p className="mt-3 text-xs text-muted">
            You opened chat for shop ID:{" "}
            <span className="font-mono text-foreground/90">{shopId}</span>.
          </p>
        ) : null}
      </section>
    </div>
  );
}

