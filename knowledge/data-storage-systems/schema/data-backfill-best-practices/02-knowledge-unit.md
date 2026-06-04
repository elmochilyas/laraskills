# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.9 Data backfill best practices (batch size, rate limiting, progress tracking)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Data backfill fills new columns/tables with data from existing structures. Backfill best practices: batch processing (100-1000 rows per batch), rate limiting (sleep between batches to reduce load), progress tracking (process X of N rows), error handling (retry per batch, skip bad rows), and verification (compare counts between old and new).

---

# Core Concepts

- **Batch size**: 500-1000 rows per batch for general use. Smaller (100) for write-heavy tables. Larger (5000) for archival.
- **Rate limiting**: `usleep(100_000)` (100ms) between batches. Adjust based on replication lag and CPU impact.
- **Progress tracking**: Store last processed ID in a `backfill_progress` table. Enables resume after failure.
- **Verification**: Compare `COUNT(*)`, hash aggregates (`MD5(GROUP_CONCAT(...))`), or sample comparisons.

---

# Patterns

**ID-based batch backfill**: `while ($maxId) { $rows = DB::table('orders')->where('id', '>', $lastId)->orderBy('id')->limit(500)->get(); if ($rows->isEmpty()) break; $lastId = $rows->last()->id; // process... }`. Resume by storing `$lastId`.

**Rate-limited backfill command**: Artisan command with `--batch-size=500`, `--throttle-ms=100`, `--progress` options.

---

# Common Mistakes

**No progress tracking**: Backfill fails at 70%. Restart from beginning. Hours wasted. Always checkpoint progress.

---

# Related Knowledge Units

11.6 Expand-contract | 11.10 Verification during migrations
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

