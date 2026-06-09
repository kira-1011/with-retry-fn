# Contributing to retry-fn

Thanks for your interest in contributing! `retry-fn` is a small, open-source
(MIT) library built in the open, and well-scoped contributions are genuinely
welcome.

## Getting started

```sh
git clone https://github.com/kira-1011/with-retry-fn.git
cd retry-fn
pnpm install
```

This project uses [pnpm](https://pnpm.io). If you don't have it:
`npm install -g pnpm`.

## Development workflow

| Command           | What it does                                                     |
| ----------------- | ---------------------------------------------------------------- |
| `pnpm test`       | Run the test suite (Vitest, watch mode)                          |
| `pnpm test run`   | Run the tests once (CI mode)                                     |
| `pnpm typecheck`  | Type-check with `tsc`                                            |
| `pnpm check`      | Lint & format check (Biome)                                      |
| `pnpm check:fix`  | Auto-fix lint & format issues                                    |
| `pnpm build`      | Build to `dist/` with tsdown                                     |
| `pnpm check:pkg`  | Validate the publishable package (publint + are-the-types-wrong) |

The project is **test-driven**: every behavior is backed by a test, and new
behavior should arrive together with the test that describes it.

## Submitting a change

1. Fork the repo and create a branch: `git checkout -b feat/my-change`.
2. Add or update tests for your change.
3. Make sure all three gates pass: `pnpm test run`, `pnpm typecheck`, and
   `pnpm check`.
4. Keep the `README.md` in sync if you change the public API.
5. Open a pull request with a clear description of the *what* and the *why*.

A Husky pre-commit hook runs Biome on staged files, so formatting is enforced
automatically.

## Reporting bugs & proposing features

- **Bugs:** open an [issue](https://github.com/kira-1011/with-retry-fn/issues) with a
  minimal reproduction.
- **Features:** for anything non-trivial, please open an issue to discuss the
  approach before investing in a PR.

## Code of Conduct

By participating, you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).
