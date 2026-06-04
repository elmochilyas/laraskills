# 11-11 Rollback Planning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-11 |
| Knowledge Unit Title | Rollback Planning |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 11.6 Expand-contract | 11.13 Destructive operations |
| Last Updated | 2026-06-02 |

## Overview

Every migration must have a tested rollback plan. For expand-contract: rollback = stop writing to new structure, fall back to old. For online DDL: rollback depends on tool (gh-ost: stop before cutover, pt-osc: stop before rename). For data drops: rollback requires pre-drop backup. Rolling back a migration should never lose data.

---

## Core Concepts

- **Expand-contract rollback**: At any phase, revert to previous phase. Phase 1→2: stop writing new, delete new. Phase 3→2: revert reads to old, keep dual-write. No data loss.
- **Online DDL rollback**: gh-ost: `gh-ost --stop` before cutover. Shadow table is dropped. Original untouched. pt-osc: stop before rename. Triggers dropped.
- **DROP column rollback**: Impossible if no backup. Always backup column data before destructive DDL.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Pre-destructive-operation snapshot**: Before `ALTER TABLE ... DROP COLUMN`, take a snapshot or export column data. Restore via INSERT if rollback needed.
- **`down()` method for every migration**: Laravel's `Schema::table('orders', fn($table) => $table->dropColumn('status'))` in `up()`. `down()` recreates the column.


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
| 1 | No down() method**: "We'll never roll back" — but you will. Always write a `down()` method, even if it's just `Schema::dropIfExists()`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

