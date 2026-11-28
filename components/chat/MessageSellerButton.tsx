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
  buttonClassName?: string;
  compact?: boolean;
  /** Button text; defaults to "Message seller". */
  label?: string;
  icon?: React.ReactNode;
};

export default function MessageSellerButton({
  sellerId,
  shopId,
  productId,
  className = "",
  buttonClassName = "dm-btn dm-btn-primary dm-btn-sm w-full",
  compact = false,
  label = "Message seller",
  icon,
}: Props) {
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
      toast.error("We couldn't find this seller. Refresh the page and try again.");
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
        toast.error((conv as { error?: string })?.error ?? "We couldn't start the chat. Try again.");
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
      toast.error("We couldn't start the chat. Check your connection and try again.");
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
        className={buttonClassName}
      >
        {icon ?? <MaterialSymbol name="chat" className="!text-sm shrink-0" aria-hidden="true" />}
        <span className={compact ? "sr-only" : ""}>
          {loading ? "Starting…" : label}
        </span>
      </button>
      {askSignIn ? (
        <SignInPrompt action="message this seller" onClose={() => setAskSignIn(false)} />
      ) : null}
    </div>
  );
}
