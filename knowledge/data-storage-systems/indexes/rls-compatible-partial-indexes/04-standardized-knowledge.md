# 3-30 Rls Compatible Partial Indexes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-30 |
| Knowledge Unit Title | Rls Compatible Partial Indexes |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.14 PostgreSQL RLS | 12.19 Row-Level Security | 12.21 RLS-compatible index design |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL Row-Level Security (RLS) policies can cause expensive post-scan filters when indexes don't align with policy `USING` expressions. Creating partial indexes that match the RLS policy's `USING` clause enables the index to pre-filter rows before the policy is evaluated, preventing full table scans.

---

## Core Concepts

- **Policy alignment**: If RLS policy is `USING (tenant_id = current_setting('app.tenant_id')::bigint)`, a partial index `WHERE tenant_id = current_setting('app.tenant_id')::bigint` allows the planner to use the index for policy evaluation.
- **FORCE ROW LEVEL SECURITY**: Required to prevent table owner bypass. Without it, the table owner's queries skip RLS.
- **Partition propagation**: RLS policies on partitioned tables must be propagated to each partition.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Create partial indexes matching tenant policy**: Index `WHERE tenant_id = current_setting('app.tenant_id')::bigint` — the planner recognizes the match and uses the index during policy evaluation.
- **Combined with application scopes**: RLS partial indexes complement global scopes. The scope filters in the application; the RLS partial index ensures efficient enforcement at the database level.


## Architecture Guidelines

- Index types: B-Tree for equality/range/sort. GIN for JSONB and full-text. GiST for geospatial and ranges. BRIN for large ordered tables. Hash for equality-only in PostgreSQL.

## Performance Considerations

- B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index adds write amplification. BRIN indexes are efficient for large ordered datasets.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Index doesn't match policy expression**: `USING (tenant_id = 5)` vs index `WHERE tenant_id = 5`. Exact match required. Even implicit type differences break the match. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Table owner bypass**: Without `FORCE ROW LEVEL SECURITY`, superuser/owner queries skip RLS. The partial index for RLS is never used, but that's correct — those queries don't need it. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Query planner ignores indexes when column types mismatch query parameter types. Implicit type conversion prevents index usage. Index bloat from heavy UPDATE/DELETE workloads degrades performance. Missing indexes on FK columns cause full table scans on JOIN queries.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Indexing Strategy Physical Design
- **Closely Related**: Other KUs within Indexing Strategy Physical Design
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

