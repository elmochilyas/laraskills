# 3-4 Gin Indexes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-4 |
| Knowledge Unit Title | Gin Indexes |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.1 B-Tree | 12.2 GIN indexes on JSONB | 12.11 GIN index on tsvector | 12.33 Array columns and GIN indexing |
| Last Updated | 2026-06-02 |

## Overview

GIN (Generalized Inverted Index) maps each component value to containing rows. Designed for multi-valued data: JSONB documents, arrays, full-text search (tsvector), and trigram-based text search. Essential for PostgreSQL applications using JSONB columns, tag systems, or full-text search.

---

## Core Concepts

- **Inverted index**: Each distinct component value maps to a list of containing rows. Opposite of B-Tree (which maps each row to its position in a sorted order).
- **JSONB operators**: `@>` (contains), `?` (key exists), `?|` (any key), `?&` (all keys).
- **tsvector**: Full-text search document representation. GIN on tsvector enables fast `@@` (match) queries.
- **pg_trgm**: Trigram-based GIN index enables `LIKE '%value%'` and `ILIKE` searches without full table scan.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **JSONB containment queries**: `WHERE data @> '{"status": "active"}'` — find rows where JSONB contains the specified structure.
- **Array overlap**: `WHERE tags && ARRAY['laravel', 'php']` — find rows with any of the specified tags.
- **Full-text search**: GIN on tsvector column for `WHERE tsv @@ to_tsquery('english', 'database & performance')`.


## Architecture Guidelines

- | Use Case | Index Type | Operators |
- |---------|------------|-----------|
- | JSONB key/value lookup | GIN | @>, ?, ?|, ?& |
- | Array membership | GIN | &&, @>, <@ |
- | Full-text search | GIN (on tsvector) | @@ |
- | LIKE/ILIKE search | GIN (trgm) | LIKE, ILIKE, ~ |


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
| 1 | Not specifying jsonb_path_ops**: `CREATE INDEX ON data USING GIN (data)` uses default opclass. `jsonb_path_ops` is smaller and faster for containment queries. Only use default if you need `?`, `?|`, `?&` operators. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | GIN on frequently updated JSONB**: Each update requires decompressing and recompressing the posting list. Write-heavy JSONB columns should use B-Tree on specific paths instead. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

