"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiAuth } from "@/lib/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error"
  );
  const [message, setMessage] = useState<string | null>(
    token ? null : "Missing verification token."
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
        if (res.access_token) {
          window.localStorage.setItem("midora_access_token", res.access_token);
        }
        if (res.refresh_token) {
          window.localStorage.setItem("midora_refresh_token", res.refresh_token);
        }
        window.dispatchEvent(new Event("midora-auth-changed"));
        setStatus("success");
        setMessage(res.message || "Email verified successfully.");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "We could not verify your email. The link may have expired."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  return (
    <div className="dm-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">
        Verifying your email…
      </h1>
      <p className="mt-2 text-sm text-muted">
        Midora Online is confirming your email address. You can close this tab after it
        completes.
      </p>

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
              "We could not verify your email. Try requesting a new link from the app."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

