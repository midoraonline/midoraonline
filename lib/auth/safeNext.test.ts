import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safeNext";

describe("safeNextPath", () => {
  it("keeps internal paths with query and hash", () => {
    // Arrange
    const input = "/products/abc?tab=reviews#write";
    // Act
    const result = safeNextPath(input);
    // Assert
    expect(result).toBe("/products/abc?tab=reviews#write");
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "/\t/evil.com",
    "evil.com",
    "",
    null,
    undefined,
  ])("rejects %s", (input) => {
    // Act
    const result = safeNextPath(input);
    // Assert
    expect(result).toBeNull();
  });
});
