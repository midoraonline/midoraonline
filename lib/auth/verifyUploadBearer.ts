export async function verifyUploadBearer(
  req: Request,
): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  try {
    const res = await fetch(`${base}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const me = (await res.json()) as { id?: unknown };
    if (typeof me.id !== "string" || !me.id) return null;
    return { userId: me.id };
  } catch {
    return null;
  }
}
