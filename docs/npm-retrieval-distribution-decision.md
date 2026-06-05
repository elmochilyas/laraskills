# npm Retrieval Distribution Decision

**Date:** 2026-06-05
**Author:** Laravel ECC Maintainer
**Status:** FINAL

## Context

The `laravel-ecc` npm package currently does not bundle the full `knowledge/` tree (2,321 KUs × 6 files = ~14,000 Markdown files). The retrieval CLI (`npx laravel-ecc retrieve/search/get`) requires the `intelligence/json/` directory to operate.

## Current npm Package Contents

Confirmed by `npm pack --dry-run`:

**125 files, 781.7 kB unpacked, 222.7 kB packed**

| Included | Not Included |
|----------|-------------|
| `skills/`, `rules/`, `agents/`, `commands/` | `knowledge/` (21 domains, 2,321 KUs) |
| `hooks/`, `mcp-configs/` | `intelligence/` (JSON files, indexes) |
| `src/` (retrieval engine) | `agent/` (navigation files) |
| `scripts/laravel-ecc.mjs` (CLI) | `meta/` (domain discovery) |
| 12 harness config dirs | `tools/` (generation scripts) |
| `AGENTS.md`, `CLAUDE.md`, `README.md` | `docs/` (reports) |
| `install.ps1`, `install.sh` | `tests/` |
| `update.ps1`, `update.sh` | |

## Strategy: Keep Lightweight + External ECC_ROOT

### Decision

1. **Do NOT bundle `knowledge/`, `intelligence/`, or `agent/` in npm.**
2. **Do NOT bundle `intelligence/json/` in npm.**
3. **CLI auto-discovers the intelligence layer** by walking up from `process.cwd()`.
4. **External root supported** via `--ecc-root <path>` or `ECC_ROOT` env var.

### Rationale

| Factor | Assessment |
|--------|-----------|
| npm package size | 781.7 kB unpacked today; adding `intelligence/json/` (~20 MB) would balloon the package with no benefit for users who only want skills/rules/agents |
| Install speed | Larger package = slower `npm install` for all users; most npm consumers don't need retrieval |
| Users who need retrieval | Already have a full git clone of the repository with all files present |
| CI/CD / agent environments | Set `ECC_ROOT` to point at a checkout, or clone the repo separately |
| MCP servers (Phase 11.2) | Will use `--ecc-root` to point at the same checkout |

### How Users Get Intelligence Files

**Option A — Full repository clone (recommended):**
```bash
git clone https://github.com/elmochilyas/laravel-ecc.git
cd laravel-ecc
npx laravel-ecc retrieve "Build a CRUD API" --ecc-root .
```

**Option B — ECC_ROOT environment variable:**
```bash
export ECC_ROOT=/path/to/laravel-ecc
npx laravel-ecc retrieve "Build a CRUD API"
```

**Option C — Working inside the repository:**
```bash
cd /path/to/laravel-ecc
npx laravel-ecc retrieve "Build a CRUD API"
# Auto-discovers intelligence/json/ from current directory
```

### Future Consideration

If a future Phase introduces an `npx laravel-ecc install --with-intelligence` that downloads and caches the JSON files separately (e.g., from a GitHub release artifact), we can revisit. For now, the lightweight approach is correct.

## Verdict

**Preferred Strategy for Phase 11.2:** Keep npm lightweight. Exclude `knowledge/` and `intelligence/`. Support external resolution via `--ecc-root` and `ECC_ROOT`. Document both approaches clearly.
