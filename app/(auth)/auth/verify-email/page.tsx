"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { notifyAuthChanged } from "@/lib/auth/token-storage";

type VerifyStatus = "processing" | "success" | "error";

export default function VerifyEmailCallbackPage() {
  const router = useRouter();
  const processedRef = useRef(false);
  const [status, setStatus] = useState<VerifyStatus>("processing");
  const [message, setMessage] = useState("Finalizing email verification...");

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const fragment = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hash = new URLSearchParams(fragment);

    const verified = hash.get("verified");
    const error = hash.get("error");

    if (error || verified === "false") {
      setStatus("error");
      setMessage(error || "Email verification failed.");
      return;
    }

    if (verified !== "true") {
      setStatus("error");
      setMessage("Missing verification status. Please use the verification link again.");
      return;
    }

    // Auth cookies were set by the backend on the verify redirect.
    window.history.replaceState(null, "", window.location.pathname);
    notifyAuthChanged();
    setStatus("success");
    setMessage("Email verified successfully. Redirecting...");
    setTimeout(() => {
      router.replace("/");
    }, 1200);
  }, [router]);

  return (
    <div className="dm-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Verify your email</h1>
      <p className="mt-2 text-sm text-muted">{message}</p>

      {status === "processing" ? (
        <p className="mt-4 text-sm text-muted">Please wait a moment...</p>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
            {message}
          </p>
          <p className="text-xs text-muted">
            <Link href="/login" className="font-semibold text-foreground/80 hover:text-foreground">
              Return to sign in
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
