# 2-16 Accessors Mutators

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-16 |
| Knowledge Unit Title | Accessors Mutators |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.18 Model serialization |
| Related KUs | 2.17 Casts |
| Last Updated | 2026-06-02 |

## Overview

Accessors transform attribute values when read from the database. Mutators transform values before saving to the database. They centralize data transformation logic in the model rather than scattering it across controllers and views.

---

## Core Concepts

- **Accessor**: `getNameAttribute($value)` — called when `$model->name` is accessed. Transforms the raw database value.
- **Mutator**: `setNameAttribute($value)` — called when `$model->name = $value` is set. Transforms before database write.
- **Attribute casting**: `protected $casts = ['is_admin' => 'boolean']` — simpler alternative for type conversions.
- **Return type**: Accessors must return the transformed value. Mutators set `$this->attributes['name'] = $transformed`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Value normalization in mutators**: Strip whitespace, format phone numbers, hash passwords, trim strings.
- **Computed read-only attributes**: Full name from first + last name. These should be in accessors, not stored in DB.
- **Use casts over mutators for type conversion**: Casts are simpler and less error-prone for type transformations (JSON, boolean, datetime).


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
| 1 | Accessors that query the database**: An accessor that calls `$this->relation()->first()` triggers a lazy load. Eager load the relationship instead. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Mutators that don't set the attribute**: `$this->name = $value` in a mutator causes infinite recursion. Use `$this->attributes['name']`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

