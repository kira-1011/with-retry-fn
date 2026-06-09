/** Options controlling how {@link withRetry} retries a failing operation. */
interface RetryOptions {
  /** Retries after the initial attempt (so `3` allows up to 4 attempts). Default `3`. */
  retries?: number;
  /** Base delay in ms before the first retry. Default `200`. */
  delay?: number;
  /** Upper bound in ms on the backoff delay. Default `500`. */
  maxDelay?: number;
  /** Multiplier applied to the delay on each retry (exponential backoff). Default `2`. */
  factor?: number;
  /** When fired, aborts the retry sequence and the current backoff wait. */
  signal?: AbortSignal;
  /** Return `false` to stop retrying a given error. Default: retry everything. */
  shouldRetry?: (error: unknown) => boolean;
}

/** Resolves after `ms`, or rejects early if `signal` is (or becomes) aborted. */
const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

/**
 * Runs `fn`, retrying with exponential backoff if it rejects.
 *
 * Resolves with the first successful result. Rejects with the original error
 * once retries are exhausted, or immediately if `shouldRetry` returns `false`
 * or `signal` is aborted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retries = 3,
    delay = 200,
    maxDelay = 500,
    factor = 2,
    signal,
    shouldRetry = () => true,
  } = options;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    signal?.throwIfAborted(); // cancelled before this attempt
    try {
      return await fn();
    } catch (error) {
      if (signal?.aborted) throw signal.reason; // cancellation wins over shouldRetry
      if (attempt === retries || !shouldRetry(error)) throw error;

      const backoff = Math.min(delay * factor ** attempt, maxDelay);
      await sleep(backoff, signal);
    }
  }

  // Unreachable: the loop always returns or throws, but TS can't prove it.
  throw new Error("retry-fn: unreachable");
}
