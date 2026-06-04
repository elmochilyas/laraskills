# Anti-Patterns — Optimistic Locking

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | idempotency-data-consistency |
| Knowledge Unit | Optimistic Locking |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Timestamp Version Field Collision
2. Application-Level Version Check (TOCTOU)
3. No Retry on Version Conflict
4. Optimistic Locking Under High Contention
5. Missing Event Sequence Ordering

---

## 1. Timestamp Version Field Collision

### Category
Reliability

### Description
Using `updated_at` timestamps as the optimistic locking version field instead of an integer counter, causing false conflicts or missed conflicts under rapid concurrent updates.

### Why It Happens
Timestamps are already present on every Eloquent model (`created_at`, `updated_at`). Using them avoids a schema migration to add a `version` column. The developer assumes timestamps have sufficient precision (MySQL datetime2 has fractional seconds). Under sub-second concurrent writes, two updates within the same millisecond produce the same timestamp value, and the version check passes incorrectly.

### Warning Signs
- `updated_at` used as version in optimistic locking WHERE clause
- Sub-second concurrent writes to the same record
- Lost updates detected despite "locking"
- Timestamp collisions in logs (same microsecond value)

### Why Harmful
When two concurrent updates happen within the same timestamp resolution window, both updates read the same `updated_at` value. The first update increments `updated_at` but the second update's WHERE clause `WHERE updated_at = :old` still matches because the new timestamp is the same (within precision limits). The second update silently overwrites the first update's changes — the classic lost update problem. The optimistic locking provides zero protection.

### Consequences
- Lost updates from sub-second concurrent writes
- Silent data corruption despite optimistic locking
- False confidence in concurrent write protection
- Intermittent, hard-to-reproduce bugs

### Alternative
Use an integer `version` column that is atomically incremented in the UPDATE statement, guaranteeing monotonic uniqueness.

### Refactoring Strategy
1. Add `$table->unsignedInteger('version')->default(1)` migration
2. Replace `WHERE updated_at = :old` with `WHERE version = :oldVersion`
3. Set `version = version + 1` in the UPDATE SET clause
4. Check `$affected > 0` to detect conflict
5. Remove old timestamp-based version checking

### Detection Checklist
- [ ] Integer version column used instead of timestamp
- [ ] Version atomically incremented in UPDATE
- [ ] No timestamp-based version checks remaining
- [ ] Concurrent updates correctly detect conflicts

### Related Rules
Use Integer Version Fields, Not Timestamps

### Related Skills
Use Optimistic Locking for Concurrent Idempotent Operations

### Related Decision Trees
Version Field Selection (Integer vs Timestamp)

---

## 2. Application-Level Version Check (TOCTOU)

### Category
Reliability

### Description
Comparing the version field at the application level before calling `update()` instead of including the version check in the UPDATE WHERE clause, creating a time-of-check-to-time-of-use vulnerability.

### Why It Happens
The natural flow is: load the model, check if version matches, then call `$model->update()`. This looks correct in sequential code — the version is checked before updating. The developer doesn't realize that between the PHP check and the SQL UPDATE, another process can modify the record and change the version. The version check is disconnected from the atomic UPDATE.

### Warning Signs
- Version comparison in PHP if-statement before `update()` call
- No version condition in UPDATE WHERE clause
- Concurrent writes to same record cause lost updates despite version check
- `$affected` rows not checked after `update()`

### Why Harmful
Two concurrent requests both load version=1. Both pass the PHP version check. Both call `update()`. Neither WHERE clause filters by version. The second update overwrites the first. This is identical to having no optimistic locking at all — the application check provides no concurrent write protection because the race window is between the PHP check and the SQL UPDATE.

### Consequences
- Lost updates despite application-level version checks
- False sense of concurrent write protection
- Data corruption under concurrent access
- Race conditions invisible in single-threaded testing

### Alternative
Include the version check in the UPDATE WHERE clause atomically: `Model::where('id', $id)->where('version', $oldVersion)->update(...)`.

### Refactoring Strategy
1. Remove application-level version comparison if-statements
2. Add `where('version', $oldVersion)` to the UPDATE query
3. Increment version in SET clause: `'version' => DB::raw('version + 1')`
4. Check `$affected === 0` to detect conflict
5. Throw `StaleModelLockingException` on conflict

### Detection Checklist
- [ ] Version check in UPDATE WHERE clause, not application logic
- [ ] Version atomically incremented in SET
- [ ] No pre-update version comparison in PHP
- [ ] Conflict detected by affected rows, not pre-check

### Related Rules
Always Check Version in UPDATE WHERE Clause

### Related Skills
Use Optimistic Locking for Concurrent Idempotent Operations

### Related Decision Trees
Locking Strategy (Optimistic vs Pessimistic)

---

## 3. No Retry on Version Conflict

### Category
Reliability

### Description
Throwing a permanent failure exception on version conflict instead of retrying with fresh data, turning predictable concurrent access conflicts into application errors.

### Why It Happens
The conflict exception (`StaleModelLockingException`) is treated like a bug rather than expected behavior. The developer catches it and logs an error or returns a 500 response, assuming conflicts are rare anomalies. Under concurrent access, conflicts are normal and expected — without retry, every conflict becomes a permanent failure.

### Warning Signs
- `StaleModelLockingException` or version conflict results in 500 or exception
- No retry logic around optimistic locking operations
- Queue jobs fail permanently on version conflict
- Production incidents from "unexpected" conflicts under concurrent load

### Why Harmful
Optimistic locking detects conflicts but does not resolve them. Without retry, every concurrent access conflict becomes a permanent failure. A webhook that arrives during a concurrent update fails permanently. A queue job that processes a record being modified by another job fails and releases without retrying. The optimistic locking mechanism designed to enable concurrent processing instead causes failures.

### Consequences
- Permanent failures from normal concurrent access
- Queue jobs exhausted on version conflict
- Reduced availability under concurrent load
- Support incidents for "processing failures"

### Alternative
Implement retry with exponential backoff on version conflict: re-read fresh data and re-apply the operation.

### Refactoring Strategy
1. Wrap optimistic locking operation in retry loop (3 attempts)
2. On conflict ($affected === 0): re-read fresh model from database
3. Re-apply operation logic to new version
4. Add exponential backoff between retries
5. Log conflict for monitoring without creating errors

### Detection Checklist
- [ ] Retry loop around optimistic locking operations
- [ ] Fresh data re-read on conflict
- [ ] Exponential backoff between retries
- [ ] Conflicts logged for monitoring, not as errors

### Related Rules
Retry on Version Conflict with Backoff

### Related Skills
Use Optimistic Locking for Concurrent Idempotent Operations

### Related Decision Trees
Conflict Resolution Strategy (Retry vs Fail)

---

## 4. Optimistic Locking Under High Contention

### Category
Performance

### Description
Using optimistic locking in high-conflict scenarios (>5% write conflict rate) where most writes fail and must retry, causing excessive retries and poor performance.

### Why It Happens
Optimistic locking is the default recommendation because it works well for most webhook and queue job scenarios where conflicts are rare. The developer applies it uniformly without measuring the actual conflict rate. A frequently updated counter, a hot row in a leaderboard, or a popular product's stock count may have 50%+ conflict rates, where every other write retries.

### Warning Signs
- Conflict rate measured >5% of writes
- Excessive retries observed in logs
- Operations take longer due to repeated retry cycles
- High CPU/database load from retry traffic
- Users experience delays on concurrent operations

### Why Harmful
Under high contention, optimistic locking degenerates: most write attempts fail and retry, each retry re-reads the data, re-computes the business logic, and re-attempts the update. A simple stock decrement operation may require 3-5 attempts, each consuming database resources and adding latency. The optimistic approach becomes slower than pessimistic locking, which serializes writes with a single database lock.

### Consequences
- Excessive retries causing high latency
- Database load amplified by retry traffic
- Poor user experience under concurrent access
- Optimistic locking becomes slower than no locking

### Alternative
Use pessimistic locking (row-level locks via `lockForUpdate()`) for high-contention resources, or use queue-based serialization.

### Refactoring Strategy
1. Measure conflict rate per resource (via logging or metrics)
2. For resources with >5% conflict rate, switch to pessimistic locking
3. Use `Model::lockForUpdate()` within a database transaction
4. Or serialize writes via queue (single worker for specific resource)
5. Monitor latency and conflict rate after switch

### Detection Checklist
- [ ] Conflict rate measured per resource
- [ ] High-contention resources identified
- [ ] Alternative locking strategy used for >5% conflict rate
- [ ] Latency acceptable under concurrent access

### Related Rules
Use Integer Version Fields, Not Timestamps

### Related Skills
Use Optimistic Locking for Concurrent Idempotent Operations

### Related Decision Trees
Locking Strategy (Optimistic vs Pessimistic)

---

## 5. Missing Event Sequence Ordering

### Category
Reliability

### Description
Processing webhook events without tracking sequence numbers, allowing out-of-order or stale events to overwrite newer data (lost update).

### Why It Happens
Webhook delivery is at-least-once but not necessarily in-order — providers may deliver events out of sequence due to retries, network issues, or parallel delivery. The developer processes each event as it arrives without checking whether it's newer or older than the last processed event. Optimistic locking only prevents concurrent overwrites but doesn't help with temporal ordering.

### Warning Signs
- Webhook events processed without sequence number tracking
- Stale event overwrites newer data in production
- Rollbacks observed after delayed webhook delivery
- No `last_sequence` or `last_event_id` tracking per resource

### Why Harmful
A webhook provider sends event E5 (customer updated name) first, then E3 arrives 30 seconds late due to a retry. Without sequence checking, E3's older data overwrites E5's newer data. The customer's name reverts to the old value. Optimistic locking doesn't prevent this because E3 has a newer timestamp (its retry) and a different version context. The stale event causes a silent data rollback.

### Consequences
- Stale webhook events overwrite newer data
- Silent data rollback from out-of-order delivery
- Customer data corruption from delayed events
- Debugging difficulty due to non-reproducible order

### Alternative
Track the last processed event sequence number per resource and reject events with sequence <= last processed.

### Refactoring Strategy
1. Create a `webhook_event_tracker` table or column for `last_sequence` per resource
2. Extract sequence number from each webhook event payload
3. Compare sequence against last processed before applying update
4. Reject stale events (sequence <= last) with 200 acknowledgment
5. Update `last_sequence` atomically with the data update

### Detection Checklist
- [ ] Sequence numbers tracked per resource
- [ ] Stale event detection before processing
- [ ] Out-of-order events rejected safely
- [ ] No rollbacks from delayed event delivery

### Related Rules
Use Event Sequence Numbers for Webhook Ordering

### Related Skills
Use Optimistic Locking for Concurrent Idempotent Operations

### Related Decision Trees
Version Field Selection (Integer vs Timestamp)
