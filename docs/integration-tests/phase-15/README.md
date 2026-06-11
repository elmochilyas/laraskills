# Phase 15 — Performance, Caching & CLI Quality

In-process cache layer, CLI output improvements, `--json` shorthand, and comprehensive verification.

## Changes

| File | Status | Description |
|------|--------|-------------|
| `src/retrieval/cache-manager.mjs` | **New** | In-process Map cache with mtime+size fingerprint invalidation |
| `src/retrieval/catalog-loader.mjs` | **Modified** | Checks cache before loading, stores after |
| `src/retrieval/formatter.mjs` | **Modified** | Title "ECC Context Bundle", budget labels for modes |
| `scripts/laravel-ecc.mjs` | **Modified** | `--json` shorthand, search with Markdown tables |
| `scripts/mcp/handlers.mjs` | **Unchanged** | Already benefit from cache via catalog-loader |
| `scripts/laravel-ecc-mcp.mjs` | **Unchanged** | Already benefit from cache via catalog-loader |
| `tests/retrieval/cache-manager.test.mjs` | **New** | 7 cache lifecycle tests |
| `tests/retrieval/catalog-loader.test.mjs` | **Extended** | 3 cache regression tests |
| `tests/retrieval/run-performance-benchmarks.mjs` | **New** | `npm run benchmark:performance` |
| `tests/phase-15/verify-mcp.mjs` | **New** | MCP round-trip verification |
| `package.json` | **Modified** | Added `benchmark:performance` script |

## Key Results

- **190/190 tests pass** (180 baseline + 10 new)
- **72/72 retrieval benchmarks pass**
- **MCP verification: 10/10 checks pass**
- **Validation: 2321 KUs, 0 cycles, 0 self-loops, 0 dangling — VALID**
- **Security scan: clean** — no secrets, no machine paths, no credentials

## Performance Improvement

| Metric | Before (cold) | Before (warm) | After (warm) | Improvement |
|--------|--------------|--------------|-------------|-------------|
| retrieve (compact) | ~162–271 ms | ~144–164 ms | **~37–104 ms** | 56–77% |
| search | ~117–181 ms | ~119–139 ms | **~23–38 ms** | 75–81% |
| validate | ~108 ms | ~131 ms | **~9.6 ms** | 92% |
| get_knowledge_unit | ~100–114 ms | ~92 ms | **~2.6 ms** | 97% |

Cold = cache cleared before each run. Warm = same process, cached catalog.
