# Skill: Use Defer Pattern for Batched Post-Response Work

## Purpose
Use `Bus::defer()` (Laravel 12+) to collect multiple closures that execute together after the HTTP response is sent, in FIFO order, within the same request lifecycle.

## When To Use
Collecting and flushing multiple post-response tasks in sequence; log aggregation (accumulate during request, flush as batch); metric collection; tiered post-response work with ordering; replacing manual terminating middleware.

## When NOT To Use
Work needing retry guarantees (no persistence); work that must survive process crashes; work > 1 second total; work needing parallelism (sequential execution); Octane or Roadrunner; single post-response task (`dispatchAfterResponse` is simpler).

## Prerequisites
- Laravel 12+
- PHP-FPM with terminating callback support

## Inputs
- Closures or job instances for deferred execution
- Exception handler for cancellation logic

## Workflow
1. Add deferred callbacks: `Bus::defer(fn () => Metrics::flush())`
2. Multiple calls accumulate into the same batch
3. Callbacks run in FIFO order during kernel termination
4. Call `Bus::defer()->cancel()` in exception/error handlers if request fails
5. Keep each callback idempotent (process may crash mid-batch)
6. Keep total batch time < 1 second
7. Log at start and end of deferred batch for visibility
8. Never defer crash-critical operations

## Validation Checklist
- [ ] Total batch time < 1 second
- [ ] Callbacks idempotent
- [ ] `cancel()` called in exception/error handlers
- [ ] Logging at batch start/end
- [ ] Not used for crash-critical work
- [ ] No queue dependency (deferred, not queued)
- [ ] FIFO ordering verified
- [ ] Error isolation — one failure doesn't stop others
- [ ] Not used in Octane/Roadrunner
- [ ] For single task: `dispatchAfterResponse` is simpler

## Common Failures
- Assuming async parallelism — all callbacks run sequentially in one thread
- Relying on destructor execution — may not run in all SAPIs or during fatal errors
- Forgetting `cancel()` on failure — callbacks operate on invalid state
- Deferring slow work — blocks PHP-FPM child, reduces throughput
- Using as queue replacement — loses retry, persistence, monitoring

## Decision Points
- Single trivial task: `dispatchAfterResponse`
- Multiple grouped tasks: `Bus::defer()`
- Durable work: queue dispatch
- Octane/Roadrunner: queue dispatch only

## Related Rules
- Rule 1: use-defer-for-response-time-sensitivity
- Rule 2: never-defer-crash-critical-operations
- Rule 3: keep-deferred-callbacks-fast
- Rule 4: use-defer-for-dispatch-after-response-replacement

## Related Skills
- Use `dispatchAfterResponse` for Post-Response Tasks
- Use `dispatchIf`/`dispatchUnless` for Conditional Dispatch
- Use `afterCommit` for Transactional Dispatch Safety

## Success Criteria
Deferred batches collect multiple callbacks, execute in FIFO order post-response, cancel on request failure, stay under 1 second, and provide error isolation.
