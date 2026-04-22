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

/** Matches `/auth/me` (profile-style; some fields optional depending on backend). */
export type MeResponse = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  user_role?: "customer" | "merchant" | "admin" | "staff" | null;
  email_verified?: boolean | null;
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

/**
 * Register. The server sets httpOnly auth cookies on success; the returned
 * token pair is kept for non-browser clients (mobile apps, scripts).
 */
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

/**
 * Rotate the refresh cookie. The request body is empty in the browser flow —
 * the refresh token lives in the `midora_refresh` cookie.
 */
export function refresh() {
  return apiFetch<TokenPair>("/api/v1/auth/refresh", {
    method: "POST",
    body: {},
    skipAuthRefresh: true,
  });
}

export function me(token?: string) {
  // Explicit `token` supports server-components; the browser carries the cookie.
  return apiFetch<MeResponse>("/api/v1/auth/me", token ? { token } : undefined);
}

export function logout() {
  return apiFetch<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
    skipAuthRefresh: true,
  });
}

export function verifyEmail(token: string) {
  const qs = new URLSearchParams({ token }).toString();
  return apiFetch<VerifyEmailResponse>(`/api/v1/auth/verify-email?${qs}`);
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
