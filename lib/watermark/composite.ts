import "server-only";

import sharp from "sharp";

export type WatermarkOptions = {
  opacity?: number;
  marginRatio?: number;
  widthRatio?: number;
};

async function applyUniformOpacity(pngBuffer: Buffer, opacity: number): Promise<Buffer> {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const copy = Buffer.from(data);
  const clamped = Math.max(0, Math.min(1, opacity));
  for (let i = 3; i < copy.length; i += 4) {
    copy[i] = Math.round(copy[i] * clamped);
  }
  return sharp(copy, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

export async function compositeShopLogoWatermark(
  imageBuffer: Buffer,
  logoBuffer: Buffer,
  options: WatermarkOptions = {},
): Promise<Buffer> {
  const opacity = options.opacity ?? 0.58;
  const marginRatio = options.marginRatio ?? 0.02;
  const widthRatio = options.widthRatio ?? 0.18;

  const meta = await sharp(imageBuffer).rotate().metadata();
  const W = meta.width ?? 1024;
  const H = meta.height ?? 1024;

  const markW = Math.round(Math.min(Math.max(W * widthRatio, 56), 280));
  const margin = Math.max(8, Math.min(Math.round(Math.min(W, H) * marginRatio), 32));

  const resizedLogo = await sharp(logoBuffer)
    .resize({ width: markW, height: markW, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .png()
    .toBuffer();

  const faded = await applyUniformOpacity(resizedLogo, opacity);
  const wmMeta = await sharp(faded).metadata();
  const mw = wmMeta.width ?? 1;
  const mh = wmMeta.height ?? 1;
  const left = Math.max(0, W - mw - margin);
  const top = Math.max(0, H - mh - margin);

  let base = sharp(imageBuffer).rotate();
  if (meta.hasAlpha) {
    base = base.flatten({ background: { r: 255, g: 255, b: 255 } });
  }

  return base
    .composite([{ input: faded, left, top, blend: "over" }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}
