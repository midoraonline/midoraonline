export type ApiFetchOptions = RequestInit & {
  token?: string;
  adminKey?: string;
};

function getBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set it in .env.local (e.g. http://127.0.0.1:8000)."
    );
  }
  return base;
}

export async function apiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<T> {
  const { token, adminKey, headers, ...rest } = opts;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(adminKey ? { "X-Admin-Key": adminKey } : {}),
      ...(headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  // Some endpoints may return 204 or empty bodies.
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (undefined as unknown) as T;
  }
  return (await res.json()) as T;
}

