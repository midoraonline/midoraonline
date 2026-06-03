"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/state";
import { apiChat, apiListingEvents } from "@/lib/api";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import TradeDisclaimer from "@/components/TradeDisclaimer";

type Props = {
  sellerId: string;
  shopId?: string;
  productId?: string;
  className?: string;
};

export default function MessageSellerButton({ sellerId, shopId, productId, className = "" }: Props) {
  const router = useRouter();
  const session = useAppSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doCreateConversation = async () => {
    if (!session.isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!sellerId) {
      setError("Seller information not available");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const conv = await apiChat.createConversation({
        seller_id: sellerId,
        shop_id: shopId,
        product_id: productId,
      });
      if (!conv || "error" in conv) {
        setError((conv as { error?: string })?.error ?? "Failed to start conversation");
        return;
      }

      if (productId) {
        apiListingEvents.recordListingEvent(productId, "messaged").catch(() => {});
      }

      router.push(`/chat?conversation=${conv.id}`);
    } catch (err) {
      setError("Something went wrong. Try again.");
      console.error("Failed to start conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TradeDisclaimer
        type="message"
        onConfirm={doCreateConversation}
      >
        {(open) => (
          <button
            type="button"
            onClick={open}
            disabled={loading}
            className={`dm-focus inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-[filter] hover:brightness-95 disabled:opacity-50 ${className}`}
          >
            <MaterialSymbol name="chat" className="!text-sm" />
            {loading ? "Starting..." : "Message seller"}
          </button>
        )}
      </TradeDisclaimer>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
