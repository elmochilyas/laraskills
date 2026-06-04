# 3-21 Index Management In Migrations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-21 |
| Knowledge Unit Title | Index Management In Migrations |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 1.5 Index definition via migrations | 3.8 Composite indexes |
| Last Updated | 2026-06-02 |

## Overview

Laravel's Schema builder supports index creation via Blueprint methods: `->index()`, `->unique()`, `->fullText()`, `->spatial()`. For advanced indexes (partial, expression, concurrent, custom names), raw `DB::statement()` is required.

---

## Core Concepts

- **Standard indexes**: `$table->index(['col1', 'col2'])` — composite B-Tree.
- **Unique indexes**: `$table->unique('email')` — unique constraint.
- **Full-text**: `$table->fullText('body')` — MySQL FULLTEXT.
- **Spatial**: `$table->spatialIndex('location')` — MySQL R-Tree.
- **Raw DDL**: `DB::statement('CREATE INDEX CONCURRENTLY ...')` — for features not supported by Blueprint.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Composite indexes in migrations**: Always define composite indexes at migration time, not as separate single-column indexes.
- **Named indexes**: `$table->index(['a', 'b'], 'idx_my_name')` — explicit naming prevents auto-generated name collisions.
- **Raw for advanced types**: PostgreSQL partial/expression indexes, CONCURRENTLY, and MySQL-specific DDL require raw SQL.


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
| 1 | Not using composite indexes**: Creating individual indexes on `(tenant_id)`, `(status)`, `(created_at)` instead of one composite `(tenant_id, status, created_at)`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Indexing without understanding query patterns**: Adding indexes before profiling what queries actually run. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

