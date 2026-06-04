# Skill: Use allowFailures for Partial Success Tolerance

## Purpose
Configure `allowFailures()` on batches to continue processing remaining jobs after individual failures, with correct callback handling for partial success detection.

## When To Use
Independent operations where one failure doesn't invalidate others (processing batches, sending notifications); maximum-throughput scenarios where all work should be attempted regardless of individual failures.

## When NOT To Use
Financial reconciliation or data migration where partial completion is unacceptable; atomic operations where any failure means the entire operation should roll back.

## Prerequisites
- Batch dispatched with `Bus::batch()`
- Understanding of `then()`/`catch()` mutual exclusion

## Inputs
- Batch of jobs
- Failure tolerance choice (allowFailures yes/no)

## Workflow
1. Add `->allowFailures()` to the batch chain
2. Always pair with `->catch(fn(Batch $b, Throwable $e) => ...)` — without it, failures are silently absorbed
3. Add `->then(fn(Batch $b) => ...)` for all-success path (fires only if failed_jobs === 0)
4. Check `$batch->failedJobs` in `finally()` for failure-aware cleanup
5. Do NOT assume `allowFailures()` prevents chain abort within a batch (it doesn't)
6. Ensure `catch()` callback provides proper alerting/logging

## Validation Checklist
- [ ] `allowFailures()` paired with `catch()` callback
- [ ] `then()` not used to detect partial failure (mutually exclusive with catch)
- [ ] `failedJobs` checked in `finally()` if failure-aware cleanup needed
- [ ] Not assuming allowFailures prevents chain abort in batch-of-chains
- [ ] Failed jobs still logged to failed_jobs table (allowFailures doesn't silence them)

## Common Failures
- Using `allowFailures()` without `catch()` — failures silently absorbed
- Assuming `then()` fires with partial failures — only fires if failed_jobs === 0
- Expecting `allowFailures()` to prevent chain abort — chain abort is chain-internal

## Decision Points
- All must succeed: don't use allowFailures
- Partial success acceptable: use allowFailures + catch()
- Maximum throughput: use allowFailures, monitor failures separately

## Performance Considerations
- allowFailures may increase throughput (no cancellation wasting dispatch slots)
- No additional overhead from allowFailures itself (boolean check)
- Failed jobs still consume DB writes for failed_jobs table

## Related Rules
- Rule 1: always-pair-allowFailures-with-catch
- Rule 2: no-allowFailures-for-chain-abort
- Rule 3: check-failedJobs-in-finally
- Rule 4: no-then-on-partial-failure

## Related Skills
- Orchestrate Parallel Job Execution with Bus::batch
- Use Batch Callbacks for Post-Batch Processing

## Success Criteria
Batch continues processing after individual failures, `catch()` callback fires for alerting, `then()` fires only on full success, and partial failures are detectable in post-processing.
