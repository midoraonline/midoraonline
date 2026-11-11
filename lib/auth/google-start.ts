import { apiAuth } from "@/lib/api";
import type { GoogleAuthUrlResponse } from "@/lib/api/auth";

// The URL is stateless (signed state, 10 min TTL), so it can be fetched before the click.
const FRESH_MS = 8 * 60 * 1000;

let cached: { value: GoogleAuthUrlResponse; at: number } | null = null;
let inflight: Promise<GoogleAuthUrlResponse> | null = null;

function isLocalhost(): boolean {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

async function fetchUrl(): Promise<GoogleAuthUrlResponse> {
  if (!isLocalhost()) return apiAuth.getGoogleAuthUrl();
  // Local dev: server-side proxy sidesteps the backend's production-only CORS.
  const origin = window.location.origin;
  const query = new URLSearchParams({
    origin,
    redirect_to: `${origin}/login`,
    redirect_uri: `${origin}/login`,
  });
  const res = await fetch(`/api/auth/google-url?${query}`);
  if (!res.ok) throw new Error("Google sign-in is unavailable");
  return (await res.json()) as GoogleAuthUrlResponse;
}

/** Warm the URL (and the API lambda) while the user is still reading the form. */
export function prefetchGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
  if (cached && Date.now() - cached.at < FRESH_MS) return Promise.resolve(cached.value);
  if (inflight) return inflight;
  inflight = fetchUrl()
    .then((value) => {
      cached = { value, at: Date.now() };
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Navigate to Google; instant when the prefetch already landed. */
export async function startGoogleSignIn(): Promise<void> {
  const { url } = await prefetchGoogleAuthUrl();
  cached = null; // state is single-use per attempt
  window.location.assign(url);
}
