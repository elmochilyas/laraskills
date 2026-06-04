# Anti-Patterns — `ShouldBeUnique` and Unique Job Locking

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Job Middleware |
| Knowledge Unit | `ShouldBeUnique` and Unique Job Locking |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Default Class-Name Key Singleton
2. Missing `uniqueFor` TTL Stale Lock
3. TTL Shorter Than Queue Wait Time
4. Confusing Dispatch vs Execution Prevention

---

## 1. Default Class-Name Key Singleton

### Category
Reliability

### Description
Implementing `ShouldBeUnique` without overriding `uniqueId()`, causing the default class-name key to act as a global singleton — only one instance of the job can ever exist across all entities.

### Why It Happens
The `ShouldBeUnique` interface requires implementing `uniqueId()`, but the default implementation returns the class name. The developer doesn't override it, assuming uniqueness is per-class. A webhook job for event 123 is dispatched, then a webhook for event 456 is dispatched — the second dispatch is silently dropped because the lock key is the class name, not the event ID.

### Warning Signs
- `uniqueId()` not overridden in the job class
- Only the first instance of any job is processed
- Subsequent dispatches silently fail
- Events lost with no error or log entry

### Why Harmful
A webhook provider sends events E1, E2, E3 for three different orders. All three are instances of `ProcessWebhookJob` with the same class-name key. The first dispatch (E1) acquires the lock. E2 and E3 are silently dropped — `Bus::dispatchToQueue()` returns `null`. Two orders are never processed. No error, no log, no notification. The business impact is silent data loss.

### Consequences
- Only one job instance processes regardless of entity
- All subsequent dispatches silently dropped
- Entities never processed with no error indication
- Lost business operations from dropped jobs

### Alternative
Always override `uniqueId()` to scope uniqueness per entity (e.g., return `$this->eventId`).

### Refactoring Strategy
1. Add `uniqueId()` override to all `ShouldBeUnique` jobs
2. Return an entity-scoped value (event ID, order ID, user ID)
3. Verify the key is unique per entity, not per class
4. Test: dispatch two jobs with different IDs — both should process

### Detection Checklist
- [ ] `uniqueId()` overridden on all `ShouldBeUnique` jobs
- [ ] Key scoped to entity identifier
- [ ] Different entities can have concurrent job instances
- [ ] No silent dropping of legitimate dispatches

### Related Rules
override-unique-id-per-entity

### Related Skills
Prevent Duplicate Job Dispatches with ShouldBeUnique

### Related Decision Trees
Unique Job Enforcement Strategy

---

## 2. Missing `uniqueFor` TTL Stale Lock

### Category
Reliability

### Description
Not setting `uniqueFor` (defaults to 0), causing the unique lock to persist indefinitely if the job crashes mid-execution and permanently blocking all future dispatches.

### Why It Happens
The `uniqueFor` property is optional — the developer doesn't implement it, assuming the lock is released automatically. In normal operation, the lock releases when the job completes. But if the worker crashes (OOM kill, deployment restart, SIGTERM), the lock is never released. With `uniqueFor = 0` (no TTL), the lock persists forever. No future job with the same unique key can ever be dispatched.

### Warning Signs
- `uniqueFor` not set (defaults to 0)
- Jobs stop processing after a worker crash
- Lock key persists in cache indefinitely
- Manual cache clear required to resume processing

### Why Harmful
A worker processing a `ProcessWebhookJob` for event E123 crashes due to an OOM kill. The lock key `laravel_unique:ProcessWebhookJob:E123` remains in Redis forever. Every subsequent `ProcessWebhookJob` dispatch for E123 is silently dropped. Even after the worker restarts, the lock is never released. Event E123 is permanently blocked unless an operator manually clears the cache key.

### Consequences
- Permanent lock after worker crash
- Future dispatches for affected key blocked forever
- Manual operator intervention required for recovery
- Events lost for stuck lock keys

### Alternative
Always set `uniqueFor` to a TTL covering max queue wait + max execution + buffer.

### Refactoring Strategy
1. Add `uniqueFor()` method returning a reasonable TTL (e.g., 3600 for 1 hour)
2. Calculate TTL as: max queue wait + p99 execution time + 20% buffer
3. For long-running jobs, set a generous TTL (hours, not seconds)
4. Test: kill a worker mid-job, verify lock auto-releases after TTL

### Detection Checklist
- [ ] `uniqueFor()` implemented on all `ShouldBeUnique` jobs
- [ ] TTL covers queue wait + execution + buffer
- [ ] Lock auto-releases after worker crash
- [ ] No permanent lock keys in production

### Related Rules
always-set-unique-for-ttl

### Related Skills
Prevent Duplicate Job Dispatches with ShouldBeUnique

### Related Decision Trees
Unique Job Lock Expiry Setting

---

## 3. TTL Shorter Than Queue Wait Time

### Category
Reliability

### Description
Setting `uniqueFor` TTL shorter than the maximum time the job spends in the queue, causing the lock to expire before the first instance processes and allowing a duplicate to be dispatched.

### Why It Happens
The developer sets `uniqueFor` to the job's execution time (e.g., 30 seconds for a 30-second job). But the queue has a backlog of 5 minutes. The lock expires after 30 seconds (TTL), while the job is still waiting in the queue. A second dispatch arrives — the lock is gone, so the second is accepted. Now two instances of the same unique job are in the queue, and they process concurrently.

### Warning Signs
- `uniqueFor` less than observed queue wait time
- Two instances of the same unique job processing simultaneously
- `ShouldBeUnique` guarantee violated under queue backlog
- Lock expiry logs show early expiration

### Why Harmful
A webhook job for event E123 has `uniqueFor = 60` seconds. The queue backlog is 5 minutes. The first dispatch waits 5 minutes in the queue. After 60 seconds, the lock expires. A second dispatch for E123 arrives — the lock is gone, the job is accepted. Both jobs are now in the queue. When they process (possibly concurrently), duplicate side effects occur. The `ShouldBeUnique` guarantee is violated.

### Consequences
- Duplicate dispatches under queue backlog
- `ShouldBeUnique` guarantee voided by early lock expiry
- Concurrent processing of same unique key
- Duplicate side effects despite uniqueness mechanism

### Alternative
Set `uniqueFor` to max queue wait time + max execution time + buffer.

### Refactoring Strategy
1. Measure max queue wait time from queue monitoring
2. Measure p99 job execution time
3. Set `uniqueFor` to sum of both + 20% buffer
4. For variable backlogs, set a generous TTL (e.g., 3600 seconds)
5. Monitor lock expiry vs processing time to detect issues

### Detection Checklist
- [ ] `uniqueFor` covers queue wait + execution + buffer
- [ ] No duplicate dispatches under queue backlog
- [ ] Lock persists for entire queued duration
- [ ] Monitoring confirms lock coverage

### Related Rules
match-unique-for-to-total-time

### Related Skills
Prevent Duplicate Job Dispatches with ShouldBeUnique

### Related Decision Trees
Unique Job Lock Expiry Setting

---

## 4. Confusing Dispatch vs Execution Prevention

### Category
Architecture

### Description
Using `ShouldBeUnique` when `WithoutOverlapping` is needed (or vice versa), applying the wrong level of prevention for the requirement.

### Why It Happens
Both features prevent "duplicates" but at different levels. The developer needs to prevent concurrent execution of a billing job and reaches for `ShouldBeUnique`. But `ShouldBeUnique` only prevents dispatch — if two jobs are dispatched within milliseconds (both before the lock), both are in the queue and can execute concurrently. Conversely, the developer uses `WithoutOverlapping` to prevent duplicate dispatches — but it only prevents concurrent execution.

### Warning Signs
- `ShouldBeUnique` used but concurrent execution still occurs
- `WithoutOverlapping` used but dispatch still duplicates
- Timing windows can overlap despite uniqueness mechanism
- Team confusion about which to use

### Why Harmful
A billing reconciliation job must never run twice for the same invoice. The developer uses `ShouldBeUnique`. Two webhook events arrive within 1ms for the same invoice. Both dispatch. `ShouldBeUnique` checks the lock — the first dispatch sets it, but the second dispatch arrived before the first dispatch's lock was stored. Both jobs are in the queue. They process concurrently and double-charge the invoice.

### Consequences
- Concurrent execution despite ShouldBeUnique
- Duplicate dispatch despite WithoutOverlapping
- Wrong protection level for actual risk
- Data corruption from incorrectly chosen mechanism

### Alternative
Use `ShouldBeUnique` to prevent duplicate dispatch at queue time. Use `WithoutOverlapping` to prevent concurrent execution. Use both for strict guarantees.

### Refactoring Strategy
1. Identify the risk: duplicate dispatch or concurrent execution
2. For duplicate dispatch risk: implement `ShouldBeUnique`
3. For concurrent execution risk: implement `WithoutOverlapping`
4. For both risks: implement both mechanisms
5. Test both scenarios: rapid dispatch and concurrent processing

### Detection Checklist
- [ ] Correct mechanism chosen for the risk
- [ ] ShouldBeUnique prevents duplicate dispatch
- [ ] WithoutOverlapping prevents concurrent execution
- [ ] Both applied when both guarantees are needed

### Related Rules
combine-with-without-overlapping

### Related Skills
Prevent Duplicate Job Dispatches with ShouldBeUnique, Prevent Concurrent Job Execution with WithoutOverlapping

### Related Decision Trees
Unique Job Enforcement Strategy
