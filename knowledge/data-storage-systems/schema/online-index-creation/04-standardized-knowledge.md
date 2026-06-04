# 1-27 Online Index Creation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-27 |
| Knowledge Unit Title | Online Index Creation |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.26 MySQL ALGORITHM options | 3.1 B-Tree index structure |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL supports creating indexes without blocking writes via the `CONCURRENTLY` option. SQL Server supports similar online index operations. Laravel exposes this via the `.online()` modifier on index creation for SQL Server, but for PostgreSQL, it requires raw SQL. Online index creation prevents DDL from locking tables for writes during index building — critical for production environments with 24/7 traffic.

---

## Core Concepts

- **PostgreSQL CONCURRENTLY**: `CREATE INDEX CONCURRENTLY` builds the index in the background while allowing concurrent inserts, updates, and deletes. Takes longer but doesn't block writes.
- **PostgreSQL limitation**: `CONCURRENTLY` cannot be run inside a transaction. Each migration using `CONCURRENTLY` must be the only operation in its migration file.
- **Laravel SQL Server .online()**: `$table->index('column')->online()` for SQL Server online index creation.
- **Tradeoff**: Online index creation takes 2-3x longer than standard index creation but avoids write blocking.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use CONCURRENTLY for indexes on large tables**: Any table with > 10M rows that is actively written to should use CONCURRENTLY. The default index creation blocks writes for the entire duration.
- **Single-migration for CONCURRENTLY**: Since CONCURRENTLY can't run inside a transaction, the migration must use raw SQL: `DB::statement('CREATE INDEX CONCURRENTLY ...')`. The migration must be the only operation.
- **Multiple CONCURRENTLY indexes**: Each index requires its own migration because CONCURRENTLY can't run inside a transaction, and multiple CONCURRENTLY statements in the same transaction would all fail.


## Architecture Guidelines

- | Index Context | Create Method | When |
- |--------------|--------------|------|
- | Small table (< 1M rows) | Standard index | Fast enough, lock duration is short |
- | Large table (> 1M rows), low traffic | Standard index | Lock duration acceptable |
- | Large table, 24/7 traffic | CONCURRENTLY | Required for zero-downtime |
- | During maintenance window | Standard index | Simpler, faster |


## Performance Considerations

- - CONCURRENTLY reads the table without blocking writes, but the additional IO may slow write operations slightly.
- - Index build process competes with application queries for CPU and memory.
- - The `maintenance_work_mem` setting in PostgreSQL affects CONCURRENTLY index build speed.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Running CONCURRENTLY inside a transaction**: PostgreSQL prohibits this. The migration must use raw `DB::statement()` outside any transaction wrapper. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Multiple CONCURRENTLY operations in one migration**: Two `CREATE INDEX CONCURRENTLY` statements in one migration. Each triggers an implicit commit, but the second fails because there's no active transaction for its commit context. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Not cleaning up invalid indexes**: A failed CONCURRENTLY operation leaves an invalid index that must be dropped before retrying. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Invalid index state**: A failed CONCURRENTLY build leaves the index in `INVALID` state. It takes up space but is not used.
- - **Exclusive lock conflict**: The finalization phase of CONCURRENTLY requires a brief SHARE UPDATE EXCLUSIVE lock. Long-running transactions can block this, causing the CONCURRENTLY build to wait.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
- **Closely Related**: 3.20 Concurrent index creation
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

