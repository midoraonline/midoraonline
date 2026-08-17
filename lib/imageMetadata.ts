/**
 * Client-side image provenance / metadata check.
 *
 * Runs before we upload the file so we can reject stock photos, AI-generated
 * images and images with a foreign watermark URL in EXIF/XMP/PNG text right
 * inside the picker — no wasted uploads, no wasted moderation calls.
 *
 * The rules mirror midoraapi/listingModeration/stages/metadata.py so a
 * merchant who passes here also passes server-side.
 */
import exifr from "exifr";

type MetadataInspection =
  | { ok: true }
  | { ok: false; reason: string };

// Same allow-list as the backend: strings inside our own domain.
const ALLOWED_DOMAIN_HINTS = ["midora", "midoraonline"];

const BANNED_SOFTWARE_KEYWORDS = [
  "dall-e",
  "dalle",
  "midjourney",
  "stable diffusion",
  "sd-webui",
  "automatic1111",
  "comfyui",
  "adobe firefly",
  "leonardo.ai",
  "runway",
  "imagen",
  "gemini image",
  "grok image",
  "flux.1",
  "flux1",
  "shutterstock",
  "istock",
  "getty",
  "adobe stock",
  "pexels",
  "unsplash",
  "pixabay",
  "alibaba",
  "aliexpress",
  "amazon",
  "ebay",
  "jumia",
  "kilimall",
  "temu",
];

// URL or bare domain hit. Kept in sync with the backend regex.
const URL_RE =
  /(?:https?:\/\/|www\.)[^\s"'<>]+|[a-z0-9][a-z0-9-]*\.(?:com|co|net|io|org|shop|store|africa|ug|ke|tz|rw)\b/i;

const EXTRA_TEXT_KEYS = [
  "ImageDescription",
  "Software",
  "Artist",
  "HostComputer",
  "Copyright",
  "UserComment",
  "XPTitle",
  "XPComment",
  "XPAuthor",
  "XPKeywords",
  "XPSubject",
  // XMP-derived keys exifr surfaces
  "CreatorTool",
  "Rights",
  "WebStatement",
  "Source",
  "Creator",
  "Description",
  "Marked",
  "Credit",
  // PNG generation-metadata chunks
  "parameters",
  "prompt",
  "workflow",
  "Comment",
  "sd-metadata",
];

function stringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringify).join(" ");
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function findBannedSoftware(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const kw of BANNED_SOFTWARE_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

function findForeignUrl(text: string): string | null {
  if (!text) return null;
  const match = text.match(URL_RE);
  if (!match) return null;
  const url = match[0].toLowerCase();
  if (ALLOWED_DOMAIN_HINTS.some((allowed) => url.includes(allowed))) return null;
  return match[0];
}

/**
 * Inspect a File for foreign URLs / stock / AI markers in its metadata.
 * Returns `{ok: true}` when the image is safe to upload, otherwise
 * `{ok: false, reason}` with a user-facing rejection message.
 */
export async function inspectImageMetadata(
  file: File,
): Promise<MetadataInspection> {
  // Videos and non-image files skip this stage.
  if (!file.type || !file.type.startsWith("image/")) return { ok: true };

  let parsed: Record<string, unknown> | undefined;
  try {
    parsed = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      xmp: true,
      iptc: true,
      icc: false,
      jfif: false,
      ihdr: false,
      // read every tag exifr knows about (not just the "translated" subset)
      translateKeys: true,
      translateValues: true,
      reviveValues: false,
    })) as Record<string, unknown> | undefined;
  } catch {
    // Corrupt metadata block — let the file through; server-side stage will
    // catch anything that decodes but is still bad.
    return { ok: true };
  }

  if (!parsed) return { ok: true };

  const fields: string[] = [];
  for (const key of EXTRA_TEXT_KEYS) {
    const v = parsed[key];
    const text = stringify(v);
    if (text) fields.push(text);
  }
  // Fallback: sweep any remaining string values in the parsed record so we
  // don't miss less common tags.
  for (const [key, value] of Object.entries(parsed)) {
    if (EXTRA_TEXT_KEYS.includes(key)) continue;
    if (typeof value === "string" && value.length <= 4000) fields.push(value);
  }

  for (const text of fields) {
    const banned = findBannedSoftware(text);
    if (banned) {
      return {
        ok: false,
        reason: `This image's metadata mentions "${banned}". Please upload your own photo taken with your phone or camera.`,
      };
    }
  }
  for (const text of fields) {
    const foreign = findForeignUrl(text);
    if (foreign) {
      return {
        ok: false,
        reason: `This image contains a watermark or link pointing to ${foreign.slice(0, 60)}. Please upload your own photo.`,
      };
    }
  }

  return { ok: true };
}
