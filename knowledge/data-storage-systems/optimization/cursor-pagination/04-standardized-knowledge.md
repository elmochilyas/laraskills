# 4-17 Cursor Pagination

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-17 |
| Knowledge Unit Title | Cursor Pagination |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.16 Offset pagination | 4.18 Keyset pagination |
| Last Updated | 2026-06-02 |

## Overview

Cursor pagination uses WHERE conditions on a unique, ordered column to paginate without OFFSET. `Model::where('id', '>', $lastId)->orderBy('id')->limit(20)`. Each page reads exactly 20 rows. Constant performance regardless of page depth. Laravel 13 supports `cursorPaginate()` built-in.

---

## Core Concepts

- **WHERE-based pagination**: `WHERE id > ? ORDER BY id LIMIT 20` — no offset, always reads 20 rows.
- **Stable sort required**: The cursor column must be unique and monotonically increasing/decreasing.
- **Laravel cursorPaginate()**: Returns `CursorPaginator` with `nextCursor` and `previousCursor`. Works with `id`, `created_at`, or any unique, ordered column.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Default to cursorPaginate for API endpoints**: Constant O(1) performance for any page depth. Better UX (infinite scroll, load more).
- **Use paginate() for numbered pages**: Cursor pagination doesn't support "Go to page 5". Use offset paginate when numbered page navigation is required.
- **Cursor on created_at**: `cursorPaginate(perPage: 20, columns: ['*'], cursorName: 'cursor', cursor: $request->cursor)`.


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
| 1 | Cursor on non-unique column**: `WHERE status > ?` — if multiple rows have the same status, pages are inconsistent. Always use a unique column or a composite (status, id). | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

