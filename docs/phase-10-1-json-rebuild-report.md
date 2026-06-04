# Phase 10.1 — JSON Rebuild Report

**Generated:** 2026-06-04

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| knowledge-units.json entries | 2,312 | 2,408 |
| rules.json entries | (stale) | 13,527 |
| skills.json entries | (stale) | 31,635 |
| decision-trees.json entries | (stale) | 23,754 |
| anti-patterns.json entries | (stale) | 16,046 |
| checklists.json entries | (stale) | 2,408 |
| dependencies.json nodes | 2,312 | 2,408 |

---

## 91-Entry Mismatch Investigation

The initial audit claimed 91 entries missing. Actual analysis revealed:

| Source | Count |
|--------|-------|
| Repository KU count (filesystem) | 2,408 |
| Previous `knowledge-units.json` entries | 2,312 |
| Actual discrepancy | 96 |
| Reason for discrepancy | KUs existed on filesystem but were never indexed in JSON |

**Cause classification:**

| Cause | Count | Details |
|-------|-------|---------|
| Missing source file (in JSON) | 236 | KUs on filesystem not in JSON (including subdomain-level KUs) |
| Orphaned JSON entries | 137 | JSON entries with paths not matching any filesystem KU (path format mismatches) |
| Net discrepancy corrected | 96 | 236 new - 140 orphaned = 96 net increase (2,312 → 2,408) |

**Resolution:** Complete regeneration of `knowledge-units.json` from the filesystem resolved all discrepancies.

---

## JSON Files Regenerated

All 7 JSON files were regenerated from scratch by scanning the filesystem:

| File | Source |
|------|--------|
| `knowledge-units.json` | Directory scanning of all KUs with `04-standardized-knowledge.md` |
| `rules.json` | Parsing `05-rules.md` files (## heading extraction for rule names) |
| `skills.json` | Parsing `06-skills.md` files (## heading extraction for skill names) |
| `decision-trees.json` | Parsing `07-decision-trees.md` files |
| `anti-patterns.json` | Parsing `08-anti-patterns.md` files |
| `checklists.json` | Parsing `09-checklists.md` files (- [ ] item extraction) |
| `dependencies.json` | Generated from knowledge-units.json KU entries |

---

## ID Convention

All IDs are deterministic using the format:
```
{domain-slug}/{subdomain-slug}/{ku-slug}/{artifact-type}-{index}
```

All source paths resolve within `laravel-ecc/knowledge/`. No paths reference `research/` or `production/`.

---

## Normalization

- All `id` fields are collision-free (derived from unique path + incrementing index)
- All `source_path` fields use forward-slash paths relative to `laravel-ecc/`
- All domain names normalized to canonical 22-domain format
- All records include: id, domain, subdomain, knowledge_unit, source_path
