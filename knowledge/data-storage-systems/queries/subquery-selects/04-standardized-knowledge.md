# 2-8 Subquery Selects

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-8 |
| Knowledge Unit Title | Subquery Selects |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 2.9 Subquery ordering | 2.7 Relationship counting | 4.25 Subquery optimization |
| Last Updated | 2026-06-02 |

## Overview

Subquery selects allow adding computed values from related tables as attributes on the parent model without eager loading the relationship. Using `addSelect` with a raw subquery or Eloquent's relationship-based subquery syntax, you can include data like "last login date" or "most recent order total" as a column on each parent row.

---

## Core Concepts

- **addSelect with closure**: `User::addSelect(['last_login_at' => LoginLog::select('created_at')->whereColumn('user_id', 'users.id')->latest()->limit(1)])`.
- **Relationship subquery**: `User::withLastLoginAt()` using a dedicated relationship method.
- **Subquery ordering**: `Order::orderByDesc(OrderItem::selectRaw('SUM(quantity)')->whereColumn('order_id', 'orders.id'))`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Last related record**: Add the latest related record value without loading all records.
- **Computed flags**: `addSelect(['has_recent_orders' => Order::selectRaw('COUNT(*) > 0')->whereColumn(...)->where('created_at', '>', now()->subMonth())])`.
- **Aggregate per parent**: Total revenue per customer without loading all invoices.


## Architecture Guidelines

- Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

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
| 1 | Subquery returns multiple rows**: The subquery must return a scalar (one row, one column). If multiple rows match, the database errors. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not limiting the subquery**: `LoginLog::select('created_at')->whereColumn(...)->orderByDesc('created_at')` without `->limit(1)` may return multiple rows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

