# Skill: Avoid Chain-Batch Composition Pitfalls

## Purpose
Recognize and work around the limitations of combining chains and batches — abandoned jobs, stuck batches, and callback failures — by using separate batches or explicit state checks.

## When To Use
When evaluating whether to use batch-of-chains or chain-of-batches patterns; when debugging stuck batches or weird callback behavior.

## When NOT To Use
Simple flat batches (no chains) — no limitations; when single per-chain batches suffice.

## Prerequisites
- Understanding of batch and chain failure domains
- Monitoring access to `job_batches` table

## Inputs
- Workflow structure (batch-of-chains vs chain-of-batches)
- Failure tolerance requirements

## Workflow
1. Evaluate: can this be done with separate per-chain batches instead of batch-of-chains?
2. If batch-of-chains is necessary: use `then()` + `catch()`, never `finally()`
3. If chain-of-batches: explicitly check inner batch `failedJobs` before chain advances
4. Implement watchdog: query `job_batches WHERE finished_at IS NULL AND created_at < now() - 1 hour`
5. For short sequences, flatten chains into individual batch jobs with ordering in job code
6. Test all combination failure scenarios (not just all-success and all-failure)

## Validation Checklist
- [ ] Batch-of-chains replaced with separate per-chain batches when feasible
- [ ] Chain-of-batches: inner batch state checked explicitly before advancement
- [ ] `finally()` not relied upon in batch-of-chains
- [ ] Watchdog implemented for stuck batch detection
- [ ] Mid-chain failure scenarios tested explicitly

## Common Failures
- `allowFailures()` does not prevent chain abort — chain abort is chain-internal
- Chain-of-batches with allowFailures advances on partial failure — downstream sees incomplete data
- Not testing mid-chain failure in batch — discovered in production

## Decision Points
- Simple workflow: use flat batch
- Ordered per-unit: use separate per-chain batches with coordinator
- Must coordinate across all chains: batch-of-chains with then()+catch()+watchdog

## Performance Considerations
- Batch-of-chains: all chains run concurrently (efficient)
- Chain-of-batches: serializes parallelism (outer chain waits)
- Abandoned jobs waste serialization effort

## Related Rules
- Rule 1: replace-batch-of-chains-with-separate
- Rule 2: check-inner-batch-state-explicitly
- Rule 3: prefer-flat-batches-for-short-sequences
- Rule 4: watchdog-for-unfinished-batches

## Related Skills
- Use Batch-of-Chains Pattern Safely
- Use allowFailures for Partial Success Tolerance

## Success Criteria
Chain-batch compositions work correctly for the chosen pattern, abandoned jobs don't occur from unhandled edge cases, callbacks fire as expected, and watchdog catches any stuck batches.
