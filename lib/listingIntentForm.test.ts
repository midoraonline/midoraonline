import { describe, expect, it } from "vitest";

import {
  categoryLabelFor,
  intentError,
  intentPreview,
  metaWithIntent,
  metaWithOpportunityCategory,
  normalizeApplicationLink,
  titleLengthError,
  withIntentMeta,
} from "./listingIntentForm";

describe("normalizeApplicationLink", () => {
  it.each([
    ["example.com/apply", "https://example.com/apply"],
    ["http://example.com/jobs", "https://example.com/jobs"],
    ["https://forms.gle/abc", "https://forms.gle/abc"],
  ])("normalises %s", (raw, expected) => {
    expect(normalizeApplicationLink(raw)).toEqual({ value: expected, error: null });
  });

  it.each(["javascript:alert(1)", "data:text/html,hi", "ftp://example.com", "localhost", "mailto:a@b.co"])(
    "rejects %s",
    (raw) => {
      expect(normalizeApplicationLink(raw).error).toBeTruthy();
    },
  );

  it("treats empty as optional", () => {
    expect(normalizeApplicationLink("  ")).toEqual({ value: null, error: null });
  });

  it("rejects links over the limit", () => {
    expect(normalizeApplicationLink(`https://example.com/${"a".repeat(500)}`).error).toMatch(/500/);
  });
});

describe("opportunity intent", () => {
  it("resets to offering for offering-only categories", () => {
    const meta = metaWithOpportunityCategory(metaWithIntent({}, "seeking"), "internships_graduate_training");
    expect(meta.intent).toBe("offering");
    expect(intentError("opportunity", meta, "Internships & Graduate Training")).toBeNull();
  });

  it("keeps the choice for bidirectional categories and requires one", () => {
    const meta = metaWithOpportunityCategory({}, "professional_jobs");
    expect(intentError("opportunity", meta, "Professional Jobs")).toBeTruthy();
    const seeking = metaWithIntent(meta, "seeking");
    expect(intentPreview("opportunity", seeking, "Professional Jobs")).toEqual({
      categoryLabel: "Professional Jobs",
      intentLabel: "SEEKING WORK",
      ctaLabel: "Contact",
    });
    expect(metaWithOpportunityCategory(seeking, "volunteer").intent).toBe("seeking");
  });

  it("stores category, kind and intent on save", () => {
    const raw = { ...metaWithOpportunityCategory({}, "tenders_contracts"), application_link: "gov.ug/tender" };
    expect(withIntentMeta("opportunity", raw, "Tenders & Contracts", {})).toEqual({
      opportunity_category: "tenders_contracts",
      opportunity_kind: "other",
      intent: "offering",
      application_link: "https://gov.ug/tender",
    });
  });

  it("uses the old subcategory label when the category list is not migrated", () => {
    const items = [{ label: "Full-time Jobs", parent_slug: "opportunities" }];
    expect(categoryLabelFor("professional_jobs", items)).toBe("Full-time Jobs");
    expect(categoryLabelFor("professional_jobs", [{ label: "Professional Jobs", parent_slug: "opportunities" }])).toBe(
      "Professional Jobs",
    );
  });
});

describe("service intent", () => {
  it("requires offer or need and never reads the title", () => {
    expect(intentError("service", {}, "Plumbing")).toBeTruthy();
    expect(withIntentMeta("service", { intent: "seeking" }, "Plumbing", {})).toEqual({ intent: "seeking" });
    expect(intentPreview("service", { intent: "seeking" }, "Plumbing").ctaLabel).toBe("Respond");
  });
});

describe("titleLengthError", () => {
  it("allows 80 and rejects 81", () => {
    expect(titleLengthError("a".repeat(80))).toBeNull();
    expect(titleLengthError("a".repeat(81))).toBeTruthy();
  });
});
