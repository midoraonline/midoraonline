"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiAuth } from "@/lib/api";
import { establishClientSession } from "@/lib/auth/establish-session";
import { platformActionMessage } from "@/lib/platformMessages";

const HEADINGS = {
  verifying: "Verifying your email…",
  success: "Email verified",
  error: "We couldn't verify your email",
} as const;

function VerifyEmailPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error"
  );
  const [message, setMessage] = useState<string | null>(
    token ? null : "This verification link is incomplete. Open the link from your email again, or ask for a new one."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    (async () => {
      setStatus("verifying");
      setMessage(null);
      try {
        const res = await apiAuth.verifyEmail(token);
        if (cancelled) return;
        await establishClientSession({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
        });
        setStatus("success");
        setMessage(res.message || "Email verified.");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          platformActionMessage(
            err,
            "We couldn't verify your email. The link may have expired. Ask for a new one and try again."
          )
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  return (
    <div className="dm-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">{HEADINGS[status]}</h1>
      {status === "verifying" ? (
        <p className="mt-2 text-sm text-muted">
          We&apos;re confirming your email address. You can close this tab when it&apos;s done.
        </p>
      ) : null}

      <div className="mt-6 text-sm">
        {status === "verifying" ? (
          <p className="text-muted">Please wait a moment…</p>
        ) : null}
        {status === "success" ? (
          <p className="text-foreground/90">
            {message || "Email verified. Redirecting you to your account…"}
          </p>
        ) : null}
        {status === "error" ? (
          <p className="text-red-600">
            {message ||
              "We couldn't verify your email. Ask for a new link and try again."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageInner />
    </Suspense>
  );
}

