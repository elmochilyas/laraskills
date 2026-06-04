# Skill: Use afterCommit for Transactional Dispatch Safety

## Purpose
Configure and apply `afterCommit` to prevent queued jobs from executing before the database transaction that created their data has committed, eliminating transaction-visibility race conditions.

## When To Use
Any job dispatched inside a database transaction that reads data written by that transaction; model creation workflows where worker needs to find newly created records; as global default for all queue connections.

## When NOT To Use
Non-transactional side effects (cache counters, logging); audit logs that must survive rollback; jobs that must execute immediately regardless of transaction state.

## Prerequisites
- Database transactions used in dispatch context
- Laravel 10+ (available); Laravel 11+ (global default)

## Inputs
- Global default setting: `queue.after_commit` config
- Individual disposition: `->afterCommit()` or `->afterCommit(false)`

## Workflow
1. Set `'after_commit' => true` in `config/queue.php` for each connection
2. Dispatches inside `DB::transaction()` are deferred until commit
3. Worker always reads committed data from the database
4. On transaction rollback, the dispatch is silently discarded
5. For immediate dispatch inside a transaction, use `->afterCommit(false)`
6. Combine with `dispatchAfterResponse` for both transactional and response timing
7. Monitor dispatch delays to detect slow transactions

## Validation Checklist
- [ ] Global `queue.after_commit` set to `true`
- [ ] `->afterCommit(false)` used explicitly for non-transactional dispatches
- [ ] Rollback discards deferred jobs (verified in tests)
- [ ] Nested transactions wait for outermost commit (tested)
- [ ] Dispatch delay gap monitored (time between registration and push)
- [ ] Combined with `dispatchAfterResponse` when both guarantees needed
- [ ] `Bus::chain()` with `afterCommit` defers entire chain (not individual jobs)

## Common Failures
- Assuming `afterCommit` works without an active transaction — dispatches immediately
- Expecting savepoint rollback to discard jobs — only outermost commit triggers dispatch
- Mixing with `Bus::chain()` — entire chain deferred, not individual jobs
- Long transactions delay critical time-sensitive dispatches

## Decision Points
- Global default `true`: safest for most applications
- Explicit override: use `afterCommit(false)` for audit logs, non-transactional work
- Combine with `dispatchAfterResponse`: when both transactional + response timing required

## Related Rules
- Rule 1: enable-global-after-commit-default
- Rule 2: use-explicit-after-commit-false-for-immediate-dispatch
- Rule 3: test-rollback-scenarios
- Rule 4: monitor-dispatch-delays
- Rule 5: understand-nested-transaction-semantics

## Related Skills
- Use dispatchAfterResponse for Post-Response Processing
- Use dispatchIf/dispatchUnless for Conditional Dispatch
- Implement Idempotency for Side-Effect Jobs

## Success Criteria
`afterCommit` is enabled globally, jobs inside transactions are deferred until commit, rollbacks discard pending dispatches, workers always see committed data, and dispatch delays are monitored.
