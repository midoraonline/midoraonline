import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/state/session-store", () => ({ useSessionStore: vi.fn() }));

import { settingsHref } from "./settingsHref";

describe("settingsHref", () => {
  it.each([
    ["customer", "/customer/settings"],
    ["merchant", "/merchant/settings"],
    ["admin", "/admin/settings"],
    ["staff", "/admin/settings"],
    [null, "/customer/settings"],
    [undefined, "/customer/settings"],
  ])("routes %s to %s", (role, expected) => {
    // Act
    const href = settingsHref(role);
    // Assert
    expect(href).toBe(expected);
  });

  it("appends the section hash", () => {
    // Act
    const href = settingsHref("customer", "profile-photo");
    // Assert
    expect(href).toBe("/customer/settings#profile-photo");
  });
});
