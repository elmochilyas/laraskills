# Post-Remediation Quality Backlog

**Date:** 2026-06-09
**Phase:** 11.2.1 Certification Remediation
**Branch:** feat/phase-11-2-1-certification-remediation

---

## Deferred Cleanup Items

The following items were identified during Phase 11.2.1 certification remediation but deferred as non-blocking. They should be addressed in future phases.

---

## 1. Duplicated Anti-Pattern Files (~103 files)

**Severity:** 🟡 Medium
**Estimate:** ~30 minutes
**Description:** Approximately 103 knowledge units across 3 domains share identical `08-anti-patterns.md` files. This is a content quality gap — the CLI still serves content, but it's unhelpful duplication.

**Affected domains:** (to be identified)
**Fix:** Deduplicate with unique per-KU anti-pattern content or merge into shared cross-domain files.

---

## 2. Global Mojibake Cleanup (~80+ files)

**Severity:** 🟡 Low
**Estimate:** ~60 minutes
**Description:** Approximately 80+ files across the repository contain non-UTF8/mojibake characters. Affects AGENTS.md, CLAUDE.md, README.md, all agent harness configs, docs, and many knowledge files. The existing `Normalize-Mojibake` function in `tools/generation/inject-dependency-edges.ps1` could be extracted and run as a standalone cleanup script.

**Fix:** Run `Normalize-Mojibake` across all `.md` files in the repository.

---

## 3. Legacy 02-/03- File Removal (~4,599 files)

**Severity:** 🟢 Trivial
**Estimate:** ~5 minutes (automated)
**Description:** Every one of the 2,321 KUs has legacy `02-ku-name.md` and `03-ku-name.md` files from an earlier generation process. These are not referenced by any index, CLI tool, or MCP tool. However, they take up ~4,599 files of disk space and confuse repository navigation.

**Fix:** `Get-ChildItem knowledge -Recurse -Filter "02-*.md","03-*.md" | Remove-Item`

---

## 4. Decision-Tree Enrichment

**Severity:** 🟢 Trivial
**Estimate:** Variable
**Description:** Some domains have zero decision trees (`decisionTrees: []` in the retrieval output). Decision trees are optional artifacts, but enriching them improves the agent's ability to make architectural choices.

**Fix:** Author decision trees for KUs in domains with low coverage.

---

## 5. Agent/Skill Coverage Expansion

**Severity:** 🟢 Trivial
**Estimate:** Variable
**Description:** The curated operating layer (agents/, skills/, rules/) covers 12 Laravel domains, while the knowledge layer covers 21 engineering domains. There is an opportunity to expand agents and skills to match.

**Fix:** Create new agent definitions and skill files for uncovered domains (e.g., data-engineering, devops, platform-engineering).

---

## 6. Semantic Search Fallback

**Severity:** 🟢 Trivial
**Estimate:** 2-3 days
**Description:** The current retrieval CLI and MCP tools use deterministic keyword-based ranking. A semantic search fallback using embeddings (e.g., pgvector, OpenAI embeddings) could improve recall for queries that don't match keywords.

**Fix:** Add an optional `--semantic` mode to `search_ecc` and `retrieve_context_bundle`.

---

## 7. Remote MCP Hosting

**Severity:** 🟢 Trivial
**Estimate:** 1-2 days
**Description:** The MCP server currently supports only stdio transport. Remote hosting via HTTP/SSE would allow cloud-based agents to access ECC knowledge without local setup.

**Fix:** Add HTTP transport support to `laravel-ecc-mcp.mjs` (Express or Hono server wrapper).

---

## Backlog Priority Matrix

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| Anti-pattern deduplication | Medium | Low | **High** |
| Mojibake cleanup | Low | Medium | Medium |
| Legacy file removal | Low | Very Low | Medium |
| Decision-tree enrichment | Low | Variable | Low |
| Agent/skill expansion | Medium | High | Low |
| Semantic search | High | High | Low |
| Remote MCP hosting | High | Medium | Low |
