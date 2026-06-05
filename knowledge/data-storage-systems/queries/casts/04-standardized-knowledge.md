# 2-17 Casts

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-17 |
| Knowledge Unit Title | Casts |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | None |
| Related KUs | 2.16 Accessors and mutators, 2.18 Model serialization |
| Last Updated | 2026-06-02 |

## Overview

Casts define how attribute values are converted between their database representation and PHP types. They handle type coercion, JSON serialization/deserialization, enum hydration, encryption, and custom transformations. Casts are the primary mechanism for type safety in Eloquent models.

---

## Core Concepts

- **Native casts**: `array`, `boolean`, `datetime`, `decimal:n`, `double`, `float`, `integer`, `object`, `string`, `timestamp`.
- **Enum casts**: Map database values to PHP enums. `protected $casts = ['status' => OrderStatus::class]`.
- **JSON casts**: Auto-serialize/deserialize arrays/objects to JSON columns.
- **Encrypted casts**: `encrypted` — auto-encrypt/decrypt attribute values using Laravel's encryption.
- **Custom casts**: Implement `CastsAttributes` interface for complex transformations.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use casts over accessors for type conversion**: `'is_admin' => 'boolean'` is simpler than `getIsAdminAttribute()`.
- **Enum casts for status fields**: `'status' => PostStatus::class` ensures type safety and prevents invalid status values.
- **Encrypted casts for PII**: `'ssn' => 'encrypted'` automatically encrypts on write, decrypts on read.


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
| 1 | Casting to integer for large numbers**: `bigInteger` columns may overflow PHP's integer type. Use `decimal` or string casts for large values. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | JSON cast without json column type**: Casting to `array` on a string column works but loses the database's JSON validation. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

