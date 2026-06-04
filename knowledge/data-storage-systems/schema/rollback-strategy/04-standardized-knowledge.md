# 1-25 Rollback Strategy

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-25 |
| Knowledge Unit Title | Rollback Strategy |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.18 Expand-contract pattern | 1.24 Schema and data migration separation | 1.10 Zero-downtime migration patterns |
| Last Updated | 2026-06-02 |

## Overview

Migration rollback safety depends on the operation type. Additive changes (creating tables, adding columns, adding indexes) are safe to rollback immediately. Destructive changes (dropping tables, dropping columns, removing indexes) require a compatibility window where no code references the dropped structures. Rollback strategy must account for the deployment state — not just the database state.

---

## Core Concepts

- **Additive operations**: CREATE TABLE, ADD COLUMN, ADD INDEX, ADD FK. Safe to reverse because they don't destroy existing data.
- **Destructive operations**: DROP TABLE, DROP COLUMN, DROP INDEX, ALTER COLUMN TYPE. Irreversible if code still references the dropped structures.
- **Compatibility window**: The period between dropping a structure and ensuring all code (including delayed queue jobs) has stopped referencing it. Typically 24-48 hours.
- **Rename operations**: Neither purely additive nor destructive — they combine both.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Immediate rollback for additive**: If a new column migration causes issues, rollback is safe — the column disappears, no data loss, no code breakage.
- **Delayed rollback for destructive**: To remove a column, first deploy code that stops referencing it. Wait 24-48 hours. Then deploy the destructive migration. The rollback of this destructive migration is to re-add the column and re-backfill data — not a simple `up()` reversal.
- **Rollback planning in deploy scripts**: Deploy scripts should always include: `If the deploy fails, run migrate:rollback`. Ensure the rollback is tested before deployment.


## Architecture Guidelines

- | Migration Type | Rollback Safety | Rollback Action |
- |----------------|----------------|----------------|
- | CREATE TABLE | Safe | DROP TABLE (no data loss if not populated) |
- | ADD COLUMN (nullable) | Safe | DROP COLUMN |
- | ADD COLUMN (NOT NULL with default) | Safe | DROP COLUMN |
- | ADD INDEX | Safe | DROP INDEX |
- | ADD FK | Safe | DROP FK |
- | DROP TABLE | DANGEROUS | Requires restore from backup |
- | DROP COLUMN | DANGEROUS | Requires re-add + backfill |
- | DROP INDEX | Caution | Require re-add (may cause slow queries) |
- | ALTER COLUMN TYPE | DANGEROUS | May lose precision or data |


## Performance Considerations

- Rollback performance depends on the operation type. Additive rollbacks (DROP COLUMN, DROP INDEX) complete in milliseconds to seconds since they only modify metadata. Destructive rollbacks that re-add columns and backfill data can take hours depending on table size. The `--step` option improves rollback performance by allowing targeted single-migration rollback instead of full batch reversal. For large deployments, test rollback time in staging and budget it in the deployment window. A rollback that takes 30 minutes on a 100M-row table should not be discovered during a production incident.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Rolling back a destructive migration immediately**: The migration drops a column. The rollback re-adds it. But queue jobs that ran during the rollback window tried to insert into the dropped column and failed. The data is lost. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Assuming rollback is always possible without data loss**: Dropping a table and rolling back requires restoring from backup. Rollback is not a substitute for backup. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Partial rollback failure**: A rollback batch contains 5 migrations. The 3rd migration's `down()` fails. The first 2 are rolled back, the last 2 remain. The database is in an inconsistent state. Mitigation: use `--step=1` to roll back one migration at a time.
- - **Data loss during column re-add**: Rolling back a DROP COLUMN re-adds the column but does not restore the deleted data. The column is NULL for all rows. Mitigation: take a backup before destructive operations.
- - **Timeout during rollback**: A rollback attempts to rebuild an index on a 100M-row table. The operation exceeds the database statement timeout. The migration tool reports success but the index wasn't rebuilt. Monitor rollback execution.
- - **Rollback of non-atomic operations**: Some DDL operations in MySQL implicitly commit the transaction. A rollback cannot undo these changes. The `down()` method must handle partial states.


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

