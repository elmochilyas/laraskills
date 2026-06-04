# Skill: Handle Batch Cancellation with the Batchable Trait

## Purpose
Use the `Batchable` trait and `SkipIfBatchCancelled` middleware to make batched jobs respect cancellation, abort mid-execution, and avoid wasted work.

## When To Use
Long-running batched jobs that should abort on cancellation (media processing, API calls); jobs that need access to batch metadata; self-cancellation patterns where a job cancels its batch on detecting unrecoverable state.

## When NOT To Use
Idempotent jobs that should run even if cancelled (logging, cleanup); jobs outside a batch context.

## Prerequisites
- Job class part of a `Bus::batch()` dispatch
- `SkipIfBatchCancelled` middleware imported

## Inputs
- Batch ID (available via `$this->batchId` when Batchable trait is used)
- Cancellation check points in handle() for long jobs

## Workflow
1. Add `use Batchable` to the batched job class
2. Add `SkipIfBatchCancelled` middleware in `middleware()`: `return [new SkipIfBatchCancelled]`
3. For long jobs, add periodic `cancelled()` checks mid-execution
4. Always `return` after calling `$this->bail()` (or use middleware instead)
5. Guard `$this->batch()` with null check: `$this->batch()?->cancelled()`
6. To cancel from within a job: `$this->batch()->cancel()`

## Validation Checklist
- [ ] `SkipIfBatchCancelled` middleware applied in `middleware()` method
- [ ] `return` after `bail()` calls (or use middleware)
- [ ] Mid-execution cancellation check for long jobs
- [ ] `$this->batch()` guarded with null check
- [ ] Cancellation doesn't delete already-queued jobs (cooperative model)

## Common Failures
- Not returning after `bail()` — job continues executing despite cancellation
- Assuming cancellation stops queued jobs — it only sets a DB flag
- `batch()` returns null if batch pruned before job runs — null method call error

## Decision Points
- Pre-execution check: use `SkipIfBatchCancelled` middleware
- Mid-execution check: use `$this->batch()->cancelled()` periodically
- Both: combine middleware + periodic checks

## Performance Considerations
- `cancelled()` checks are cache reads — negligible overhead
- `bail()` calls `delete()` — removes job from queue backend
- Periodic checks every N items add overhead for very granular checks

## Related Rules
- Rule 1: use-SkipIfBatchCancelled-middleware
- Rule 2: always-return-after-bail
- Rule 3: check-cancellation-mid-execution
- Rule 4: no-auto-stop-on-cancellation

## Related Skills
- Orchestrate Parallel Job Execution with Bus::batch
- Use Batch Callbacks for Post-Batch Processing

## Success Criteria
Canceled batches stop processing promptly, already-running jobs check cancellation and abort, no wasted work after cancellation, and `SkipIfBatchCancelled` middleware handles pre-execution checks.
