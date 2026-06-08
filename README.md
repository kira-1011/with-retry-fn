<div align="center">

<!-- Drop your banner here once you have one (see the logo ideas in the issues / below).
<picture>
  <source srcset="./assets/banner-dark.png" media="(prefers-color-scheme: dark)" />
  <source srcset="./assets/banner-light.png" media="(prefers-color-scheme: light)" />
  <img src="./assets/banner-light.png" alt="retry-fn" width="600" />
</picture>
-->

# retry-fn

**Retry an async function that fails transiently, with a clean, fully-typed API.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat&colorA=000000&colorB=000000)](./LICENSE)
![Module: ESM only](https://img.shields.io/badge/module-ESM%20only-blue?style=flat&colorA=000000&colorB=000000)
![Types: included](https://img.shields.io/badge/types-included-blue?style=flat&colorA=000000&colorB=000000)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-blue?style=flat&colorA=000000&colorB=000000)

<!-- Uncomment once published to npm:
[![npm version](https://img.shields.io/npm/v/retry-fn.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/retry-fn)
[![npm downloads](https://img.shields.io/npm/dm/retry-fn?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/retry-fn)
-->

<p>
  <a href="https://github.com/kira-1011/retry-fn">GitHub</a>
  ·
  <a href="https://github.com/kira-1011/retry-fn/issues">Issues</a>
  ·
  <a href="#api">API</a>
  ·
  <a href="#contributing">Contributing</a>
</p>

</div>

---

`retry-fn` wraps an async operation so that **transient failures are retried
automatically** instead of bubbling up on the first error. Those are the
failures (a brief `503`, a dropped connection, a momentary timeout) that
succeed if you simply try again a moment later. Exponential backoff, a delay
cap, and a "should I even retry this?" predicate are all built in, behind a
single tiny function.

## Why?

Network and I/O calls fail _transiently_: the operation is still valid, the
timing was just unlucky. Without retries, one momentary hiccup fails the whole
operation. And hand-rolled retry loops tend to get the details wrong: no
backoff, retrying errors that will never succeed (like an HTTP `400`), or
swallowing the original error so you can't tell what actually went wrong.
`retry-fn` aims to get those details right behind a tiny API.

## Features

- ♻️ Retries a failing async function automatically
- ⚡ Returns the result as soon as an attempt succeeds
- 📈 Exponential backoff with a configurable growth factor and maximum delay
- 🎯 `shouldRetry` predicate to skip errors that can't succeed (e.g. HTTP `400`)
- 🧩 Rethrows the **original** error when all attempts fail, with no error swallowing
- 🔠 Fully typed: the return type is inferred from your function
- 📦 ESM-only, zero runtime dependencies

## Install

> **Not yet published to npm.** It's coming. For now you can try it by cloning
> the repo (see [Development](#development)). Once released:

```sh
pnpm add retry-fn
# npm install retry-fn  •  yarn add retry-fn
```

Requires a modern ESM environment (Node.js 18+, or any bundler).

## Usage

```ts
import { withRetry } from "retry-fn";

const data = await withRetry(() => fetchFromFlakyApi());
```

If `fetchFromFlakyApi()` rejects, `withRetry` waits and tries again with an
exponentially growing delay, up to the configured number of retries. It
returns as soon as an attempt succeeds; if every attempt fails, the
**original** error is thrown.

The return type flows through automatically, with no annotations needed:

```ts
const user = await withRetry(() => getUser("123"));
//    ^? User (inferred from the function's return type)
```

### With options

```ts
const data = await withRetry(() => callApi(), {
  retries: 5, // up to 5 retries (6 attempts total)
  delay: 200, // base delay in ms
  factor: 2, // delay multiplier per attempt (exponential backoff)
  maxDelay: 5000, // never wait longer than 5s between attempts
  shouldRetry: (
    error, // only retry transient failures
  ) => error instanceof ApiError && error.status >= 500,
});
```

## API

### `withRetry<T>(fn, options?): Promise<T>`

Returns a `Promise<T>` that resolves with `fn`'s result on the first success,
or rejects with the original error once retries are exhausted (or immediately,
if `shouldRetry` rejects the error).

| Param     | Type               | Description                     |
| --------- | ------------------ | ------------------------------- |
| `fn`      | `() => Promise<T>` | The async operation to attempt. |
| `options` | `RetryOptions`     | Optional. See below.            |

#### `RetryOptions`

| Option        | Type                          | Default      | Description                                                                  |
| ------------- | ----------------------------- | ------------ | ---------------------------------------------------------------------------- |
| `retries`     | `number`                      | `3`          | Retries after the initial attempt (so `3` means up to 4 attempts total).     |
| `delay`       | `number`                      | `200`        | Base delay in ms before the first retry.                                     |
| `factor`      | `number`                      | `2`          | Multiplier applied to the delay on each subsequent retry (the backoff base). |
| `maxDelay`    | `number`                      | `500`        | Upper bound in ms on the backoff delay.                                      |
| `shouldRetry` | `(error: unknown) => boolean` | `() => true` | Decides whether a given error is worth retrying.                             |

**Backoff:** the wait before retry _n_ (0-indexed) is `min(delay × factorⁿ, maxDelay)`.
With the defaults that's 200 ms, 400 ms, then 500 ms (capped), and so on.

## Development

```sh
pnpm install      # install dependencies
pnpm test         # run tests (Vitest, watch mode)
pnpm typecheck    # type-check with tsc
pnpm build        # build with tsdown -> dist/
pnpm check:pkg    # validate the publishable package (publint + are-the-types-wrong)
pnpm check        # lint & format check (Biome)
pnpm check:fix    # auto-fix lint & format issues
```

Built with [tsdown](https://tsdown.dev), tested with [Vitest](https://vitest.dev),
linted and formatted with [Biome](https://biomejs.dev). The package is ESM-only
and verified with [publint](https://publint.dev) and
[are-the-types-wrong](https://arethetypeswrong.github.io).

## Contributing

Contributions are welcome. `retry-fn` is open source (MIT) and built in the
open. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup, the development
workflow, and the PR checklist, and please follow our
**[Code of Conduct](./CODE_OF_CONDUCT.md)**.

**Found a bug or have an idea?** Open an
[issue](https://github.com/kira-1011/retry-fn/issues). For larger features, a
quick issue to discuss the approach before a PR is appreciated.

## Security

Found a vulnerability? Please report it responsibly via our
**[Security Policy](./SECURITY.md)**. Don't open public issues for security
problems.

## License

[MIT](./LICENSE) © Kirubel
