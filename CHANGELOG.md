# with-retry-fn

## 0.1.1

### Patch Changes

- 3e5445f: Validate retry options and reject invalid input (negative/NaN delay, maxDelay, factor; non-integer/negative retries) with a clear RangeError
