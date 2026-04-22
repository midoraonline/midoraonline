import { AUTH_CHANGED_EVENT } from "@/lib/auth/token-storage";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  /**
   * Explicit bearer token. Primarily used by server components (RSCs) since
   * browsers carry the auth cookie automatically.
   */
  token?: string | null;
  /** Legacy admin header. Phase 3 introduces role-based admin; scripts keep this. */
  adminKey?: string;
  /** Opt out of sending credentials (for public endpoints where that matters). */
  anonymous?: boolean;
  /** Body (JSON-serialized automatically unless already a string / FormData). */
  body?: RequestInit["body"] | Record<string, unknown> | unknown[] | null;
  /** Request timeout in ms (default 20s). Set to 0 to disable. */
  timeoutMs?: number;
  /** Skip the one-shot refresh-and-retry on 401. */
  skipAuthRefresh?: boolean;
};

export type ApiErrorPayload = {
  detail?: string;
  code?: string;
  errors?: unknown;
  [key: string]: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly data?: ApiErrorPayload;

  constructor(message: string, status: number, data?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = data?.code;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT_MS = 20_000;

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set it in .env.local (e.g. http://127.0.0.1:8000)."
    );
  }
  return base.replace(/\/$/, "");
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const prefix = path.startsWith("/") ? "" : "/";
  return `${getBaseUrl()}${prefix}${path}`;
}

function shouldSerialiseAsJson(body: unknown): boolean {
  if (body == null) return false;
  if (typeof body === "string") return false;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) return false;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    return false;
  }
  return true;
}

function isMultipartOrBinary(body: unknown): boolean {
  if (body == null) return false;
  if (typeof FormData !== "undefined" && body instanceof FormData) return true;
  if (typeof Blob !== "undefined" && body instanceof Blob) return true;
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) return true;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) return true;
  return false;
}

async function parseErrorBody(res: Response): Promise<ApiErrorPayload> {
  const text = await res.text().catch(() => "");
  if (!text) return { detail: res.statusText };
  try {
    const parsed = JSON.parse(text) as ApiErrorPayload;
    if (parsed && typeof parsed === "object") return parsed;
    return { detail: text };
  } catch {
    return { detail: text };
  }
}

/**
 * Shared refresh promise. Multiple racing 401 retries piggyback on the same
 * refresh request so we never fire two at once.
 */
let inflightRefresh: Promise<boolean> | null = null;

async function tryRefreshCookie(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!inflightRefresh) {
    inflightRefresh = (async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (!res.ok) {
          return false;
        }
        return true;
      } catch {
        return false;
      } finally {
        inflightRefresh = null;
      }
    })();
  }
  return inflightRefresh;
}

async function doFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  if (!timeoutMs) return fetch(url, init);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<T> {
  const {
    token,
    adminKey,
    anonymous,
    headers,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuthRefresh,
    credentials,
    ...rest
  } = opts;

  const explicitToken = typeof token === "string" && token.length > 0 ? token : null;
  const url = resolveUrl(path);

  const callerHeaders = (headers as Record<string, string>) || {};
  const hasContentType = Object.keys(callerHeaders).some(
    (k) => k.toLowerCase() === "content-type"
  );

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(!hasContentType && !isMultipartOrBinary(body) ? { "Content-Type": "application/json" } : {}),
    ...(explicitToken ? { Authorization: `Bearer ${explicitToken}` } : {}),
    ...(adminKey ? { "X-Admin-Key": adminKey } : {}),
    ...callerHeaders,
  };

  const init: RequestInit = {
    ...rest,
    headers: finalHeaders,
    credentials:
      credentials ?? (anonymous ? "omit" : "include"),
    body: shouldSerialiseAsJson(body)
      ? JSON.stringify(body)
      : (body as RequestInit["body"] | null),
  };

  let res: Response;
  try {
    res = await doFetch(url, init, timeoutMs);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError("Request timed out", 0, { code: "timeout" });
    }
    throw new ApiError(
      e instanceof Error ? e.message : "Network error",
      0,
      { code: "network_error" }
    );
  }

  if (
    res.status === 401 &&
    !skipAuthRefresh &&
    !explicitToken &&
    !anonymous &&
    typeof window !== "undefined"
  ) {
    const ok = await tryRefreshCookie();
    if (ok) {
      return apiFetch<T>(path, { ...opts, skipAuthRefresh: true });
    }
  }

  if (!res.ok) {
    const payload = await parseErrorBody(res);
    const message =
      (typeof payload.detail === "string" && payload.detail) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, payload);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export { AUTH_CHANGED_EVENT };
