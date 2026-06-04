# 2-26 Update Or Create First Or Create

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-26 |
| Knowledge Unit Title | Update Or Create First Or Create |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.21 upsert | 2.22 insertOrIgnore |
| Last Updated | 2026-06-02 |

## Overview

These methods provide "find or create" semantics: try to find a matching record, and if none exists, create one. `firstOrCreate` creates and persists. `firstOrNew` creates an unsaved instance. `updateOrCreate` updates if exists, creates if not. All perform two operations (SELECT + INSERT) and are not atomic without a transaction.

---

## Core Concepts

- **firstOrCreate(attrs)**: Find by attrs, or create and persist. Returns the model.
- **firstOrNew(attrs)**: Find by attrs, or create a new unsaved instance. Returns the model (unsaved if new).
- **updateOrCreate(attrs, values)**: Find by attrs, update with values, or create with attrs + values.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use upsert for atomic create-or-update**: In concurrent environments, wrap `updateOrCreate` in a database transaction or use `upsert` which is atomic.
- **firstOrCreate for reference data**: Countries, categories, statuses — data that rarely causes concurrent conflicts.
- **firstOrNew for draft-like behavior**: Create an unsaved model instance to show a form, save explicitly when submitted.


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
| 1 | Race condition with firstOrCreate**: Two requests simultaneously execute `firstOrCreate`. Both SELECT returns null. Both INSERT. Second INSERT violates unique constraint. Wrap in transaction or use upsert. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Using firstOrCreate in a loop**: `foreach ($items as $item) { Model::firstOrCreate(...) }` — N+1 pattern at the database level. Use upsert for batch operations. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

