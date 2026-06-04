# Duplicate KU Resolution Report

**Date:** 2026-06-04  
**Repository:** Laravel ECC  
**Scope:** 6 duplicate KU directory pairs  

---

## Resolved Pairs

### Pair 1: `laravel-optimize-command/` → `optimize-command/`

| Detail | Value |
|--------|-------|
| **Duplicate** | `knowledge/laravel-execution-lifecycle/caching-optimization/laravel-optimize-command/` |
| **Canonical** | `knowledge/laravel-execution-lifecycle/caching-optimization/optimize-command/` |
| **Files compared** | 9 files in duplicate (including extra `04.md` copy of `04-standardized-knowledge.md`), 8 files in canonical. Same filenames but different sizes/contents — no merge needed. |
| **Files merged** | None |
| **References updated** | 9 JSON files + 6 index MD files + 4 knowledge files (`compilation-optimization`, `ku-02-route-caching`, `event-listener-registration-order`, `bootstrap-warmup-in-cicd`, etc.) — all `ku-09-laravel-optimize-command` and `laravel-optimize-command` references replaced with `optimize-command` |
| **Directory removed** | Yes |
| **Unresolved issues** | None |

### Pair 2: `ku-01-config-caching/` → `config-caching/`

| Detail | Value |
|--------|-------|
| **Duplicate** | `knowledge/laravel-execution-lifecycle/caching-optimization/ku-01-config-caching/` |
| **Canonical** | `knowledge/laravel-execution-lifecycle/caching-optimization/config-caching/` |
| **Files compared** | 9 files in duplicate (including extra `04.md` copy of `04-standardized-knowledge.md`), 8 files in canonical. Same filenames but different sizes/contents — no merge needed. |
| **Files merged** | None |
| **References updated** | 9 JSON files + 6 index MD files + 6 knowledge files (`compilation-optimization`, `ku-02-route-caching`, `opcache-autoloader`, etc.) — all `ku-01-config-caching` replaced with `config-caching` |
| **Directory removed** | Yes |
| **Unresolved issues** | None |

### Pair 3: `event-caching/` → `events-caching/`

| Detail | Value |
|--------|-------|
| **Duplicate** | `knowledge/laravel-execution-lifecycle/caching-optimization/event-caching/` |
| **Canonical** | `knowledge/laravel-execution-lifecycle/caching-optimization/events-caching/` |
| **Files compared** | 9 files in duplicate (including extra `04.md` copy of `04-standardized-knowledge.md`), 8 files in canonical. Same filenames but different sizes/contents — no merge needed. |
| **Files merged** | None |
| **References updated** | 9 JSON files + 6 index MD files + 2 knowledge files (`event-listener-registration-order`) — all `ku-03-event-caching` and bare `event-caching` references replaced with `events-caching` |
| **Directory removed** | Yes |
| **Unresolved issues** | None |

### Pair 4: `service-caching-meta/` → `services-cache/`

| Detail | Value |
|--------|-------|
| **Duplicate** | `knowledge/laravel-execution-lifecycle/caching-optimization/service-caching-meta/` |
| **Canonical** | `knowledge/laravel-execution-lifecycle/caching-optimization/services-cache/` |
| **Files compared** | 9 files in duplicate (including extra `04.md` copy of `04-standardized-knowledge.md`), 8 files in canonical. Same filenames but different sizes/contents — no merge needed. |
| **Files merged** | None |
| **References updated** | 9 JSON files + 6 index MD files + 2 knowledge files (`view-caching`) — all `ku-05-service-caching-meta` and bare `service-caching-meta` references replaced with `services-cache` |
| **Directory removed** | Yes |
| **Unresolved issues** | None |

### Pair 5: `cache-invalidation-deploy/` → `cache-invalidation-deployment/`

| Detail | Value |
|--------|-------|
| **Duplicate** | `knowledge/laravel-execution-lifecycle/caching-optimization/cache-invalidation-deploy/` |
| **Canonical** | `knowledge/laravel-execution-lifecycle/caching-optimization/cache-invalidation-deployment/` |
| **Files compared** | 9 files in duplicate (including extra `04.md` copy of `04-standardized-knowledge.md`), 8 files in canonical. Same filenames but different sizes/contents — no merge needed. |
| **Files merged** | None |
| **References updated** | 9 JSON files + 6 index MD files + 10 knowledge files (`compilation-optimization`, `ku-02-route-caching`, `opcache-autoloader`, `opcache-configuration`, `optimize-command`, `services-cache`, `view-caching`, `bootstrap-warmup-in-cicd`, `composer-autoloader-optimization`, `config-caching`, `events-caching`, `bootstrap-with-event-system`, `octane-boot-timing`) — all `ku-08-cache-invalidation-deploy` and bare `cache-invalidation-deploy` references replaced with `cache-invalidation-deployment` |
| **Directory removed** | Yes |
| **Unresolved issues** | None |

### Pair 6: `commitment-optimization/scheduled-scaling/` → `server-sizing-autoscaling/scheduled-scaling/`

| Detail | Value |
|--------|-------|
| **Duplicate** | `knowledge/cost-resource-optimization/commitment-optimization/scheduled-scaling/` |
| **Canonical** | `knowledge/cost-resource-optimization/server-sizing-autoscaling/scheduled-scaling/` |
| **Files compared** | Both have 8 files. `06-skills.md` is identical (same hash). Other files differ — no merge needed as canonical is more complete. |
| **Files merged** | None |
| **References updated** | 9 JSON files + 6 index MD files — all `commitment-optimization/scheduled-scaling` replaced with `server-sizing-autoscaling/scheduled-scaling` |
| **Directory removed** | Yes |
| **Unresolved issues** | None |

---

## Summary

| Metric | Count |
|--------|-------|
| Directories compared | 12 (6 pairs) |
| Files compared | ~100 files across all pairs |
| Files merged | 0 — no unique content found in duplicates requiring merge |
| Directories removed | 6 |
| Index files updated | 7 JSON + 6 MD index + 1 registry = 14 intelligence files |
| Knowledge files updated | ~18 knowledge files with cross-references |
| Unresolved issues | None |

## Post-Cleanup Structure

### Caching Optimization (remaining canonical KUs):

`bootstrap-warmup-in-cicd/`, `cache-invalidation-deployment/`, `compilation-optimization/`, `composer-autoloader-optimization/`, `config-caching/`, `events-caching/`, `ku-02-route-caching/`, `opcache-autoloader/`, `opcache-configuration/`, `optimize-command/`, `route-caching/`, `services-cache/`, `view-caching/`

### Commitment Optimization (remaining KUs):

`auto-scaling-policies/`, `compute-savings-plans/`, `ec2-instance-savings-plans/`, `reserved-instances/`, `spot-instances/`, `spot-instances-strategy/`, `spot-interruption-costs/`
