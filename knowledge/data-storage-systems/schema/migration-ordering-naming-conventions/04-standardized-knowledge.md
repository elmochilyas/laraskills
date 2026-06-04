# 1-6 Migration Ordering Naming Conventions

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-6 |
| Knowledge Unit Title | Migration Ordering Naming Conventions |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 1.1 Migration file structure | 1.7 Migration batch tracking | 1.4 Foreign key definition |
| Last Updated | 2026-06-02 |

## Overview

Migration execution order is determined by filename sorting. The `YYYY_MM_DD_HHmmss` timestamp prefix ensures deterministic ordering. Naming conventions encode intent (create, alter, add, drop) and help teams understand migration purpose from filenames. Incorrect ordering causes FK constraint failures when referenced tables don't exist yet.

---

## Core Concepts

- **Timestamp prefix**: `2026_06_02_000000_create_users_table.php`. Laravel generates this via `date('Y_m_d_His')`.
- **Name components**: Timestamp + action + target (e.g., `create_`, `alter_`, `add_`, `drop_`, `change_`) + descriptive name.
- **Collision handling**: If two developers create migrations in the same second, the sort order is then alphabetical by the rest of the name. Anonymous classes (Laravel 9+) prevent class name collisions but not ordering collisions.
- **Ordering fixes**: If a migration needs to run before another, manually prepend a slightly earlier timestamp. Use `migrate:status` to verify order.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Reference tables before referencing tables**: The table referenced by a FK must exist before the table with the FK. Name migrations so `create_authors` (timestamp: 000000) comes before `create_books` (timestamp: 000001) if `books` has a FK to `authors`.
- **Verb prefix convention**: `create_table` for new tables, `add_column_to_table` for new columns, `drop_column_from_table` for removals, `change_column_on_table` for modifications, `add_index_to_table` for indexes.
- **Aggressive timestamps**: Laravel uses `HHiiss` down to the second. If ordering is critical, manually set the seconds to ensure correct order.


## Architecture Guidelines

- | Practice | When | When Not |
- |----------|------|----------|
- | Verb prefix naming | Always — improves readability | Tiny projects with < 10 migrations |
- | Manual timestamp adjustment | FK ordering requires it | Most migrations (default timestamps suffice) |
- | Group related migrations in same batch | Deploy atomic schema changes | Independent changes |


## Performance Considerations

- Not applicable directly — naming and ordering don't affect query performance. However, incorrect ordering that causes FK failures in CI wastes development time.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Duplicate timestamp**: Two migrations with the same timestamp cause unpredictable ordering. Always run `migrate:status` after creating migrations in a team setting. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Poor naming**: `2026_06_02_000000_some_changes.php` — the name doesn't communicate what changes are made. This becomes unmanageable at scale. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **FK dependency failure**: Migration references a table that doesn't exist yet. Error: `General error: 1215 Cannot add foreign key constraint`. Fix by adjusting the timestamp so the referenced table's migration runs first.
- - **Renamed migration file**: File renamed after deployment. Rollback fails because `down()` is called on the original class name, which no longer exists at the new path.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
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

