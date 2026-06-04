# 1-8 Migration Squashing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-8 |
| Knowledge Unit Title | Migration Squashing |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 1.6 Migration ordering | 1.7 Migration batch tracking | 1.20 Migration immutability |
| Last Updated | 2026-06-02 |

## Overview

Migration squashing consolidates hundreds of individual migration files into a single SQL schema file using `php artisan schema:dump`. This dramatically reduces migration time for fresh installs (CI, new developers) by executing one SQL file instead of hundreds of PHP classes. Squashing is safe because Laravel only uses the schema dump when no migrations have been executed — existing environments are unaffected.

---

## Core Concepts

- **schema:dump command**: Generates `database/schema/{connection}.sql` containing the full CREATE TABLE SQL for the schema.
- **Execution order**: On a fresh database, Laravel executes the schema dump SQL first, then runs any remaining migration files not included in the dump.
- **Safety**: The schema dump is only used when the `migrations` table is empty. Existing environments continue to run individual migrations.
- **Per-connection dumps**: `php artisan schema:dump` generates separate dump files per database connection.
- **Git management**: The schema dump file should be committed to version control.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Squash before major releases**: After stabilizing a version, run `schema:dump` to compress the migration history. Future migrations build on the squashed state.
- **Keep schema dump in CI**: CI pipelines benefit most — instead of running 200 migrations every test run, they execute one SQL file.
- **--prune only after full confidence**: The `--prune` option deletes original migration files after squashing. Only prune after all team members have pulled the latest and no rollback from the squashed state is anticipated.


## Architecture Guidelines

- | Decision | When | Risk |
- |----------|------|------|
- | schema:dump without --prune | Regular maintenance | Migration files accumulate |
- | schema:dump with --prune | Release stabilization | Permanently removes old migration files |
- | No squashing | Small projects (< 30 migrations) | CI time wasted on old migrations |


## Performance Considerations

- - Fresh migration time drops from minutes to seconds on large migration histories.
- - Schema dump files can be large (thousands of lines) on complex schemas, but execute as a single batch.
- - Existing environments see zero performance change — they continue individual migration execution.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Pruning too early**: Deleting original migration files with `--prune` before the team has pulled the latest changes prevents their local migrations from matching the schema dump. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Quietly accepting an incorrect dump**: If the database client (mysqldump/pg_dump) is not installed on the CI server, `schema:dump` fails silently. Verify the dump file is generated and valid. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Forgetting to regenerate**: After significant schema changes, the schema dump becomes stale. New migrations build on the dump, but the dump should be regenerated periodically. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Schema dump from wrong environment**: Dumping a staging database that has manual schema changes missing from migrations creates a dump that doesn't match the migration record.
- - **Incompatible dump format**: The MySQL dump may not be compatible with MariaDB or vice versa. Only use on matching database engines.


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

