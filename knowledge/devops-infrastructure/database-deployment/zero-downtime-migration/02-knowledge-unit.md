# Zero-Downtime Migration

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Database Deployment
- **Knowledge Unit:** Zero-Downtime Migration
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Zero-downtime migration strategies enable schema changes on production databases without locking tables or causing application downtime. Standard Laravel migrations lock tables during DDL operations on large datasets, blocking reads and writes. The primary tools are `pt-online-schema-change` (Percona Toolkit) and `gh-ost` (GitHub) for non-blocking schema alterations.

---

## Core Concepts

- **Shadow Table Pattern** — Create a copy of the table, apply schema changes to the copy, then atomically swap
- **Triggers for Sync** — Keep original and shadow tables synchronized during migration using database triggers
- **pt-online-schema-change** — Percona Toolkit tool using triggers to apply schema changes without locking
- **gh-ost** — GitHub's triggerless online schema change tool using binary log stream replication
- **Throttling** — Rate-limit migration to avoid production impact based on replication lag and server load

---

## Mental Models

- **Copy-On-Write Schema Changes** — Instead of `ALTER TABLE` that locks the original, create a shadow copy, synchronize changes via triggers or binlog, and atomically swap. The original table serves traffic throughout.
- **Schema Migration vs. Application Migration** — Schema migration changes table structure; application migration changes code that reads/writes the table. For large tables, these must be decoupled — schema changes happen online while application code is prepared for both old and new schema.
- **Throttling as Safety Valve** — Online schema change tools are aggressive by default. Throttling ensures they don't overwhelm production database resources. Set replication lag and server load thresholds before starting.

---

## Internal Mechanics

`pt-online-schema-change` creates a shadow table with the new schema, creates triggers on the original table to capture INSERT/UPDATE/DELETE operations, copies rows in batches from the original to the shadow table, applies the captured changes via triggers, and atomically renames the tables (original to old, shadow to original). `gh-ost` works differently: it reads the binary log stream to capture changes instead of using triggers, which reduces trigger overhead. Both tools throttle based on replication lag and server load metrics.

---

## Patterns

- **Benchmark First** — Test online schema change on staging with production-sized data before production
- **Use Throttling** — Set replication lag and load thresholds to slow migration during peak traffic
- **Monitor Progress** — Track migration progress, replication lag, and server load in real time
- **Have Fallback Plan** — Ensure the original table is untouched if migration fails
- **Test Rollback** — Practice killing and restarting online migration to verify safety and resume capability

---

## Architectural Decisions

- **pt-online-schema-change vs. gh-ost** — Choose pt-online-schema-change for MySQL with trigger support; choose gh-ost for triggerless operation and reduced replication overhead
- **Online Tool vs. Standard Migration** — Use online schema change for tables > 1M rows or ALTER operations expected to take > 5 seconds; use standard migration for small tables
- **MySQL vs. PostgreSQL** — PostgreSQL supports `ALTER TABLE ... ALTER COLUMN` without table locking in many cases. Online schema change is primarily needed for MySQL.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Schema changes without application downtime | Requires additional tool installation | `pt-online-schema-change` or `gh-ost` must be available on database server |
| Table remains readable/writable during migration | Trigger overhead on original table | Triggers slow down write operations on the original table during migration |
| Throttling prevents production impact | Migration takes longer with throttling | Large tables may require hours for the migration to complete |
| Resume capability if interrupted | Complex rollback procedure | Fallback requires renaming tables back, which briefly locks tables |

---

## Performance Considerations

Online schema change tools add overhead during the migration. Triggers on the original table slow down write operations. Row copy batches should be sized to balance speed against lock duration. Throttling based on replication lag ensures replica performance. Binary log growth during gh-ost migration can be significant. PT-OSC requires InnoDB tables with a PRIMARY KEY.

---

## Production Considerations

Always benchmark on staging with production-sized data before production. Set conservative throttling thresholds — start with high lag tolerance and tight load thresholds. Monitor migration progress, replication lag, and server load. Have a documented fallback procedure. Schedule migrations during low-traffic periods even with online schema change. Test interruption recovery by killing and restarting the migration process.

---

## Common Mistakes

- **No Benchmarking** — Running online schema change on production without testing on staging with production-sized data. Unknown performance characteristics cause surprises.
- **No Throttling Configured** — Migration runs at full speed, overwhelming production database. Set throttling thresholds before starting.
- **Forgetting PRIMARY KEY Requirement** — PT-OSC requires InnoDB tables with a PRIMARY KEY. Tables without PK cannot use this tool.
- **Skipping Post-Migration Verification** — Not verifying the shadow table has the correct schema before the atomic swap. Missing columns or indexes are discovered after the swap.

---

## Failure Modes

- **Replication Lag Spike** — Online migration causes excessive replication lag. Detection: replication delay alerts. Mitigation: enable throttling, reduce batch size, pause migration if lag exceeds threshold.
- **Table Lock During Swap** — The final atomic rename briefly locks the table. Detection: brief write errors during rename window. Mitigation: the lock is typically sub-second; schedule during low traffic.
- **Migration Interruption** -- Process is killed before completion. Detection: shadow table exists but swap hasn't occurred. Mitigation: most tools support resume; clean up shadow table if restart not possible.
- **Trigger Performance Degradation** -- Triggers on active table slow down write operations significantly. Detection: increased write latency. Mitigation: throttle migration, consider gh-ost (triggerless) as alternative.

---

## Ecosystem Usage

Online schema change tools are essential for Laravel applications running on large production MySQL databases. `pt-online-schema-change` is part of Percona Toolkit and is widely available. `gh-ost` is developed by GitHub and used in high-scale environments. These tools are typically run outside the Laravel migration system, either as manual operations or integrated into deployment scripts. For PostgreSQL, native online DDL support reduces the need for these tools.

---

## Related Knowledge Units

### Prerequisites
- MySQL/PostgreSQL DDL, replication concepts

### Related Topics
- Database Migration CI
- Automated Migration Deployment
- Rollback Strategies

### Advanced Follow-up Topics
- Database Versioning
- Schema Change Management

---

## Research Notes

Online schema change is required for tables > 1M rows on MySQL. Never run standard `ALTER TABLE` on production large tables without understanding locking behavior. PT-OSC uses triggers; gh-ost uses binlog stream. Benchmark on staging with production-sized data. Always configure throttling. Test interruption recovery. PT-OSC requires InnoDB tables with PRIMARY KEY.
