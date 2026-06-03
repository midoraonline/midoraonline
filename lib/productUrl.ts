const SLUG_SEP = "--";

export function slugifyProductTitle(title: string): string {
  const s = title.trim().toLowerCase();
  const slug = s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "item";
}

export function productPageSlug(p: { id: string; title: string }): string {
  return `${slugifyProductTitle(p.title)}${SLUG_SEP}${p.id}`;
}

export function resolveProductIdFromPageSlug(param: string): string {
  const i = param.indexOf(SLUG_SEP);
  if (i === -1) return param;
  const id = param.slice(i + SLUG_SEP.length);
  return id.length > 0 ? id : param;
}
