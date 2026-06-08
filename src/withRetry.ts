interface RetryOptions {
  retries?: number;
  delay?: number; // ms
  maxDelay?: number; // max delay cap
  factor?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions = {},
): Promise<T> {
  const {
    retries = 3,
    delay = 200,
    maxDelay = 500,
    factor = 2,
    shouldRetry = () => true,
  } = retryOptions;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempts = 0; attempts <= retries; attempts += 1) {
    const currentDelay = Math.min(delay * factor ** attempts, maxDelay);
    try {
      return await fn();
    } catch (error) {
      if (attempts === retries || !shouldRetry(error)) {
        throw error;
      }
      // sleep
      await sleep(currentDelay);
    }
  }

  throw Error("Unreachable");
}
