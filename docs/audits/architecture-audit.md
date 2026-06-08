# Architecture Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## Root Directory Overview

| Category | Directories | Count |
|----------|------------|-------|
| **Curated Operating Layer** | agents/, skills/, rules/, commands/, hooks/, mcp-configs/ | 6 |
| **Knowledge Intelligence Layer** | knowledge/, intelligence/, agent/, meta/, tools/ | 5 |
| **Dev/Tooling** | src/, scripts/, tests/, docs/, examples/ | 5 |
| **IDE/Agent Harness Configs** | .claude/, .codebuddy/, .codex/, .cursor/, .gemini/, .github/, .kiro/, .opencode/, .qwen/, .trae/, .vscode/, .zed/ | 12 |
| **Stale/Legacy** | manifests/, production/ | 2 |

## Expected vs Actual Status

| Directory | Exists | Contents | Status |
|-----------|--------|----------|--------|
| agents/ | ✅ | 12 agent files | ✅ |
| skills/ | ✅ | 12 subdirs, 25 files | ✅ |
| rules/ | ✅ | 4 subdirs, 41 files | ✅ |
| commands/ | ✅ | 7 files | ✅ |
| hooks/ | ✅ | 2 files | ✅ |
| mcp-configs/ | ✅ | 1 file | ⚠️ README says 2 |
| src/ | ✅ | 13 files | ✅ |
| scripts/ | ✅ | 5 files (3 + mcp/2) | ✅ |
| knowledge/ | ✅ | 21 domains, 2321 KUs | ✅ |
| intelligence/ | ✅ | indexes(7) + json(10) + registry(1) | ✅ |
| agent/ | ✅ | 5 navigation files | ✅ |
| meta/ | ✅ | 22 subdirs, 42 files | ✅ |
| tools/ | ✅ | 1 file + empty subdir | ⚠️ |
| docs/ | ✅ | ~52 files | ✅ |
| tests/ | ✅ | 10 test files | ✅ |
| examples/ | ✅ | 2 files | ✅ |
| manifests/ | ❌ Empty | 0 files | 🔴 Stale |
| production/ | ❌ Empty | 0 files (empty indexes/) | 🔴 Stale |

## Stale / Empty Directories

| Directory | Problem | Severity |
|-----------|---------|----------|
| `manifests/` | Completely empty | 🔴 Remove |
| `production/indexes/` | Empty subdirectory | 🔴 Remove |
| `production/` | Contains only empty `indexes/` | 🔴 Remove |

## Curated Operating Layer — Counts

| Layer | Expected | Actual |
|-------|----------|--------|
| Agents | 12 | 12 ✅ |
| Skills | 12 | 12 ✅ |
| Rule Categories | 4 | 4 ✅ |
| Rule Files | 41 | 41 ✅ |
| Commands | 7 | 7 ✅ |
| Hooks | 2 | 2 ✅ |
| MCP Configs | 2 | 1 ⚠️ (mcp-configs/mcp-servers.json) |

## MCP Config Detail

`mcp-configs/mcp-servers.json` defines 2 servers:
1. `laravel-docs` → `@upstash/context7-mcp`
2. `composer-security` → `mcp-security-audit`

## Naming Concerns

| Concern | Severity |
|---------|----------|
| `agent/` vs `agents/` — confusingly similar but serve different purposes (navigation vs agent defs) | 🟡 Minor |
| `tools/generation/` — empty directory | 🟡 Minor |

## Verdict

| Check | Result |
|-------|--------|
| Expected dirs present | ✅ |
| Missing dirs | ✅ None |
| Unexpected dirs | ✅ None |
| Empty dirs | ❌ manifests/, production/ |
| Stale dirs | ❌ manifests/, production/ |
| Duplicate layers | ✅ None |
| Generated knowledge separate from curated | ✅ |
| Intelligence indexes at intended path | ✅ |
| Navigation separate from KUs | ✅ |
| Tooling not in knowledge tree | ✅ |
