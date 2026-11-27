import { describe, expect, it } from "vitest";
import { cardVisual, readCardIntent, safeApplicationLink } from "./cardIntent";

describe("readCardIntent", () => {
  it("prefers server values", () => {
    const r = readCardIntent({
      item_type: "opportunity",
      listing_meta: { intent: "seeking", opportunity_category: "professional_jobs" },
      intent: "offering",
      intent_label: "JOB OPENING",
      cta: "apply",
      opportunity_category: "professional_jobs",
    });
    expect(r).toEqual({ intent: "offering", label: "JOB OPENING", cta: "apply", opportunityCategory: "professional_jobs" });
  });

  it("falls back to the client resolver when the server sends nothing", () => {
    const r = readCardIntent({ item_type: "service", listing_meta: { intent: "seeking" } });
    expect(r.label).toBe("SERVICE NEEDED");
    expect(r.cta).toBe("respond");
  });

  it("maps legacy subcategory labels and forces offering on offering-only categories", () => {
    const r = readCardIntent({ item_type: "opportunity", listing_meta: {}, category: "Opportunities > Tenders & Contracts" });
    expect(r).toMatchObject({ intent: "offering", label: "OPPORTUNITY", cta: "view_details" });
  });

  it("keeps a server null label (never guessed) and ignores unknown cta keys", () => {
    const r = readCardIntent({ item_type: "service", listing_meta: { intent: "offering" }, intent_label: null, cta: "bogus" as never });
    expect(r.label).toBeNull();
    expect(r.cta).toBe("whatsapp");
  });

  it("gives products no intent text", () => {
    expect(readCardIntent({ item_type: "product", listing_meta: { intent: "offering" } }).label).toBeNull();
  });
});

describe("cardVisual", () => {
  it("follows category, not intent", () => {
    expect(cardVisual("service", null)).toBe("/visuals/service-universal.svg");
    expect(cardVisual("opportunity", "volunteer")).toBe("/visuals/opportunity-volunteer.svg");
    expect(cardVisual("product", null)).toBeNull();
  });

  it("picks a service illustration from the subcategory label or slug", () => {
    expect(cardVisual("service", null, "Services > Photography & Videography")).toBe("/visuals/service-photography.svg");
    expect(cardVisual("service", null, "services/cleaning-services")).toBe("/visuals/service-cleaning.svg");
    expect(cardVisual("service", null, "Services > Tech & IT Services")).toBe("/visuals/service-tech.svg");
    expect(cardVisual("service", null, "Services > Professional & Consulting")).toBe("/visuals/service-consulting.svg");
    expect(cardVisual("service", null, "Services > Something New")).toBe("/visuals/service-universal.svg");
  });
});

describe("safeApplicationLink", () => {
  it("upgrades http and rejects other schemes", () => {
    expect(safeApplicationLink("http://www.example.com/jobs")).toEqual({ href: "https://www.example.com/jobs", host: "example.com" });
    expect(safeApplicationLink("javascript:alert(1)")).toBeNull();
    expect(safeApplicationLink("data:text/html,hi")).toBeNull();
    expect(safeApplicationLink("")).toBeNull();
  });
});
