# Skill: Prevent Concurrent Job Execution with WithoutOverlapping

## Purpose
Use `WithoutOverlapping` middleware to prevent concurrent execution of the same job for the same entity, using cache-based locking with proper key scoping and backoff.

## When To Use
Jobs that mutate shared state (billing, file processing, data sync); resource-limited operations; when concurrent execution would corrupt data.

## When NOT To Use
Read-only jobs (overlapping reads are safe); jobs with idempotent side effects (idempotency handles duplicates more gracefully); jobs that dispatch other instances of themselves on the same key (will deadlock).

## Prerequisites
- Cache driver with atomic lock support (Redis, Memcached, Database — NOT array or file)
- Understanding of job execution time (p99) for expireAfter calculation

## Inputs
- Entity identifier for lock key scoping (e.g., order ID, user ID, file path)
- Job p99 execution time
- Acceptable backoff delay on contention

## Workflow
1. Import: `use Illuminate\Queue\Middleware\WithoutOverlapping;`
2. In `middleware()`: `return [(new WithoutOverlapping(5))->byKey(fn($job) => $job->order->id)]`
3. Add `->releaseAfter(10)` to set backoff delay on contention
4. Add `->expireAfter(120)` to set lock TTL (2x p99 execution time)
5. Verify cache driver supports atomic locks
6. Never use with array or file cache drivers

## Validation Checklist
- [ ] Lock scoped per entity with `byKey()` (not global class-name lock)
- [ ] `releaseAfter` set to 5-30 seconds (not default 0)
- [ ] `expireAfter` set to at least 2x job p99 execution time
- [ ] Cache driver supports atomic locks (Redis, Memcached, Database)
- [ ] Not using with array or file cache driver

## Common Failures
- Not scoping with `byKey()` — all instances of the job class serialize
- No `releaseAfter` (default 0) — tight retry loop burns CPU
- `expireAfter` shorter than job duration — lock expires, second instance overlaps
- Using with `array` cache — no atomic lock support, overlapping occurs silently

## Decision Points
- Per-entity lock: use `byKey(fn($job) => $job->entityId)`
- Global singleton: use default (no byKey)

## Performance Considerations
- Lock acquisition: ~1-5ms per cache operation
- Multiple overlapping attempts on the same key create lock contention
- Lock entries persist for `expireAfter` seconds

## Related Rules
- Rule 1: always-scope-by-key
- Rule 2: set-release-after-backoff
- Rule 3: expire-after-twice-p99
- Rule 4: use-atomic-lock-cache-driver

## Related Skills
- Prevent Duplicate Job Dispatches with ShouldBeUnique
- Add RateLimited Middleware to Jobs

## Success Criteria
Jobs for the same entity never execute concurrently, blocked jobs back off with configured delay, lock auto-releases if the job crashes, and throughput for different entities is unaffected.
