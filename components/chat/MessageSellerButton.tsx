"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSession } from "@/lib/state";
import { apiChat, apiListingEvents } from "@/lib/api";
import { notifyFeedEngagement } from "@/lib/engagementEvents";
import { MaterialSymbol } from "@/components/MaterialSymbol";

type Props = {
  sellerId: string;
  shopId?: string;
  productId?: string;
  className?: string;
  compact?: boolean;
};

export default function MessageSellerButton({ sellerId, shopId, productId, className = "", compact = false }: Props) {
  const router = useRouter();
  const session = useAppSession();
  const [loading, setLoading] = useState(false);

  const doCreateConversation = async () => {
    if (!session.isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!sellerId) {
      toast.error("Seller information not available");
      return;
    }
    setLoading(true);
    try {
      const conv = await apiChat.createConversation({
        seller_id: sellerId,
        shop_id: shopId,
        product_id: productId,
      });
      if (!conv || "error" in conv) {
        toast.error((conv as { error?: string })?.error ?? "Failed to start conversation");
        return;
      }

      if (productId) {
        apiListingEvents.recordListingEvent(productId, "messaged").catch(() => {});
        notifyFeedEngagement();
      }

      router.push(`/chat?conversation=${conv.id}`);
    } catch {
      toast.error("Couldn't start the conversation. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={doCreateConversation}
        disabled={loading}
        className="dm-btn dm-btn-primary dm-btn-sm w-full"
      >
        <MaterialSymbol name="chat" className="!text-sm shrink-0" aria-hidden="true" />
        <span className={compact ? "sr-only" : ""}>
          {loading ? "Starting…" : "Message seller"}
        </span>
      </button>
    </div>
  );
}
