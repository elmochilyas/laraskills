# 11-17 Migration Order Dependencies

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-17 |
| Knowledge Unit Title | Migration Order Dependencies |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 1.13 Migration structure | 15.1 Foreign key constraints |
| Last Updated | 2026-06-02 |

## Overview

Migration order matters: referenced tables must be created before referencing tables. Laravel's migration filenames are prefixed with timestamps — executed in order. When adding an FK, ensure the referenced table exists before running the FK migration. Circular dependencies require deferred FK addition.

---

## Core Concepts

- **Timestamp ordering**: `2026_01_01_000001_create_users_table.php` runs before `2026_01_02_000001_create_orders_table.php`. Order determined by filename prefix.
- **FK addition**: Add FK after both tables exist. Separate migration: `2026_01_03_000001_add_user_fk_to_orders.php`.
- **Circular dependencies**: Table A references Table B, and Table B references Table A. Create tables without FK, then add FK in subsequent migration.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Create tables → Add columns → Add constraints**: Standard migration sequence. Create all tables first, then add columns, then add FKs, then add indexes.
- **Deferred FK validation**: `ALTER TABLE ... ADD CONSTRAINT ... NOT VALID` (PostgreSQL). Add FK without validating existing data. Validate later.


## Architecture Guidelines

- gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Performance Considerations

- Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Creating FK in the same migration as the table**: `Schema::create('orders', fn($table) => $table->foreignId('user_id')->constrained())` — the `users` table must be created in an earlier migration. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Production Schema Operations
- **Closely Related**: Other KUs within Production Schema Operations
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

