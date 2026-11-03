"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppSession } from "@/lib/state";
import { apiChat } from "@/lib/api";
import { ApiError } from "@/lib/api/base";
import { track } from "@/lib/analytics";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import SignInPrompt from "@/components/SignInPrompt";

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
  const [askSignIn, setAskSignIn] = useState(false);

  const doCreateConversation = async () => {
    if (session.hydrated && !session.isAuthenticated) {
      setAskSignIn(true);
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

      if (shopId) {
        track("listing:messaged", { productId, shopId });
      }

      router.push(`/chat?conversation=${conv.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAskSignIn(true);
        return;
      }
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
      {askSignIn ? (
        <SignInPrompt action="message this seller" onClose={() => setAskSignIn(false)} />
      ) : null}
    </div>
  );
}
