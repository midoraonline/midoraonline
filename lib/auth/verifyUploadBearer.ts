import axios from "axios";

export async function verifyUploadBearer(
  req: Request,
): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  try {
    const res = await axios.get(`${base}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      validateStatus: () => true,
    });
    if (res.status < 200 || res.status >= 300) return null;
    const me = res.data as { id?: unknown };
    if (typeof me?.id !== "string" || !me.id) return null;
    return { userId: me.id };
  } catch {
    return null;
  }
}
