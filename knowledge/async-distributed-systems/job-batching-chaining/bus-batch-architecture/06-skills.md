# Skill: Orchestrate Parallel Job Execution with Bus::batch

## Purpose
Use `Bus::batch` to dispatch parallel jobs with completion tracking, progress callbacks, and failure handling — enabling scatter-gather workflows.

## When To Use
Parallel independent work units (image processing, data imports, API calls); scatter-gather patterns where all results must complete before proceeding; progress tracking for long-running batch operations.

## When NOT To Use
Sequential job execution (use `Bus::chain`); small numbers of jobs (< 5) — direct dispatch is simpler; high-throughput systems where DB row lock contention is unacceptable.

## Prerequisites
- `job_batches` database table created via `queue:batches-table` migration
- Queue worker running

## Inputs
- Array of job instances (recommended max 10,000)
- Batch callbacks (`then`, `catch`, `finally`)
- Failure tolerance (allowFailures yes/no)

## Workflow
1. Ensure `job_batches` table exists: `php artisan queue:batches-table && php artisan migrate`
2. Build batch: `Bus::batch([$job1, $job2, $job3])`
3. Add `->allowFailures()` if partial success is acceptable
4. Add callbacks: `->then(fn(Batch $b) => ...)` / `->catch(...)` / `->finally(...)`
5. Configure: `->onConnection('redis')->onQueue('batch')`
6. Call `->dispatch()` and capture return value: `$batch = Bus::batch(...)->dispatch()`
7. For progress: poll `$batch->fresh()->progress()` or use `then()` callback
8. Schedule periodic pruning: `$schedule->command('queue:prune-batches --hours=48')->daily()`

## Validation Checklist
- [ ] `job_batches` table migrated
- [ ] Batch size under 10,000 jobs
- [ ] `allowFailures()` called when partial success is acceptable
- [ ] Callbacks don't capture large serialized objects
- [ ] `$batch->fresh()` used for current state (Batch is immutable)
- [ ] Old batches pruned regularly via scheduler

## Common Failures
- Not calling `allowFailures()` — batch cancels on first failure
- `$this` in callback closures — serialization error
- Assuming real-time progress without `$batch->fresh()`
- Large batches with progress callback — 10K extra worker jobs
- Not pruning old batches — table grows unbounded

## Decision Points
- All jobs must succeed: no allowFailures
- Partial success OK: use allowFailures
- Need progress: use then() callback or poll $batch->fresh()

## Performance Considerations
- Each job completion acquires a row lock on job_batches table
- Keep batch sizes under 10,000 to avoid lock contention
- Callbacks are serialized closures stored in options column

## Related Rules
- Rule 1: keep-batch-sizes-manageable
- Rule 2: use-allowFailures-for-partial-success
- Rule 3: avoid-large-objects-in-callbacks
- Rule 4: prune-old-batches-regularly
- Rule 5: always-fresh-batch-for-current-state

## Related Skills
- Chain Sequential Jobs with Bus::chain
- Batch of Chains: Combine Sequential and Parallel Patterns

## Success Criteria
Batch dispatches all jobs in parallel, completion callback fires when all finish, partial failures don't cancel remaining work (if allowFailures), and old batch records are pruned regularly.
