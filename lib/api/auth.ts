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

export type RefreshRequest = {
  refresh_token: string;
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

export function register(body: RegisterRequest) {
  return apiFetch<TokenPair>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function login(body: LoginRequest) {
  return apiFetch<TokenPair>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function refresh(body: RefreshRequest) {
  return apiFetch<TokenPair>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function me(token: string) {
  return apiFetch<MeResponse>("/api/v1/auth/me", { token });
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
    body: JSON.stringify(body),
  });
}

