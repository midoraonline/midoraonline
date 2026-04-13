"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CallbackStatus = "processing" | "success" | "error";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const processedRef = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [message, setMessage] = useState("Completing Google sign-in...");

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const fragment = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hash = new URLSearchParams(fragment);

    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const error = hash.get("error");

    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }

    if (!accessToken || !refreshToken) {
      setStatus("error");
      setMessage("Missing authentication tokens. Please try Google sign-in again.");
      return;
    }

    window.localStorage.setItem("midora_access_token", accessToken);
    window.localStorage.setItem("midora_refresh_token", refreshToken);
    window.dispatchEvent(new Event("midora-auth-changed"));

    // Remove sensitive token fragment from browser URL.
    window.history.replaceState(null, "", window.location.pathname);
    setStatus("success");
    setMessage("Sign-in successful. Redirecting to your dashboard...");
    router.replace("/");
  }, [router]);

  return (
    <div className="dm-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Google authentication</h1>
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
