# Dependency Authoring Backlog

> Proposal-only. No automatic edge injection.
> Generated: 2026-06-04 | Phase 10.5

## Priority Matrix

Priority is based on domain size, current coverage gap, and logical dependency discoverability:

| Priority | Domain | KUs | Coverage | Rationale |
|---|---|---|---|---|
| P0 | data-storage-systems | 289 | 80.6% | Largest domain, already 158 edges — highest ROI for incremental authoring |
| P0 | laravel-eloquent-domain-modeling | 171 | 36.8% | 108 orphans despite being a core domain |
| P1 | api-crud-system-engineering | 246 | 69.5% | Large domain, only 1 dep edge, 75 orphans |
| P1 | application-architecture-patterns | 107 | 21.5% | 84 orphans, foundational patterns domain |
| P1 | backend-architecture-design | 84 | 29.8% | 59 orphans, core engineering domain |
| P1 | platform-engineering-developer-experience | 107 | 56.1% | 47 orphans, developer tooling |
| P2 | async-distributed-systems | 95 | 9.5% | 86 orphans but highly specific |
| P2 | performance-runtime-engineering | 161 | 97.5% | Good rel coverage, add deps incrementally |
| P3 | security-identity-engineering | 61 | 93.4% | Good rel coverage |
| P3 | devops-infrastructure | 47 | 8.5% | Small domain, specialized |
| P3 | data-engineering-analytics | 44 | 9.1% | Small domain |
| P3 | observability-production-intelligence | 34 | 38.2% | Small domain |
| P4 | governance-compliance-engineering | 40 | 0.0% | Zero rels, needs rels first before deps |
| P4 | api-integration-engineering | 82 | 100.0% | Has full rel coverage |
| P4 | cost-resource-optimization | 109 | 100.0% | Has full rel coverage |
| P4 | search-retrieval-systems | 140 | 100.0% | Has full rel coverage |
| P4 | ai-intelligence-systems | 117 | 100.0% | Has full dep+rel coverage |
| P4 | laravel-core-application-engineering | 159 | 96.2% | Near-full coverage |
| P4 | laravel-execution-lifecycle | 110 | 100.0% | Full coverage |
| P4 | real-time-systems | 39 | 89.7% | Near-full coverage |
| P4 | testing-reliability-engineering | 79 | 79.7% | Good coverage |

## Zero-Dep Domains — Suggested Initial Edges

### P2: async-distributed-systems (95 KUs, 0 dep edges)

Candidate cross-domain prerequisites:

| From | To | Type | Rationale |
|---|---|---|---|
| laravel-core-application-engineering/routing/queue-workflow | async-distributed-systems/queue-configuration/job-lifecycle | prerequisite | Queue config requires core understanding |
| laravel-core-application-engineering/event-system/event-discovery | async-distributed-systems/event-driven-architecture/event-definition | prerequisite | Events are defined in Laravel core |
| data-storage-systems/connections/pool-architecture | async-distributed-systems/queue-configuration/job-lifecycle | prerequisite | DB connection pooling for job workers |
| laravel-core-application-engineering/caching/cache-drivers | async-distributed-systems/distributed-caching/cache-invalidation | prerequisite | Cache drivers before distributed invalidation |

### P2: performance-runtime-engineering (161 KUs, 0 dep edges)

| From | To | Type | Rationale |
|---|---|---|---|
| data-storage-systems/optimization/sargable-vs-non-sargable | performance-runtime-engineering/query-optimization/n-plus-1-detection | prerequisite | Sargability before query detection |
| laravel-execution-lifecycle/middleware-pipeline/middleware-execution-order | performance-runtime-engineering/request-lifecycle/middleware-bottleneck-analysis | prerequisite | Middleware order before bottleneck analysis |
| data-storage-systems/indexes/composite-index-column-order | performance-runtime-engineering/database-profiling/slow-query-log-analysis | prerequisite | Index understanding before profiling |

### P3: security-identity-engineering (61 KUs, 0 dep edges)

| From | To | Type | Rationale |
|---|---|---|---|
| laravel-core-application-engineering/middleware-pipeline/middleware-execution-order | security-identity-engineering/authentication/guard-authentication-flow | prerequisite | Middleware before auth guards |
| laravel-core-application-engineering/routing/route-model-binding | security-identity-engineering/authorization/policy-auto-discovery | prerequisite | Route model binding before policies |

### P3: devops-infrastructure (47 KUs, 0 dep edges)

| From | To | Type | Rationale |
|---|---|---|---|
| platform-engineering-developer-experience/environment-configuration/env-file-management | devops-infrastructure/deployment-strategies/zero-downtime-deployment | prerequisite | Env config before deployment |
| laravel-core-application-engineering/configuration/config-caching | devops-infrastructure/ci-cd-pipelines/build-optimization | prerequisite | Config caching before build pipelines |

### P4: governance-compliance-engineering (40 KUs, 0 dep edges, 0 rel edges)

This domain needs relationship edges first. The following would connect it to the knowledge graph:

| From | To | Type | Rationale |
|---|---|---|---|
| security-identity-engineering/encryption/data-encryption-at-rest | governance-compliance-engineering/data-protection/data-retention-policies | related-topic | Encryption is a compliance requirement |
| data-storage-systems/schema-design/soft-delete-implementation | governance-compliance-engineering/audit-logging/audit-trail-implementation | related-topic | Soft deletes relate to audit requirements |
| laravel-core-application-engineering/middleware-pipeline/middleware-execution-order | governance-compliance-engineering/audit-logging/http-request-auditing | prerequisite | Middleware for request auditing |

## Backlog Workflow

1. For each target domain, add `Dependencies` metadata field in `04-standardized-knowledge.md` files
2. Run `tools/generation/inject-dependency-edges.ps1` to regenerate edges
3. Validate: no broken references, no circular dependencies
4. Review: edges are prerequisite-accurate (not merely related)

## Notes

- Only add edges when the source KU is a genuine **prerequisite** for the target KU
- Prefer **strength: required** for hard prerequisites, **strength: recommended** for strong suggestions
- Avoid creating edges solely to reduce the orphan count
- Cross-domain edges are high-value: they connect otherwise siloed knowledge

## Reference: Edge Schema

```json
{
  "id": "$sourceId->$targetId",
  "source": "$sourceId",
  "target": "$targetId",
  "type": "prerequisite",
  "strength": "required|recommended",
  "reason": "Human-readable explanation",
  "evidence_paths": ["knowledge/$targetId/04-standardized-knowledge.md"]
}
```
