# Phase 11.1.3 — Encoding Cleanup Report

**Date:** 2026-06-05
**Status:** COMPLETE
**Goal:** Eliminate UTF-8 mojibake (`â€”` / `â†’`) from all JSON intelligence files

## Summary

All 10 JSON intelligence files and the dependency-index.md are now free of encoding corruption. The root cause was PowerShell 5.1's `Get-Content` defaulting to Windows-1252 when reading BOM-less UTF-8 `.md` files.

## Validation Results

| Check | Result |
|---|---|
| Total unit tests | 102 / 102 PASS |
| Encoding tests | 11 / 11 PASS |
| Validator regression tests | 29 / 29 PASS |
| Benchmarks | 70 / 70 PASS |
| `laravel-ecc validate` | PASS (2321 KUs, 0 cycles, 0 self-loops) |
| CRUD retrieval regression | PASS — top KU `cursor-based-pagination` (score 141) |
| N+1 retrieval | PASS — top KU `n-plus-one-detection-elimination` (score 230) |
| Sanctum + tenant retrieval | PASS — top KU `cross-tenant-data-leak-prevention` (score 283) |
| Queue email retrieval | PASS — top KU `queue-connections-vs-queues` (score 171) |
| pgvector retrieval | PASS — `pgvector-fts-hybrid` ranked 10th (score 136) |
| Unicode output rendering | PASS — all em-dashes and arrows render correctly |

## Root Cause

PowerShell 5.1 `Get-Content` (without `-Encoding UTF8`) reads BOM-less UTF-8 files as Windows-1252. The UTF-8 byte sequence `0xE2 0x80 0x94` (em-dash U+2014) is interpreted as three separate Latin-1 characters:
- `0xE2` → â (U+00E2)
- `0x80` → € (U+20AC)
- `0x94` → ” (U+201D, RIGHT DOUBLE QUOTATION MARK)

When these three characters are later re-encoded as UTF-8, the file contains `C3 A2 E2 82 AC E2 80 9D` (7 bytes) instead of the correct `E2 80 94` (3 bytes).

## Changes Made

### Fixed: `tools/generation/inject-dependency-edges.ps1`

1. Added `-Encoding UTF8` to 3 `Get-Content` calls (lines 62, 76, 170) — prevents new mojibake from entering the pipeline
2. Added `Normalize-Mojibake` function (line 7) — corrects existing mojibake in source files:
   - `â€"` (U+00E2 U+20AC U+201D) → `—` (U+2014, em-dash)
   - `â†'` (U+00E2 U+2020 U+2019) → `→` (U+2192, right arrow)
3. Added `$newDepJson = Normalize-Mojibake $newDepJson` guard on the final dependencies.json string (line 177)
4. Added `$relContent = Normalize-Mojibake $relContent` guard on the final relationships.json string (line 186)

### New: `tests/retrieval/encoding.test.mjs`

11 tests covering all 10 JSON intelligence files for:
- Valid UTF-8 without mojibake sequences
- Proper em-dash usage in `relationships.json`

## Dependency Repair (Phase 11.1.2, included in this commit)

- Fixed 15 SCCs (strongly connected components — cycles in the dependency graph)
- 2 broken aliases fixed: "N+1 queries" → `n-plus-one-detection-elimination`, "12.1 JSONB column type" → `blueprint-column-types`
- Post-alias cycle detection added to the inject script
- Created `validator.test.mjs` with 29 regression tests
- Created audit and repair report docs

## Files Changed (51 files, +1923/-1718)

### Core fix
- `tools/generation/inject-dependency-edges.ps1` — +59 lines

### New files
- `tests/retrieval/encoding.test.mjs` — 11 encoding tests
- `tests/retrieval/validator.test.mjs` — 29 validator regression tests
- `docs/phase-11-1-1-ranking-audit.md`
- `docs/phase-11-1-2-dependency-validation-audit.md`
- `docs/phase-11-1-2-dependency-validation-repair-report.md`
- `tests/retrieval/fixtures/capture-before.mjs`
- `tests/retrieval/fixtures/regression-before.json`

### Regenerated intelligence
- `intelligence/json/relationships.json` — 3633 edges, mojibake-free
- `intelligence/json/dependencies.json` — 428 edges
- `intelligence/json/aliases.json` — 2 alias fixes
- `intelligence/indexes/dependency-index.md` — regenerated

### Knowledge files (31 files, each +2-4 lines)
- Dependency table formatting fixes across multiple domains

### Retrieval engine source
- 9 source files in `src/retrieval/` — ranking, domain routing, formatting, etc.

## Verification

- Graph: 2321/2321 KUs reachable, 0 cycles, 0 self-loops, 0 dangling edges
- Encoding: 0 mojibake sequences in any JSON intelligence file
- Ranking: deterministic, no regressions from Phase 11.1.1 baseline
- No changes to retrieval relevance, graph structure, or ranking behavior

## Safe to Begin Phase 11.2 (MCP Integration)

Yes. All intelligence files are clean, all tests pass, all benchmarks pass, and the dependency graph is cycle-free.
