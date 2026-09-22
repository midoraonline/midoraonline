import { apiFetch } from "./base";

export type RegisterRequest = {
  email: string;
  password: string;
  full_name?: string;
  user_role?: "customer" | "merchant";
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type MeResponse = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  phone_verified?: boolean | null;
  user_role?: "customer" | "merchant" | "admin" | "staff" | null;
  email_verified?: boolean | null;
  plan_tier?: "basic" | "standard" | "premium" | null;
  plan_expires_at?: string | null;
  /**
   * Short-lived JWT (role="authenticated") for Supabase Realtime subscriptions.
   * Passed to `supabase.realtime.setAuth()` so RLS policies bind to `auth.uid()`.
   */
  supabase_realtime_token?: string | null;
};

export type VerifyEmailResponse = {
  message: string;
  user: MeResponse;
} & TokenPair;

export type GoogleAuthUrlResponse = {
  url: string;
  state: string;
};

export type GoogleExchangeRequest = {
  code: string;
  state: string;
};

export function register(body: RegisterRequest) {
  return apiFetch<TokenPair>("/api/v1/auth/register", {
    method: "POST",
    body,
  });
}

export function login(body: LoginRequest) {
  return apiFetch<TokenPair>("/api/v1/auth/login", {
    method: "POST",
    body,
  });
}

export function refresh() {
  return apiFetch<TokenPair>("/api/v1/auth/refresh", {
    method: "POST",
    body: {},
    skipAuthRefresh: true,
  });
}

export function me(token?: string) {
  return apiFetch<MeResponse>("/api/v1/auth/me", token ? { token } : undefined);
}

export async function logout() {
  // 1. Clear Next.js-domain cookies first so /me and tryRefreshCookie cannot
  //    revive the session from a leftover midora_refresh cookie.
  try {
    await fetch("/api/auth/clear-cookies", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    /* best-effort */
  }

  // 2. Revoke refresh + clear API-host cookies.
  //    Prefer the same-origin proxy so Path=/ refresh cookies (set via
  //    set-cookies / proxy rewrite) are sent and cleared consistently.
  //    Also hit FastAPI directly for any host-only API-domain leftovers.
  try {
    await fetch("/api/dev-proxy/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    /* best-effort */
  }

  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
    if (base) {
      await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    }
  } catch {
    /* best-effort */
  }

  // 3. Clear again after upstream Set-Cookie clears, in case the proxy
  //    rewrote delete cookies incompletely.
  try {
    await fetch("/api/auth/clear-cookies", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    /* best-effort */
  }
}

export function verifyEmail(token: string) {
  const qs = new URLSearchParams({ token }).toString();
  return apiFetch<VerifyEmailResponse>(`/api/v1/auth/verify-email?${qs}`);
}

export type UpdateProfileRequest = {
  full_name?: string;
  phone_number?: string;
};

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

export function updateProfile(body: UpdateProfileRequest) {
  return apiFetch<MeResponse>("/api/v1/auth/me", {
    method: "PATCH",
    body,
  });
}

export function changePassword(body: ChangePasswordRequest) {
  return apiFetch<{ message: string }>("/api/v1/auth/change-password", {
    method: "POST",
    body,
  });
}

export type SendPhoneCodeRequest = {
  phone_number: string;
};

export function sendPhoneVerificationCode(body: SendPhoneCodeRequest) {
  return apiFetch<{ message: string }>("/api/v1/auth/phone/send-code", {
    method: "POST",
    body,
  });
}

export function confirmPhoneVerificationCode(code: string) {
  return apiFetch<MeResponse>("/api/v1/auth/phone/verify", {
    method: "POST",
    body: { code },
  });
}

export function getGoogleAuthUrl() {
  return apiFetch<GoogleAuthUrlResponse>("/api/v1/auth/google/url");
}

export function exchangeGoogleCode(body: GoogleExchangeRequest) {
  return apiFetch<TokenPair>("/api/v1/auth/google/exchange", {
    method: "POST",
    body,
  });
}
