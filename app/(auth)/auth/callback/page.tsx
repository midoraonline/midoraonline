"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import GoogleSignInProgress, {
  GOOGLE_SUCCESS_HOLD_MS,
  type GoogleProgressStatus,
} from "@/components/auth/GoogleSignInProgress";
import { establishGoogleCallbackSession } from "@/lib/auth/establish-session";
import { setGoogleCallbackPending } from "@/lib/auth/google-callback-guard";
import { startGoogleSignIn } from "@/lib/auth/google-start";
import { isSignupsClosed, SIGNUPS_CLOSED_MESSAGE } from "@/lib/platformMessages";

const SIGN_IN_ERROR = "We couldn't finish signing you in. Please try again.";

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<GoogleProgressStatus>("processing");
  const [step, setStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState(SIGN_IN_ERROR);
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
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (error || provider !== "google" || verified !== "true") {
      setGoogleCallbackPending(false);
      queueMicrotask(() => {
        if (!active) return;
        setErrorMessage(SIGN_IN_ERROR);
        setStatus("error");
      });
      return () => {
        active = false;
      };
    }

    void establishGoogleCallbackSession((s) => {
      if (active) setStep(s);
    })
      .then(() => {
        if (!active) return;
        setStatus("success");
        timer = setTimeout(() => router.replace("/"), GOOGLE_SUCCESS_HOLD_MS);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMessage(isSignupsClosed(err) ? SIGNUPS_CLOSED_MESSAGE : SIGN_IN_ERROR);
        setStatus("error");
      });

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  async function tryAgain() {
    setRestarting(true);
    try {
      await startGoogleSignIn();
    } catch {
      setRestarting(false);
      setErrorMessage(SIGN_IN_ERROR);
      setStatus("error");
    }
  }

  return (
    <GoogleSignInProgress
      status={status}
      step={step}
      message={status === "error" ? errorMessage : undefined}
      onRetry={() => void tryAgain()}
      retrying={restarting}
    />
  );
}
