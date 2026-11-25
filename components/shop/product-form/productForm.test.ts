import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/base";
import type { CategoryMetaField } from "@/lib/listingMeta";
import { emptyDraft } from "./draft";
import { buildQualityRequest, detailValue } from "./qualityRequest";
import { intentErrorsFor, invalidSectionsFor, sectionForError } from "./validation";

const parts = { parentLabel: "Jobs", subcategoryLabel: null };

describe("detailValue", () => {
  it("formats scalars, booleans and arrays", () => {
    expect(detailValue(undefined)).toBe("");
    expect(detailValue(true)).toBe("yes");
    expect(detailValue(false)).toBe("no");
    expect(detailValue(3)).toBe("3");
    expect(detailValue(["a", "b", null])).toBe("a, b");
  });

  it("sends the file name, never [object Object]", () => {
    const file = { url: "https://cdn.example/cv.pdf", name: "cv.pdf", mime: "application/pdf", size: 10 };
    expect(detailValue(file)).toBe("cv.pdf");
    expect(detailValue({ foo: 1 })).toBe("");
  });
});

describe("buildQualityRequest", () => {
  it("includes category field values by label", () => {
    const draft = {
      ...emptyDraft("opportunity"),
      title: " Clerk ",
      meta: { cv: { url: "https://cdn.example/cv.pdf", name: "cv.pdf", mime: "application/pdf", size: 1 } },
    };
    const fields = [{ key: "cv", label: "CV" }] as CategoryMetaField[];
    const req = buildQualityRequest(draft as never, fields, parts);
    expect(req.title).toBe("Clerk");
    expect(req.details?.CV).toBe("cv.pdf");
    expect(req.details).toHaveProperty("Budget / pay (UGX)");
    expect(req.category).toBe("Jobs");
    expect(req.listing_kind).toBe("opportunity");
  });
});

describe("sectionForError", () => {
  it("maps API codes and falls back to the message", () => {
    expect(sectionForError(new ApiError("x", 400, { code: "invalid_intent" }))).toBe("intent");
    expect(sectionForError(new ApiError("x", 400, { code: "title_too_long" }))).toBe("details");
    expect(sectionForError(new ApiError("x", 400, { code: "invalid_application_link" }))).toBe("meta");
    expect(sectionForError(new ApiError("x", 400, { code: "listing_fields_required" }))).toBe("meta");
    expect(sectionForError(new ApiError("Price is too low", 400))).toBe("price");
    expect(sectionForError(new Error("price"))).toBeNull();
  });
});

describe("validation helpers", () => {
  it("flags an over-long title", () => {
    const draft = { ...emptyDraft("product"), title: "x".repeat(500) };
    expect(intentErrorsFor("edit", draft).title).toBeTruthy();
  });

  it("highlights sections only after submit, except server errors", () => {
    const base = {
      errors: { images: "Add photos", category: "Pick one" },
      intentErrors: {},
      kind: "opportunity" as const,
      saleKind: "empty" as const,
      serverFieldErrors: {},
      mediaError: null,
      linkServerError: "bad link",
      serverSection: null,
    };
    expect([...invalidSectionsFor({ ...base, showErrors: false })]).toEqual(["meta"]);
    expect(invalidSectionsFor({ ...base, showErrors: true })).toEqual(new Set(["media", "intent", "meta"]));
  });
});
