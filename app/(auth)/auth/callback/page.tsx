"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { establishGoogleCallbackSession } from "@/lib/auth/establish-session";

type CallbackStatus = "processing" | "success" | "error";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [message, setMessage] = useState("Completing Google sign-in...");

  useEffect(() => {
    const fragment = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hash = new URLSearchParams(fragment);
    const error = hash.get("error");
    const provider = hash.get("provider");
    const verified = hash.get("verified");

    let active = true;
    if (error || provider !== "google" || verified !== "true") {
      queueMicrotask(() => {
        if (!active) return;
        setStatus("error");
        setMessage("Google sign-in was cancelled or failed.");
      });
      return () => {
        active = false;
      };
    }

    void establishGoogleCallbackSession()
      .then(() => {
        if (active) {
          setStatus("success");
          setMessage("Sign-in successful. Redirecting to your dashboard...");
        }
        router.replace("/");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Could not establish your session. Please try again.",
        );
      });

    return () => {
      active = false;
    };
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
