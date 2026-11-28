import { describe, expect, it } from "vitest";
import { normalizeCategoryFields } from "@/lib/listingMeta";
import {
  acceptAttribute,
  attachmentsInMeta,
  DEFAULT_FILE_SPEC,
  downloadLabel,
  fileProblem,
  fileSpecOf,
  formatFileSize,
  isFileField,
  mimeFor,
  parseFileValue,
  withFileFields,
  type FileFieldSpec,
} from "@/lib/listingAttachment";

const pdf = { url: "https://abc.ufs.sh/f/KEY", mime: "application/pdf", name: "Tender notice.pdf", size: 1_258_291 };

describe("listing attachments", () => {
  it("parses stored file values and ignores anything else", () => {
    expect(parseFileValue(pdf)).toEqual(pdf);
    expect(parseFileValue({ url: "javascript:alert(1)", name: "x" })).toBeNull();
    expect(parseFileValue("https://abc.ufs.sh/f/KEY")).toBeNull();
    expect(parseFileValue({ url: "https://abc.ufs.sh/f/K2" })).toEqual({ url: "https://abc.ufs.sh/f/K2", name: "Attachment", size: 0, mime: "" });
    expect(attachmentsInMeta({ attachment: pdf, deadline: "2026-12-01", other: { foo: 1 } })).toEqual([{ key: "attachment", file: pdf }]);
  });

  it("formats download labels and sizes", () => {
    expect(downloadLabel(pdf)).toBe("Download Tender notice.pdf (PDF, 1.2 MB)");
    expect(downloadLabel({ ...pdf, name: "cv", mime: "application/msword", size: 0 })).toBe("Download cv (Word)");
    expect(formatFileSize(800)).toBe("800 B");
    expect(formatFileSize(20_480)).toBe("20 KB");
    expect(formatFileSize(12 * 1024 * 1024)).toBe("12 MB");
  });

  it("restores file fields that normalizeCategoryFields reads as text", () => {
    const raw = [
      { key: "attachment", label: "Tender document", type: "file", required: true, accept: ["pdf"], max_size_mb: 5 },
      { key: "organisation", label: "Organisation", type: "text" },
    ];
    const fields = withFileFields(normalizeCategoryFields(raw), raw);
    expect(isFileField(fields[0])).toBe(true);
    expect(fileSpecOf(fields[0])).toEqual({ accept: ["pdf"], maxSizeMb: 5 });
    expect(isFileField(fields[1])).toBe(false);
    expect(fileSpecOf({ key: "a", label: "A", kind: "file" })).toEqual(DEFAULT_FILE_SPEC);
  });

  it("checks type and size before uploading", () => {
    const s: FileFieldSpec = { accept: ["pdf", "doc"], maxSizeMb: 1 };
    expect(fileProblem({ name: "a.pdf", size: 1000, type: "application/pdf" }, s)).toBeNull();
    expect(fileProblem({ name: "a.docx", size: 1000, type: mimeFor({ name: "a.docx", type: "" }) }, s)).toBeNull();
    expect(fileProblem({ name: "a.png", size: 1000, type: "image/png" }, s)).toMatch(/PDF or Word/);
    expect(fileProblem({ name: "a.pdf", size: 2 * 1024 * 1024, type: "application/pdf" }, s)).toMatch(/over 1 MB/);
    expect(mimeFor({ name: "scan.JPG", type: "application/octet-stream" })).toBe("image/jpeg");
    expect(acceptAttribute({ accept: ["pdf"], maxSizeMb: 1 })).toBe("application/pdf,.pdf");
  });
});
