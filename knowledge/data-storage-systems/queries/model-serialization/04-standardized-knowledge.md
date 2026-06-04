# 2-18 Model Serialization

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-18 |
| Knowledge Unit Title | Model Serialization |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.16 Accessors and mutators | 2.17 Casts | 2.27 API resource classes |
| Last Updated | 2026-06-02 |

## Overview

Model serialization converts models and collections to arrays or JSON for API responses. The `hidden` and `visible` properties control which attributes are included. `append` adds computed attributes (accessors) to the serialized output.

---

## Core Concepts

- **toArray()**: Converts model + loaded relationships to a nested array.
- **toJson()**: JSON-encodes the result of `toArray()`.
- **$hidden**: Array of attribute names to exclude from serialization (passwords, tokens).
- **$visible**: Whitelist of attributes to include (alternative to hidden).
- **$appends**: List of accessor attributes to include in serialization (not stored in DB).
- **API Resources**: Dedicated transformation layer (`App\Http\Resources\PostResource`) for fine-grained control.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Hide sensitive attributes**: `protected $hidden = ['password', 'remember_token', 'api_key']`.
- **Append computed fields**: `protected $appends = ['full_name', 'is_active']` — adds accessor results to JSON output.
- **Use API Resources for endpoint-specific serialization**: Different endpoints need different attribute sets. Resources provide per-endpoint control.


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
| 1 | $appends triggering N+1**: An accessor in `$appends` that lazy loads a relationship causes N+1 on every serialization. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not hiding sensitive attributes**: `toJson()` on a user model exposes `password` if not in `$hidden`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

