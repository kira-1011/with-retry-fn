# retry-fn

> Retry an async function that fails transiently — with a clean, fully-typed API.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Status](https://img.shields.io/badge/status-early%20development-orange)
![Module](https://img.shields.io/badge/module-ESM%20only-blue)

`retry-fn` wraps an async operation so that **transient failures are retried
automatically** instead of bubbling up on the first error — the kinds of
failures (a brief `503`, a dropped connection, a momentary timeout) that
succeed if you simply try again a moment later.

> **⚠️ Early development.** This is being built incrementally as a learning
> project. It is **pre-1.0**, the API **will change**, and it is **not yet
> published to npm**. See the [Roadmap](#roadmap) for what's planned.

## Why?

Network and I/O calls fail _transiently_: the operation is still valid, the
timing was just unlucky. Without retries, one momentary hiccup fails the whole
operation. And hand-rolled retry loops tend to get the details wrong — no
backoff, retrying errors that will never succeed (like an HTTP `400`), or
swallowing the original error so you can't tell what actually went wrong.
`retry-fn` aims to get those details right behind a tiny API.

## Features

- ♻️ Retries a failing async function automatically
- ⚡ Returns the result as soon as an attempt succeeds
- 🎯 Rethrows the **original** error when all attempts fail — no error swallowing
- 🧩 Fully typed: the return type is inferred from your function
- 📦 ESM-only, zero runtime dependencies

## Install

> Not yet published to npm. Once released:

```sh
pnpm add retry-fn
# npm install retry-fn  •  yarn add retry-fn
```

Requires a modern ESM environment (Node.js ≥ 18, or any bundler).

## Usage

```ts
import { withRetry } from "retry-fn";

const data = await withRetry(() => fetchFromFlakyApi());
```

If `fetchFromFlakyApi()` rejects, `withRetry` waits briefly and tries once
more. If it succeeds on either attempt, you get the value back. If every
attempt fails, the **original** error is thrown.

The return type flows through automatically — no annotations needed:

```ts
const user = await withRetry(() => getUser("123"));
//    ^? User — inferred from the function's return type
```

## API

### `withRetry<T>(fn): Promise<T>`

| Param | Type               | Description                       |
| ----- | ------------------ | --------------------------------- |
| `fn`  | `() => Promise<T>` | The async operation to attempt.   |

Returns a `Promise<T>` that resolves with `fn`'s result on the first success,
or rejects with the original error if all attempts fail.

**Current behavior (v0):**

- Up to **2 attempts** total (1 initial call + 1 retry).
- A fixed **200 ms** delay between attempts.
- The **original error** from the final attempt is rethrown.

> Retry count and delay are not configurable yet — that's the next milestone
> on the [Roadmap](#roadmap).

## Roadmap

- [ ] Configurable `retries` and `delay` via an options object
- [ ] Exponential backoff (`minDelay`, `maxDelay`, growth factor)
- [ ] Jitter, to avoid the thundering-herd problem
- [ ] `shouldRetry(error)` predicate to skip non-retryable errors (e.g. HTTP `400`)
- [ ] `AbortSignal` support for cancellation
- [ ] First publish to npm

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

Issues and pull requests are welcome. This is a learning-oriented project, so
clear, well-tested contributions are especially appreciated. Before opening a
PR, please make sure `pnpm test`, `pnpm typecheck`, and `pnpm check` all pass.

## License

[MIT](./LICENSE) © Kirubel
