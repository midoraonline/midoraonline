const PROBE_ORIGIN = "https://midora.invalid";

/** Same-origin path from a `?next=` value, or null. Blocks `//host`, `/\host` and schemes. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  // Browsers strip tabs/newlines, which can rebuild "//".
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
