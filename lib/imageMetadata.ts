import exifr from "exifr";


export type InspectionFailureCode =
  | "banned_software"
  | "foreign_link"
  | "screenshot_or_downloaded";

export type MetadataInspection =
  | { ok: true }
  | { ok: false; code: InspectionFailureCode; reason: string; details: string[] };


const ALLOWED_DOMAIN_HINTS = ["midora", "midoraonline"];

const BANNED_SOFTWARE_KEYWORDS = [
  "dall-e", "dalle", "midjourney", "stable diffusion", "sd-webui",
  "automatic1111", "comfyui", "adobe firefly", "leonardo.ai", "runway",
  "imagen", "gemini image", "grok image", "flux.1", "flux1",
  "shutterstock", "istock", "getty", "adobe stock", "pexels", "unsplash",
  "pixabay", "alibaba", "aliexpress", "amazon", "ebay", "jumia", "kilimall",
  "temu",
];

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s"'<>]+|[a-z0-9][a-z0-9-]*\.(?:com|co|net|io|org|shop|store|africa|ug|ke|tz|rw)\b/i;

const EXTRA_TEXT_KEYS = [
  "ImageDescription", "Software", "Artist", "HostComputer", "Copyright",
  "UserComment", "XPTitle", "XPComment", "XPAuthor", "XPKeywords",
  "XPSubject", "CreatorTool", "Rights", "WebStatement", "Source", "Creator",
  "Description", "Marked", "Credit", "parameters", "prompt", "workflow",
  "Comment", "sd-metadata",
];

// Presence of ANY of these is a strong signal the file came off a real
// camera/phone sensor rather than a screen capture or a downloaded image.
const CAMERA_HINT_KEYS = [
  "Make", "Model", "LensModel", "LensMake", "FocalLength", "FNumber",
  "ApertureValue", "ExposureTime", "ShutterSpeedValue", "ISO",
  "ISOSpeedRatings", "DateTimeOriginal", "GPSLatitude", "GPSLongitude",
  "SubjectDistance", "WhiteBalance", "Flash",
];

// Physical-pixel dimensions (either orientation) that match common
// desktop/laptop displays.
const COMMON_DESKTOP_RESOLUTIONS = new Set(
  [
    [1280, 720], [1280, 800], [1366, 768], [1440, 900], [1536, 864],
    [1600, 900], [1680, 1050], [1920, 1080], [1920, 1200], [2048, 1152],
    [2256, 1504], [2560, 1080], [2560, 1440], [2560, 1600], [2880, 1620],
    [2880, 1800], [3000, 2000], [3024, 1964], [3072, 1920], [3440, 1440],
    [3456, 2160], [3840, 2160], [3840, 1600], [5120, 1440], [1512, 982],
    [1512, 945], [1470, 956],
  ].flatMap(([w, h]) => [`${w}x${h}`, `${h}x${w}`]),
);

// Typical CSS/logical viewport widths for phones & tablets.
const COMMON_DEVICE_LOGICAL_WIDTHS = new Set([
  320, 360, 375, 390, 393, 412, 414, 428, 430, 768, 810, 820, 834, 1024, 1180,
]);

const MIN_SUSPICION_SCORE_TO_FLAG = 3;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Step 1: text metadata scan (EXIF / XMP / IPTC) — explicit, high-confidence
// ---------------------------------------------------------------------------

async function scanTextMetadata(file: File): Promise<{
  bannedHit: { keyword: string; field: string } | null;
  foreignUrlHit: { url: string; field: string } | null;
  hasCameraHints: boolean;
  hasAnyMetadata: boolean;
}> {
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
      translateKeys: true,
      translateValues: true,
      reviveValues: false,
    })) as Record<string, unknown> | undefined;
  } catch {
    parsed = undefined;
  }

  if (!parsed) {
    return { bannedHit: null, foreignUrlHit: null, hasCameraHints: false, hasAnyMetadata: false };
  }

  // Keep track of which field each string came from, so the message can
  // name it (e.g. "the Software field" vs "the Copyright field").
  const fields: { key: string; text: string }[] = [];
  for (const key of EXTRA_TEXT_KEYS) {
    const text = stringify(parsed[key]);
    if (text) fields.push({ key, text });
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (EXTRA_TEXT_KEYS.includes(key)) continue;
    if (typeof value === "string" && value.length <= 4000) fields.push({ key, text: value });
  }

  let bannedHit: { keyword: string; field: string } | null = null;
  for (const { key, text } of fields) {
    const kw = findBannedSoftware(text);
    if (kw) {
      bannedHit = { keyword: kw, field: key };
      break;
    }
  }

  let foreignUrlHit: { url: string; field: string } | null = null;
  if (!bannedHit) {
    for (const { key, text } of fields) {
      const url = findForeignUrl(text);
      if (url) {
        foreignUrlHit = { url, field: key };
        break;
      }
    }
  }

  const hasCameraHints = CAMERA_HINT_KEYS.some((k) => parsed![k] != null);
  const hasAnyMetadata = Object.keys(parsed).length > 0;

  return { bannedHit, foreignUrlHit, hasCameraHints, hasAnyMetadata };
}

// ---------------------------------------------------------------------------
// Step 2: dimension heuristic — does this look like a screen capture?
// ---------------------------------------------------------------------------

function screenResolutionMatch(width: number, height: number): string | null {
  if (COMMON_DESKTOP_RESOLUTIONS.has(`${width}x${height}`)) {
    return `${width}x${height} is a common desktop/laptop screen resolution`;
  }
  for (const dpr of [1, 2, 3]) {
    if (width % dpr !== 0 || height % dpr !== 0) continue;
    const logicalW = width / dpr;
    const logicalH = height / dpr;
    if (COMMON_DEVICE_LOGICAL_WIDTHS.has(logicalW) || COMMON_DEVICE_LOGICAL_WIDTHS.has(logicalH)) {
      return `${width}x${height} matches a typical phone/tablet screen size at ${dpr}x pixel density`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Step 3: pixel heuristic — flat-color bands at top/bottom
// ---------------------------------------------------------------------------

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img> fallback
    }
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function getBitmapSize(bmp: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  return "width" in bmp && "height" in bmp ? { w: bmp.width, h: bmp.height } : { w: 0, h: 0 };
}

function hasUniformEdgeBands(bmp: ImageBitmap | HTMLImageElement, w: number, h: number): boolean {
  if (w <= 0 || h <= 0) return false;

  const targetW = 48;
  const targetH = Math.max(1, Math.round((h / w) * targetW));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  try {
    ctx.drawImage(bmp as CanvasImageSource, 0, 0, targetW, targetH);
    const { data } = ctx.getImageData(0, 0, targetW, targetH);

    const rowVariance = (rowIndex: number): number => {
      const start = rowIndex * targetW * 4;
      let rSum = 0, gSum = 0, bSum = 0;
      for (let x = 0; x < targetW; x++) {
        const i = start + x * 4;
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }
      const rMean = rSum / targetW, gMean = gSum / targetW, bMean = bSum / targetW;
      let variance = 0;
      for (let x = 0; x < targetW; x++) {
        const i = start + x * 4;
        variance +=
          (data[i] - rMean) ** 2 + (data[i + 1] - gMean) ** 2 + (data[i + 2] - bMean) ** 2;
      }
      return variance / targetW;
    };

    const UNIFORM_THRESHOLD = 60;
    return rowVariance(0) < UNIFORM_THRESHOLD && rowVariance(targetH - 1) < UNIFORM_THRESHOLD;
  } catch {
    return false; // tainted/failed canvas — fail open, don't flag
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Client-side pre-filter only — narrows the UX with a fast, specific
 * rejection message, but is bypassable. The backend MUST re-run equivalent
 * checks on the uploaded bytes rather than trusting `ok: true` here.
 */
export async function inspectImage(file: File): Promise<MetadataInspection> {
  if (!file.type || !file.type.startsWith("image/")) return { ok: true };

  const meta = await scanTextMetadata(file);

  if (meta.bannedHit) {
    const { keyword, field } = meta.bannedHit;
    return {
      ok: false,
      code: "banned_software",
      reason: `We can't accept this image: its "${field}" metadata field mentions "${keyword}", which suggests it was generated or sourced from another platform rather than a photo you took. Please upload an original photo taken directly with your phone or camera — you can also strip metadata by taking a fresh screenshot-free photo instead of re-saving an existing file.`,
      details: [`Metadata field "${field}" contains banned term: "${keyword}"`],
    };
  }

  if (meta.foreignUrlHit) {
    const { url, field } = meta.foreignUrlHit;
    return {
      ok: false,
      code: "foreign_link",
      reason: `We can't accept this image: its "${field}" metadata field contains a link to "${url.slice(0, 60)}", which suggests it was copied from another website rather than a photo you took. Please upload your own original photo instead.`,
      details: [`Metadata field "${field}" contains external link: "${url}"`],
    };
  }

  // --- Heuristic pass: is this actually a screen capture / downloaded image? ---
  const details: string[] = [];
  let score = 0;

  if (!meta.hasAnyMetadata) {
    score += 1;
    details.push("The file has no embedded metadata at all — real camera/phone photos almost always carry some.");
  }
  if (!meta.hasCameraHints) {
    score += 1;
    details.push("No camera capture info was found (make, model, exposure, ISO, GPS, date taken, etc.).");
  }

  try {
    const bmp = await loadBitmap(file);
    if (bmp) {
      const { w: width, h: height } = getBitmapSize(bmp);

      if (width > 0 && height > 0) {
        const resMatch = screenResolutionMatch(width, height);
        if (resMatch) {
          score += 2;
          details.push(`Its dimensions (${width}x${height}) look like a screen capture, not a camera photo — ${resMatch}.`);
        }

        if (hasUniformEdgeBands(bmp, width, height)) {
          score += 2;
          details.push("The very top and bottom of the image are flat, solid colors — typical of a phone status bar, browser toolbar, or app navigation bar in a screenshot.");
        }
      }

      if ("close" in bmp && typeof bmp.close === "function") bmp.close();
    }
  } catch {
    // Pixel analysis failure shouldn't penalize the upload.
  }

  if (score >= MIN_SUSPICION_SCORE_TO_FLAG) {
    const bulletList = details.map((d) => `• ${d}`).join("\n");
    return {
      ok: false,
      code: "screenshot_or_downloaded",
      reason:
        `This looks like a screenshot or an image saved from somewhere else, not a photo you took, because:\n${bulletList}\n\n` +
        `Please open your phone or camera's camera app, take a fresh photo, and upload that instead.`,
      details,
    };
  }

  return { ok: true };
}

/** Back-compat alias for existing call sites. */
export const inspectImageMetadata = inspectImage;