# Skill: Chain Sequential Jobs with Bus::chain

## Purpose
Use `Bus::chain` to execute jobs sequentially with fail-fast semantics, ensuring each job's side effects are complete before the next one starts.

## When To Use
Dependent operations where job B requires job A's side effects (create user → send welcome email); ordered data pipelines (validate → transform → export); when partial execution is worse than no execution.

## When NOT To Use
Independent work — use `Bus::batch` for parallelism; progress tracking needed — chains have no progress callbacks; chain length > 10 jobs — consider saga pattern or workflow engine.

## Prerequisites
- Understanding of fail-fast semantics (one failure aborts all remaining)
- Jobs designed with retry considerations

## Inputs
- Ordered array of job instances
- Catch callback for failure compensation
- Per-job timeout values

## Workflow
1. Build chain: `Bus::chain([new JobA($data), new JobB($data), new JobC($data)])`
2. Add `->catch(fn(Throwable $e) => ...)` for compensatory action on failure
3. Call `->dispatch()`
4. Ensure each job in the chain is idempotent (safe to retry)
5. Set explicit `$timeout` on each job in the chain
6. Keep chain length under 5 jobs
7. Do not use chains for work that can run in parallel

## Validation Checklist
- [ ] Each chain job is idempotent
- [ ] `catch()` callback provides compensatory action (not just logging)
- [ ] Per-job `$timeout` set explicitly
- [ ] Chain length under 5 jobs
- [ ] Worker `--timeout` covers total chain duration
- [ ] Not using chain for parallelizable work

## Common Failures
- Using chains for independent work — sequential when parallel is correct
- Assuming chain rollback on failure — previous jobs' effects persist
- Worker crash breaks chain — job 1 done, job 2 never runs
- Not setting per-job timeout — worker kills chain mid-execution

## Decision Points
- Sequential dependency: use Bus::chain
- Parallel independent: use Bus::batch
- Need rollback: implement compensation in catch()

## Performance Considerations
- Chain throughput = sum of individual job times (no parallelism)
- `$chained` property carries remaining jobs serialized — overhead proportional to chain length
- Worker crash between jobs breaks chain permanently (no recovery)

## Related Rules
- Rule 1: make-chain-jobs-idempotent
- Rule 2: set-per-job-timeout-explicitly
- Rule 3: use-catch-for-compensation
- Rule 4: limit-chain-length
- Rule 5: no-chains-for-parallel-work

## Related Skills
- Orchestrate Parallel Job Execution with Bus::batch
- Batch of Chains: Combine Sequential and Parallel Patterns

## Success Criteria
Jobs execute in strict order, job B waits for job A to complete, failure of any job aborts the chain with compensation, and each job is idempotent for safe retry on worker crash.
