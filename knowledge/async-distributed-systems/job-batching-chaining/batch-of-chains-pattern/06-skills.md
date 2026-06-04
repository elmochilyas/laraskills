# Skill: Use Batch-of-Chains Pattern Safely

## Purpose
Combine parallel batch execution with sequential chains within each unit, avoiding the `finally()` never-fires bug by using `then()` + `catch()` and watchdog monitoring.

## When To Use
Multi-step pipelines where each unit is independent but steps within a unit are sequential; parallel processing of ordered workflows.

## When NOT To Use
When `finally()` is required for critical post-processing (unreliable); when any chain could have mid-chain failures; production-critical workflows without watchdog monitoring.

## Prerequisites
- Understanding of `finally()` edge case with mid-chain failure
- Monitoring for stuck batches in place

## Inputs
- Array of chains (each chain is an array of jobs)
- Success and failure callbacks

## Workflow
1. Build batch of chains: `Bus::batch([[$a1, $a2], [$b1, $b2]])`
2. Add `->then(fn(Batch $b) => ...)` for all-success path
3. Add `->catch(fn(Batch $b, Throwable $e) => ...)` for failure path
4. Do NOT rely on `finally()` — it never fires if mid-chain failure leaves jobs undispatched
5. Implement watchdog for stuck batches: query `job_batches` where `finished_at IS NULL AND created_at < now() - 1 hour`
6. Consider separate batches per chain instead of batch-of-chains
7. Keep chain length within batch to 2-3 jobs

## Validation Checklist
- [ ] `then()` + `catch()` used instead of `finally()`
- [ ] Watchdog implemented for stuck batch detection
- [ ] Chain length limited to 2-3 jobs per chain
- [ ] Mid-chain failure scenario tested explicitly
- [ ] Separate per-chain batches considered as alternative

## Common Failures
- Using `finally()` for critical post-processing — never fires on mid-chain failure
- Assuming `allowFailures()` fixes the `finally()` bug — chain abort is chain-internal
- Not testing mid-chain failure scenario — discovered in production
- No watchdog — stuck batches accumulate silently

## Decision Points
- Need reliable post-processing: use separate per-chain batches instead
- Need coordination across all chains: batch-of-chains with `then()` + `catch()` + watchdog

## Performance Considerations
- Efficient for parallel pipelines — all chains run concurrently
- Abandoned jobs waste serialization effort
- Stuck batches not pruned by normal cleanup

## Related Rules
- Rule 1: use-then-catch-not-finally
- Rule 2: implement-stuck-batch-watchdog
- Rule 3: prefer-separate-batches-over-chains
- Rule 4: limit-chain-length-in-batches

## Related Skills
- Orchestrate Parallel Job Execution with Bus::batch
- Chain Sequential Jobs with Bus::chain

## Success Criteria
All chains execute concurrently, sequential ordering within each chain is maintained, `then()`/`catch()` fire correctly, `finally()` isn't relied upon, and watchdog catches any stuck batches.
