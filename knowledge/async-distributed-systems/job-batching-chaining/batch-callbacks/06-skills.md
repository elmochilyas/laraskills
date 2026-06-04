# Skill: Use Batch Callbacks for Post-Batch Processing

## Purpose
Configure `then()`, `catch()`, `progress()`, and `finally()` callbacks on batches to handle success, failure, and cleanup after batch completion.

## When To Use
Post-batch notification (all orders processed → send summary); progress reporting for long-running operations; resource cleanup regardless of success/failure.

## When NOT To Use
Complex business logic in callbacks — dispatch a dedicated job instead; when callback deserialization would be catastrophic (closures reference classes that may change).

## Prerequisites
- Batch dispatched with `Bus::batch()`
- Understanding of `then()`/`catch()` mutual exclusion and `finally()` limitations

## Inputs
- Batch object
- Success callback logic
- Failure callback logic

## Workflow
1. Add `->then(fn(Batch $b) => ...)` for all-success path
2. Add `->catch(fn(Batch $b, Throwable $e) => ...)` for any-failure path
3. Add `->finally(fn(Batch $b) => ...)` for unconditional cleanup (avoid in batch-of-chains)
4. Keep callbacks thin — dispatch a dedicated job for complex work
5. Never use `$this` in callback closures — use `use ($specificVar)` with primitives
6. Prefer `then()` + `catch()` over `finally()` for batch-of-chains patterns

## Validation Checklist
- [ ] No `$this` used in callback closures
- [ ] Callbacks are thin (dispatch jobs for complex logic)
- [ ] `then()` + `catch()` used for explicit success/failure paths
- [ ] `finally()` not relied upon in batch-of-chains patterns
- [ ] Callbacks don't capture large serialized objects
- [ ] `catch()` provides compensatory action, not just logging

## Common Failures
- `$this` in closures — serialization error or wrong context
- Relying on `finally()` in batch-of-chains — may never fire due to undispatched chain jobs
- No `allowFailures()` with `catch()` — first failure cancels batch, remaining jobs never run

## Decision Points
- All succeeded: `then()` fires if failed_jobs === 0
- Any failed: `catch()` fires if failed_jobs > 0
- Batch-of-chains: use `then()` + `catch()`, avoid `finally()`

## Performance Considerations
- Callbacks run in a worker and block batch completion — must be fast
- Progress callback on 10K jobs fires 10K times — can overload worker
- Callbacks are serialized closures stored in `options` column

## Related Rules
- Rule 1: no-dollar-this-in-callbacks
- Rule 2: keep-callbacks-thin
- Rule 3: prefer-then-catch-over-finally
- Rule 4: dont-rely-on-finally-for-chains

## Related Skills
- Orchestrate Parallel Job Execution with Bus::batch
- Use allowFailures for Partial Success Tolerance

## Success Criteria
Callbacks fire at the correct time with correct semantics, complex work is dispatched as separate jobs, and batch cleanup runs reliably regardless of outcome.
