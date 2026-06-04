# 3-23 Over Indexing Risks

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-23 |
| Knowledge Unit Title | Over Indexing Risks |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.22 Index size estimation | 3.19 Index maintenance |
| Last Updated | 2026-06-02 |

## Overview

Every index adds write amplification: INSERT updates all indexes, UPDATE updates indexes on changed columns, DELETE updates all indexes. Over-indexing degrades write performance, consumes storage, and increases vacuum/maintenance overhead.

---

## Core Concepts

- **Write amplification factor**: Each index multiplies the write cost of data modifications. 5 indexes = 5x the write IO of a non-indexed table.
- **Storage cost**: Indexes can exceed data size. A table with 10 indexes may have 15x data-to-index storage ratio.
- **Vacuum load (PostgreSQL)**: More indexes = more dead tuples = more vacuum work.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Minimum viable indexes**: Add indexes based on measured query patterns, not theoretical access paths.
- **Index consolidation**: Replace multiple single-column indexes with fewer composite indexes.
- **Drop unused indexes**: Use index usage statistics to identify and remove indexes with zero scans.


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
| 1 | Index every column**: "This column might be queried someday." Indexes have costs. Add when needed, not preemptively. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Duplicate indexes**: Composite index `(a, b)` makes separate index on `(a)` redundant. The composite serves leftmost prefix queries on `a`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

