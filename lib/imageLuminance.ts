export type ImageTone = {
  luminance: number;
  isDark: boolean;
  averageRgb: [number, number, number];
};

const DEFAULT_TONE: ImageTone = {
  luminance: 0.32,
  isDark: true,
  averageRgb: [80, 80, 80],
};

const toneCache = new Map<string, ImageTone>();
const pending = new Map<string, Promise<ImageTone>>();

function srgbToLinear(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function defaultTone(): ImageTone {
  return DEFAULT_TONE;
}

export function getCachedTone(url: string | null | undefined): ImageTone | undefined {
  if (!url) return undefined;
  return toneCache.get(url);
}

export function analyzeImageTone(url: string): Promise<ImageTone> {
  if (typeof window === "undefined" || !url) {
    return Promise.resolve(DEFAULT_TONE);
  }

  const cached = toneCache.get(url);
  if (cached) return Promise.resolve(cached);

  const inflight = pending.get(url);
  if (inflight) return inflight;

  const run = new Promise<ImageTone>((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    const finish = (tone: ImageTone) => {
      toneCache.set(url, tone);
      pending.delete(url);
      resolve(tone);
    };

    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          finish(DEFAULT_TONE);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let lumSum = 0;
        let wSum = 0;

        for (let y = 0; y < size; y++) {
          const rowWeight = y >= size / 2 ? 1.75 : 1.0;
          for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const a = data[i + 3] / 255;
            if (a < 0.1) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const lum =
              0.2126 * srgbToLinear(r) +
              0.7152 * srgbToLinear(g) +
              0.0722 * srgbToLinear(b);

            rSum += r * rowWeight;
            gSum += g * rowWeight;
            bSum += b * rowWeight;
            lumSum += lum * rowWeight;
            wSum += rowWeight;
          }
        }

        if (wSum === 0) {
          finish(DEFAULT_TONE);
          return;
        }

        const luminance = Math.max(0, Math.min(1, lumSum / wSum));
        const avgRgb: [number, number, number] = [
          Math.round(rSum / wSum),
          Math.round(gSum / wSum),
          Math.round(bSum / wSum),
        ];

        finish({
          luminance,
          isDark: luminance < 0.5,
          averageRgb: avgRgb,
        });
      } catch {
        finish(DEFAULT_TONE);
      }
    };

    img.onerror = () => finish(DEFAULT_TONE);
    img.src = url;
  });

  pending.set(url, run);
  return run;
}
