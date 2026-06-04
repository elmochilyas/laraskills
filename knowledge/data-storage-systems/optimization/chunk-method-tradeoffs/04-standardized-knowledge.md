# 4-19 Chunk Method Tradeoffs

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-19 |
| Knowledge Unit Title | Chunk Method Tradeoffs |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 2.23 chunk/chunkById/cursor/lazy | 4.20 Memory optimization |
| Last Updated | 2026-06-02 |

## Overview

Each iteration method has different memory profiles and stability characteristics: `chunk` (offset-based, unstable), `chunkById` (key-based, stable), `cursor` (single query, stream, holds connection), `lazy` (LazyCollection, holds connection), `lazyById` (LazyCollection + key-based, holds connection). Choose based on data stability, connection duration tolerance, and memory constraints.

---

## Core Concepts

- **chunk**: Uses OFFSET internally. Rows can be skipped/duplicated if modified between chunks.
- **chunkById**: Uses `WHERE id > ? ORDER BY id LIMIT ?`. Stable — no skipped/duplicated rows.
- **cursor**: Single query, PHP generator, yields one row at a time. Low memory, holds connection.
- **lazy**: LazyCollection wrapping cursor. Supports collection methods (map, filter).
- **lazyById**: LazyCollection with key-based ordering.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **chunkById for production backfills**: Stable ordering. Safe for tables with concurrent modifications.
- **cursor for memory-safe exports**: Process millions of rows for CSV/JSON generation.
- **lazy for collection pipelines**: Chain map/filter/reduce on large results without loading all into memory.


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
| 1 | chunk on tables with modifications**: Rows shift due to OFFSET. Use chunkById. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | cursor in long-running queue jobs**: Holds connection for entire iteration. Use chunkById for queued processing. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

