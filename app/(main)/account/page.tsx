"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAppSession } from "@/lib/state";

/**
 * Legacy `/account` route — now a role-aware redirect into the dedicated
 * dashboards. Admins go to /admin, merchants to /merchant, everyone else to
 * /customer. Unauthenticated users get sent to login.
 */
export default function LegacyAccountRedirect() {
  const router = useRouter();
  const session = useAppSession();

  const stillResolving =
    !session.hydrated || (session.isAuthenticated && session.user === undefined);

  useEffect(() => {
    if (stillResolving) return;
    if (!session.isAuthenticated) {
      router.replace("/login?next=/customer");
      return;
    }
    const role = session.user?.user_role;
    if (role === "admin") router.replace("/admin");
    else if (role === "merchant") router.replace("/merchant");
    else router.replace("/customer");
  }, [stillResolving, session.isAuthenticated, session.user, router]);

  return (
    <div className="dm-card p-8 text-sm text-muted">
      Taking you to your dashboard…
    </div>
  );
}
