# npm Package Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## package.json Verification

| Field | Value | Status |
|-------|-------|--------|
| name | `laravel-ecc` | ✅ |
| version | `1.0.0-beta.8` | ✅ |
| bin.laravel-ecc | `scripts/laravel-ecc.mjs` | ✅ |
| bin.laravel-ecc-mcp | `scripts/laravel-ecc-mcp.mjs` | ✅ |
| license | MIT | ✅ |
| engines | `node >=18` | ✅ |
| publishConfig.access | `public` | ✅ |
| dependencies | `@modelcontextprotocol/sdk ^1.29.0`, `zod ^3.25.0` | ✅ |
| scripts | test, benchmark, postinstall, mcp:start | ✅ |

## Tarball Contents

**Pack size:** 229 KB  
**Unpack size:** 812 KB  
**File count:** 128 files

### Expected files present
- `scripts/laravel-ecc.mjs` ✅
- `scripts/laravel-ecc-mcp.mjs` ✅
- `scripts/mcp/schemas.mjs` ✅
- `scripts/mcp/handlers.mjs` ✅

### Private directories correctly excluded
- `knowledge/` — NOT in tarball ✅
- `intelligence/` — NOT in tarball ✅
- `agent/` — NOT in tarball ✅
- `meta/` — NOT in tarball ✅
- `tools/` — NOT in tarball ✅
- `docs/` — NOT in tarball ✅
- `tests/` — NOT in tarball ✅
- `examples/` — NOT in tarball ✅

### Install scripts included
- `install.ps1` ✅
- `install.sh` ✅
- `update.ps1` ✅
- `update.sh` ✅

## package-lock.json Issue

The lockfile's `bin` block (lines 16-18) only contains `laravel-ecc` but `package.json` defines **two** binary entries (`laravel-ecc` + `laravel-ecc-mcp`). The lockfile is **stale** — generated before `laravel-ecc-mcp` was added. Run `npm install` to regenerate.

## Verdict

| Check | Result |
|-------|--------|
| Package version matches VERSION | ✅ |
| Bin entries correct | ✅ |
| Dependency versions resolved | ✅ |
| files allowlist correct | ✅ |
| Lightweight distro (no knowledge layer) | ✅ |
| Lockfile consistent | ⚠️ Missing laravel-ecc-mcp bin entry |
