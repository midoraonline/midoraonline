"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAppSession } from "@/lib/state";

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
