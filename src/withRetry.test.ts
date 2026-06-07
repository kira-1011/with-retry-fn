import { withRetry } from "./withRetry";
import { describe, it, expect, vi } from "vitest";

describe("withRetry", () => {
  it("returns the result when the function succeeds on the first attempt", async () => {
    const fn = vi.fn(async () => "ok"); // a fake async fn that succeeds

    const result = await withRetry(fn);

    expect(result).toBe("ok"); // we got the value back
    expect(fn).toHaveBeenCalledTimes(1); // and it ran exactly once (no retries)
  });

  it("if the function fails the first time but succeeds the second time, withRetry should return the value and have called fn twice.", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Async error"))
      .mockReturnValue("ok");

    const result = await withRetry(fn);

    expect(result).toBe("ok"); // we got the value back
    expect(fn).toHaveBeenCalledTimes(2); // and it ran exactly twice (with retries)
  });

  it("throws the original error when all attempts fail", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(withRetry(fn)).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(2); // initial + 1 retry
  });
});
