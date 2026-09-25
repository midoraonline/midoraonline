"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { apiAuth } from "@/lib/api";
import { establishGoogleCallbackSession } from "@/lib/auth/establish-session";
import { setGoogleCallbackPending } from "@/lib/auth/google-callback-guard";

type CallbackStatus = "processing" | "success" | "error";

const SIGN_IN_ERROR = "We couldn't finish signing you in. Please try again.";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [message, setMessage] = useState("Completing Google sign-in...");
  const [restarting, setRestarting] = useState(false);

  useLayoutEffect(() => {
    setGoogleCallbackPending(true);
  }, []);

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
      setGoogleCallbackPending(false);
      queueMicrotask(() => {
        if (!active) return;
        setStatus("error");
        setMessage(SIGN_IN_ERROR);
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
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setMessage(SIGN_IN_ERROR);
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function tryAgain() {
    setRestarting(true);
    setStatus("processing");
    setMessage("Starting Google sign-in...");
    try {
      const isLocal =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocal) {
        const origin = window.location.origin;
        const query = new URLSearchParams({
          origin,
          redirect_to: `${origin}/login`,
          redirect_uri: `${origin}/login`,
        });
        const res = await fetch(`/api/auth/google-url?${query}`);
        if (!res.ok) throw new Error("unavailable");
        const data = (await res.json()) as { url: string };
        window.location.href = data.url;
        return;
      }
      const data = await apiAuth.getGoogleAuthUrl();
      window.location.href = data.url;
    } catch {
      setRestarting(false);
      setStatus("error");
      setMessage(SIGN_IN_ERROR);
    }
  }

  return (
    <div className="dm-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight">Google sign-in</h1>
      <p className="mt-2 text-sm text-muted">{message}</p>

      {status === "processing" ? (
        <p className="mt-4 text-sm text-muted">Please wait a moment...</p>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => void tryAgain()}
            disabled={restarting}
            className="dm-btn dm-btn-primary min-h-11 w-full"
          >
            {restarting ? "Starting…" : "Try again"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
