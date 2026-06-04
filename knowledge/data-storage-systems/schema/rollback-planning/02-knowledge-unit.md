# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.11 Rollback planning (reversible migrations, data preservation)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Every migration must have a tested rollback plan. For expand-contract: rollback = stop writing to new structure, fall back to old. For online DDL: rollback depends on tool (gh-ost: stop before cutover, pt-osc: stop before rename). For data drops: rollback requires pre-drop backup. Rolling back a migration should never lose data.

---

# Core Concepts

- **Expand-contract rollback**: At any phase, revert to previous phase. Phase 1→2: stop writing new, delete new. Phase 3→2: revert reads to old, keep dual-write. No data loss.
- **Online DDL rollback**: gh-ost: `gh-ost --stop` before cutover. Shadow table is dropped. Original untouched. pt-osc: stop before rename. Triggers dropped.
- **DROP column rollback**: Impossible if no backup. Always backup column data before destructive DDL.

---

# Patterns

**Pre-destructive-operation snapshot**: Before `ALTER TABLE ... DROP COLUMN`, take a snapshot or export column data. Restore via INSERT if rollback needed.

**`down()` method for every migration**: Laravel's `Schema::table('orders', fn($table) => $table->dropColumn('status'))` in `up()`. `down()` recreates the column.

---

# Common Mistakes

**No down() method**: "We'll never roll back" — but you will. Always write a `down()` method, even if it's just `Schema::dropIfExists()`.

---

# Related Knowledge Units

11.6 Expand-contract | 11.13 Destructive operations
## Ecosystem Usage

gh-ost for MySQL trigger-free migrations. pt-online-schema-change for trigger-based MySQL. pgroll for PostgreSQL view-based migrations. Spirit as gh-ost successor for MySQL 8.0+.

## Failure Modes

Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Performance Considerations

Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Production Considerations

Test full migration flow in staging. Monitor disk space during migration. Have rollback plan for every phase.

## Research Notes

Spirit provides faster row copying for MySQL 8.0+. pgroll view-based approach avoids trigger overhead. Industry trends toward application-level orchestration.

## Internal Mechanics

gh-ost creates ghost table, copies rows in chunks, streams binlog, atomically swaps. pt-osc uses triggers. pgroll creates PostgreSQL views.

## Architectural Decisions

gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Tradeoffs

Zero-downtime DDL requires complex tool setup. Reversible migrations only with PostgreSQL. Trigger-free requires binlog enabled.

## Mental Models

Online schema changes use shadow table strategy. Think of changing a tire while the car is moving.

