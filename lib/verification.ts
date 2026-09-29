import { apiFetch, ApiError } from "@/lib/api/base";
import { me, type MeResponse } from "@/lib/api/auth";

export type VerificationChannel = "phone" | "email";

export type VerificationStatus = {
  phone: string | null;
  phone_verified: boolean;
  email: string | null;
  email_verified: boolean;
  can_post: boolean;
  required_channel: VerificationChannel | null;
};

const COPY: Record<string, string> = {
  invalid_phone: "Enter a valid phone number.",
  invalid_email: "Use the email address on this account.",
  code_invalid: "That code doesn't match. Check the message and try again.",
  code_expired: "That code has expired. Request a new one.",
  sms_unavailable: "We couldn't send a text right now. Try again in a moment.",
  email_unavailable: "We couldn't send the email right now. Try again in a moment.",
  resend_too_soon: "Wait a moment before requesting another code.",
  too_many_attempts: "Too many tries. Request a new code.",
  phone_in_use:
    "That phone number is already linked to another Midora account. Sign in with that account, or use a different number.",
  verification_required: "Verify your phone or email before you post.",
};

/** Envelope is `{ detail, code }`. Nested `detail.code` is only a safety net. */
export function verificationErrorCode(err: unknown): string | undefined {
  if (!(err instanceof ApiError)) return undefined;
  if (err.code) return err.code;
  const detail = err.data?.detail;
  if (detail && typeof detail === "object" && "code" in detail) {
    const code = (detail as { code?: unknown }).code;
    if (typeof code === "string" && code) return code;
  }
  return undefined;
}

export function isVerificationRequired(err: unknown): boolean {
  return verificationErrorCode(err) === "verification_required";
}

export function isResendTooSoon(err: unknown): boolean {
  return verificationErrorCode(err) === "resend_too_soon";
}

export function verificationMessage(err: unknown): string {
  const code = verificationErrorCode(err);
  if (code && COPY[code]) return COPY[code];
  if (err instanceof Error && err.message.trim() && !/^HTTP \d+/.test(err.message) && !/^Request failed/i.test(err.message)) {
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

function statusFromProfile(profile: MeResponse): VerificationStatus {
  const phone = profile.phone_number?.trim() || null;
  const email = profile.email?.trim() || null;
  const phoneVerified = Boolean(profile.phone_verified);
  const emailVerified = Boolean(profile.email_verified);
  const canPost = phoneVerified || emailVerified;
  return {
    phone,
    phone_verified: phoneVerified,
    email,
    email_verified: emailVerified,
    can_post: canPost,
    required_channel: canPost ? null : phone ? "phone" : "email",
  };
}

export async function fetchVerificationStatus(): Promise<VerificationStatus> {
  try {
    return await apiFetch<VerificationStatus>("/api/v1/auth/verification-status");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      return statusFromProfile(await me());
    }
    throw err;
  }
}

export function startPhoneVerification(phone: string) {
  return apiFetch<{ message: string }>("/api/v1/auth/verify/phone/start", {
    method: "POST",
    body: { phone },
  });
}

export function confirmPhoneCode(phone: string, code: string) {
  return apiFetch<VerificationStatus>("/api/v1/auth/verify/phone/confirm", {
    method: "POST",
    body: { phone, code },
  });
}

export function startEmailVerification(email: string) {
  return apiFetch<{ message: string }>("/api/v1/auth/verify/email/start", {
    method: "POST",
    body: { email },
  });
}

export function confirmEmailCode(email: string, code: string) {
  return apiFetch<VerificationStatus>("/api/v1/auth/verify/email/confirm", {
    method: "POST",
    body: { email, code },
  });
}
