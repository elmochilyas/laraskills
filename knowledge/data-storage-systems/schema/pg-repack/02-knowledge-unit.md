# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.15 pg_repack (bloat/index reorganization without ACCESS EXCLUSIVE lock)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

pg_repack is a PostgreSQL extension that removes table bloat and reorganizes indexes without requiring an ACCESS EXCLUSIVE lock. It works by creating a new copy of the table, applying changes via triggers or a logged table, and swapping in the new copy with only a brief ACCESS EXCLUSIVE lock during the final swap. Essential for reclaiming storage and improving query performance in high-write PostgreSQL environments.

---

# Core Concepts

- **Bloat**: Dead tuples in PostgreSQL tables and indexes caused by UPDATE and DELETE operations. Autovacuum reclaims space but may not fully compact the table.
- **ACCESS EXCLUSIVE lock**: The most restrictive PostgreSQL lock — blocks all reads and writes. pg_repack avoids holding this lock for the duration of the reorganization.
- **Trigger-based sync**: Like pt-osc, pg_repack uses triggers to capture ongoing changes during the rebuild.

---

# Mental Models

pg_repack is a table defragmentation tool. It rebuilds the physical table storage without taking the table offline. Equivalent to `ALTER TABLE ... CLUSTER` but without the exclusive lock duration.

---

# Internal Mechanics

1. Creates a new physical table with the same structure.
2. Registers triggers to capture changes on the original table.
3. Copies rows from the original to the new table (compacting storage).
4. Replaces the original table with the new copy (brief ACCESS EXCLUSIVE lock).
5. Drops triggers and rebuilds indexes.

---

# Patterns

**Schedule regular pg_repack**: For high-write tables, schedule pg_repack during low-traffic periods (e.g., weekly).

**Monitor bloat levels**: Use `pgstattuple` or `pg_bloat_check` queries to identify tables with > 20% bloat.

**Combine with autovacuum tuning**: pg_repack handles compacting, but properly tuned autovacuum reduces how often pg_repack is needed.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| pg_repack | Tables with > 20% bloat, frequent UPDATE-heavy workloads | Tables with low write activity (autovacuum suffices) |
| Full table repack vs index-only repack | Table bloat AND index bloat | Index-only bloat |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
No extended exclusive lock | Requires extension installation | Must be installed on all PostgreSQL instances
Reclaims physical disk space | Doubles table storage during repack | Requires ~2x free space
Improves query performance | Trigger overhead during repack | Write performance degraded during rebuild

---

# Performance Considerations

- pg_repack requires free disk space approximately equal to the target table's size.
- During repack, write performance degrades due to trigger overhead and IO competition.
- After repack, query performance improves due to compacted storage and reduced index depth.

---

# Production Considerations

- **Extension installation**: Requires `pg_repack` extension installed on the PostgreSQL server. May need superuser privileges.
- **Scheduling**: Run during low-traffic windows. For 24/7 workloads, use throttled repack.
- **Monitoring**: Track repack progress via `pg_repack_progress` view.

---

# Common Mistakes

**Running on a table without sufficient free space**: pg_repack fails mid-operation because disk space is exhausted.

**Not rescheduling**: A one-time repack is insufficient for high-write tables — bloat returns.

---

# Ecosystem Usage

pg_repack is widely used in the PostgreSQL ecosystem for production bloat management. GitLab uses `gitlab-pgrepack` as a wrapper for automated bloat reduction across their Patroni clusters. Amazon RDS for PostgreSQL supports pg_repack as a standard extension. Managed PostgreSQL providers like Aiven, Crunchy Bridge, and Timescale recommend pg_repack over `VACUUM FULL` for online operations. The extension is commonly scheduled via `pg_cron` or Kubernetes CronJobs for weekly maintenance. Laravel deployments using PostgreSQL with high-write tables (logs, audit trails, activity feeds) benefit most from regular pg_repack scheduling.

# Failure Modes

- **Disk space exhaustion**: pg_repack requires ~2x the table size in free disk space during operation. Running out of space mid-repack corrupts the temporary table and requires manual cleanup of the `repack` schema.
- **Exclusive lock wait**: The final swap phase requires a brief ACCESS EXCLUSIVE lock. If a long-running query holds a conflicting lock, pg_repack hangs. Monitor `pg_locks` for blocking sessions and use `--no-kill-backends` carefully.
- **Trigger conflict**: pg_repack installs triggers on the target table. If another process (replication, CDC tool) also uses triggers, conflicts may cause the repack to fail.
- **WAL explosion**: High-write tables generate significant WAL during repack, potentially exhausting WAL archiving storage or causing replica lag.
- **Failed cleanup**: An interrupted repack leaves behind temporary tables in the `repack` schema and repack triggers on the target table. Manual cleanup with `DROP SCHEMA repack CASCADE` is required.

---

# Research Notes

pg_repack is an essential tool for PostgreSQL production maintenance that is often overlooked in Laravel deployments. High-write Eloquent models (logs, audit trails, activity feeds) benefit most from periodic pg_repack runs.

## Related Knowledge Units

- **Online DDL tools**: gh-ost (GitHub Online Schema Transitions), pt-online-schema-change (Percona Toolkit) — trigger-based approaches for MySQL that replicate data to a shadow table, then swap atomically.
- **Zero-downtime migration patterns**: Expand-contract pattern, blue-green schema deployment, view-based migration (pgroll), and trigger-based migration (gh-ost). Each approach has tradeoffs in complexity, reversibility, and database compatibility.
- **Schema versioning tools**: Flyway (Java), Liquibase (Java), Sqitch (Perl/Node), and Alembic (Python) — migration management frameworks with different versioning philosophies (version-numbered, timestamped, or state-based).
- **Database locking and DDL**: MySQL lock types (metadata lock, table lock, row lock), PostgreSQL lock levels (ACCESS EXCLUSIVE, SHARE ROW EXCLUSIVE), and how they interact with DDL operations. Understanding lock escalation is essential for zero-downtime schema changes.
- **Replica-safe DDL**: Techniques for applying schema changes to replicated environments without breaking replication — including replica-first deployment, statement-based vs row-based replication considerations, and GTID-based failover safety.
