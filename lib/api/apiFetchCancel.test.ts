import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiErrorMessage, apiFetch, apiHttp, isCanceledError } from "./base";

function rejectWith(code: string) {
  return vi.spyOn(apiHttp, "request").mockRejectedValue(new AxiosError("x", code));
}

describe("apiFetch cancel vs timeout", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports a caller abort as canceled, not timeout", async () => {
    // Arrange
    rejectWith("ERR_CANCELED");
    const ac = new AbortController();
    ac.abort();
    // Act
    const err = await apiFetch("http://api.test/x", { signal: ac.signal }).catch((e: unknown) => e);
    // Assert
    expect(isCanceledError(err)).toBe(true);
    expect(apiErrorMessage(err, "fallback")).toBe("fallback");
  });

  it("reports an axios timeout as timeout", async () => {
    // Arrange
    rejectWith("ECONNABORTED");
    // Act
    const err = await apiFetch("http://api.test/x").catch((e: unknown) => e);
    // Assert
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("timeout");
  });

  it("treats an AbortSignal.timeout() abort as timeout", async () => {
    // Arrange
    rejectWith("ERR_CANCELED");
    const ac = new AbortController();
    ac.abort(new DOMException("t", "TimeoutError"));
    // Act
    const err = await apiFetch("http://api.test/x", { signal: ac.signal }).catch((e: unknown) => e);
    // Assert
    expect((err as ApiError).code).toBe("timeout");
  });
});
