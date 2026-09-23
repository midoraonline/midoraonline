/** Composite a transparent cutout onto a solid background color. */

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

export const BG_COLOR_PRESETS = [
  { label: "White", value: "#ffffff" },
  { label: "Light gray", value: "#f3f4f6" },
  { label: "Cream", value: "#faf7f2" },
  { label: "Black", value: "#111827" },
  { label: "Brand soft", value: "#eef2ff" },
] as const;

export async function compositeOnColor(
  cutout: Blob,
  hex: string,
): Promise<Blob> {
  const bitmap = await createImageBitmap(cutout);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    const { r, g, b } = parseHex(hex || "#ffffff");
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Composite failed"))),
        "image/jpeg",
        0.92,
      );
    });
    return blob;
  } finally {
    bitmap.close();
  }
}
