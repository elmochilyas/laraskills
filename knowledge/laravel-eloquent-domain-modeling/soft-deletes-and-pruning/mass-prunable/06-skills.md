# Mass Prunable Skills

## Skill: Automatically prune old records in bulk using MassPrunable

### Purpose
Use `MassPrunable` to bulk-delete eligible records in a single `DELETE` query without per-record events or callbacks — significantly faster than `Prunable` for large datasets where individual record processing is unnecessary.

### When To Use
- Large cleanup operations where per-record events are unnecessary (10k+ records)
- Ephemeral data (sessions, log entries, notifications) where individual deletion tracking is irrelevant
- Bulk archiving — deleting old data after it has been exported/archived externally
- Performance-critical background cleanup jobs where speed matters over event fidelity
- Tables with high write throughput where individual deletes would cause too many transactions

### When NOT To Use
- When per-record event firing is required — use `Prunable` instead
- When `pruning()`/`pruned()` callbacks are needed — mass pruning has no lifecycle hooks
- When you need to skip individual records based on runtime conditions — `prunable()` query must be precise
- On tables with millions of rows without batching — a single massive `DELETE` can lock the table
- Combined with `Prunable` on the same model — trait method collision on `prune()`

### Prerequisites
- Model with index on columns used in `prunable()` query
- Understanding that no model events fire during mass pruning

### Inputs
- Model instance with `MassPrunable` trait and defined `prunable()` method

### Workflow
1. Import `use MassPrunable` on the model
2. Define `prunable(): Builder` with precise query conditions — no `pruning()` safety net
3. For soft-deletable models, explicitly filter `onlyTrashed()` in `prunable()`
4. Add `->limit(1000)` in `prunable()` to batch large deletes and prevent table locks
5. Run `model:prune --pretend --model=YourModel` before enabling in production
6. Schedule during off-peak hours to minimize table lock impact
7. Implement external audit logging (pre/post count queries) if compliance-relevant data is pruned
8. Wrap small mass prunes (<10k records) in a database transaction for rollback

### Validation Checklist
- [ ] `MassPrunable` deletes only eligible records
- [ ] Single `DELETE` query is issued (verify via DB query log)
- [ ] No model events fired (`deleting`/`deleted` listeners report 0 calls)
- [ ] Mass prune with `SoftDeletes` deletes only eligible trashed records
- [ ] Active records are untouched; eligible trashed records permanently removed
- [ ] `--pretend` mode does not delete records but shows expected count
- [ ] Mass prune handles limited batch size via `->limit()` in `prunable()`
- [ ] Performance: bulk `DELETE` is significantly faster than per-record iteration

### Common Failures
- Applying `MassPrunable` where `Prunable` is needed — if app depends on `deleting` events, mass prune silently skips them
- Forgetting the model uses `SoftDeletes` — the prunable query must explicitly filter trashed conditions
- No limit on prunable query — deleting millions of records in one statement causes prolonged table locks
- Assuming mass prune fires observers — it does not; side effects must be handled separately
- Combining `Prunable` and `MassPrunable` on the same model — trait method collision

### Decision Points
- **MassPrunable or Prunable?** — Use `MassPrunable` for ephemeral data where per-record side effects are unnecessary; use `Prunable` when `pruning()`/`pruned()` callbacks are required
- **Batch size?** — Use `->limit(1000)` for production tables to minimize lock duration; adjust based on index performance
- **Audit logging?** — External pre/post count queries for compliance-relevant data; skip for ephemeral data

### Performance Considerations
- Single `DELETE` vs N deletes — for 10k records, ~1ms vs potentially 5000ms
- Table locking — large `DELETE` without `LIMIT` locks the table; batch with `->limit(1000)` and loop
- Binary log growth — bulk `DELETE` generates fewer log entries than individual deletes
- InnoDB buffer pool — bulk `DELETE` marks pages as dirty; I/O spike during flush on large deletes
- No model hydration — query operates entirely at the SQL level, avoiding Eloquent overhead

### Security Considerations
- No per-record audit events — mass pruning removes records silently; implement pre/post checks externally
- The `prunable()` query must be absolutely correct — no `pruning()` safety net
- A buggy `prunable()` query (missing `onlyTrashed()`) can delete active records
- Use `--pretend` as a mandatory pre-flight check before production
- Foreign key constraints may cause the bulk `DELETE` to fail — test with full dataset

### Related Rules
- [MassPrunable-When-No-Events-Needed](../mass-prunable/05-rules.md)
- [MassPrunable-Precise-Query](../mass-prunable/05-rules.md)
- [MassPrunable-Pretend-Before-Production](../mass-prunable/05-rules.md)
- [MassPrunable-Limit-Large-Batches](../mass-prunable/05-rules.md)
- [MassPrunable-Filter-Trashed-For-SoftDeletes](../mass-prunable/05-rules.md)
- [MassPrunable-No-Combine-With-Prunable](../mass-prunable/05-rules.md)
- [MassPrunable-External-Audit-Logging](../mass-prunable/05-rules.md)
- [MassPrunable-Schedule-During-Off-Peak](../mass-prunable/05-rules.md)
- [MassPrunable-Test-Realistic-Volumes](../mass-prunable/05-rules.md)
- [MassPrunable-Transaction-For-Small-Datasets](../mass-prunable/05-rules.md)

### Related Skills
- Automatically prune old records per-record using the Prunable trait
- Schedule and run pruning via the model:prune Artisan command

### Success Criteria
- `MassPrunable` deletes all eligible records in a single `DELETE` query
- No model events are fired during mass prune
- `--pretend` mode shows correct expected record count
- `prunable()` query with `->limit()` batches deletes to prevent table locks
- Soft-deletable models: only trashed records are deleted (active records untouched)
- Performance is significantly better than per-record `Prunable` for large datasets
- External audit logging captures prune scope when compliance-relevant data is affected
