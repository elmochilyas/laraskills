# Skill: Implement afterCommit for Transactional Job Dispatching

## Purpose
Ensure queued jobs only execute after the current database transaction commits, preventing race conditions where jobs read stale or missing data.

## When To Use
- Every dispatch inside a database transaction where the job reads data written in that transaction
- Production queue systems with any data consistency requirements
- Applications experiencing intermittent `ModelNotFoundException` in job processing

## When NOT To Use
- Jobs that intentionally run before commit (audit logs, monitoring)
- Dispatches outside transaction context (afterCommit has no effect)
- Simple jobs that don't read transaction data (can dispatch immediately)

## Prerequisites
- Laravel queue configured with Redis, SQS, or database driver
- Understanding of database transaction boundaries
- Supervisor or Horizon for queue worker management

## Inputs
- Job classes dispatched within database transactions
- Queue connection configuration
- Transaction boundary locations

## Workflow
1. **Set global default.** Configure `after_commit => true` in `config/queue.php` for each queue connection. This eliminates the need to remember `->afterCommit()` on every dispatch.

2. **Validate before transaction.** Move all input validation before the `DB::transaction()` call. Validation failures should never cause a transaction rollback.

3. **Identify transaction boundaries.** Determine where `DB::transaction()` or `DB::beginTransaction()` is called. Every dispatch inside these blocks is a candidate for afterCommit.

4. **Add afterCommit to individual dispatches** (if global default is not set). Chain `->afterCommit()` on `dispatch()` calls inside transactions: `ProcessOrder::dispatch($order)->afterCommit()`.

5. **Handle exceptions explicitly.** For the rare cases where a job must dispatch before commit, use `->beforeCommit()` (Laravel 11+) or move the dispatch outside the transaction block.

6. **Monitor rollback rates.** Track transaction rollback frequency. Rollbacks silently discard afterCommit dispatches. Alert on rollback anomalies.

7. **Test transactional behavior.** Write tests that use `DatabaseTransactions` and assert on job state when the transaction rolls back vs commits.

## Validation Checklist
- [ ] `after_commit` set to `true` in queue connection config
- [ ] Input validation placed before transaction boundaries
- [ ] No dispatches inside transactions without afterCommit (unless intentional)
- [ ] Exception cases documented with reasoning
- [ ] Rollback monitoring in place
- [ ] Test verifies job waits for commit
- [ ] Test verifies job is not dispatched on rollback

## Common Failures
- **Forgotten afterCommit.** Setting global default solves this permanently.
- **Validation inside transaction.** Moving validation before the transaction fixes it.
- **Unnecessary transactions for afterCommit.** Single-statement operations don't need transactions.
- **Mixed dispatch strategies.** Using the same default for all dispatches avoids ordering issues.

## Decision Points
- **Global default vs per-dispatch?** Global default (recommended) for consistent safety; per-dispatch when most dispatches need afterCommit but a few don't.
- **afterCommit vs beforeCommit?** afterCommit for standard transactional safety; beforeCommit for audit/diagnostic jobs that must run even on rollback.
- **afterCommit vs outbox pattern?** afterCommit for simple single-database transactions; outbox pattern for distributed or multi-database transactional messaging.

## Performance Considerations
- Normal: negligible overhead — job held in memory until commit
- Peak: memory proportional to size of serialized jobs in the transaction
- Latency: job execution delayed by transaction duration

## Security Considerations
- afterCommit jobs are not persisted until commit — crash between dispatch and commit loses the job
- Rollback silently discards jobs — monitor transaction health
- Serialized job data held in memory longer — encrypt sensitive job properties

## Related Rules
- Rule: Always use afterCommit when the job depends on data written in the current transaction (05-rules.md)
- Rule: Always validate data before the transaction (05-rules.md)
- Rule: Understand that afterCommit dispatches immediately when no transaction is active (05-rules.md)

## Related Skills
- Configure Queue Connections for Transactional Safety
- Implement Outbox Pattern for Reliable Messaging
- Monitor Queue Job Failures

## Success Criteria
Jobs always wait for transaction commit. No race conditions between transaction commit and job processing. Rollback protection ensures orphaned jobs are never dispatched.
