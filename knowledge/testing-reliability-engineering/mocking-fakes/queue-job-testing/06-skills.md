# Skill: Test Queue Job Dispatching

## Purpose
Verify that jobs are pushed to the correct queue with the right payload using `Queue::fake()` and `Bus::fake()`, ensuring job-driven workflows execute as expected without processing jobs in the test.

## When To Use
- When testing that a controller or service dispatches a specific job
- When verifying job payload (constructor arguments)
- When testing job chains or batches
- When testing job middleware (rate limiting, throttling)
- When testing conditional job dispatch logic

## When NOT To Use
- When testing the job's `handle()` method itself (test the job class directly)
- When testing the queue driver or connection (trust Laravel)
- When retry or failure logic is the focus (test `failed()` and `retryUntil()` separately)
- For testing job middleware behavior (requires processing the job — use a feature test)

## Prerequisites
- `Bus::fake()` and `Queue::fake()` facade methods
- Job class definitions
- Understanding of `assertPushed()`, `assertPushedWithChain()`, and `assertNotPushed()`

## Inputs
- Job class name and expected constructor arguments
- Queue name or connection if job targets a specific queue
- Expected chain or batch structure

## Workflow
1. Call `Bus::fake()` to prevent job dispatch and capture pushed jobs
2. Execute the action that should dispatch the job
3. Assert the job was pushed: `Bus::assertPushed(ProcessPodcast::class)`
4. Assert job payload: `Bus::assertPushed(ProcessPodcast::class, fn ($job) => $job->podcast->id === $podcast->id)`
5. Assert dispatch count: `Bus::assertPushedCount(3)`
6. For job chains: `Bus::assertChained([ProcessPodcast::class, OptimizePodcast::class])`
7. For batches: `Bus::assertBatched(fn ($batch) => $batch->name === 'Process Podcasts')`
8. Assert specific jobs were not pushed: `Bus::assertNotPushed(ProcessPodcast::class)`

## Validation Checklist
- [ ] `Bus::fake()` is called before the action
- [ ] Job class and payload are verified in assertions
- [ ] Dispatch count is asserted when multiple jobs may be pushed
- [ ] Job chains are verified if the action dispatches chains
- [ ] Jobs that should not be pushed in error scenarios are asserted
- [ ] Job batches are tested if used in the workflow

## Common Failures
- Using `Queue::assertPushed()` when the job is dispatched synchronously (use `Bus::assertPushed()`)
- Not verifying job payload — existence alone doesn't check constructor arguments
- Testing the job's handle method via dispatch assertion (test handle() directly instead)
- Forgetting to fake before the action — jobs are processed in the test
- Asserting chain structure without verifying individual job payloads

## Decision Points
- `Bus::fake()` vs `Queue::fake()` — Bus for sync dispatch, Queue for async queue testing
- `assertPushed` vs `assertPushedWithChain` — assertPushed for single jobs, assertPushedWithChain for chains
- Job payload callback vs direct assertion — callback for complex payloads, raw for simple existence

## Performance Considerations
- `Bus::fake()` has negligible overhead (<0.5ms)
- Faked jobs prevent real queue processing, keeping tests fast
- Multiple job assertions are efficient (in-memory captured job storage)

## Security Considerations
- Job payloads may contain sensitive data — ensure assertions don't log them
- Test that security-critical jobs (process refund, revoke access) are always dispatched when expected
- Verify that dispatch conditions (admin only, specific states) are enforced

## Related Rules
- [Rule: Use `Bus::fake()` for Dispatch Testing](./05-rules.md)
- [Rule: Verify Job Payload with Callbacks](./05-rules.md)
- [Rule: Test Job Chain Structure](./05-rules.md)

## Related Skills
- Event Testing
- Mail Notification Testing
- Laravel Fakes

## Success Criteria
- [ ] Every job dispatch point has a corresponding test
- [ ] Job payload assertions verify constructor arguments
- [ ] Job chains and batches are tested when used
- [ ] Conditional dispatch logic is tested for both should-push and should-not-push scenarios
