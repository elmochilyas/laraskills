# Optimistic Locking — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Idempotency
- **Knowledge Unit:** Optimistic Locking
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand database transactions and isolation levels
- [ ] Familiarity with Eloquent models and concurrency control
- [ ] Knowledge of `StaleModelLockingException` handling

## Implementation Checklist
- [ ] Version field present on all concurrently-writable models
- [ ] `UPDATE WHERE version = :oldVersion` pattern used
- [ ] Conflict detection triggers retry with backoff
- [ ] Webhook event processing handles out-of-order events via sequence numbers
- [ ] Integer version fields used, not timestamps
- [ ] Optimistic locking combined with idempotency keys

## Verification Checklist
- [ ] Concurrent webhook workers do not cause data corruption
- [ ] Queue job race conditions prevented on shared state
- [ ] Retry on conflict with exponential backoff implemented

## Security Checklist
- [ ] Stale read detection prevents lost updates
- [ ] Lock-free concurrency (no database locks held)
- [ ] Webhook event ordering via sequence numbers

## Performance Checklist
- [ ] Optimistic locking adds zero overhead on reads (no locks)
- [ ] Write conflict detection: single extra WHERE clause condition
- [ ] Conflict retry adds full read-update cycle (50-500ms)

## Production Readiness Checklist
- [ ] Laravel's built-in optimistic locking via `Model::lockForUpdate()` used sparingly
- [ ] For Eloquent, `Model::where('version', $oldVersion)->update([...])` pattern
- [ ] `StaleModelLockingException` handled with retry logic in queue jobs
- [ ] Combined with distributed locks for critical sections

## Common Mistakes to Avoid
- [ ] Avoid using timestamps as version fields (clock skew, duplicate values)
- [ ] Avoid not retrying on conflict errors (causes permanent failures)
- [ ] Avoid assuming Eloquent's `update()` checks version automatically
- [ ] Avoid combining optimistic with pessimistic locking (defeats purpose)
