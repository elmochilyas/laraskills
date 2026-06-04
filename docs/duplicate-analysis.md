# Duplicate Analysis Report

**Date:** 2026-06-04
**Scope:** knowledge/, intelligence/

---

## 1. Knowledge Unit Name Duplicates (46 shared names)

All are **acceptable cross-domain references** — each instance has different content. No deduplication needed.

**Example cross-domain KU names:**
- `outbox-pattern`: api-integration-engineering, backend-architecture-design, application-architecture-patterns
- `n-plus-one-detection`: data-storage-systems, observability-production-intelligence, testing-reliability-engineering
- `circuit-breaker`: api-integration-engineering, application-architecture-patterns
- `event-sourcing-cqrs`: api-integration-engineering, application-architecture-patterns
- `dependency-injection`: laravel-core-application-engineering, application-architecture-patterns
- `spatie-laravel-data`: laravel-eloquent-domain-modeling, laravel-core-application-engineering

---

## 2. Exact Duplicate Files (90 files)

### HIGH Severity — Duplicate Rule Files (10 files, 5 pairs)

All located in `laravel-execution-lifecycle/caching-optimization/`:

| Duplicate (Remove) | Canonical (Keep) | Evidence |
|--------------------|------------------|----------|
| `laravel-optimize-command/05-rules.md` | `optimize-command/05-rules.md` | Identical SHA256 |
| `ku-01-config-caching/05-rules.md` | `config-caching/05-rules.md` | Identical SHA256 |
| `event-caching/05-rules.md` | `events-caching/05-rules.md` | Identical SHA256 |
| `service-caching-meta/05-rules.md` | `services-cache/05-rules.md` | Identical SHA256 |
| `cache-invalidation-deploy/05-rules.md` | `cache-invalidation-deployment/05-rules.md` | Identical SHA256 |

These are rename/migration remnants where old KU directories were kept alongside renamed versions.

### HIGH Severity — Duplicate Skill File (2 files, 1 pair)

| Duplicate | Canonical |
|-----------|-----------|
| `cost-resource-optimization/commitment-optimization/scheduled-scaling/06-skills.md` | `cost-resource-optimization/server-sizing-autoscaling/scheduled-scaling/06-skills.md` |

A moved KU where both copies remain. The `server-sizing-autoscaling` subdomain is the more appropriate location.

### MEDIUM Severity — Template Anti-Pattern Stubs (78 files, 15 groups)

These are **identical auto-generated placeholder files** with no actual anti-pattern content:

| Group | Count | Location |
|-------|-------|----------|
| Feature HTTP testing | 10 | testing-reliability-engineering/feature-http-testing/ |
| Unit testing | 8 | testing-reliability-engineering/unit-testing/ |
| CI/CD pipeline | 8 | testing-reliability-engineering/ci-cd-pipeline/ |
| Mocking & fakes | 8 | testing-reliability-engineering/mocking-fakes/ |
| Database testing | 8 | testing-reliability-engineering/database-testing/ |
| Core concepts | 8 | testing-reliability-engineering/core-concepts/ |
| Code quality | 8 | platform-engineering-developer-experience/code-quality/ |
| CDN storage optimization | 7 | cost-resource-optimization/cdn-storage-optimization/ |
| Queue worker optimization | 7 | cost-resource-optimization/queue-worker-optimization/ |
| Resilience & chaos eng. | 6 | testing-reliability-engineering/resilience-chaos-engineering/ |
| Test data management | 6 | testing-reliability-engineering/test-data-management/ |
| Browser E2E testing | 5 | testing-reliability-engineering/browser-e2e-testing/ |
| Cache layer optimization | 3 | cost-resource-optimization/cache-layer-optimization/ |
| Performance load testing | 3 | testing-reliability-engineering/performance-load-testing/ |
| Misc testing areas | 7 | testing-reliability-engineering/mutation/architecture/snapshot/flaky/ |

---

## 3. Clean Areas (No Duplicates Found)

- 07-decision-trees.md — 0 duplicates across all 2,327 files
- 09-checklists.md — 0 duplicates across all 2,284 files
- Index entries — 0 duplicate KU references
- Registry entries — all unique
- JSON entries — all unique (2,284 distinct IDs)

---

## Recommendations

| Priority | Action | Type | Effort |
|----------|--------|------|--------|
| 1 | Remove 5 duplicate KU directories in caching-optimization | HIGH | Low |
| 2 | Remove duplicate scheduled-scaling skill file | HIGH | Low |
| 3 | Author content for 78 anti-pattern stubs | MEDIUM | High |
| 4 | No action for 46 cross-domain KU name overlaps | INFO | None |

**No automatic deletions were performed.**
