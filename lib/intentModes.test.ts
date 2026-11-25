import { afterEach, describe, expect, it } from "vitest";

import { currentIntentModes, overridesFromRows, setIntentModes } from "./intentModes";
import { allowsSeeking, effectiveIntentMode } from "./listingIntent";
import { intentError, metaWithIntent, metaWithOpportunityCategory, withIntentMeta } from "./listingIntentForm";

describe("intent mode fallback", () => {
  afterEach(() => setIntentModes({}));

  it("uses the code defaults when the API has not answered", () => {
    expect(currentIntentModes()).toEqual({});
    expect(allowsSeeking("professional_jobs", currentIntentModes())).toBe(true);
    expect(allowsSeeking("tenders_contracts", currentIntentModes())).toBe(false);
  });

  it("keeps only well-formed rows from the API", () => {
    expect(
      overridesFromRows([
        { opportunity_category: "domestic_jobs", intent_mode: "offering_only" },
        { opportunity_category: "furniture", intent_mode: "offering_only" },
        { opportunity_category: "volunteer", intent_mode: "sometimes" },
        null,
      ]),
    ).toEqual({ domestic_jobs: "offering_only" });
    expect(overridesFromRows({ detail: "boom" })).toEqual({});
  });

  it("never makes a category without seeking wording two-way", () => {
    expect(effectiveIntentMode("scholarships_training", { scholarships_training: "bidirectional" })).toBe("offering_only");
  });

  it("follows the loaded admin mode in the form helpers", () => {
    // Arrange
    setIntentModes({ professional_jobs: "offering_only" });
    const seeking = metaWithIntent({}, "seeking");

    // Act / Assert
    expect(metaWithOpportunityCategory(seeking, "professional_jobs").intent).toBe("offering");
    expect(intentError("opportunity", { opportunity_category: "professional_jobs" }, "Professional Jobs")).toBeNull();
    expect(withIntentMeta("opportunity", { ...seeking, opportunity_category: "professional_jobs" }, "Professional Jobs", {}).intent).toBe("offering");
    expect(metaWithOpportunityCategory(seeking, "domestic_jobs").intent).toBe("seeking");
  });
});
