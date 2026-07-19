import { apiFetch } from "./base";

export type RegisterRequest = {
  email: string;
  password: string;
  full_name?: string;
  user_role?: "customer" | "merchant" | "admin";
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
  user_role?: "customer" | "merchant" | "admin" | "staff" | null;
  email_verified?: boolean | null;
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
  // 1. Clear Next.js-domain cookies so the browser stops sending them.
  try {
    await fetch("/api/auth/clear-cookies", { method: "POST" });
  } catch {
    /* best-effort */
  }

  // 2. Call FastAPI directly (NOT through the proxy) so that its Set-Cookie
  //    headers keep the original Domain= scope and actually clear the
  //    FastAPI-domain cookies. If we went through the proxy, the Domain=
  //    would be stripped and the FastAPI-domain cookies would survive,
  //    letting tryRefreshCookie re-authenticate the user on next me() call.
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
    await fetch(`${base}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    /* best-effort — local Next.js cookies are already cleared */
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

export function getGoogleAuthUrl() {
  return apiFetch<GoogleAuthUrlResponse>("/api/v1/auth/google/url");
}

export function exchangeGoogleCode(body: GoogleExchangeRequest) {
  return apiFetch<TokenPair>("/api/v1/auth/google/exchange", {
    method: "POST",
    body,
  });
}
