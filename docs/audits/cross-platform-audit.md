# Cross-Platform Compatibility Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## Shell Scripts

### install.sh / update.sh (Bash)

| Check | Result |
|-------|--------|
| `#!/usr/bin/env bash` shebang | ✅ |
| `set -euo pipefail` | ✅ |
| `BASH_SOURCE[0]` for self-dir | ✅ |
| `sed -i` without backup extension | ❌ Fails on macOS (BSD sed) |
| Stale version `1.0.0-beta.6` hardcoded | ❌ |
| `ecc-clone` dead reference | ⚠️ Silently fails |
| Portability | ⚠️ Not macOS compatible due to `sed -i` |

### install.ps1 / update.ps1 (PowerShell)

| Check | Result |
|-------|--------|
| `Set-StrictMode -Version Latest` | ✅ |
| `$ErrorActionPreference = 'Stop'` | ✅ |
| Uses `Join-Path` throughout | ✅ |
| Stale version `1.0.0-beta.6` hardcoded | ❌ |
| `ecc-clone` dead reference | ⚠️ |
| Unused variable `$Yellow` in update.ps1 | 🟡 |

## Node.js Scripts (`scripts/*.mjs`)

| Check | Result |
|-------|--------|
| Shebang `#!/usr/bin/env node` | ✅ |
| `import.meta.url` + `fileURLToPath` | ✅ |
| Uses `path.join()` (not hardcoded `/`) | ✅ |
| No Unix-specific path assumptions | ✅ |
| Uses `process.env.ECC_ROOT` | ✅ |
| Uses `process.cwd()` | ✅ |
| `cpSync`/`copyFileSync` (Node 18+) | ✅ |
| SIGINT/SIGTERM handlers | ✅ (works in Windows Node 14+) |
| `disconnect` event | ✅ Cross-platform |

## Package Metadata

| Field | Value | Status |
|-------|-------|--------|
| Engine requirement | `>=18` | ✅ LTS |
| bin entries | 2 entries | ✅ |
| publishConfig | public | ✅ |

## Known Risks

| Risk | Environment | Severity |
|------|-------------|---------|
| `sed -i` without backup extension | macOS | 🟡 Medium |
| Stale version in install scripts | All | 🟡 Medium |
| Hardcoded local paths in build tools | Author's machine only | 🟡 Low (build-only) |
| Paths with spaces | Windows | 🟢 Low (scripts use quoted paths) |
| ECC_ROOT with spaces | All | 🟢 Low (tested, handled) |

## Unsupported Environments

None identified. Node >=18 runs on all major platforms.

## Verdict

| Check | Result |
|-------|--------|
| PowerShell 5.1 compatible | ✅ (verified) |
| PowerShell 7 compatible | ✅ |
| Linux Bash compatible | ⚠️ `sed -i` issue |
| macOS shell compatible | ❌ `sed -i` breaks |
| Node.js LTS compatible | ✅ (>=18) |
| npm global install | ✅ |
| npm link | ✅ |
| Paths with spaces | ✅ |
| ECC_ROOT with spaces | ✅ |
| JSONC configuration | ✅ |
| UTF-8 output | ✅ |
| Signal handling | ✅ |
