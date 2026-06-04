# Anti-Patterns: Mass Prunable

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Mass Prunable

## Anti-Patterns

### Using MassPrunable When Per-Record Side Effects Matter
Applying `MassPrunable` to a model that depends on `deleting`/`deleted` events for caching, notifications, archival, or cascading deletes. Mass pruning issues a single `DELETE` and fires zero model events.

**Problem:** Silent loss of audit trails; missing cascading deletes; cache invalidation failures; notifications never sent — all without errors or warnings.

**Solution:** Use `Prunable` (not `MassPrunable`) when per-record events, side effects, or callbacks are required.

### No --pretend Before Production
Running mass prune in production without a dry-run verification first. `MassPrunable` deletes all matching records atomically — there is no per-record safety net or interruption mechanism.

**Problem:** Irreversible mass deletion of incorrect records; no ability to roll back without database restore if the `prunable()` query is wrong.

**Solution:** Always execute `model:prune --pretend --model=YourModel` in the production environment and verify the output before enabling the schedule.

### No Batch Limit
Omitting `->limit()` in the `prunable()` query when the table contains millions of rows. A single massive `DELETE` locks the table for the duration of the statement.

**Problem:** Prolonged table locks blocking application queries; replication lag on read replicas; transaction log overflow on high-volume tables; deadlocks with concurrent writes.

**Solution:** Apply `->limit(1000)` in `prunable()` to batch deletes. Loop externally until all eligible records are pruned.

### Missing deleted_at Filter on Soft-Deletable Models
Writing a `prunable()` query on a soft-deletable model without explicitly filtering for `onlyTrashed()` or `whereNotNull('deleted_at')`. `MassPrunable` does not call `forceDelete()` — it issues a raw `DELETE`.

**Problem:** Permanent deletion of active records from the database; catastrophic data loss with no soft-delete recovery mechanism.

**Solution:** Always include `onlyTrashed()` in the `prunable()` query for soft-deletable models: `static::onlyTrashed()->where('deleted_at', '<=', now()->subDays(90))`.

### Expecting pruning() Callbacks
Implementing `pruning()` or `pruned()` methods on a model with `MassPrunable` and expecting them to execute. `MassPrunable` has no lifecycle hooks — these callbacks are never called.

**Problem:** Silent omission of side effects that were expected to run during pruning. The code compiles and runs but the callbacks are dead code.

**Solution:** Use `Prunable` if callbacks are needed. For `MassPrunable`, implement side effects externally (pre-archival job, post-prune count verification).

### Combining Prunable and MassPrunable
Importing both `Prunable` and `MassPrunable` traits on the same model. Both define a `prune()` method, causing a PHP trait method collision.

**Problem:** PHP fatal error preventing the application from booting; confusing resolution code if manually aliased.

**Solution:** Use exactly one pruning trait per model. The traits are mutually exclusive by design.

### Scheduling Mass Prune During Peak Hours
Running mass prune schedules during peak traffic periods. A bulk `DELETE` acquires table-level locks that block concurrent reads and writes.

**Problem:** Application timeouts during peak traffic; user-facing errors from locked rows; increased database connection pool contention; degraded user experience.

**Solution:** Schedule mass pruning during off-peak hours or maintenance windows. Use `->dailyAt('03:00')` or similar low-traffic time slots.

### No External Audit for Compliance Data
Mass pruning compliance-relevant data without implementing pre-prune and post-prune audit logging. `MassPrunable` fires no events, so no `deleted` or `forceDeleted` listeners execute.

**Problem:** Invisible data removal that cannot be traced; compliance audit gaps; inability to investigate data loss incidents.

**Solution:** Add external audit logging with pre-count and post-count queries: log recorded count before and after mass prune execution.

### No Transaction Rollback for Small Datasets
Running mass prune on small datasets (<10,000 records) without wrapping in a database transaction. If the prune deletes wrong records, there is no ability to roll back.

**Problem:** Irreversible data loss from a buggy prune query; inability to recover mistakenly deleted records without database restore.

**Solution:** Wrap small mass prunes in an explicit database transaction with validation before commit.

### Not Testing with Realistic Data Volumes
Testing `MassPrunable` only with small development datasets. A `DELETE` query that executes in milliseconds on 1,000 records may take minutes on 1,000,000 production records.

**Problem:** Unexpected production incidents: prolonged table locks, replication lag, transaction log overflow, and application downtime.

**Solution:** Run mass prune queries against a staging database with production-scale data volumes before deploying to production.
