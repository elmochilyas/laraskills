# afterCommit — Transactional Job Dispatch

## Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** 08-async-patterns
**Knowledge Unit:** afterCommit
**Difficulty:** Intermediate
**Category:** Async Pattern
**Last Updated:** 2026-06-04

## Overview

The `afterCommit` pattern defers queued job execution until the current database transaction commits. It solves the fundamental race condition in transactional job dispatching: when a job is dispatched inside a transaction, the job may execute before the transaction commits, reading stale or missing data.

This pattern exists because Laravel's queue dispatchers are not transaction-aware by default. When you call `ProcessOrder::dispatch($order)` inside `DB::transaction()`, the job is immediately serialized and pushed to the queue. A worker can pick it up and start processing within milliseconds — potentially before the database transaction has committed. The worker queries for `$order`, finds nothing, and fails with `ModelNotFoundException`.

Engineers should care because this is the most common queue-related race condition in Laravel applications. It's intermittent, nearly impossible to reproduce in development, and manifests as mysterious job failures in production. The `afterCommit` pattern eliminates the entire class of race conditions with a single method call.

## Core Concepts

**Transaction-Aware Dispatch:** `afterCommit` tells Laravel to hold the job dispatch in memory until the current database transaction commits. If the transaction rolls back, the job is never dispatched. If the transaction commits, the job is pushed to the queue.

**No-Op Outside Transactions:** `afterCommit` has no effect when called outside a database transaction. The job dispatches immediately, exactly as if `afterCommit` were not called. This is by design — outside a transaction, there is no commit to wait for.

**Global Default Configuration:** Laravel allows setting `after_commit` to `true` at the queue connection level in `config/queue.php`. This makes every dispatch transaction-aware by default, eliminating the need to remember `->afterCommit()` on individual dispatches.

**Rollback Protection:** When a transaction rolls back, all `afterCommit` dispatches are discarded. This prevents orphaned jobs that reference data that was rolled back. Without `afterCommit`, the job would be dispatched before the rollback occurs, creating a job that operates on data that no longer exists.

**Ordering Guarantees:** Jobs dispatched with `afterCommit` within the same transaction are queued in the order they were dispatched, but only after commit. Jobs dispatched without `afterCommit` in the same transaction are queued immediately, creating an unpredictable execution order.

## When To Use

- Every dispatch inside a transaction that reads data written in that transaction
- Dispatches where the job queries the same records created or modified in the current transaction
- Systems experiencing intermittent `ModelNotFoundException` in queue jobs
- Event listeners that dispatch jobs and run inside the same transaction
- Any production queue system where data consistency is critical

## When NOT To Use

- Jobs that don't read the transaction's data (e.g., logging, analytics, external notifications that only need an ID)
- Dispatches that intentionally execute outside transaction context (e.g., audit logs that should record even on rollback)
- Jobs that need to run as early as possible and don't depend on transactional data
- Simple non-transactional dispatches (no active transaction — `afterCommit` has no effect)

## Best Practices

**Set Global Default to `true`:** Configure `after_commit => true` in `config/queue.php` for all production queue connections. This makes transactional safety the default and eliminates the need to remember `->afterCommit()` on every dispatch.

**Validate Before Transaction:** Run all input validation before the transaction starts. Validation failures inside the transaction cause rollbacks that waste the transaction and discard any `afterCommit` dispatches.

**Keep Transactions Short:** Long transactions with `afterCommit` dispatches delay job execution. Workers must wait for the transaction to commit. Keep transaction scope minimal.

**Document Exceptions:** When a dispatch intentionally skips `afterCommit` (e.g., audit logging), document the reasoning in a comment. Future developers should understand why the exception exists.

**Test Transactional Behavior:** Write tests that verify jobs wait for transaction commit. Use `DatabaseTransactions` trait and assert on job state after rollback.

**Use Consistent Strategy:** Mixing `afterCommit` and non-`afterCommit` dispatches in the same transaction creates unpredictable execution order. Use the same strategy for all dispatches in the same transaction.

## Architecture Guidelines

**Queue Connection Configuration:** Set `after_commit` at the connection level, not individual dispatch level, for consistent behavior. Override per-dispatch only when necessary.

**Transaction Scope:** The `afterCommit` behavior is tied to the outermost transaction. Nested transactions (savepoints) do not cause early dispatch.

**Event Listener Context:** When dispatching jobs from event listeners that run within the dispatching transaction, the `afterCommit` setting is inherited from the queue connection configuration.

**CLI/Queue Context:** `afterCommit` works identically in CLI and queue contexts. It references the active database transaction regardless of the execution context.

**Failed Transaction Handling:** On transaction rollback, `afterCommit` dispatches are silently discarded. There is no notification or log entry — the jobs simply don't dispatch. This is correct behavior (the job was never supposed to run), but teams should be aware of it for debugging.

## Performance Considerations

- `afterCommit` holds job serialization in memory until commit — no significant overhead for typical transactions
- Memory impact is proportional to number and size of queued jobs in the transaction — batch dispatching thousands of jobs may increase peak memory
- Job execution latency increases by the transaction duration — workers wait for commit before receiving the job
- No serialization overhead — the job is serialized once, at dispatch time, not at commit time
- Database connection is held until commit — long transactions delay `afterCommit` job processing

## Security Considerations

- Jobs dispatched with `afterCommit` are not persisted to the queue until commit — if the application crashes between dispatch and commit, the job is lost
- Rollback silently discards jobs — teams must monitor for unexpected rollbacks that may indicate lost work
- Sensitive data in serialized job properties is held in memory longer (until commit) — consider encrypting sensitive job properties
- `afterCommit` does not protect against jobs that modify data after reading committed state — idempotency is still required

## Common Mistakes

**Dispatching Without afterCommit Inside Transactions:** The most common mistake — forgetting `->afterCommit()` on a dispatch inside a transaction.

**Why developers make it:** The race condition is intermittent. Tests often pass because the transaction commits quickly. Developers don't see the failure in development.

**Consequences:** Intermittent `ModelNotFoundException` in production. Hard-to-debug failures. Customer-facing processing errors.

**Better approach:** Set `after_commit => true` globally. This eliminates the need to remember on individual dispatches.

**Misunderstanding afterCommit Outside Transactions:** Believing that `afterCommit` delays job execution when called outside a transaction.

**Why developers make it:** The name "afterCommit" sounds like it always delays. Developers don't understand the transaction context requirement.

**Consequences:** False sense of safety. Wrapping dispatches in unnecessary transactions "to make afterCommit work."

**Better approach:** Document and understand that `afterCommit` only defers inside an active transaction. Outside a transaction, it dispatches immediately.

**Validating Inside the Transaction:** Putting validation inside the queued job that runs after commit.

**Why developers make it:** Convenience — the job class already has the data.

**Consequences:** Invalid data is committed to the database. The job fails validation after commit, leaving orphaned records.

**Better approach:** Validate before the transaction. Fail fast with a user-facing error before any data is committed.

**Mixing Dispatch Strategies:** Dispatching both `afterCommit` and non-`afterCommit` jobs in the same transaction.

**Why developers make it:** Different jobs have different timing requirements. The developer doesn't consider ordering implications.

**Consequences:** Unpredictable execution order. Jobs that run before commit see stale data. Jobs after commit see committed data.

**Better approach:** Use the same strategy for all dispatches in the same transaction. Move immediate-dispatch jobs outside the transaction.

## Anti-Patterns

**Transaction for afterCommit:** Wrapping single queries in transactions solely to use `afterCommit`. Single-statement operations are atomic by nature — the transaction adds overhead without benefit. Refactor: dispatch without transaction for single-statement operations.

**False Safety:** Relying on `afterCommit` for data consistency when the job also reads data from external APIs or other databases. `afterCommit` only protects data in the current database transaction.

**Ignorant Rollback:** Not monitoring transaction rollback rates. A spike in rollbacks means `afterCommit` jobs are being silently discarded. Monitor rollback rates and alert on anomalies.

**Global afterCommit Without Exception Strategy:** Setting `after_commit => true` globally without a plan for the 5% of dispatches that should execute before commit. Define and document the exception pattern.

## Examples

### Basic afterCommit Usage
```php
DB::transaction(function () {
    $order = Order::create($validated);
    
    ProcessOrder::dispatch($order)->afterCommit();
    SendConfirmation::dispatch($order)->afterCommit();
});
```

### Global Configuration
```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'default',
        'retry_after' => 90,
        'after_commit' => true, // Global default
    ],
],
```

### Validate Before Transaction
```php
// Validation happens first
$validated = $request->validated();

DB::transaction(function () use ($validated) {
    $order = Order::create($validated);
    ProcessOrder::dispatch($order); // after_commit is true by default
});
```

### Exception for Immediate Dispatch
```php
DB::transaction(function () {
    $order = Order::create($validated);
    
    // This job must run immediately for audit compliance
    // even if the transaction rolls back
    AuditTrail::dispatch($order)->beforeCommit(); // Laravel 11+
    
    ProcessOrder::dispatch($order); // Waits for commit (global default)
});
```

## Related Topics

**Prerequisites:**
- Laravel Queue Fundamentals (ku-ads-001)
- Database Transactions
- Queue Job Dispatch Lifecycle

**Closely Related:**
- Transactional Safety Patterns
- Defer Pattern — alternative async dispatch timing
- Dispatch After Response — middleware-level dispatch timing

**Advanced Follow-Up:**
- Outbox Pattern — reliable transactional messaging without queue job in-memory holding
- Idempotency Patterns — defense against duplicate job execution
- Eventual Consistency — reasoning about state across transaction boundaries

**Cross-Domain Connections:**
- MySQL/PostgreSQL Transaction Isolation Levels
- Distributed Transactions
- Saga Pattern for multi-service transactional flows
