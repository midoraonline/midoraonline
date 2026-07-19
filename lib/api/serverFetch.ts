import "server-only";

import { cookies } from "next/headers";
import { apiFetch, ApiError, type ApiFetchOptions } from "./base";

/** Cookie name used by the FastAPI backend for the access token. */
export const ACCESS_TOKEN_COOKIE = "midora_access";

/** Read the current request's access token from the Next.js cookie store. */
export async function getServerToken(): Promise<string | null> {
  try {
    const store = await cookies();
    const raw = store.get(ACCESS_TOKEN_COOKIE)?.value;
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Server-only wrapper around `apiFetch` that auto-injects the caller's
 * Bearer token (from cookies) when no explicit token is supplied.
 *
 * Use this from Server Components / Route Handlers whenever the FastAPI
 * endpoint requires authentication. Cross-domain cookies do NOT reach
 * FastAPI on Vercel, so a Bearer header is the reliable pattern.
 */
export async function serverApiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const token = opts.token ?? (await getServerToken());
  return apiFetch<T>(path, { ...opts, token });
}

/** Returns null when the upstream call is missing / forbidden / unavailable. */
export async function safeServerFetch<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401 || e.status === 403 || e.status === 404) return null;
      if (e.status >= 500) return null;
    }
    throw e;
  }
}

/** Convenience helper — resolve many independent SSR calls in parallel, tolerating individual failures. */
export async function parallelServerFetch<T extends Record<string, Promise<unknown>>>(
  tasks: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> | null }> {
  const keys = Object.keys(tasks) as (keyof T)[];
  const values = await Promise.all(
    keys.map((k) => safeServerFetch(tasks[k] as Promise<unknown>)),
  );
  const out = {} as { [K in keyof T]: Awaited<T[K]> | null };
  keys.forEach((k, i) => {
    out[k] = values[i] as Awaited<T[typeof k]> | null;
  });
  return out;
}
