# Skill: Test Job Dispatch Behavior with Queue::fake()

## Purpose
Write unit tests that verify jobs are dispatched with the correct data, queue, and connection without executing them, using `Queue::fake()` and `Bus::fake()`.

## When To Use
When testing that jobs are dispatched correctly in response to application actions. Separate dispatch verification from job logic testing.

## When NOT To Use
Integration tests that need the full serialization pipeline; testing job logic (use `dispatchSync()` instead); testing closure serialization.

## Prerequisites
- PHPUnit or Pest configured
- Laravel testing environment
- Understanding of ShouldQueue and dispatch patterns

## Inputs
- Job class(es) under test
- Dispatch conditions and expected data
- Queue routing expectations (which queue/connection)

## Workflow
1. Call `Queue::fake()` before the action under test
2. Execute the action that should dispatch the job
3. Assert with `Queue::assertPushed(JobClass::class)`
4. For precise matching, use callback assertions: `assertPushed(fn($job) => $job->orderId === 123)`
5. For queue routing: use `assertPushedOn('queue-name', Job::class)`
6. For batches/chains: use `Bus::fake()` and `Bus::assertBatchDispatched()`
7. For negative assertions: `Queue::assertNotPushed(JobClass::class)`
8. Clean up fakes between tests in `tearDown()`

## Validation Checklist
- [ ] `Queue::fake()` called before action, not after
- [ ] Callback assertions used for data-specific matching
- [ ] Queue routing verified with `assertPushedOn()`
- [ ] `Bus::fake()` used for batch/chain assertions
- [ ] Fakes cleaned up between tests
- [ ] Job logic tested separately with `dispatchSync()` (not with `Queue::fake()`)
- [ ] Tests pass deterministically without real queue backend

## Common Failures
- `Queue::fake()` not called before action — assertions miss jobs
- Using `assertPushed()` with closures — use `CallQueuedClosure::class`
- Testing job logic with fake active — job never runs, test passes vacuously
- Missing `Bus::fake()` for batches — `Queue::fake()` doesn't capture Bus

## Decision Points
- For data-specific asserts: use callback assertions over class-name-only
- For batch assertions: use `Bus::fake()` not `Queue::fake()`

## Performance Considerations
- `Queue::fake()` stores all jobs in memory — large dispatches increase memory
- Each assertion filters the entire pushed array — O(n) per assertion

## Security Considerations
- Fakes don't serialize jobs — real serialization issues not caught
- Supplement with integration tests that use real queue backend

## Related Rules
- Rule 1: queue-fake-before-action
- Rule 2: prefer-callback-assertions
- Rule 3: never-test-logic-with-fake
- Rule 4: use-bus-fake-for-batches
- Rule 5: cleanup-fakes-between-tests
- Rule 6: assert-pushed-on-queue

## Related Skills
- Test Job Logic with dispatchSync()
- Test Batch and Chain Dispatches

## Success Criteria
Tests reliably verify correct dispatch behavior (class, data, queue, connection) without executing jobs, catching regressions in dispatch routing and conditional logic.
