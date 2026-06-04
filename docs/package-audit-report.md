# Package Audit Report

**Date:** 2026-06-04
**Command:** `npm pack --dry-run`

---

## Package Details

| Property | Value |
|----------|-------|
| Name | laravel-ecc |
| Version | 1.0.0-beta.7 |
| Compressed size | 196.1 kB |
| Unpacked size | 678.3 kB |
| Files included | 112 |

---

## Files Included (from npm pack)

| Category | Files | Examples |
|----------|-------|----------|
| CLI configs | 13 | .opencode/, .claude/, .cursor/, .gemini/ |
| Skills | 12 dirs | laravel-patterns, laravel-eloquent, laravel-tdd |
| Rules | 41 files | common/, laravel/, php/, web/ |
| Agents | 12 files | laravel-artisan, laravel-eloquent, laravel-api-rest |
| Commands | 7 files | artisan.md, code-review.md, plan.md |
| Hooks | 2 files | hooks.json, README.md |
| Scripts | 1 file | laravel-ecc.mjs |
| MCP configs | 1 file | mcp-servers.json |
| Install/Update | 4 files | install.ps1, install.sh, update.ps1, update.sh |
| Root docs | 4 files | AGENTS.md, CLAUDE.md, README.md, VERSION |

---

## Files NOT Included (excluded by package.json `files` field)

| Directory | Items | Size (estimated) |
|-----------|-------|-----------------|
| `knowledge/` | 21 domains, 2,328 KUs | ~50 MB |
| `intelligence/` | 7 indexes, 7 JSON, 1 registry | ~15 MB |
| `agent/` | 5 routing files | ~20 KB |
| `docs/` | 7 report files + existing | ~100 KB |
| `meta/` | Domain discovery artifacts | ~500 KB |
| `production/` | 1 remaining index file | ~200 KB |

---

## Package Rationale

The current `package.json` `files` field intentionally excludes the knowledge layer. The package is designed as:

1. **CLI harness** — install.ps1/sh, update.ps1/sh, scripts/
2. **AI agent configurations** — .opencode/, .claude/, .cursor/, .gemini/
3. **Core skills/rules/agents** — 12 skills, 41 rules, 12 agent files

The knowledge layer (21 domains, 2,328 KUs) is treated as **repository-only content** — consumed via Git clone, not npm install.

---

## Distribution Recommendations

| Option | Size Impact | Complexity | Recommended For |
|--------|-------------|------------|-----------------|
| **Keep as-is** (knowledge excluded) | 196 kB | None | Current best fit |
| GitHub release artifact (.zip) | ~65 MB | Low | Knowledge consumers |
| Split package (`laravel-ecc-knowledge`) | ~65 MB | Medium | npm ecosystem |
| Git submodule | N/A | Medium | Multi-repo setups |
| CDN-hosted JSON | ~15 MB (intelligence only) | Medium | Agent toolchains |

**Recommended:** Keep current package lightweight (196 kB). Publish knowledge layer as a **GitHub release artifact** for on-demand download. Add a CLI command (`laravel-ecc knowledge install`) that downloads the knowledge bundle.

---

## Unintended Inclusions

The current package (`files` field) correctly scopes included content. No unintended files were detected in the dry-run output:

- No `.git/` contents
- No node_modules/
- No generation scripts (.ps1 inside knowledge/)
- No generation logs (.txt)
- No backup/research directories

---

## Practical Installation Evaluation

| Scenario | Feasible? | Notes |
|----------|-----------|-------|
| Install as npm dependency | Yes | 196 kB, installs in <1s |
| Use skills during coding | Yes | 12 skills available |
| Use agent routing | Partial | Agent files included, knowledge layer not |
| Navigate knowledge base | No | Requires Git clone |

**Conclusion:** The package is practical for CLI harness and agent configuration use. For knowledge base consumption, a Git clone or separate download is required.
