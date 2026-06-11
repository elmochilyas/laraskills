# Phase 14.1 — ECC Root Resolver Regression Cleanup

**Report Date:** 2026-06-11
**Status:** Complete — all 180 tests pass; repository returns to fully green state.

---

## Summary

Two pre-existing `ecc-root-resolver` test failures (present on `main` before Phase 14, carried through Phase 14 merge) are now fixed. Root cause was **test isolation leakage** — both failing tests were reading the developer's real user config file (`%APPDATA%/laravel-ecc/config.json`), which interfered with the resolver's precedence logic.

---

## Initial Failures

| # | Test File | Line | Test Name | Error |
|---|-----------|------|-----------|-------|
| 1 | `tests/retrieval/ecc-root-resolver.test.mjs` | 134 | 4th precedence: cwd discovery works inside repo | Expected `cwd-discovery`, got `user-config` |
| 2 | `tests/retrieval/ecc-root-resolver.test.mjs` | 194 | throws actionable error when no root can be resolved | Missing expected exception (resolver found a valid root via config) |

---

## Root Cause

The `resolveEccRootWithPrecedence` function has a correct precedence chain:

```
1. explicit --ecc-root argument
2. ECC_ROOT environment variable
3. persisted user config (loadConfig → getConfigPath)
4. cwd and parent-directory discovery
5. actionable error
```

However, both failing tests called `resolveEccRootWithPrecedence({})` with no explicit root or env root, expecting precedence to fall through to step 4 (cwd-discovery) or step 5 (error). On the developer's machine, the real persisted config file at `%APPDATA%/laravel-ecc/config.json` (created by `laravel-ecc setup` during normal use) returned a valid root at step 3, short-circuiting the fallthrough.

**The implementation is correct.** The bug is in test isolation: the tests did not isolate themselves from the real user config via `LARAVEL_ECC_CONFIG_DIR` or guard against a leaked `ECC_ROOT` environment variable.

---

## Fix Applied

**File:** `tests/retrieval/ecc-root-resolver.test.mjs`

Two suites now save and restore `LARAVEL_ECC_CONFIG_DIR` and `ECC_ROOT` environment variables:

**Suite 1 — `resolveEccRootWithPrecedence` (lines 96–166):**
- `before`: saves `LARAVEL_ECC_CONFIG_DIR` and `ECC_ROOT`, sets `LARAVEL_ECC_CONFIG_DIR` to an isolated temp directory (`tmp-resolver-test/resolve-precedence/isolated-config`), clears `ECC_ROOT`
- `after`: restores both env vars to their original values (or deletes them if they were unset)

**Suite 2 — `error messages` (lines 197–238):**
- `before`: saves both env vars, sets `LARAVEL_ECC_CONFIG_DIR` to a path inside the void directory that is cleaned up in `after`, clears `ECC_ROOT`
- `after`: restores CWD, cleans up void directory, restores both env vars

The `user-config` test suite (`user-config.test.mjs`) already managed `LARAVEL_ECC_CONFIG_DIR` correctly — only the `ecc-root-resolver` tests were missing isolation.

---

## Regression Coverage

The fixed tests themselves serve as regression coverage:

| Test | What It Verifies |
|------|------------------|
| `4th precedence: cwd discovery works inside repo` | With no explicit root, no `ECC_ROOT`, and no matching config, cwd-discovery falls through correctly |
| `throws actionable error when no root can be resolved` | With no root source at all, the resolver throws the expected actionable error |
| All 6 precedence tests | The full precedence chain is documented and tested end-to-end |

No new tests were needed — the existing tests now pass in isolation.

---

## Files Changed

```
tests/retrieval/ecc-root-resolver.test.mjs   — +12 lines (env save/restore in 2 suites)
```

---

## Validation Results

| Check | Result |
|-------|--------|
| `npm test` | **180/180 PASS** |
| `npm run benchmark` | **72/72 pass (100%)** |
| `node scripts/laravel-ecc.mjs validate` | **VALID** — 2,321 KUs, 0 cycles |
| `setup` with isolated config dir | **succeeds** |
| `doctor` with isolated config dir | **HEALTHY** |
| `validate` with isolated config dir | **VALID** |
| Real user config untouched | Confirmed — temp config cleaned up |
| `ECC_ROOT` restored | Confirmed — saved/restored per suite |
| `LARAVEL_ECC_CONFIG_DIR` restored | Confirmed — saved/restored per suite |

### Test Summary

```
ℹ tests 180
ℹ suites 40
ℹ pass 180
ℹ fail 0
```

First fully green test run since before the Phase 13 line-introducing changes.

### Q-Metrics (Benchmark)

```
Primary Accuracy:       100.0% (72/72)
Supporting Recall:     87.7% (93/106)
Forbidden Precision:   94.7% (54/57 clean)
Top-KU Recall:         100.0% (16/16)
Avg Tokens per Query:  3268
```

---

## Scope Check

| Check | Result |
|-------|--------|
| `git diff --check` | CLEAN — no whitespace errors |
| Files changed | 1 test file only |
| Lines changed | +12 / -0 |
| `C:\Users\` paths | 0 new occurrences |
| Secrets, tokens, credentials | NONE |
| `.env` files | NONE |
| Temporary artifacts | NONE — cleaned up in all `after` hooks |
| Version bump | NONE — still `1.0.0-beta.12` |
| npm publication | NONE |
| Tags | NONE |
| Commits | NONE — stopped before commit |

---

## Beta.13 Readiness

All gating criteria for `1.0.0-beta.13` preparation are now met:

- [x] 180/180 tests pass (fully green)
- [x] 72/72 benchmarks pass
- [x] Intelligence layer valid (2321 KUs, 0 issues)
- [x] CLI smoke tests pass (`setup`, `doctor`, `validate`)
- [x] Test isolation verified (env vars saved/restored, real config untouched)
- [x] No whitespace errors
- [x] No secrets leaked
- [x] No version bump needed
- [x] No publication, tags, or commits made

The fix is a minimal, targeted test-isolation patch that does not touch any runtime code. Full merge and beta.13 preparation can proceed.
