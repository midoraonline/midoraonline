import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type Method,
} from "axios";

import { isGoogleCallbackPending } from "@/lib/auth/google-callback-guard";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/token-storage";

export type ApiFetchOptions = {
  method?: Method | string;
  headers?: HeadersInit | Record<string, string>;
  token?: string | null;
  adminKey?: string;
  anonymous?: boolean;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  cache?: RequestCache;
  /** fetch keepalive — survives reload. Keep the body under 64KB. */
  keepalive?: boolean;
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

/** Shared axios instance for Midora API / same-origin proxy calls. */
export const apiHttp = axios.create({
  timeout: DEFAULT_TIMEOUT_MS,
  // Cookies for session auth (browser) and SSR when callers pass withCredentials.
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
  // Don't throw on 4xx/5xx — apiFetch maps status to ApiError itself.
  validateStatus: () => true,
});

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set it in .env.local (e.g. http://127.0.0.1:8000).",
    );
  }
  return base.replace(/\/$/, "");
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const prefix = path.startsWith("/") ? "" : "/";

  // Route all browser API calls through the Next.js proxy so cookies
  // are set on and sent to the same domain (fixes SSR personalization
  // on Vercel serverless and avoids CORS issues).
  if (typeof window !== "undefined" && path.startsWith("/api/v1/")) {
    return `/api/dev-proxy${path}`;
  }

  return `${getBaseUrl()}${prefix}${path}`;
}

/** Browser-only URL for API calls (via Next.js proxy when on /api/v1/). */
export function resolveClientApiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  if (path.startsWith("/api/v1/")) return `/api/dev-proxy${path}`;
  return resolveUrl(path);
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

function headersToRecord(headers?: HeadersInit | Record<string, string>): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function messageFromPayload(payload: ApiErrorPayload, status: number): string {
  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }
  const errors = payload.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as { msg?: unknown };
    if (typeof first?.msg === "string" && first.msg.trim()) return first.msg;
  }
  return `Request failed with status ${status}`;
}

function payloadFromUnknown(data: unknown, fallbackDetail: string): ApiErrorPayload {
  if (data && typeof data === "object") return data as ApiErrorPayload;
  if (typeof data === "string" && data.trim()) return { detail: data };
  return { detail: fallbackDetail };
}

let inflightRefresh: Promise<boolean> | null = null;
let refreshEpoch = 0;

if (typeof window !== "undefined") {
  window.addEventListener(AUTH_CHANGED_EVENT, () => {
    refreshEpoch += 1;
    inflightRefresh = null;
  });
}

async function tryRefreshCookie(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  // A revoked frontend refresh presented here wipes every token for the user,
  // including the Google session the callback is about to redeem.
  if (isGoogleCallbackPending()) return false;
  const epoch = refreshEpoch;
  if (!inflightRefresh) {
    inflightRefresh = (async () => {
      try {
        const res = await apiHttp.request({
          url: "/api/dev-proxy/api/v1/auth/refresh",
          method: "POST",
          data: {},
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 8_000,
        });
        if (epoch !== refreshEpoch) return false;
        return res.status >= 200 && res.status < 300;
      } catch {
        return false;
      } finally {
        if (epoch === refreshEpoch) inflightRefresh = null;
      }
    })();
  }
  return inflightRefresh;
}

export async function apiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {},
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
    method = "GET",
    signal,
    keepalive = false,
  } = opts;

  const explicitToken = typeof token === "string" && token.length > 0 ? token : null;
  const url = resolveUrl(path);

  const callerHeaders = headersToRecord(headers);
  const hasContentType = Object.keys(callerHeaders).some(
    (k) => k.toLowerCase() === "content-type",
  );

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(!hasContentType && !isMultipartOrBinary(body)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(explicitToken ? { Authorization: `Bearer ${explicitToken}` } : {}),
    ...(adminKey ? { "X-Admin-Key": adminKey } : {}),
    "X-Correlation-Id": callerHeaders["X-Correlation-Id"] || crypto.randomUUID(),
    ...callerHeaders,
  };

  // For multipart, let the browser/axios set the boundary Content-Type.
  if (isMultipartOrBinary(body)) {
    for (const key of Object.keys(finalHeaders)) {
      if (key.toLowerCase() === "content-type") delete finalHeaders[key];
    }
  }

  const withCredentials =
    credentials === "omit" || anonymous
      ? false
      : credentials === "include" || credentials === "same-origin" || credentials == null
        ? true
        : true;

  const data = shouldSerialiseAsJson(body) ? body : body ?? undefined;

  const config: AxiosRequestConfig = {
    url,
    method: (method || "GET") as Method,
    headers: finalHeaders,
    data: method && String(method).toUpperCase() === "GET" ? undefined : data,
    timeout: timeoutMs || undefined,
    withCredentials,
    signal,
    validateStatus: () => true,
  };

  let status = 0;
  let responseData: unknown = undefined;
  let contentType = "";

  try {
    const dispatched = await dispatchRequest(config, keepalive);
    status = dispatched.status;
    responseData = dispatched.responseData;
    contentType = dispatched.contentType;
  } catch (e) {
    if (axios.isCancel(e) || (e instanceof AxiosError && e.code === "ERR_CANCELED")) {
      throw new ApiError("Request timed out", 0, { code: "timeout" });
    }
    if (e instanceof AxiosError && e.code === "ECONNABORTED") {
      throw new ApiError("Request timed out", 0, { code: "timeout" });
    }
    throw new ApiError(
      e instanceof Error ? e.message : "Network error",
      0,
      { code: "network_error" },
    );
  }

  if (
    status === 401 &&
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

  if (status < 200 || status >= 300) {
    const payload = payloadFromUnknown(responseData, `HTTP ${status}`);
    throw new ApiError(messageFromPayload(payload, status), status, payload);
  }

  if (status === 204) return undefined as T;
  if (contentType && !contentType.includes("application/json")) {
    return undefined as T;
  }
  // axios already parsed JSON when content-type is json; empty body may be "".
  if (responseData === "" || responseData == null) return undefined as T;
  return responseData as T;
}

type DispatchResult = {
  status: number;
  responseData: unknown;
  contentType: string;
};

/** XHR is cancelled on reload; keepalive fetch is not. Used for mark-read. */
async function dispatchRequest(
  config: AxiosRequestConfig,
  keepalive: boolean,
): Promise<DispatchResult> {
  if (!keepalive || typeof fetch === "undefined") {
    const res = await apiHttp.request(config);
    const ct = res.headers["content-type"];
    const contentType = typeof ct === "string" ? ct : Array.isArray(ct) ? ct[0] || "" : "";
    return { status: res.status, responseData: res.data, contentType };
  }

  const method = String(config.method || "GET").toUpperCase();
  const headers = (config.headers || {}) as Record<string, string>;
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const data = config.data;
    body = data == null ? "{}" : typeof data === "string" ? data : JSON.stringify(data);
  }

  const res = await fetch(String(config.url), {
    method,
    headers,
    body,
    credentials: config.withCredentials ? "include" : "omit",
    keepalive: true,
    signal: config.signal as AbortSignal | undefined,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  if (res.status === 204) {
    return { status: res.status, responseData: undefined, contentType };
  }
  const text = await res.text();
  if (!text) return { status: res.status, responseData: undefined, contentType };
  if (contentType.includes("application/json")) {
    try {
      return { status: res.status, responseData: JSON.parse(text) as unknown, contentType };
    } catch {
      return { status: res.status, responseData: text, contentType };
    }
  }
  return { status: res.status, responseData: text, contentType };
}

export { AUTH_CHANGED_EVENT };
