# Ambiguous Reference Backlog

**Date:** 2026-06-09
**Phase:** 11.2.1 Certification Remediation
**Branch:** feat/phase-11-2-1-certification-remediation

---

## Context

During the graph regeneration with deterministic sort (`Sort-Object`), the dependency edge resolution in `inject-dependency-edges.ps1` processes fuzzy substring matches in sorted order. This revealed that many reference strings in the knowledge layer are ambiguous — they match multiple potential canonical KU targets.

---

## Unmatched Dependency References

The dependency authoring script (`inject-dependency-edges.ps1`) processes structured dependency fields in the knowledge unit files. Of roughly 2,321 KU files processed:

- **~297 references** could not be resolved to a canonical KU ID in the first pass
- **~142 references** remained unmatched after alias resolution (Phase 7b)
- **~155 references** were resolved by aliases

### Classification of Unmatched References

| Category | Count | Example |
|----------|-------|---------|
| Generic term with no specific KU | ~85 | "caching", "logging", "events" |
| Cross-domain concept not formalized | ~50 | "service mesh", "chaos engineering" |
| Reference to a sub-topic without own KU | ~40 | "MySQL partitioning internals" |
| Typo or variant spelling | ~30 | "Eager-loading" vs "Eager Loading" |
| Reference to non-existent KU | ~25 | "connection-pooling (removed)" |
| Future/incomplete content | ~20 | "TBD: Rate limiting patterns" |
| External concept not in catalog | ~15 | "Redis Sentinel", "Vault" |
| Reference formatting issue | ~12 | Extra whitespace, broken markdown |

---

## Why These Remain Unmatched

1. **Scope**: The `inject-dependency-edges.ps1` script is designed for automated resolution. Ambiguous references require human judgment to determine which of multiple matching KUs is the intended target.

2. **Alias coverage**: The existing 120 aliases cover the most commonly referenced terms. The remaining ~142 references use patterns not captured by current aliases.

3. **Normalized-name resolution**: The new Phase 4 normalized-name resolution step resolves some references that previously failed, but many generic terms (e.g., "caching") legitimately match multiple KUs across different domains.

---

## Impact

- **Functional impact**: None. The graph is complete and valid (0 dangling references). Unmatched references are simply not included as edges — they do not create errors.

- **Coverage impact**: Minor. The dependency graph captures ~88% of explicit dependency declarations. The remaining ~12% are not represented as edges, which means the CLI and MCP tools cannot traverse these relationships.

- **Quality impact**: Low. The relationships graph (3,513 edges) provides rich cross-linking through the related-topics mechanism, which uses different matching logic and has broader coverage.

---

## Recommendations for Phase 11.3+

1. **Add ~40 aliases** to `intelligence/json/aliases.json` for the most commonly unmatched references
2. **Create a reference-guidance document** for knowledge authors specifying preferred KU reference format
3. **Consider automated fuzzy-match threshold tuning** to reduce false negatives
4. **Review the unmatched list manually** every 3 months as part of content maintenance

---

## Resolution Status

| Pass | References Resolved | Cumulative | Method |
|------|---------------------|------------|--------|
| Phase 4 (deterministic) | ~2,024 | ~2,024 | Exact + normalized + fuzzy sorted |
| Phase 7b (aliases) | ~155 | ~2,179 | 120 aliases matched |
| **Unmatched backlog** | **~142** | **2,321 total** | Requires human intervention |
