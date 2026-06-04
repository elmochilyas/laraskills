# 4-9 Like Leading Wildcard

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-9 |
| Knowledge Unit Title | Like Leading Wildcard |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.13 Full-text indexes | 4.7 Sargable vs non-sargable |
| Last Updated | 2026-06-02 |

## Overview

`LIKE '%value'` or `LIKE '%value%'` cannot use B-Tree indexes because the starting character is unknown. `LIKE 'value%'` (trailing wildcard only) IS sargable — it's a range scan over values starting with "value".

---

## Core Concepts

- **Trailing wildcard only**: `LIKE 'prefix%'` — sargable. Uses B-Tree range scan `WHERE col >= 'prefix' AND col < 'prefiy'`.
- **Leading wildcard**: `LIKE '%suffix'` or `LIKE '%middle%'` — full table scan. No B-Tree index can help.
- **Alternatives**: Full-text index (FULLTEXT, GIN tsvector), pg_trgm (GIN trigram index), external search (Meilisearch, Algolia).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use full-text search for text columns**: MySQL FULLTEXT index + `MATCH...AGAINST`. PostgreSQL GIN index on tsvector + `@@`.
- **Use pg_trgm for PostgreSQL**: `CREATE INDEX ON table USING GIN (col gin_trgm_ops)` — enables `ILIKE '%search%'` with index support.
- **Use Scout for advanced search**: Laravel Scout with Meilisearch, Algolia, or Typesense for any non-trivial search feature.


## Architecture Guidelines

- Query cache for read-heavy low-write workloads. Materialized views for complex aggregations. Read replicas for reporting offload.

## Performance Considerations

- EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table queries affects performance.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | LIKE on large text column without alternatives**: Full-text search is always better for natural language search. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
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

