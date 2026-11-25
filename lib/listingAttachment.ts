import type { CategoryMetaField } from "@/lib/listingMeta";

/** `listing_meta[key]` for a category file field (mirrors nestapi file-field.ts). */
export type FileFieldValue = { url: string; name: string; size: number; mime: string };
export type FileKind = "pdf" | "doc" | "image";
export type FileFieldSpec = { accept: FileKind[]; maxSizeMb: number };
export type FileMetaField = CategoryMetaField & { accept?: string[]; max_size_mb?: number };

export const DEFAULT_FILE_SPEC: FileFieldSpec = { accept: ["pdf", "doc", "image"], maxSizeMb: 10 };
const FILE_TYPE_NAMES = new Set(["file", "attachment", "upload", "document"]);

const KIND_MIMES: Record<FileKind, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
};
const KIND_EXTENSIONS: Record<FileKind, string[]> = {
  pdf: ["pdf"],
  doc: ["doc", "docx"],
  image: ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"],
};
const KIND_LABEL: Record<FileKind, string> = { pdf: "PDF", doc: "Word", image: "image" };

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
};

/** Kind of a file from its MIME type (inferred from the extension when missing). */
export function fileKindOf(mime: string, name: string): FileKind | null {
  const m = mimeFor({ name, type: mime });
  return (Object.keys(KIND_MIMES) as FileKind[]).find((k) => KIND_MIMES[k].includes(m)) ?? null;
}

export function isFileField(field: CategoryMetaField): boolean {
  return FILE_TYPE_NAMES.has(String(field.type || field.kind || "").toLowerCase());
}

export function fileSpecOf(field: FileMetaField): FileFieldSpec {
  const accept = (field.accept ?? []).filter((k): k is FileKind => k in KIND_MIMES);
  const max = Number(field.max_size_mb);
  return {
    accept: accept.length ? accept : DEFAULT_FILE_SPEC.accept,
    maxSizeMb: Number.isFinite(max) && max > 0 ? max : DEFAULT_FILE_SPEC.maxSizeMb,
  };
}

/**
 * `normalizeCategoryFields` reads unknown types as text and drops file options;
 * restore them from the raw API fields by key.
 */
export function withFileFields(fields: CategoryMetaField[], raw: unknown): FileMetaField[] {
  const rows = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  return fields.map((field) => {
    const row = rows.find((r) => r && typeof r === "object" && String(r.key ?? r.name ?? "").trim() === field.key);
    const type = String(row?.type ?? row?.kind ?? "").toLowerCase();
    if (!row || !FILE_TYPE_NAMES.has(type)) return field;
    const out: FileMetaField = { ...field, type: "file", kind: "file" };
    if (Array.isArray(row.accept)) out.accept = row.accept.map(String);
    if (typeof row.max_size_mb === "number") out.max_size_mb = row.max_size_mb;
    return out;
  });
}

/** `accept` attribute for the file picker. */
export function acceptAttribute(spec: FileFieldSpec): string {
  return spec.accept.flatMap((k) => [...KIND_MIMES[k], ...KIND_EXTENSIONS[k].map((e) => `.${e}`)]).join(",");
}

export function describeAccept(spec: FileFieldSpec): string {
  return `${spec.accept.map((k) => KIND_LABEL[k]).join(", ")} up to ${spec.maxSizeMb} MB`;
}

/** Client-side check before uploading; the API repeats it on save. */
export function fileProblem(file: { name: string; size: number; type: string }, spec: FileFieldSpec): string | null {
  const kind = fileKindOf(file.type, file.name);
  if (!kind || !spec.accept.includes(kind)) return `Choose a ${spec.accept.map((k) => KIND_LABEL[k]).join(", ")} file.`;
  if (file.size > spec.maxSizeMb * 1024 * 1024) return `That file is over ${spec.maxSizeMb} MB. Pick a smaller one.`;
  if (file.size <= 0) return "That file is empty.";
  return null;
}

/** The MIME type the API expects; browsers sometimes leave `type` empty or generic for Word files. */
export function mimeFor(file: { name: string; type: string }): string {
  const type = file.type.trim().toLowerCase();
  if (type && type !== "application/octet-stream") return type;
  const ext = extensionOf(file.name);
  const kind = (Object.keys(KIND_EXTENSIONS) as FileKind[]).find((k) => KIND_EXTENSIONS[k].includes(ext));
  if (!kind) return type;
  if (kind === "image") return ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return KIND_MIMES[kind][kind === "doc" && ext === "docx" ? 1 : 0];
}

/** A stored value, or null for anything that is not a complete file object. */
export function parseFileValue(raw: unknown): FileFieldValue | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.url !== "string" || !/^https:\/\//i.test(v.url)) return null;
  const name = typeof v.name === "string" && v.name.trim() ? v.name.trim() : "Attachment";
  const size = typeof v.size === "number" && v.size > 0 ? v.size : 0;
  return { url: v.url, name, size, mime: typeof v.mime === "string" ? v.mime : "" };
}

export function formatFileSize(bytes: number): string {
  if (!(bytes > 0)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** "PDF", "DOCX", "JPG"… for the download link. */
export function fileTypeLabel(value: Pick<FileFieldValue, "name" | "mime">): string {
  const ext = extensionOf(value.name);
  if (ext) return ext.toUpperCase();
  const kind = fileKindOf(value.mime, value.name);
  return kind === "pdf" ? "PDF" : kind === "doc" ? "Word" : kind === "image" ? "Image" : "File";
}

/** "Download Tender notice.pdf (PDF, 1.2 MB)". */
export function downloadLabel(value: FileFieldValue): string {
  const facts = [fileTypeLabel(value), formatFileSize(value.size)].filter(Boolean).join(", ");
  return `Download ${value.name}${facts ? ` (${facts})` : ""}`;
}

/** File values in listing_meta, keyed like the meta (for the detail page). */
export function attachmentsInMeta(meta: Record<string, unknown> | null | undefined): { key: string; file: FileFieldValue }[] {
  return Object.entries(meta ?? {}).flatMap(([key, raw]) => {
    const file = parseFileValue(raw);
    return file ? [{ key, file }] : [];
  });
}
