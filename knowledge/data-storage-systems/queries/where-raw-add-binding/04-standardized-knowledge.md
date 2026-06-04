# 2-12 Where Raw Add Binding

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-12 |
| Knowledge Unit Title | Where Raw Add Binding |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 2.10 Query builder methods | 2.11 Where clause types | 4.10 Function wraps in WHERE clause |
| Last Updated | 2026-06-02 |

## Overview

Raw expressions (`DB::raw`, `whereRaw`, `selectRaw`, `orderByRaw`) bypass Laravel's query builder escaping and parameter binding. `addBinding` allows safely attaching bound parameters to raw expressions, preventing SQL injection while using custom SQL syntax.

---

## Core Concepts

- **DB::raw('expression')**: Creates an unescaped SQL fragment. No parameter binding.
- **whereRaw('sql', [$bindings])**: Raw WHERE clause with bound parameters. Parameters use `?` placeholders.
- **addBinding($values, $type)**: Adds parameter bindings to a specific clause type (where, join, having, order).
- **SQL injection risk**: Raw expressions without bound parameters are vulnerable to SQL injection.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use whereRaw only when needed**: For complex WHERE expressions that the query builder can't express (CASE statements, MATCH...AGAINST, JSON path queries).
- **Always bind parameters**: Never concatenate user input into raw SQL strings. Use `?` placeholders and pass bindings array.
- **addBinding for constructed queries**: When building raw expressions programmatically, `addBinding` attaches parameters to the correct clause type.


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
| 1 | String interpolation in raw SQL**: `->whereRaw("status = '$status'")` — SQL injection vulnerability. Use `->whereRaw('status = ?', [$status])`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not using addBinding for constructed queries**: Building raw SQL with `implode()` and embedding values creates SQL injection vectors. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

