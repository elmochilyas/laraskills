# 2-5 Constrained Eager Loading

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-5 |
| Knowledge Unit Title | Constrained Eager Loading |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.3 Eager loading | 2.6 Relationship existence filtering | 2.7 Relationship counting |
| Last Updated | 2026-06-02 |

## Overview

Constrained eager loading filters, limits, or orders the related models loaded via `with()` using closure-based constraints. This prevents loading all related records when only a subset is needed. Since Laravel 12, `limit()` is supported natively in constrained eager loads.

---

## Core Concepts

- **Closure constraints**: `with(['comments' => fn($q) => $q->where('approved', true)->limit(5)])` loads only approved comments, max 5 per post.
- **Aggregate constraints**: `withCount(['comments' => fn($q) => $q->where('spam', false)])` counts only non-spam comments.
- **Native limit()**: Laravel 12+ supports `limit()` on eager loaded relationships without external packages.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Top N per parent**: `with(['comments' => fn($q) => $q->latest()->limit(3)])` — load the 3 most recent comments per post.
- **Filtered counts**: `withCount(['likes' => fn($q) => $q->where('type', 'upvote')])` — count only upvotes.
- **Conditional constraints**: `with(['comments' => fn($q) => $q->when($onlyApproved, fn($q) => $q->where('approved', true))])` — conditionally filter by request parameter.


## Architecture Guidelines

- | Pattern | When | When Not |
- |---------|------|----------|
- | limit() on eager load | List views needing top N per parent | When all related records are displayed |
- | Filtered withCount | Dashboard stats, summary endpoints | When full count is needed |


## Performance Considerations

- Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Forgetting to constrain list endpoints**: Loading 500 comments per post when only 3 are displayed. Massively over-fetches data. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Complex constraints causing slow queries**: Constraint uses `orWhere` or function wrapping that breaks index usage. The eager load query becomes slow. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Eloquent Orm Query Builder
- **Closely Related**: Other KUs within Eloquent Orm Query Builder
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

