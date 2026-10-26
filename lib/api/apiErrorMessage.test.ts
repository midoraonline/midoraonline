import { describe, expect, it } from "vitest";
import { ApiError, apiErrorMessage } from "./base";

const FALLBACK = "Couldn't submit report. Try again.";

describe("apiErrorMessage", () => {
  it("shows the server message for a 409", () => {
    // Arrange
    const err = new ApiError("You have already reported this listing.", 409, { detail: "x" });
    // Act
    const message = apiErrorMessage(err, FALLBACK);
    // Assert
    expect(message).toBe("You have already reported this listing.");
  });

  it.each([
    new ApiError("boom", 500, { detail: "boom" }),
    new ApiError("Request failed with status 400", 400, {}),
    new Error("network"),
    "nope",
  ])("falls back for %s", (err) => {
    // Act
    const message = apiErrorMessage(err, FALLBACK);
    // Assert
    expect(message).toBe(FALLBACK);
  });
});
