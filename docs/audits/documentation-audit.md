# Documentation Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## README.md

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Skills | 12 | 12 | ✅ |
| Rules | 41 | 41 | ✅ |
| Agents | 12 | 12 | ✅ |
| Commands | 7 | 7 | ✅ |
| Harness Configs | 12 | 12 | ✅ |
| MCP Configs | 2 | **1** | ❌ Inflated |
| Engineering Domains | 21 | 21 | ✅ |
| Knowledge Units | 2,321 | 2,321 | ✅ |
| JSON Files | 10 | 10 | ✅ |
| Markdown Indexes | 7 | 7 | ✅ |
| Dependency Edges | 428 | 428 | ✅ |
| Relationship Edges | 3,633 | 3,633 | ✅ |
| Two-layer architecture described | Yes | Yes | ✅ |
| Lightweight distro wording | Accurate | Accurate | ✅ |
| ECC_ROOT instructions | Yes | Yes | ✅ |
| OpenCode examples | Yes | Yes | ✅ |
| No absolute local paths committed | — | None in README | ✅ |
| Version | 1.0.0-beta.8 | 1.0.0-beta.8 | ✅ |

## AGENTS.md

| Check | Status |
|-------|--------|
| 12 agents listed | ✅ |
| 12 skills listed | ✅ |
| Retrieval workflow explained | ✅ |
| 5 MCP tools referenced | ✅ |
| Retrieval CLI commands explained | ✅ |
| Stale counts or paths | ✅ None found |

## CLAUDE.md

| Check | Status |
|-------|--------|
| References AGENTS.md | ✅ Line 5 |
| Laravel 13 version references | ✅ |
| Skill table (12 skills) | ✅ |
| Skill path inconsistency | ⚠️ `skills/laravel-authentication/` has trailing slash (no SKILL.md) while all others use `skills/{name}/SKILL.md` |

## VERSION File

| Value | Status |
|-------|--------|
| `1.0.0-beta.8` | ✅ Matches package.json |

## Issues Found

### Stale Version in Install Scripts (HIGH)
- `install.sh:41` and `install.sh:112` hardcode `"1.0.0-beta.6"` (should be `1.0.0-beta.8`)
- `install.ps1:56` and `install.ps1:165` hardcode `'1.0.0-beta.6'`

### MCP Config Count Mismatch (MEDIUM)
- README claims **2 MCP configs** (table line 53: "Laravel docs + Composer security")
- Actual: only **1 file** (`mcp-configs/mcp-servers.json`) which defines 2 servers

### Stale `ecc-clone` Path (LOW)
- `install.sh:98`: `$ECC_AGENTS="$SCRIPT_DIR/../ecc-clone/agents"` — references non-existent sibling directory
- `install.ps1:145`: Same pattern — will silently fail

### CLAUDE.md Skill Path Inconsistency (LOW)
- Line 66: `skills/laravel-authentication/` uses trailing dir (no SKILL.md referenced)
- All other skills use `skills/{name}/SKILL.md`

### MCP Example Uses Placeholder Paths (INFO)
- `examples/opencode-mcp.local.jsonc` and `.linked.jsonc` use `C:\\path\\to\\laravel-ecc`
- Intentional placeholder — not a bug

## Verdict

| Check | Result |
|-------|--------|
| Counts match JSON | ⚠️ MCP config count inflated |
| Package version matches | ✅ |
| Architecture accurately described | ✅ |
| CLI documentation accurate | ✅ |
| MCP documentation accurate | ✅ |
| ECC_ROOT instructions accurate | ✅ |
| OpenCode examples accurate | ✅ |
| Lightweight distro wording accurate | ✅ |
| No absolute local paths in docs | ✅ |
| No stale test totals | ✅ |
