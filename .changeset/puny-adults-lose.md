---
"with-retry-fn": patch
---

Validate retry options and reject invalid input (negative/NaN delay, maxDelay, factor; non-integer/negative retries) with a clear RangeError
