# Remediation Path Inventory

**Date:** 2026-06-09
**Phase:** 11.2.1 Certification Remediation
**Branch:** feat/phase-11-2-1-certification-remediation

---

## Summary

| Category | Count | Files |
|----------|-------|-------|
| Scripts fixed | 10 | Hardcoded paths sanitized to script-relative |
| Knowledge files fixed | 22 | 21 `.anchored-summary.md` + 1 `summary.md` sanitized |
| Rules repaired | 1 | Singleton resource controllers 05-rules.md |
| Reports created | 9 | Under `docs/audits/` |
| Documentation updated | 6 | AGENTS.md, CLAUDE.md, README.md, audit docs |
| Intelligence indexes | 8 | All regenerated |
| Graph JSON | 2 | dependencies.json, relationships.json |
| Agent navigation | 1 | domain-routing-index.md |
| Install scripts | 2 | install.ps1, install.sh |
| Update scripts | 2 | update.ps1, update.sh |
| Package-lock | 1 | Regenerated |
| Stale artifacts removed | 2 | Stub + stale index |
| Test assertions | 1 | mcp.test.mjs |
| OpenCode commands | 4 | .opencode/commands/ |
| **Total changed** | **61** | |

---

## Scripts Fixed (10 files)

All had hardcoded `C:\Users\Pc\Desktop\...` local paths replaced with `$PSScriptRoot`-relative or Node.js `__dirname`-relative paths.

1. `tools/generation/inject-dependency-edges.ps1`
2. `tools/rebuild-intelligence.ps1`
3. `tools/generation/generate-02-files.ps1`
4. `tools/generation/data-storage-systems-generate-anti-patterns.ps1`
5. `tools/generation/data-storage-systems-generate-all-checklists.ps1`
6. `tools/generation/cost-resource-optimization-generate-decision-trees.ps1`
7. `tools/generation/cost-resource-optimization-gen_trees.ps1`
8. `tools/generation/ai-intelligence-systems-generate-decision-trees.ps1`
9. `generate-intelligence.ps1`
10. `generate-indexes.ps1`

---

## Knowledge Files Fixed (22 files)

### Anchored Summaries (21 files)
Each `.anchored-summary.md` had `C:\Users\Pc\Desktop\...\research\workspaces\{domain}` replaced with relative paths.

- `knowledge/ai-intelligence-systems/.anchored-summary.md`
- `knowledge/api-crud-system-engineering/.anchored-summary.md`
- `knowledge/api-integration-engineering/.anchored-summary.md`
- `knowledge/application-architecture-patterns/.anchored-summary.md`
- `knowledge/async-distributed-systems/.anchored-summary.md`
- `knowledge/backend-architecture-design/.anchored-summary.md`
- `knowledge/cost-resource-optimization/.anchored-summary.md`
- `knowledge/data-engineering-analytics/.anchored-summary.md`
- `knowledge/data-storage-systems/.anchored-summary.md`
- `knowledge/devops-infrastructure/.anchored-summary.md`
- `knowledge/governance-compliance-engineering/.anchored-summary.md`
- `knowledge/laravel-core-application-engineering/.anchored-summary.md`
- `knowledge/laravel-eloquent-domain-modeling/.anchored-summary.md`
- `knowledge/laravel-execution-lifecycle/.anchored-summary.md`
- `knowledge/observability-production-intelligence/.anchored-summary.md`
- `knowledge/performance-runtime-engineering/.anchored-summary.md`
- `knowledge/platform-engineering-developer-experience/.anchored-summary.md`
- `knowledge/real-time-systems/.anchored-summary.md`
- `knowledge/search-retrieval-systems/.anchored-summary.md`
- `knowledge/security-identity-engineering/.anchored-summary.md`
- `knowledge/testing-reliability-engineering/.anchored-summary.md`

### Domain Summary (1 file)

- `knowledge/data-storage-systems/summary.md`

---

## Rules Repaired (1 file)

- `knowledge/api-crud-system-engineering/resource-controllers/singleton-resource-controllers/05-rules.md`
  - Removed PowerShell profile path from PHP code examples
  - Fixed broken PHP variable names

---

## Reports Created (9 files)

- `docs/audits/phase-11-2-1-remediation-report.md` (this file)
- `docs/audits/remediation-path-inventory.md`
- `docs/audits/ambiguous-reference-backlog.md`
- `docs/audits/deterministic-rebuild-verification.md`
- `docs/audits/post-remediation-security-scan.md`
- `docs/audits/phase-11-3-readiness-recheck.md`
- `docs/audits/post-remediation-quality-backlog.md`
- `docs/audits/agent-navigation-remediation.md`
- `docs/audits/graph-delta-analysis.md`

---

## Documentation Updated (6 files)

- `AGENTS.md` — Updated MCP count, fixed stale references
- `CLAUDE.md` — Fixed encoding, updated counts
- `README.md` — Fixed MCP config count (2→1), updated badge
- `docs/documentation-sync-audit.md` — Updated assert counts
- `docs/phase-11-1-4-current-state-audit.md` — Updated metrics
- `docs/phase-11-2-mcp-adapter-report.md` — Minor corrections

---

## Intelligence Indexes Regenerated (8 files)

- `intelligence/indexes/anti-pattern-index.md`
- `intelligence/indexes/checklist-index.md`
- `intelligence/indexes/decision-tree-index.md`
- `intelligence/indexes/dependency-index.md`
- `intelligence/indexes/knowledge-unit-index.md`
- `intelligence/indexes/rule-index.md`
- `intelligence/indexes/skill-index.md`
- `intelligence/registry/knowledge-registry.md`

---

## Graph JSON Regenerated (2 files)

- `intelligence/json/dependencies.json` (428 → 429 edges)
- `intelligence/json/relationships.json` (3,633 → 3,513 edges)

---

## Agent Navigation Repaired (1 file)

- `agent/domain-routing-index.md` — Fixed stale KU counts (10 of 21 domains corrected) and wrong anchor links

---

## Install/Update Scripts Fixed (4 files)

- `install.ps1` — v1.0.0-beta.6 → v1.0.0-beta.8, removed `ecc-clone` dead reference
- `install.sh` — v1.0.0-beta.6 → v1.0.0-beta.8, removed `ecc-clone` dead reference
- `update.ps1` — Fixed stale version
- `update.sh` — Fixed `sed -i` macOS incompatibility, stale version

---

## Package-lock Regenerated (1 file)

- `package-lock.json` — Missing `mcp` bin entry added

---

## Stale Artifacts Removed (2 files)

- `knowledge/data-storage-systems/connections/connection-lifecycle/09-test.md` — 9-byte stub
- `production/indexes/anti-pattern-index.md` — 175 KB stale duplicate

---

## Test Assertions Updated (1 file)

- `tests/retrieval/mcp.test.mjs` — Updated expected metrics

---

## OpenCode Commands Added (4 files)

- `.opencode/commands/artisan.md`
- `.opencode/commands/code-review.md`
- `.opencode/commands/plan.md`
- `.opencode/commands/tdd.md`
