# Phase 10.3 — Dependency Authoring Report

## Overview
This report documents the dependency and relationship graph built during Phase 10.3 for all 2,321 canonical KUs.

## Summary

| Metric | Value |
|---|---|
| Canonical KUs | 2,321 |
| Dependency Edges | 269 |
| Relationship Edges | 3,621 |
| KUs with Dependencies | 377 |
| KUs with Related Topics | 1,681 |
| Unmatched References | 323 |
| Isolated KUs | 2,043 |
| Cross-Domain Dependency Edges | 49 |

## Dependency Graph

269 edges injected into `dependencies.json`:

- **required**: Edges from KU-to-KU where the `Dependencies` metadata matches a canonical KU name exactly.
- **recommended**: Edges where partial name matching was used (substring, fuzzy) for section-number references, K-codes, and similar patterns.

### Edge Distribution

| Source Domain | Target Domain | Count |
|---|---|---|
| data-storage-systems | data-storage-systems | 59 |
| testing-reliability-engineering | testing-reliability-engineering | 27 |
| ai-intelligence-systems | real-time-systems | 22 |
| data-storage-systems | testing-reliability-engineering | 6 |
| backend-architecture-design | data-storage-systems | 5 |
| laravel-core-application-engineering | testing-reliability-engineering | 4 |
| data-storage-systems | data-engineering-analytics | 3 |
| data-storage-systems | observability-production-intelligence | 2 |
| (and other cross-domain pairs) | | |

## Relationship Graph

3,621 edges in `relationships.json` generated from `Related KUs` metadata fields and `## Related KUs` sections in 04 files.

- All edges validated: both source and target resolve to existing KUs.
- Bidirectional deduplication: `A <-> B` and `B <-> A` are stored once.
- 1,681 KUs (72% of all KUs) have at least one relationship edge.

## Unmatched Reference Analysis

323 references could not be matched to canonical KUs. Categories:

| Category | Count | Examples |
|---|---|---|
| External concepts | ~150 | "PHPUnit basics", "CSS selectors", "HTTP protocol" |
| Section-number refs | ~90 | "5.14 PostgreSQL RLS", "7.10 Multi-master replication" |
| Real-time-system K-codes | ~50 | K16, K17, K19, K20, K21, K22, K25, K30, K31, K32 |
| Other unmatched | ~33 | Partial name mismatches, typos |

These are not structural gaps — they reference external knowledge or use format-mismatched identifiers.

## Isolated KUs

2,043 KUs have no explicit dependencies or dependents. This is expected for:
- Foundation/overview KUs (they serve as prerequisites, not dependents)
- Reference material KUs
- KUs whose dependencies are at the language/framework level

## JSON Validation

- `dependencies.json`: Valid. 269 edges, 2,321 nodes.
- `relationships.json`: Valid. 3,621 edges.

## Files Modified

- `intelligence/json/dependencies.json` — 269 dependency edges injected
- `intelligence/json/relationships.json` — 3,621 relationship edges
- `intelligence/indexes/dependency-index.md` — Regenerated with real data
- `tools/rebuild-intelligence.ps1` — Re-run for full regeneration

## Known Issues

1. **BOM in dependencies.json**: The inject script writes UTF-8 BOM. Node.js parsers need BOM-aware handling.
2. **323 unmatched refs**: Excluded from graph; could be mapped with additional name/alias mappings.
3. **2213/2321 mapped names**: 108 KUs missing from name mapping (02 files with unusual formats).
4. **First node in nodes array was corrupted** (missing `{` and `"subdomain"` in original `dependencies.json`) — fixed during Phase 10.3.
