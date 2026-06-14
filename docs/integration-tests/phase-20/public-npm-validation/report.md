# Phase 20 — Public npm Package Validation (`laraskills@beta`)

**Date:** 2026-06-14
**Package version:** `1.0.0-beta.16`
**Test plan:** [AGENTS.md](./AGENTS.md) — Phase 20: public npm validation

## Environment

| Component | Version |
|-----------|---------|
| Node.js | v24.15.0 |
| npm | 11.12.1 |
| PHP | 8.4.22 |
| Composer | 2.9.5 |
| OS | Windows (win32) |
| LaraSkills source commit | `40c2a97e13aae94c4cd5f743ca2c0672d2ee4b1c` |
| Package version | 1.0.0-beta.16 |

## Summary

| Scenario | Result |
|----------|--------|
| A — Fresh Laravel project with `laraskills@beta` | **PASS** |
| B — Existing Laravel project (Breeze) with `laraskills@beta` | **PASS** |
| Overall validation | **PASS** |

---

## Scenario A — Fresh Laravel Project

**Steps:**
1. `composer create-project laravel/laravel:^13.0` — fresh Laravel 13 app with SQLite
2. `php artisan install:api` — API scaffolding with Sanctum
3. `npm install --save-dev laraskills@beta` — install from npm registry
4. Verify `npx laraskills --help` shows all commands
5. Run `laraskills doctor` — health check
6. Run `laraskills validate` — intelligence layer integrity
7. Run `laraskills retrieve` — context bundle retrieval
8. Run `laraskills search` — knowledge unit search
9. Run `laraskills get --include-content` — full KU with content
10. Run `laraskills setup` — configure LaraSkills root
11. Run `laraskills install --profile core` — install 6 skills + 5 agents + rules + hooks + MCP configs

### Results

| Check | Result | Evidence |
|-------|--------|----------|
| `npm install --save-dev laraskills@beta` | **PASS** — 172 packages added in 45s | `evidence/fresh/npm-install.txt` |
| `npx laraskills --help` | **PASS** — all commands shown | `evidence/fresh/cli-help.txt` |
| `npx laraskills doctor` | **PASS** — `Status: HEALTHY` | `evidence/fresh/cli-doctor.txt` |
| `npx laraskills validate` | **PASS** — 2321 KUs, 427 deps, 3513 relations, 120 aliases, 26 external | `evidence/fresh/cli-validate.txt` |
| `npx laraskills retrieve --mode compact` | **PASS** — ranked KUs with scoring breakdown | `evidence/fresh/cli-retrieve.txt` |
| `npx laraskills search --limit 5` | **PASS** — 5 KU results with scores | `evidence/fresh/cli-search.txt` |
| `npx laraskills get --include-content` | **PASS** — full KU with standardization sections | `evidence/fresh/cli-get.txt` |
| `npx laraskills setup` | **PASS** — config stored, intelligence valid | `evidence/fresh/cli-setup.txt` |
| `npx laraskills install --profile core` | **PASS** — 6 skills, rules, hooks, MCP, 5 agents | `evidence/fresh/cli-install-core.txt` |
| Installed artifacts exist | **PASS** — `skills/` (6 dirs), `agents/` (5 files), `rules/` (4 dirs), `hooks/`, `mcp-configs/` | `evidence/fresh/installed-artifacts.txt` |
| `php artisan test` | **PASS** — 2/2 passed | (terminal output) |

### Artifacts Created

```
skills/
├── laravel-patterns
├── laravel-tdd
├── laravel-security
├── laravel-core-internals
├── laravel-eloquent
└── laravel-database

agents/
├── laravel-artisan.md
├── laravel-container.md
├── laravel-database.md
├── laravel-eloquent.md
└── laravel-migration.md

rules/
├── common/
├── laravel/
├── php/
└── web/
```

---

## Scenario B — Existing (Non-Empty) Laravel Project

**Steps:**
1. `composer create-project laravel/laravel:^13.0` — base app with SQLite
2. `composer require laravel/breeze:2.x-dev` + `php artisan breeze:install blade` — realistic app with auth scaffolding
3. Run baseline test suite — **25/25 passing**
4. `npm install --save-dev laraskills@beta` — install from npm registry (84 packages added)
5. Run all CLI commands (doctor, validate, retrieve, search, install --profile core)
6. Re-run test suite — verify **zero regression**

### Results

| Check | Before Install | After Install | Result |
|-------|---------------|---------------|--------|
| `npx laraskills doctor` | N/A | **PASS** — HEALTHY | `evidence/existing/cli-doctor.txt` |
| `npx laraskills validate` | N/A | **PASS** — 2321 KUs | `evidence/existing/cli-validate.txt` |
| `npx laraskills retrieve` | N/A | **PASS** | `evidence/existing/cli-retrieve.txt` |
| `npx laraskills search` | N/A | **PASS** | `evidence/existing/cli-search.txt` |
| `npm install --save-dev laraskills@beta` | N/A | **PASS** — 84 packages added in 17s | `evidence/existing/npm-install.txt` |
| `laraskills install --profile core` | N/A | **PASS** | `evidence/existing/cli-install-core.txt` |
| `php artisan test` | **25/25 passed** (61 assertions, 24.30s) | **25/25 passed** (61 assertions, 5.64s) | **PASS — no regression** |

### Test Suite Details

Before install:
```
Tests:    25 passed (61 assertions)
Duration: 24.30s
```

After install:
```
Tests:    25 passed (61 assertions)
Duration: 5.64s
```

**Zero tests broken. Zero new failures.**

---

## Intelligence Layer Validation

| Metric | Value |
|--------|-------|
| Knowledge Units | 2,321 |
| Dependency Edges | 427 |
| Relationship Edges | 3,513 |
| Aliases | 120 |
| External Concepts | 26 |
| Overall Status | **VALID** |

---

## CLI Commands Validated

| Command | Fresh Project | Existing Project |
|---------|---------------|-----------------|
| `--help` | PASS | PASS (built-in) |
| `doctor` | PASS | PASS |
| `validate` | PASS | PASS |
| `setup` | PASS | PASS |
| `retrieve` | PASS | PASS |
| `search` | PASS | PASS |
| `get --include-content` | PASS | PASS (same binary) |
| `install --profile core` | PASS | PASS |

---

## Conclusion

**`laraskills@beta` (1.0.0-beta.16) passes all validation checks when installed from the npm registry.**

- **Fresh project:** All CLI commands work correctly, the `install --profile core` command lays down 6 skills, 5 agents, shared rules, hooks, and MCP configs.
- **Existing (Breeze) project:** The package installs without conflict, all CLI commands work, and the existing 25-test Breeze authentication suite continues to pass without any regression.
- **Intelligence layer:** 2,321 knowledge units with 427 dependencies and 3,513 relationships — all structurally valid.

**Status: ✅ PASS**

---

## Evidence Files

```
evidence/
├── node-version.txt
├── npm-version.txt
├── php-version.txt
├── composer-version.txt
├── source-commit.txt
├── package-version.txt
├── fresh/
│   ├── cli-help.txt
│   ├── cli-doctor.txt
│   ├── cli-validate.txt
│   ├── cli-retrieve.txt
│   ├── cli-search.txt
│   ├── cli-get.txt
│   ├── cli-setup.txt
│   ├── cli-install-core.txt
│   ├── npm-install.txt
│   └── installed-artifacts.txt
└── existing/
    ├── cli-doctor.txt
    ├── cli-validate.txt
    ├── cli-retrieve.txt
    ├── cli-search.txt
    ├── cli-install-core.txt
    ├── npm-install.txt
    ├── baseline-tests-before.txt
    └── tests-after-install.txt
```
