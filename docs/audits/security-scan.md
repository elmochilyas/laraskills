# Security Scan

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## Scan Summary

| Category | Result |
|----------|--------|
| API keys / tokens | ✅ None found |
| Passwords | ✅ None found (placeholder only) |
| OAuth secrets | ✅ None found |
| GitHub auth tokens | ✅ None found (educational example only) |
| npm auth tokens | ✅ None found |
| `.env` files | ✅ None (properly gitignored) |
| `.npmrc` secrets | ✅ None found |
| SSL keys/certs | ✅ None found |
| Private URLs | ✅ None found |

## Findings

### 🔴 HIGH: Absolute Local Paths — Script Files

10 script files contain hardcoded `C:\Users\Pc\...` paths:

| File | Line | Content (Redacted) |
|------|------|--------------------|
| `tools/generation/inject-dependency-edges.ps1` | 21 | `$root = "C:\Users\[R]\Desktop\[...]\laravel-ecc"` |
| `tools/rebuild-intelligence.ps1` | 2-3 | `$KnowledgeRoot = "C:\Users\[R]\Desktop\[...]\knowledge"` |
| `tools/generation/generate-02-files.ps1` | 1 | `$root = "C:\Users\[R]\Desktop\[...]\laravel-ecc"` |
| `tools/generation/data-storage-systems-generate-anti-patterns.ps1` | 9 | `$basePath = "C:\Users\[R]\Desktop\[...]\research\[...]"` |
| `tools/generation/data-storage-systems-generate-all-checklists.ps1` | 2 | `$BasePath = "C:\Users\[R]\Desktop\[...]\research\[...]"` |
| `tools/generation/cost-resource-optimization-generate-decision-trees.ps1` | 1 | `$base = "C:\Users\[R]\Desktop\[...]\research\[...]"` |
| `tools/generation/cost-resource-optimization-gen_trees.ps1` | 1 | `$base = "C:\Users\[R]\Desktop\[...]\research\[...]"` |
| `tools/generation/ai-intelligence-systems-generate-decision-trees.ps1` | 1 | `$domain = "C:\Users\[R]\Desktop\[...]\research\[...]"` |
| `generate-intelligence.ps1` | 2-4 | All params hardcoded to `C:\Users\[R]\...` |
| `generate-indexes.ps1` | 4-6 | All paths hardcoded to `C:\Users\[R]\...` |

### 🔴 HIGH: Absolute Local Paths — Knowledge Content

- 21 `.anchored-summary.md` files (one per domain) reference `C:\Users\Pc\Desktop\[...]\research\workspaces\{domain}`
- `knowledge/data-storage-systems/summary.md:35` — same pattern

### 🔴 HIGH: Path Leaked in Code Example

- `knowledge/api-crud-system-engineering/resource-controllers/singleton-resource-controllers/05-rules.md`
- Lines 73, 79, 132: PowerShell profile path `C:\Users\Pc\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` embedded in PHP code examples
- Code examples are broken (missing variable names)

### 🟡 MEDIUM: Test Secret in Documentation (Educational)

- `knowledge/security-identity-engineering/secrets/secrets-scanning/05-rules.md`
- Line 82: `test-api-key-12345` in `.gitleaksignore` example
- Line 84: `ghp_example` in documentation example
- Both are intentional educational examples

### 🟡 LOW: Mojibake / Encoding Issues

- ~80+ files across the repository contain non-UTF8/mojibake characters
- Affects AGENTS.md, CLAUDE.md, README.md, all agent harness configs, docs, and many knowledge files
- Existing `Normalize-Mojibake` function in `tools/generation/inject-dependency-edges.ps1`

### ✅ Clean Categories

| Category | Result |
|----------|--------|
| OpenAI-style keys (`sk-...`) | ✅ None |
| GitHub tokens (`ghp_`, `gho_`, `ghu_`) | ✅ None (only doc example) |
| Proxy tokens | ✅ None |
| Inspector session tokens | ✅ None |
| Machine usernames in content | ✅ None (only in build tools) |
| npm tokens | ✅ None |
| `.env` files | ✅ None committed |
| Private URLs | ✅ None |
| SSH keys/certs | ✅ None |

## Verdict

| Check | Result |
|-------|--------|
| No real secrets committed | ✅ |
| No API keys committed | ✅ |
| No auth tokens committed | ✅ |
| No proxy tokens committed | ✅ |
| No `.env` committed | ✅ |
| No `.npmrc` secrets | ✅ |
| Local paths in scripts | ❌ 10 files |
| Local paths in knowledge | ❌ 22 files |
| Secrets in code examples | ❌ PowerShell path leaked in 1 file |
| Encoding issues | ❌ ~80+ files with mojibake |
