# 1-20 Migration Immutability

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-20 |
| Knowledge Unit Title | Migration Immutability |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 1.1 Migration file structure | 1.6 Migration ordering and naming | 1.7 Migration batch tracking |
| Last Updated | 2026-06-02 |

## Overview

Once a migration file has been deployed to any environment (local, staging, production), it must never be edited. The `migrations` table records the filename — editing the file after execution means the change is silently skipped on subsequent `migrate` runs. This is the most important rule of migration management in Laravel.

---

## Core Concepts

- **filename-based tracking**: The `migrations` table stores only the migration filename (without `.php`). Laravel compares this list to the filesystem to determine which migrations have run.
- **Silent skip**: If you edit a deployed migration, its filename is already in the `migrations` table. Laravel sees it as "already run" and skips it. The edit is never applied.
- **Rollback implications**: If you edit a deployed migration and then roll it back, the `down()` method reflects the edited version, not the original. The rollback may not correctly reverse the applied change.
- **Team synchronization**: If developer A edits a deployed migration and developer B pulls the change, developer B's `migrations` table (which has the original filename) doesn't match the new content. The edit is silently ignored for developer B.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Corrective migration**: Instead of editing an existing migration, run `php artisan make:migration fix_column_name_on_table` and write the correction there.
- **Rollback + re-run for local only**: In local development, if a migration hasn't been pushed to any shared branch, you can rollback, edit, and re-run. Anything pushed = immutable.


## Architecture Guidelines

- | Approach | When | When Not |
- |----------|------|----------|
- | Create new migration | Any deployed migration | Unpushed local migrations |
- | Rollback + edit + re-run | Local, unpushed migrations only | Migrations on shared branches |


## Performance Considerations

- Migration immutability itself has no direct performance cost — the `migrations` table lookup is a simple filename comparison. However, the corrective migrations that immutability forces do accumulate over time. A schema with 200 migrations that could have been 50 editable migrations takes longer to replay on `migrate:fresh`. This is mitigated by `schema:dump` (Laravel 8+). The performance cost of immutability is paid in file count and CI time, not in query performance or production DDL speed.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | The most common Laravel migration mistake**: Editing a deployed migration to fix a typo in column name. The edit is silently ignored in all environments where the migration has already run. Developers think the fix is applied, but it's not. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Editing to add a missing index**: Adding `->index()` to a migration that already ran. The index is never created. The developer wonders why queries are slow. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Rollback inconsistency**: A deployed migration is edited. The edited `down()` doesn't correctly reverse the originally applied `up()`. Rollback leaves the database in an inconsistent state.
- - **Environment drift**: The production migration was run before an edit, but a new staging environment is created after the edit. Production and staging have different schema states.


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

