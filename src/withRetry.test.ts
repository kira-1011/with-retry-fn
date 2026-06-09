import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./withRetry";

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
    await expect(withRetry(fn, { retries: 1 })).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it("retries up to the configured number of times, then throws", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("boom")); // always fails
    await expect(withRetry(fn, { retries: 3 })).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it("uses the default retry count when no options are given", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(withRetry(fn)).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(4); // default 3 retries + 1 initial
  });

  it("increases the delay exponentially on each retry", async () => {
    vi.useFakeTimers(); // swap in the fake clock
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const fn = vi.fn().mockRejectedValue(new Error("boom"));

    const promise = withRetry(fn, { retries: 2, delay: 100 });
    promise.catch(() => {}); // swallow rejection so it's not "unhandled"

    await vi.runAllTimersAsync(); // run all timers, flushing promises between them

    await expect(promise).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries

    // the delays handed to setTimeout should have GROWN: 100, then 200
    const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
    expect(delays).toEqual([100, 200]);

    vi.useRealTimers(); // ALWAYS restore real timers after
  });

  it("caps the delay at maxDelay", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const fn = vi.fn().mockRejectedValue(new Error("boom"));

    const promise = withRetry(fn, { retries: 3, delay: 100, maxDelay: 150 });
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    const delays = setTimeoutSpy.mock.calls.map((c) => c[1]);
    expect(delays).toEqual([100, 150, 150]); // grows to 100, would-be-200 capped to 150, capped
    vi.useRealTimers();
  });

  it("retries only the errors shouldRetry accepts", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("retryable"))
      .mockRejectedValueOnce(new Error("fatal"))
      .mockResolvedValue("ok");
    const shouldRetry = (err: unknown) =>
      (err as Error).message === "retryable";

    await expect(withRetry(fn, { retries: 5, shouldRetry })).rejects.toThrow(
      "fatal",
    );
    expect(fn).toHaveBeenCalledTimes(2); // retried the first, stopped at the second
  });

  it("scales the backoff by a custom factor", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const fn = vi.fn().mockRejectedValue(new Error("boom"));

    const promise = withRetry(fn, { retries: 2, delay: 100, factor: 3 });
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    const delays = setTimeoutSpy.mock.calls.map((c) => c[1]);
    expect(delays).toEqual([100, 300]); // 100, then 100×3 (still under the 500 cap)
    vi.useRealTimers();
  });

  it("rejects without calling fn if the signal is already aborted", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const signal = AbortSignal.abort(); // a signal that starts out aborted
    await expect(withRetry(fn, { signal })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(0); // never even tried
  });

  it("interrupts the backoff wait immediately when aborted mid-sleep", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(new Error("boom"));

    const promise = withRetry(fn, {
      retries: 5,
      delay: 1000,
      signal: controller.signal,
    });
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(0); // let attempt 0 fail and enter the 1000ms sleep
    expect(fn).toHaveBeenCalledTimes(1);

    controller.abort(); // abort partway through the wait
    await vi.advanceTimersByTimeAsync(0); // flush microtasks (NOT the full 1000ms)

    await expect(promise).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1); // never retried, and didn't wait out the timer
  });

  it("stops on abort without consulting shouldRetry", async () => {
    const controller = new AbortController();
    const shouldRetry = vi.fn(() => true);
    const fn = vi.fn().mockImplementation(async () => {
      controller.abort(); // the underlying op got cancelled
      throw new Error("op failed"); // and surfaced its own error
    });

    await expect(
      withRetry(fn, { retries: 5, signal: controller.signal, shouldRetry }),
    ).rejects.toThrow();

    expect(fn).toHaveBeenCalledTimes(1); // no retry
    expect(shouldRetry).not.toHaveBeenCalled(); // abort short-circuited before shouldRetry
  });

  it("applies full jitter to the delay when enabled", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5); // deterministic jitter
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const fn = vi.fn().mockRejectedValue(new Error("boom"));

    const promise = withRetry(fn, { retries: 1, delay: 100, jitter: true });
    promise.catch(() => {});
    await vi.runAllTimersAsync();

    const delays = setTimeoutSpy.mock.calls.map((c) => c[1]);
    expect(delays).toEqual([50]); // 0.5 × min(100×2^0, 500) = 0.5 × 100
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});
