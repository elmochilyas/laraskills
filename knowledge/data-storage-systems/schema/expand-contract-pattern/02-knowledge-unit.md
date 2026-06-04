# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.18 Expand-contract pattern (add column, dual-write, backfill, dual-read, remove old)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The expand-contract pattern is the most reliable approach for zero-downtime schema changes. It separates a single logical schema change into multiple deployment phases, ensuring old and new code can coexist during the transition. The phases are: add (new schema element), dual-write (write to both old and new), backfill (populate historical data), dual-read (read from new while verifying old), and remove (drop old structures).

---

# Core Concepts

- **Phase 1 — Add**: Deploy migration that adds the new column (nullable), creates the new table, or adds the new index. Old code works unchanged. No application deploy needed.
- **Phase 2 — Dual-write**: Deploy application code that writes to both old and new columns/tables. Old reads continue using old structures. New reads can optionally use new structures.
- **Phase 3 — Backfill**: Populate existing rows with data for the new column/table. Runs as queued jobs or chunked batch processing.
- **Phase 4 — Dual-read**: Switch reads to the new column/table. Monitor for correctness. Keep old as verification.
- **Phase 5 — Remove**: Deploy migration to drop old column/table. This is destructive — only safe after all code references to old structures are removed.

---

# Mental Models

The expand-contract pattern treats schema changes as multi-phase distributed system operations, not single database commands. Each phase is reversible independently. The application code during the transition must work correctly with both old and new schema states.

---

# Internal Mechanics

**Add phase**: `Schema::table('orders', fn($t) => $t->string('new_status')->nullable());` — no default, nullable, no lock on modern databases.

**Dual-write phase**: 
```php
// On create/update
$order->status = $input['status'];        // old column
$order->new_status = $input['status'];    // new column
$order->save();
```

**Backfill phase**: `Order::whereNull('new_status')->chunkById(100, fn($orders) => ...)` — chunked, throttled, queued.

**Dual-read phase**: 
```php
// Gradually switch consumers
$status = feature_flag('use_new_column') 
    ? $order->new_status 
    : $order->status;
```

**Remove phase**: `Schema::table('orders', fn($t) => $t->dropColumn('status'));` — requires ALGORITHM=INPLACE in MySQL, immediate in PostgreSQL.

---

# Patterns

**Backward-compatible add**: Always add columns as nullable or with a default. A NOT NULL column added without a default fails immediately on tables with existing rows.

**Dual-write with same value**: Write the same value to both columns to prevent drift. If writing different values, the migration becomes a data transformation, not a rename.

**Remove with delay**: Schedule the remove phase 24-48 hours after dual-read is verified. This catches delayed queue jobs and long-running processes that still reference the old structure.

---

# Architectural Decisions

| Phase | Duration | Risk |
|-------|----------|------|
| Add | Minutes (DDL execution) | Very low — no application changes |
| Dual-write | One deploy cycle | Medium — application logic duplication |
| Backfill | Hours to days (data volume dependent) | Low — throttled, idempotent |
| Dual-read | One deploy cycle | Medium — must verify correctness |
| Remove | Minutes (DDL execution) | High — destructive, irreversible |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Zero application downtime | 5 separate deploy steps | Slower end-to-end change time
Safe rollback at any phase | Temporary dual-maintenance | Additional code complexity
Verification before destruction | Extra monitoring and alerting needed | Operational overhead

---

# Performance Considerations

- Dual-write doubles write throughput to the affected tables temporarily. Monitor database write IOPS during this phase.
- Backfill should be throttled — use chunked processing with configurable sleep intervals between chunks.
- Read path has constant-time overhead (ternary operator or feature flag check).

---

# Production Considerations

- **Long-running backfill**: A backfill that takes 12+ hours must be resumable. Use checkpoint tracking (record last processed ID).
- **Compatibility window**: All running code (including delayed queue jobs, cron tasks) must be compatible with both schema states. Extend the compatibility window to cover the maximum expected job delay.
- **Monitor for drift**: During dual-write, verify that old and new columns stay in sync. Add periodic consistency checks.

---

# Common Mistakes

**Short compatibility window**: Dropping the old column 1 hour after switching reads. A queue job that was delayed 2 hours fails when it tries to write to the dropped column.

**Backfill in the same deploy as column addition**: The column addition migration runs; the backfill starts; it takes 4 hours. The production deploy pipeline blocks on backfill completion. Always run backfill as a separate background process.

**Not verifying dual-read correctness**: Switching reads to the new column without verifying the data matches. If the dual-write had a bug, the new column has incorrect data and users see wrong results.

---

# Failure Modes

- **Inconsistent dual-write**: Application writes different values to old and new columns (e.g., one is transformed, the other is raw). The columns drift, and switching reads produces incorrect results.
- **Backfill job failure**: The backfill crashes after processing 40% of rows. The new column has mixed populated/NULL values. Readers using the new column get inconsistent results.
- **Feature flag misconfiguration**: A feature flag enables the new column read path before the backfill completes. Users see NULL values.

---

# Related Knowledge Units

1.10 Zero-downtime migration patterns | 1.19 Data backfill strategies | 11.6 Expand-contract detailed

---

# Ecosystem Usage

The expand-contract pattern is the foundation of zero-downtime migration strategies across the entire Laravel ecosystem. Deploy tools like Laravel Envoyer, Forge, and Vapor all assume expand-contract compatibility in their deployment pipelines. Packages like `stancl/tenancy` use expand-contract principles for multi-tenant schema changes. PlanetScale's branching model and GitHub's gh-ost both implement expand-contract at the database level. Feature flag services like LaunchDarkly and Laravel Pennant are commonly used to manage the dual-read phase, gradually shifting traffic from old to new columns.

# Research Notes

The expand-contract pattern is the gold standard for zero-downtime schema changes. Teams that skip phases (especially the dual-read verification) inevitably encounter data consistency issues. The "delay before remove" phase is the most commonly skipped and most commonly regretted — queue jobs and delayed processes continue referencing old structures long after the deploy completes.
