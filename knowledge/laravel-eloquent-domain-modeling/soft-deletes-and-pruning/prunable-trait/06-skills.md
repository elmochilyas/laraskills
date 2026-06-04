# Prunable Trait Skills

## Skill: Automatically prune old soft-deleted records using the Prunable trait

### Purpose
Use the `Prunable` trait to automatically expire old records (typically soft-deleted ones) by defining a `prunable()` query scope, with per-record lifecycle callbacks (`pruning()` and `pruned()`) for conditional skipping and side effects.

### When To Use
- Periodic cleanup of old soft-deleted records past the recovery window
- Expiring temporary data (sessions, notifications, cache entries, audit logs)
- Compliance-driven data retention policies (auto-delete records older than X days)
- Automated storage reclamation for tables that accumulate stale rows
- Any model where data has a known expiration and should be removed without manual intervention

### When NOT To Use
- For records that must be kept indefinitely (core business data, financial records)
- When bulk deletion is acceptable and per-record callbacks are unnecessary — use `MassPrunable` instead
- Without defining `prunable()` — the method has no default and returns an empty query, resulting in a silent no-op
- Using `prunable()` with conditions that could match active records unintentionally
- For models needing individual audit trails on deletion — pruning is a background operation

### Prerequisites
- Model with `SoftDeletes` trait (typical) or a model with time-based expiration
- Indexed columns used in `prunable()` query

### Inputs
- Model instance with `Prunable` trait and defined `prunable()` method

### Workflow
1. Import `use Prunable` on the model
2. Define `prunable(): Builder` returning the query for eligible records
3. Optionally define `pruning($model): ?bool` returning `false` to skip individual records
4. Optionally define `pruned($model): void` for side effects after deletion (archiving, logging)
5. Index all columns used in the `prunable()` WHERE clause
6. Schedule `model:prune` in `Kernel::schedule()` with `->withoutOverlapping()`
7. Run `model:prune --pretend --model=YourModel` before enabling in production
8. Test `prunable()` query in CI with realistic data volumes

### Validation Checklist
- [ ] `prunable()` method is defined and returns correct eligible records
- [ ] `pruning()` returning `false` skips the record
- [ ] `pruned()` callback is invoked after successful deletion
- [ ] All eligible records are deleted after `prune()` completes
- [ ] Non-eligible records are not deleted
- [ ] Memory-efficient iteration (cursor-based, O(1) memory)
- [ ] Pruning without `SoftDeletes` calls `delete()` (not `forceDelete()`)
- [ ] `--pretend` mode does not modify data but shows intended deletions
- [ ] Columns used in `prunable()` are indexed

### Common Failures
- Not overriding `prunable()` — default returns empty query, nothing is ever pruned (silent)
- Using `prunable()` for non-soft-delete conditions — may delete records still needed for business processes
- Forgetting `forceDelete()` semantics — if model uses `SoftDeletes`, pruning calls `forceDelete()`, not `delete()`
- Assuming `pruning()` can return void — `pruning()` should return `false` explicitly to skip; void return means continue
- Not testing `prunable()` query in CI — may be fast in development but slow in production

### Decision Points
- **Prunable or MassPrunable?** — Use `Prunable` when per-record callbacks (`pruning()`/`pruned()`) are needed; use `MassPrunable` for bulk deletion without events (>10k records)
- **Logic in prunable() or pruning()?** — Keep `prunable()` as a simple, indexable SQL query; use `pruning()` for runtime conditions that can't be expressed in SQL
- **Side effects in pruned() or queued?** — Queue expensive side effects (archiving, notifications) instead of executing inline in `pruned()`

### Performance Considerations
- `cursor()` holds a single database cursor — memory is O(1) but connection stays open
- Each `forceDelete()` is its own transaction — consider wrapping batches in manual transactions
- Index columns used in `prunable()` (typically `deleted_at` or `created_at`)
- For >10k records, `MassPrunable` is significantly faster
- Heavy `pruned()` callbacks cause prune to be slow — queue side effects

### Security Considerations
- Pruning permanently removes data — ensure retention policy meets compliance requirements
- `pruned()` callback is the hook for secure data archival before deletion
- If `pruning()` throws, the entire prune stops — ensure callbacks are exception-safe
- Verify `prunable()` query does not include active records
- The `model:prune` command should be restricted to CLI/admin access only

### Related Rules
- [Prunable-Always-Define-Pruneable](../prunable-trait/05-rules.md)
- [Prunable-Index-Prunable-Columns](../prunable-trait/05-rules.md)
- [Prunable-Keep-Callbacks-Lightweight](../prunable-trait/05-rules.md)
- [Prunable-Use-Pruning-For-Conditional-Skip](../prunable-trait/05-rules.md)
- [Prunable-WithoutOverlapping](../prunable-trait/05-rules.md)
- [Prunable-Pretend-Before-Production](../prunable-trait/05-rules.md)
- [Prunable-Test-In-CI](../prunable-trait/05-rules.md)
- [Prunable-Retention-Policy-Documented](../prunable-trait/05-rules.md)
- [Prunable-Switch-To-MassPrunable-Large-Batches](../prunable-trait/05-rules.md)
- [Prunable-No-Combination-With-MassPrunable](../prunable-trait/05-rules.md)

### Related Skills
- Automatically prune old records in bulk using MassPrunable
- Schedule and run pruning via the model:prune Artisan command

### Success Criteria
- `prunable()` query returns only records eligible for pruning
- Pruned records are permanently deleted (forceDelete on soft-deletable models)
- `pruning()` returning `false` correctly skips individual records
- `pruned()` callback executes after successful deletion
- Schedule runs with `->withoutOverlapping()` — no concurrent prune executions
- `--pretend` shows correct count without deleting
- Columns in `prunable()` are indexed for performance
