# Dependency Coverage Baseline

> Generated: 2026-06-04
> Phase 10.5 — Dependency Schema Repair & Coverage Foundation

## Summary

| Metric | Value |
|---|---|
| Total KUs | 2,321 |
| Total Domains | 21 |
| Dependency Edges | 269 |
| Relationship Edges | 3,621 |
| Domains with Dep Edges | 11 / 21 |
| Cross-Domain Dep Edges | 95 |
| Intra-Domain Dep Edges | 174 |
| KUs Participating in Deps (source or target) | 278 |
| KUs Participating in Rels | 1,550 |
| Total Orphan KUs (no dep OR rel) | 693 (29.9%) |
| Zero-Dep Domains | 10 |

## Per-Domain Coverage

| Domain | KUs | Dep Edges | Rel Edges | Dep-Participating KUs | Orphans | Coverage |
|---|---|---|---|---|---|---|
| ai-intelligence-systems | 117 | 40 | 778 | 30 | 0 | 100.0% |
| api-crud-system-engineering | 246 | 1 | 417 | 2 | 75 | 69.5% |
| api-integration-engineering | 82 | 0 | 189 | 0 | 0 | 100.0% |
| application-architecture-patterns | 107 | 2 | 126 | 4 | 84 | 21.5% |
| async-distributed-systems | 95 | 0 | 16 | 0 | 86 | 9.5% |
| backend-architecture-design | 84 | 18 | 374 | 25 | 59 | 29.8% |
| cost-resource-optimization | 109 | 0 | 317 | 0 | 0 | 100.0% |
| data-engineering-analytics | 44 | 0 | 9 | 0 | 40 | 9.1% |
| data-storage-systems | 289 | 158 | 224 | 186 | 56 | 80.6% |
| devops-infrastructure | 47 | 0 | 16 | 0 | 43 | 8.5% |
| governance-compliance-engineering | 40 | 0 | 0 | 0 | 40 | 0.0% |
| laravel-core-application-engineering | 159 | 19 | 777 | 22 | 6 | 96.2% |
| laravel-eloquent-domain-modeling | 171 | 11 | 191 | 15 | 108 | 36.8% |
| laravel-execution-lifecycle | 110 | 1 | 371 | 2 | 0 | 100.0% |
| observability-production-intelligence | 34 | 0 | 12 | 0 | 21 | 38.2% |
| performance-runtime-engineering | 161 | 0 | 362 | 0 | 4 | 97.5% |
| platform-engineering-developer-experience | 107 | 1 | 82 | 2 | 47 | 56.1% |
| real-time-systems | 39 | 39 | 85 | 28 | 4 | 89.7% |
| search-retrieval-systems | 140 | 0 | 402 | 0 | 0 | 100.0% |
| security-identity-engineering | 61 | 0 | 119 | 0 | 4 | 93.4% |
| testing-reliability-engineering | 79 | 74 | 137 | 71 | 16 | 79.7% |

**Coverage definition:** `(KUs - orphans) / KUs * 100` where orphans have no dep OR rel edges. 100% means every KU in the domain has at least one relationship link.

## Zero-Dep Domains (no dependency edges)

These 10 domains have no dependency edges at all:

1. api-integration-engineering
2. async-distributed-systems
3. cost-resource-optimization
4. data-engineering-analytics
5. devops-infrastructure
6. governance-compliance-engineering
7. observability-production-intelligence
8. performance-runtime-engineering
9. search-retrieval-systems
10. security-identity-engineering

## Cross-Domain Dependency Pairs

| Source Domain | Target Domain | Edges |
|---|---|---|
| ai-intelligence-systems | real-time-systems | 39 |
| laravel-core-application-engineering | testing-reliability-engineering | 17 |
| backend-architecture-design | data-storage-systems | 11 |
| laravel-eloquent-domain-modeling | data-storage-systems | 9 |
| backend-architecture-design | testing-reliability-engineering | 7 |
| data-storage-systems | testing-reliability-engineering | 2 |
| laravel-core-application-engineering | data-storage-systems | 2 |
| laravel-eloquent-domain-modeling | testing-reliability-engineering | 2 |
| application-architecture-patterns | testing-reliability-engineering | 2 |
| ai-intelligence-systems | testing-reliability-engineering | 1 |
| api-crud-system-engineering | testing-reliability-engineering | 1 |
| laravel-execution-lifecycle | testing-reliability-engineering | 1 |
| platform-engineering-developer-experience | testing-reliability-engineering | 1 |

## Top 10 Most Depended-Upon KUs

| KU ID | Dependents |
|---|---|
| real-time-systems/security/cross-language-pub-sub-gaps | 4 |
| real-time-systems/websocket-servers/pusher-channels-integration | 4 |
| testing-reliability-engineering/test-data-management/minimal-data-principle | 3 |
| real-time-systems/security/serverless-websocket-limitations | 3 |
| real-time-systems/websocket-servers/soketi-self-hosted-setup | 3 |
| testing-reliability-engineering/mocking-fakes/laravel-fakes | 3 |
| testing-reliability-engineering/mocking-fakes/mockery-integration | 3 |
| testing-reliability-engineering/feature-http-testing/file-upload-testing | 3 |
| testing-reliability-engineering/feature-http-testing/console-command-testing | 3 |
| data-storage-systems/connections/connection-count-management | 2 |

## Orphan Domains (most isolated)

| Domain | Orphans | Total KUs | % Isolated |
|---|---|---|---|
| laravel-eloquent-domain-modeling | 108 | 171 | 63.2% |
| async-distributed-systems | 86 | 95 | 90.5% |
| application-architecture-patterns | 84 | 107 | 78.5% |
| api-crud-system-engineering | 75 | 246 | 30.5% |
| backend-architecture-design | 59 | 84 | 70.2% |
| data-storage-systems | 56 | 289 | 19.4% |
| platform-engineering-developer-experience | 47 | 107 | 43.9% |
| devops-infrastructure | 43 | 47 | 91.5% |
| data-engineering-analytics | 40 | 44 | 90.9% |
| governance-compliance-engineering | 40 | 40 | 100.0% |

## Key Findings

1. **Testing & Reliability Engineering** is the most common cross-domain dependency target (31 edges from 8 different domains). This is natural — most engineering topics depend on testing concepts.

2. **Real-Time Systems** cross-domain dependencies (39 edges) come entirely from AI Intelligence Systems, reflecting the AI → real-time communication dependency pattern.

3. **Data Storage Systems** is the primary infrastructure dependency for both Backend Architecture Design (11 edges) and Laravel Eloquent Domain Modeling (9 edges).

4. **Relationship coverage (1,550 KUs, 66.8%)** is significantly higher than dependency coverage (278 KUs, 12.0%). Nearly all KUs have related-topic relationships, but explicit prerequisite dependencies are sparse.

5. **10 domains have zero dependency edges** — these are candidates for initial dependency authoring.

6. **Governance & Compliance Engineering** has zero relationship edges as well (100% orphan), making it the most disconnected domain.
