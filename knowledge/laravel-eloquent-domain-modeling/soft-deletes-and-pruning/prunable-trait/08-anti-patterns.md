# Anti-Patterns: Prunable Trait

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Soft Deletes & Pruning
- **Knowledge Unit:** Prunable Trait

## Anti-Patterns

### No prunable() Override
Adding the `Prunable` trait to a model but never defining the `prunable()` method. The default implementation returns an empty query (`whereRaw('0 = 1')`), making `prune()` a silent no-op.

**Problem:** Pruning never executes, soft-deleted records accumulate indefinitely, table bloat degrades performance over time. The developer has a false sense of cleanup.

**Solution:** Always define `prunable(): Builder` when using the `Prunable` trait. Verify the query returns the expected records using `--pretend` mode.

### Prunable Query Without Index
Writing a `prunable()` method that filters on unindexed columns. The query runs on every prune invocation, performing a full table scan on tables that may contain millions of rows.

**Problem:** Heavy database load during each prune cycle; slow pruning that takes hours instead of minutes; replication lag and query timeouts.

**Solution:** Add database indexes on every column referenced in the `prunable()` WHERE clause. Typically index `deleted_at` or `created_at`.

### Heavy pruning()/pruned() Callbacks
Performing expensive I/O (HTTP calls, file uploads, email sends) in `pruning()` or `pruned()` callbacks. These run per-record during cursor-based iteration.

**Problem:** An HTTP call taking 200ms becomes 200 seconds for 1,000 records. The database cursor stays open for the entire duration, risking connection timeouts and holding locks.

**Solution:** Keep callbacks lightweight. Queue expensive side effects from `pruned()` instead of executing them inline. Use `MassPrunable` when no per-record callbacks are needed.

### No Monitoring
Scheduling `model:prune` without monitoring whether it succeeds, fails, or how many records were pruned. Prune failures go unnoticed, causing unchecked table growth.

**Problem:** Silent failures causing unchecked table growth; undetected data loss from buggy `prunable()` queries; no visibility into prune performance trends.

**Solution:** Schedule with `->sendOutputTo()`, `->onFailure()`, and `->then()` handlers. Log record counts and duration. Alert on failures.

### Pruning During Peak Traffic
Running `model:prune` during business hours, causing row lock contention with user queries. Pruning requires database resources that compete with application traffic.

**Problem:** Application timeouts during peak traffic; user-facing errors from locked rows; increased database connection pool contention.

**Solution:** Schedule pruning during off-peak hours via `->dailyAt('03:00')`. Use `->withoutOverlapping()` to prevent extended runs from overlapping with the next cycle.

### Prunable Query That Could Match Active Records
Writing a `prunable()` query that does not correctly scope to records eligible for deletion. For soft-deletable models, omitting `onlyTrashed()` can cause active records to be permanently deleted.

**Problem:** Mass permanent deletion of active records; catastrophic data loss requiring database restore.

**Solution:** For soft-deletable models, always include `onlyTrashed()` in the `prunable()` query. Run `--pretend` before enabling production pruning.

### Using Prunable for Large Batches Without Callbacks
Using `Prunable` to prune more than 10,000 records per cycle when no `pruning()` or `pruned()` callbacks are defined. Each record is deleted individually, generating N queries unnecessarily.

**Problem:** 10,000+ individual DELETE queries when a single statement would suffice; prune operations that take hours instead of seconds.

**Solution:** Switch to `MassPrunable` when per-record callbacks are not needed and the dataset exceeds 10,000 records.

### Combining Prunable and MassPrunable
Importing both `Prunable` and `MassPrunable` traits on the same model. Both define a `prune()` method, causing a trait method collision.

**Problem:** PHP fatal error preventing the application from booting; confusing resolution code if manually aliased.

**Solution:** Use exactly one pruning trait per model. Choose based on whether per-record callbacks are needed.

### No CI Test for prunable()
Maintaining `prunable()` without automated verification. Changes to the query or the model's relationships can silently alter what qualifies for pruning.

**Problem:** Catastrophic production incidents from query changes; regressions undetected until the next prune cycle; difficult debugging of prune behavior.

**Solution:** Write a CI test that creates records matching and not matching prune conditions, and asserts only the eligible records are returned by `prunable()`.
