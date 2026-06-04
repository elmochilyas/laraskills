# ECC Standardized Knowledge — Optimistic Locking

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | idempotency-data-consistency |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Optimistic Locking |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K006 |

## Overview (Engineering Value)
Optimistic locking prevents concurrent write conflicts in API integrations without holding database locks. Instead of locking rows, it uses a version field (integer or timestamp) that's checked before updates: if the version has changed since reading, the operation fails with a conflict error, and the caller must retry with fresh data. For API integrations, optimistic locking is used when multiple consumers (webhooks, queue jobs, API calls) may concurrently update the same resource. It's especially important for webhook processing where at-least-once delivery can cause concurrent processing of the same event.

## Core Concepts
- **Version Field**: Integer or timestamp column incremented on every update
- **Read-Check-Write**: Read version → verify unchanged → write with version increment
- **Stale Read Detection**: Update fails if version has changed since read
- **Retry on Conflict**: Caller re-reads fresh data and retries the operation
- **Lock-Free Concurrency**: No database locks held; conflicts detected on write
- **Webhook Event Ordering**: Use event sequence numbers to detect out-of-order processing

## When To Use
- Concurrent webhook processing where multiple workers may handle the same resource
- API integrations with idempotency key conflicts from concurrent requests
- Queue job processing with potential race conditions on shared state
- Any integration where concurrent reads and writes to the same record are possible

## When NOT To Use
- Single-threaded or sequential processing (no concurrency to manage)
- High-conflict scenarios where most writes fail (pessimistic locking is better)
- Simple append-only operations (no conflicts possible)

## Best Practices
- Use integer version fields, not timestamps (timestamps can have duplicate values)
- Always check version in the WHERE clause of UPDATE statements
- Combine with idempotency keys: idempotency prevents duplicates, optimistic locking prevents conflicts
- Use `updated_at` timestamps as version when integer columns are impractical
- Implement exponential backoff retry on conflict failure

## Architecture Guidelines
- Add `version` integer column to models with optimistic locking
- Use Laravel's built-in optimistic locking support via `Model::lockForUpdate()` sparingly
- For Eloquent, use `Model::where('version', $oldVersion)->update([...])`
- Handle `StaleModelLockingException` with retry logic in queue jobs
- Combine with distributed locks for critical sections

## Performance Considerations
- Optimistic locking adds zero overhead on reads (no locks)
- Write conflict detection: single extra WHERE clause condition
- Conflict retry adds full read-update cycle (50-500ms)
- Low conflict rate: negligible overhead; high conflict rate: poor performance

## Common Mistakes
- Using timestamps as version fields (clock skew, duplicate values from rapid updates)
- Not retrying on conflict errors (causes permanent failures)
- Assuming Eloquent's `update()` method checks version (it doesn't automatically)
- Combining optimistic locking with pessimistic locking (defeats the purpose)

## Related Topics
- **Prerequisites**: Database transactions, Eloquent models
- **Closely Related**: Idempotency keys (ku-01), consistency guarantees (ku-03)
- **Advanced**: Distributed optimistic locking with Redis, event versioning
- **Cross-Domain**: Concurrency control, database isolation levels

## Verification
- [ ] Version field present on all concurrently-writable models
- [ ] UPDATE WHERE version = :oldVersion pattern used
- [ ] Conflict detection triggers retry with backoff
- [ ] Webhook event processing handles out-of-order events via sequence numbers
