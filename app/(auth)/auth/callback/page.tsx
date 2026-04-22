"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { notifyAuthChanged } from "@/lib/auth/token-storage";

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
    const error = hash.get("error");
    const provider = hash.get("provider");

    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }

    // Auth cookies were set by the API callback redirect. Strip the hash and
    // rehydrate the session from `/auth/me`.
    window.history.replaceState(null, "", window.location.pathname);
    if (provider) notifyAuthChanged();
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
