# Intelligence JSON Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## File Inventory

| File | Exists | Valid JSON | BOM-Free | Size | Records |
|------|--------|-----------|----------|------|---------|
| knowledge-units.json | ✅ | ✅ | ✅ | 2,044,122 B | 2,321 |
| rules.json | ✅ | ✅ | ✅ | 1,551,682 B | 2,321 |
| skills.json | ✅ | ✅ | ✅ | 1,558,646 B | 2,321 |
| decision-trees.json | ✅ | ✅ | ✅ | 1,614,358 B | 2,321 |
| anti-patterns.json | ✅ | ✅ | ✅ | 1,607,394 B | 2,321 |
| checklists.json | ✅ | ✅ | ✅ | 1,586,502 B | 2,321 |
| dependencies.json | ✅ | ✅ | ✅ | 1,570,080 B | 428 edges |
| relationships.json | ✅ | ✅ | ✅ | 3,033,852 B | 3,633 edges |
| aliases.json | ✅ | ✅ | ✅ | 40,011 B | 120 |
| external-concepts.json | ✅ | ✅ | ✅ | 16,171 B | 26 |

**Encoding:** All files are valid BOM-free UTF-8. No null bytes, no replacement characters, no mojibake.

## knowledge-units.json Structure

| Check | Result |
|-------|--------|
| Top-level key | `knowledge_units` (array) ✅ |
| Records | 2,321 ✅ |
| Missing `id` | 0 ✅ |
| Missing `domain` | 0 ✅ |
| Missing `directory` | 0 ✅ |
| All directories exist | 2,321/2,321 ✅ |
| Duplicate IDs | 0 ✅ |
| Duplicate directories | 0 ✅ |
| Unique domains | 21 ✅ |

**Note:** Field is named `directory`, not `path`. All consumers use `directory`.

## Domain Distribution

| Domain | KUs |
|--------|-----|
| data-storage-systems | 289 |
| api-crud-system-engineering | 246 |
| laravel-eloquent-domain-modeling | 171 |
| performance-runtime-engineering | 161 |
| laravel-core-application-engineering | 159 |
| search-retrieval-systems | 140 |
| ai-intelligence-systems | 117 |
| laravel-execution-lifecycle | 110 |
| cost-resource-optimization | 109 |
| application-architecture-patterns | 107 |
| platform-engineering-developer-experience | 107 |
| async-distributed-systems | 95 |
| backend-architecture-design | 84 |
| api-integration-engineering | 82 |
| testing-reliability-engineering | 79 |
| security-identity-engineering | 61 |
| devops-infrastructure | 47 |
| data-engineering-analytics | 44 |
| governance-compliance-engineering | 40 |
| real-time-systems | 39 |
| observability-production-intelligence | 34 |

## Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| 45 relationship self-loops | 🟡 Moderate | KUs have `related-topic` edges pointing to themselves in relationships.json |
| 101 cross-domain dependency edges | 🟢 Info | May be intentional; should be reviewed |
