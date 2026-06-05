# Phase 11.1.4 — Current State Audit

**Date:** 2026-06-05
**Source:** Direct file reads + `node --test` + script queries

## Package Version

| Field | Value |
|---|---|
| `package.json` version | `1.0.0-beta.8` |
| `AGENTS.md` version | `1.0.0-beta.7` (STALE) |
| `VERSION` file | `1.0.0-beta.8` |

## Intelligence JSON Files (`intelligence/json/`)

| # | File | Entries |
|---|------|---------|
| 1 | `knowledge-units.json` | 2,321 KUs |
| 2 | `rules.json` | 2,321 rules |
| 3 | `skills.json` | 2,321 skills |
| 4 | `decision-trees.json` | 2,321 decision trees |
| 5 | `anti-patterns.json` | 2,321 anti-patterns |
| 6 | `checklists.json` | 2,321 checklists |
| 7 | `dependencies.json` | 428 edges |
| 8 | `relationships.json` | 3,633 edges |
| 9 | `aliases.json` | 120 aliases |
| 10 | `external-concepts.json` | 26 external concepts |

**Total: 10 JSON files**

## Markdown Indexes (`intelligence/indexes/`)

| # | File |
|---|------|
| 1 | `checklist-index.md` |
| 2 | `rule-index.md` |
| 3 | `skill-index.md` |
| 4 | `decision-tree-index.md` |
| 5 | `dependency-index.md` |
| 6 | `knowledge-unit-index.md` |
| 7 | `anti-pattern-index.md` |

**Total: 7 Markdown indexes**

## Graph Health

| Metric | Value |
|---|---|
| Canonical KUs | 2,321 |
| Dependency edges | 428 |
| Relationship edges | 3,633 |
| Aliases | 120 |
| External concepts | 26 |
| Cycles | 0 |
| Self-loops | 0 |
| Dangling edges | 0 |
| KUs reachable | 2,321 / 2,321 |

## Test & Benchmark Health

| Metric | Value |
|---|---|
| Unit tests | 102 / 102 PASS |
| Encoding tests | 11 / 11 PASS |
| Validator tests | 29 / 29 PASS |
| Benchmarks | 70 / 70 PASS |
| `laravel-ecc validate` | PASS |

## Stale Documentation Values

### AGENTS.md

| Line | Current Value | Correct Value |
|------|--------------|---------------|
| 5 | Version: `1.0.0-beta.7` | `1.0.0-beta.8` |
| 115 | `8 JSON files, 7 markdown indexes` | `10 JSON files, 7 markdown indexes` |
| 144 | `Machine-readable JSON intelligence (8 files)` | `Machine-readable JSON intelligence (10 files)` |
| 240 | `dependencies.json — 264 dependency edges` | `dependencies.json — 428 dependency edges` |
| 241 | `relationships.json — 3,626 relationship edges` | `relationships.json — 3,633 relationship edges` |
| 233–241 | Missing `aliases.json` and `external-concepts.json` | Add both |

### README.md

| Line | Current Value | Correct Value |
|------|--------------|---------------|
| 63 | `456 (266 direct + 190 alias-resolved)` | `428` |
| 64 | `3,634` | `3,633` |

## npm Package Contents (from `npm pack --dry-run`)

**125 files, 781.7 kB unpacked, 222.7 kB packed**

Includes:
- `skills/`, `rules/`, `agents/`, `commands/`, `hooks/`, `mcp-configs/`
- `src/` (retrieval core engine — 13 files)
- `scripts/laravel-ecc.mjs` (CLI entry point)
- 12 harness config directories (`.claude/`, `.cursor/`, etc.)
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `VERSION`
- `install.ps1`, `install.sh`, `update.ps1`, `update.sh`

Does NOT include:
- `knowledge/` (21 domains, 2,321 KUs)
- `intelligence/` (JSON files, indexes)
- `agent/` (navigation files)
- `meta/` (domain discovery)
- `tools/` (generation scripts)
- `docs/` (reports, including this one)
- `tests/` (test files)
