# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.11 gh-ost tool (binlog-based, trigger-free, pause/resume, test-on-replica)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

gh-ost (GitHub Online Schema Transfer) is a trigger-free, binlog-based online schema migration tool for MySQL. Unlike trigger-based approaches (pt-online-schema-change), gh-ost avoids triggers by reading the binary log to capture ongoing changes. It supports pause/resume, throttling, test-on-replica, and controlled cut-over locking. Designed by GitHub for large-scale MySQL migrations with minimal production impact.

---

# Core Concepts

- **Trigger-free architecture**: Reads the binary log (binlog) to capture writes happening on the original table during migration. Avoids trigger overhead and trigger-related deadlocks.
- **Shadow-table approach**: Creates a ghost table with the new schema, applies the migration, streams live changes via binlog, then atomically swaps.
- **Cut-over phase**: The final swap from original table to ghost table. Brief lock period (typically < 1 second).
- **Throttling**: Self-regulates based on replication lag, thread count, load, or custom thresholds.
- **Test-on-replica**: Runs the full migration on a replica without executing cut-over, verifying correctness and timing before touching the primary.

---

# Mental Models

gh-ost is a CDC (Change Data Capture) pipeline applied to schema migration. It streams ongoing changes from the binlog to the ghost table while bulk-applying the historical dataset. The cut-over is the final atomic commit.

---

# Internal Mechanics

1. Creates a ghost table (same structure as original + schema changes applied).
2. Reads the original table's rows in chunks, applies transformation, writes to ghost table.
3. Simultaneously, reads binlog events (INSERT, UPDATE, DELETE) from the original table and applies them to the ghost table.
4. During cut-over:
   a. Acquires a brief low-level lock on the original table.
   b. Verifies ghost table is caught up.
   c. Atomically renames: original -> _old, ghost -> original.
   d. Releases lock (typically < 1 second blocking window).
5. Cleans up the _old table (optional, configurable delay).

---

# Patterns

**Test-on-replica first**: Use `--test-on-replica --host=replica_host` to run the entire migration on a replica. Verify timing, row counts, and lock duration before running on the primary.

**Throttle during peak traffic**: Set `--throttle-flag-file` that is created during peak hours. gh-ost pauses when the flag file exists.

**Default cut-over**: Let gh-ost manage cut-over automatically (default). Manual cut-over is an option for advanced scenarios.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| gh-ost over pt-osc | Tables > 100GB, trigger overhead concerns | Tables < 10GB (pt-osc may be simpler) |
| Test-on-replica | First-time use, critical tables | Simple additive changes (instant DDL suffices) |
| Automatic throttle | Production with variable traffic | Controlled maintenance windows |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
No trigger overhead | Requires binlog enabled and accessible | Extra storage for binlogs
Pause/resume capability | Migration state persists on disk | Cleanup required if migration is abandoned
Controlled cut-over | Brief exclusive lock during swap | Acceptable for most production workloads
Test-on-replica validation | Extra replica load during test | Must have a dedicated test replica

---

# Performance Considerations

- gh-ost reads type table in chunks — chunk size determines rows-per-statement and affects load.
- Binlog streaming adds minimal overhead (< 5% write amplification).
- Throttle by replication lag: if replica lag exceeds threshold (default 10 seconds), gh-ost pauses row copy.
- Network latency between gh-ost host and MySQL affects throughput.

---

# Production Considerations

- **Binlog format must be ROW**: gh-ost requires ROW-based replication. Statement-based binlog is not supported.
- **Permissions**: gh-ost needs SUPER, REPLICATION SLAVE, REPLICATION CLIENT, and ALTER/CREATE/DROP on the target database.
- **Migration file**: gh-ost writes a state file (`.ghc`) to track progress. If interrupted, resume reads this file.
- **Cleanup**: The `_old` table should be dropped after a verification period (24-48 hours).

---

# Common Mistakes

**Not testing on replica first**: Running gh-ost on production without verifying on a replica. A misconfiguration can cause extended write blocking.

**Cut-over timeout**: The cut-over lock wait timeout is exceeded because the ghost table is still catching up. This extends the write-blocking window.

**Insufficient binlog retention**: gh-ost must read binlogs from the start of the migration. If binlog retention is too short, gh-ost fails with "binlog not found" error.

---

# Failure Modes

- **Binlog position lost**: gh-ost cannot find the binlog position from when the migration started. The entire migration must restart from scratch.
- **Cut-over lock escalation**: Lock wait timeout during cut-over because a long-running transaction holds a conflicting lock.
- **Ghost table corruption**: Network issue or crash during migration corrupts the ghost table. gh-ost must be restarted (state file tracks position).

---

# Ecosystem Usage

`daursu/laravel-zero-downtime-migration` integrates gh-ost as a migration driver. GitHub's infrastructure team originally built gh-ost for their own MySQL migrations. It's the recommended tool for large MySQL schema changes in hosted environments like RDS, Aurora, and self-managed MySQL.

---

# Related Knowledge Units

1.12 pt-online-schema-change | 1.13 Spirit tool | 1.10 Zero-downtime migration patterns | 1.18 Expand-contract pattern

---

# Research Notes

gh-ost's trigger-free architecture is its key advantage over pt-osc. Triggers in pt-osc can cause deadlocks under high concurrency, especially on tables with complex FK relationships. gh-ost avoids this entirely by using the binlog. The test-on-replica feature is underused — most teams run gh-ost directly on production without prior validation.
