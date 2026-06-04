# afterCommit — Transactional Job Dispatch

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Async Patterns
- **Knowledge Unit:** afterCommit
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
The `afterCommit` pattern defers queued job execution until the current database transaction commits, solving the fundamental race condition where a job executes before the transaction commits and reads stale or missing data. Laravel's queue dispatchers are not transaction-aware by default — calling `ProcessOrder::dispatch($order)` inside `DB::transaction()` immediately pushes the job to the queue, and a worker can pick it up within milliseconds before the transaction commits. This is the most common queue-related race condition in Laravel: intermittent, nearly impossible to reproduce in development, manifesting as mysterious `ModelNotFoundException` in production.

---

## Core Concepts
- **Transaction-Aware Dispatch**: Holds job dispatch in memory until the database transaction commits — if it rolls back, the job is never dispatched
- **No-Op Outside Transactions**: `afterCommit` has no effect when called outside a transaction — the job dispatches immediately as if `afterCommit` were not called
- **Global Default Configuration**: Set `after_commit => true` at the queue connection level in `config/queue.php` to make every dispatch transaction-aware by default
- **Rollback Protection**: When a transaction rolls back, all `afterCommit` dispatches are silently discarded — prevents orphaned jobs referencing rolled-back data
- **Ordering Guarantees**: Jobs dispatched with `afterCommit` within the same transaction are queued in dispatch order, but only after commit; mixing `afterCommit` and non-`afterCommit` dispatches creates unpredictable execution order

---

## Mental Models
1. **afterCommit as a Bouncer**: The job is like a customer waiting outside a club. The transaction is the bouncer. Until the bouncer says "transaction committed" (by finishing successfully), the customer doesn't enter the club (queue). If the bouncer says "transaction rolled back" (the night is canceled), the customer goes home — the job is never dispatched. This prevents the awkward situation where a customer enters an empty club.
2. **afterCommit as a Queue Holding Pen**: Jobs sit in an in-memory holding pen until the transaction commits. When the commit happens, the pen opens and all jobs queue up in order. If the transaction rolls back, the pen is emptied — no trace, no notification. The holding pen has zero serialization overhead — jobs are serialized once at dispatch time, not at commit time.

---

## Internal Mechanics
When `->afterCommit()` is called on a dispatch, Laravel sets a flag on the pending dispatch. During transaction commit, the framework checks if there are pending `afterCommit` callbacks registered via the `AfterCommit` trait. If found, the job serialization (already completed at dispatch time) is pushed to the queue driver. If the transaction rolls back, the registered callbacks are discarded. The transaction scope is determined by the outermost transaction — nested savepoints do not trigger early dispatch.

---

## Patterns
### Global Default with Specific Exceptions
- **Purpose**: Make transactional safety the default while allowing opt-out for specific jobs
- **Mechanism**: Set `after_commit => true` at the queue connection level; use `->beforeCommit()` (Laravel 11+) for immediate dispatch exceptions
- **Benefits**: Consistent behavior across all dispatches; no mental overhead remembering `afterCommit`

### Validate-Before-Transaction Flow
- **Purpose**: Avoid rollbacks caused by validation failures that would discard `afterCommit` jobs
- **Mechanism**: Run all input validation before starting the transaction; use validated data inside the transaction
- **Benefits**: Fewer wasted transactions; no silent job discarding from validation failures

---

## Architectural Decisions
- **Set global `after_commit => true`** for all production queue connections — eliminates the most common queue race condition globally
- **Document all `->beforeCommit()` exceptions** with inline comments explaining why immediate dispatch is necessary
- **Monitor transaction rollback rates** — a spike in rollbacks means `afterCommit` jobs are being silently discarded

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates transaction race condition | Delays job execution until commit | Workers wait for transaction duration |
| Rollback protection (no orphaned jobs) | Jobs silently discarded on rollback | Teams must monitor rollback rates |
| No-op outside transactions (safe by default) | Mental model confusion — "why isn't it delaying?" | Educate team on transaction dependency |

---

## Performance Considerations
`afterCommit` holds job serialization in memory until commit — minimal overhead for typical transactions. Memory impact is proportional to number and size of queued jobs in the transaction. Job execution latency increases by the transaction duration — workers wait for commit. No serialization overhead (job serialized once at dispatch time, not at commit time).

---

## Production Considerations
Set global `after_commit => true` in `config/queue.php`. Use `->beforeCommit()` in Laravel 11+ for exceptions. Validate before the transaction. Keep transactions short. Monitor rollback rates. Test transactional behavior with `DatabaseTransactions` trait, asserting job state after rollback.

---

## Common Mistakes
1. **Dispatching without afterCommit inside transactions**: Most common — intermittent `ModelNotFoundException` in production. Fix: set global default to `true`.
2. **Misunderstanding afterCommit outside transactions**: Believing it delays when no transaction is active. Remember: no-op outside transactions.
3. **Validating inside the transaction**: Validation failure causes rollback, silently discarding jobs. Always validate before the transaction.
4. **Mixing dispatch strategies**: Unpredictable execution order. Use the same strategy for all dispatches in the same transaction.

---

## Failure Modes
- **Application crash between dispatch and commit**: Job is lost because it was held in memory, not persisted to the queue
- **Rollback silently discards jobs**: No notification or log entry — monitoring rollback rates is essential
- **Long transactions delay jobs**: Workers sit idle waiting for commit; optimize transaction duration

---

## Ecosystem Usage
Available in all Laravel queue connections (database, redis, SQS, etc.). Controlled by `after_commit` connection-level config in `config/queue.php`. Per-dispatch override via `->afterCommit()` and in Laravel 11+, `->beforeCommit()`. Works identically in CLI and queue contexts — references the active database transaction regardless of execution context.

---

## Related Knowledge Units
### Prerequisites
- Queue Driver Architecture — Dispatch lifecycle and serialization
- Database Transactions — Transaction scope, commit, rollback

### Related Topics
- Defer Pattern — Alternative async dispatch timing
- Dispatch After Response — Middleware-level dispatch timing
- Outbox Pattern — Reliable transactional messaging without in-memory holding

### Advanced Follow-up Topics
- Idempotency Patterns — Defense against duplicate job execution
- Eventual Consistency — Reasoning about state across transaction boundaries
