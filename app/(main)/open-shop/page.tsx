"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAppSession } from "@/lib/state";

/**
 * Legacy `/open-shop` route — now a redirect into the merchant dashboard's
 * "new shop" flow. Preserves existing deep-links from the marketing site.
 */
export default function LegacyOpenShopRedirect() {
  const router = useRouter();
  const session = useAppSession();

  const stillResolving =
    !session.hydrated || (session.isAuthenticated && session.user === undefined);

  useEffect(() => {
    if (stillResolving) return;
    if (!session.isAuthenticated) {
      router.replace("/login?next=/merchant/new");
      return;
    }
    router.replace("/merchant/new");
  }, [stillResolving, session.isAuthenticated, router]);

  return (
    <div className="dm-card p-8 text-sm text-muted">
      Taking you to the merchant dashboard…
    </div>
  );
}
