"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { establishGoogleCallbackSession } from "@/lib/auth/establish-session";
import { setGoogleCallbackPending } from "@/lib/auth/google-callback-guard";
import { startGoogleSignIn } from "@/lib/auth/google-start";
import { isSignupsClosed, SIGNUPS_CLOSED_MESSAGE } from "@/lib/platformMessages";

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
      .catch((err: unknown) => {
        if (!active) return;
        setStatus("error");
        setMessage(isSignupsClosed(err) ? SIGNUPS_CLOSED_MESSAGE : SIGN_IN_ERROR);
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
      await startGoogleSignIn();
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
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Please wait a moment...
        </p>
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
