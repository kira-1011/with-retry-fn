export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const N_RETRIES = 1;
  const DELAY = 200;
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempts = 0; attempts <= N_RETRIES; attempts += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempts === N_RETRIES) {
        throw error;
      }
      // Delay
      await delay(DELAY);
    }
  }

  throw Error("Unreachable");
}
