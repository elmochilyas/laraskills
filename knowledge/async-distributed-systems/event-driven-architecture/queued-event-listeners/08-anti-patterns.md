---
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: K028 — Queued Event Listeners
Knowledge ID: K028
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Queuing ALL Listeners Indiscriminately | Performance | Medium |
| 2 | Infinite Retries Without `$tries` Limit | Reliability | Critical |
| 3 | No `SerializesModels` on Queued Listeners | Performance | High |
| 4 | Event Payload with Full Model Graphs | Performance | Medium |
| 5 | Testing Queued Listeners Only with `Event::fake()` | Testing | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Queue Overhead for Fast Listeners | High — queue serialization time exceeds inline execution time | Profile listener execution time; only queue >5ms |
| Unbounded Listener Retries | Critical — infinite retries consume worker resources forever | Enforce `$tries` via coding standard or base listener class |
| Payload Bloat from Model Serialization | Medium — full model graphs inflate queue payloads | Use `SerializesModels` or pass plain IDs |

---

## 1. Queuing ALL Listeners Indiscriminately

### Category
Performance

### Description
Implementing `ShouldQueue` on every event listener regardless of execution time or I/O requirements. Fast listeners (<5ms) that update local database state are queued, adding unnecessary overhead and introducing eventual consistency where it wasn't needed.

### Why It Happens
- "Queue everything" mentality without considering cost
- Defaulting to async because "it's safer" without evaluating consistency requirements
- Not profiling listener execution time before deciding on queue strategy
- Copy-paste from another project that queued all listeners

### Warning Signs
- Listeners doing simple DB updates have `ShouldQueue`
- Queue volume is high (>90% of jobs are <5ms listeners)
- UI shows stale data after form submission (eventual consistency delay)
- Queue worker CPU is dominated by serialization/deserialization overhead

### Why Harmful
- Queue serialization/deserialization overhead (~1ms) exceeds inline execution time
- Introduces eventual consistency where immediate consistency was expected
- Multiplies queue volume unnecessarily — more workers needed
- Event ordering becomes non-deterministic across listeners
- Debugging becomes harder — must check both event dispatch and queue processing

### Consequences
- Higher infrastructure costs (more queue workers)
- UI staleness — users don't see their changes immediately
- Harder to reason about application state
- Unnecessary CPU cycles spent on serialization
- Increased complexity in testing

### Alternative
- Keep listeners that update local DB state and execute <5ms inline
- Only queue listeners that make network I/O calls or exceed 5ms
- Profile listener execution time before deciding

### Refactoring Strategy
1. Measure execution time of each listener (add logging or profiling)
2. Categorize: I/O-bound listeners → keep queued; fast local updates → make inline
3. Remove `ShouldQueue` from fast listeners
4. Update consistency expectations in documentation
5. Verify immediate consistency for inline listeners

### Detection Checklist
- [ ] No `ShouldQueue` on listeners doing only local DB writes <5ms
- [ ] Queue volume doesn't include trivial listeners
- [ ] UI reflects changes immediately after event dispatch
- [ ] Profile data confirms queued listeners are I/O-bound or >5ms
- [ ] Queue worker CPU is dominated by actual work, not serialization

### Related Rules
- set-tries-on-queued-listeners

### Related Skills
- Queue Event Listeners with `ShouldQueue`

### Related Decision Trees
- ShouldQueue on Listener vs Inline Execution

---

## 2. Infinite Retries Without `$tries` Limit

### Category
Reliability

### Description
Omitting the `$tries` property on a queued event listener, causing it to retry indefinitely on permanent failures (invalid data, API endpoint removed, authorization denied). The listener consumes worker resources forever.

### Why It Happens
- Not knowing that `$tries` defaults to `null` (infinite)
- Assuming the queue worker's `--tries` option caps listener retries (it caps job retries, but `CallQueuedListener` wraps the listener)
- Forgetting to add `$tries` when creating the listener
- Copy-paste from a listener template that omits retry configuration

### Warning Signs
- Horizon dashboard shows a single listener retried 50+ times
- Queue worker is stuck processing the same listener repeatedly
- Logs filled with the same error from a failing listener
- Support ticket: "emails keep trying to send for an order that was cancelled"

### Why Harmful
- Worker resources are consumed indefinitely by a permanently failing task
- Real jobs behind the failing listener are delayed or starved
- Logs are flooded with repeated error messages
- API rate limits may be exhausted by repeated retries
- Cloud queue costs increase with each retry

### Consequences
- Workers unavailable for other jobs
- Increased cloud costs (queue API calls, compute)
- Delayed processing for legitimate jobs
- Operational fatigue from alarms for the same failing job
- Cascading delays in dependent workflows

### Alternative
- Always set `$tries` to a finite number:
  ```php
  public $tries = 3;
  ```
- Use `retryUntil()` for time-based cutoff if you need variable retry counts
- Implement `failed()` for cleanup after exhaustion

### Refactoring Strategy
1. Identify all queued listeners without `$tries` set
2. Add `public $tries = 3` to each (adjust based on listener criticality)
3. Set `$backoff` array for progressive wait times
4. Implement `failed()` method for cleanup on permanent failure
5. Test failure scenario to confirm retries stop after exhaustion

### Detection Checklist
- [ ] All queued listeners have `$tries` set (or `retryUntil()` defined)
- [ ] No listener has `$tries = null` (default is infinite)
- [ ] Horizon/queue dashboard shows finite retry attempts
- [ ] `failed()` method implemented where cleanup is needed
- [ ] Tests verify retry exhaustion behavior

### Related Rules
- set-tries-on-queued-listeners

### Related Skills
- Queue Event Listeners with `ShouldQueue`

### Related Decision Trees
- Queued Listener Configuration Strategy

---

## 3. No `SerializesModels` on Queued Listeners

### Category
Performance

### Description
Queued event listeners handling events with Eloquent model properties that do not use the `SerializesModels` trait. The entire model graph (including all loaded relations) is serialized into the queue payload.

### Why It Happens
- Not knowing that `SerializesModels` is needed for model-bearing events
- Assuming PHP's `serialize()` handles Eloquent models efficiently
- Events pass `$order->id` instead of `$order` (developer thinks they don't need it until they add the model later)
- Copy-paste from inline listener that didn't need the trait

### Warning Signs
- Queue payload size exceeds 100KB for simple events
- Redis memory usage for queue is unexpectedly high
- Serialization timeouts for large model graphs
- Worker processes slow jobs (time spent deserializing large payloads)
- Stale model data on worker (model was serialized with old state, not re-queried)

### Why Harmful
- Queue payloads are 10-100x larger than necessary
- Redis/DB queue storage costs increase proportionally
- Serialization/deserialization time increases with payload size
- Stale model data — the serialized model reflects state at dispatch time, not at processing time
- Worker must deserialize the entire model graph even if it only needs the ID

### Consequences
- Higher infrastructure costs (more memory, more queue storage)
- Slower job processing (serialization overhead)
- Stale data bugs — worker processes with old model state
- Queue payload limits may be exceeded (e.g., SQS 256KB limit)
- Failed jobs if model graph is too large

### Alternative
- Always add `SerializesModels` trait when event contains Eloquent models:
  ```php
  use Illuminate\Queue\SerializesModels;

  class SendShipmentNotification implements ShouldQueue
  {
      use InteractsWithQueue, Queueable, SerializesModels;
  }
  ```
- Or pass only the model ID and re-query in the listener

### Refactoring Strategy
1. Identify queued listeners handling events with Eloquent model properties
2. Add `use SerializesModels;` to each
3. Verify models are serialized as `ModelIdentifier` (not full dump)
4. Confirm model is re-queried on worker (fresh data)
5. Measure payload size reduction (expect 90%+ reduction)

### Detection Checklist
- [ ] All queued listeners handling model-bearing events have `SerializesModels`
- [ ] Queue payloads show `ModelIdentifier` instead of full model dump
- [ ] Payload size < 5KB for typical events
- [ ] Worker processes fresh model data (not stale)
- [ ] No serialization errors for circular model references

### Related Rules
- add-serializes-models-to-listener

### Related Skills
- Queue Event Listeners with `ShouldQueue`

### Related Decision Trees
- Queued Listener Configuration Strategy

---

## 4. Event Payload with Full Model Graphs

### Category
Performance

### Description
Passing Eloquent models with eager-loaded relations (e.g., `$user->load('posts.comments.author')`) in event properties. The entire loaded relation tree is serialized into every queued listener job, even when the listener only needs the primary model or its ID.

### Why It Happens
- Developer passes the model as-is without considering serialization cost
- Eager-loaded relations in controllers are passed through to events
- "Just in case" loading — loading relations that might be needed
- Not reviewing event payload size in development

### Warning Signs
- Event constructor accepts fully-loaded Eloquent models
- Payload size exceeds 50KB for events with relation trees
- Serialization errors for circular relationships
- Worker jobs take longer to deserialize than to execute
- Redis memory usage correlates with relation-loaded events

### Why Harmful
- Massively bloated queue payloads (a 1KB event becomes 500KB with relation graph)
- Wasted memory on queue backends
- Slow serialization/deserialization
- Worker receives stale relation data (relations loaded at dispatch time, not fresh)
- Increased network transfer time for queue backends

### Consequences
- Queue infrastructure costs multiply
- Job processing latency increases
- Failed jobs when serialization exceeds limits
- Data freshness bugs (worker uses stale relation data)
- Reloading relations on worker defeats the purpose of eager-loading

### Alternative
- Pass only the model ID (or IDs) and re-query relations on the worker
- Use `SerializesModels` which serializes models as `ModelIdentifier` (but still only fresh data on restore)
- Design events with minimal data: only what the listeners need

### Refactoring Strategy
1. Identify events with eager-loaded models passed to listeners
2. Replace full models with IDs: `new OrderShipped(orderId: $order->id)`
3. Re-query necessary data in each listener
4. Or keep the model but ensure no eager-loading before dispatch
5. Measure payload size reduction
6. Update event constructors and listener `handle()` signatures

### Detection Checklist
- [ ] Event payloads don't contain full model graphs with eager-loaded relations
- [ ] Payload size < 10KB for events with model references
- [ ] Listeners re-query necessary relations on worker
- [ ] No eager-loaded relations on models passed to events
- [ ] Serialization profiling confirms lightweight payloads

### Related Rules
- keep-events-serializable
- add-serializes-models-to-listener

### Related Skills
- Queue Event Listeners with `ShouldQueue`

### Related Decision Trees
- ShouldQueue on Listener vs Inline Execution

---

## 5. Testing Queued Listeners Only with `Event::fake()`

### Category
Testing

### Description
Using `Event::fake()` to assert the event was dispatched, but never directly testing the queued listener's `handle()` method. `Event::fake()` only captures the event dispatch — it does not execute queued listener jobs, so the listener logic remains untested.

### Why It Happens
- Developer assumes `Event::fake()` processes all listeners synchronously (it only processes inline listeners, not queued ones)
- Documentation examples show `Event::fake()` for basic event testing
- Not understanding the difference between `Event::fake()` behavior for inline vs queued listeners
- Test coverage reports show "listener covered" but only the dispatch is tested

### Warning Signs
- Test passes but listener logic has bugs
- Listener `handle()` method throws in production but tests pass
- No direct unit tests for listener `handle()` methods
- `Event::fake()` used exclusively in feature tests with queued listeners
- Coverage reports show listener class is "tested" but handle() is never invoked in test

### Why Harmful
- Listener logic is completely untested
- Bugs in listener handle(), serialization, or error handling go to production
- Retry behavior is never validated
- `failed()` method is never tested
- Confidence in test suite is misleading — green tests don't mean listener works

### Consequences
- Production bugs from listener logic that tests didn't catch
- Rolled-back deployments due to listener failures
- Debugging time wasted on issues that should have been caught in tests
- Developer must manually verify listener behavior

### Alternative
- Test the listener's `handle()` method directly:
  ```php
  $listener = new SendShipmentNotification();
  $listener->handle(new OrderShipped(orderId: 1));
  Mail::assertSent(ShipmentConfirmation::class);
  ```
- Use `Bus::fake()` to assert `CallQueuedListener` was dispatched
- Write integration tests that actually process the queue

### Refactoring Strategy
1. Identify all tests using `Event::fake()` for queued listeners
2. Add direct `handle()` tests for each queued listener
3. Add `Bus::fake()` assertions for `CallQueuedListener` dispatch
4. Add integration tests processing the queue end-to-end
5. Verify test coverage of `handle()`, `failed()`, and retry logic

### Detection Checklist
- [ ] All queued listeners have direct `handle()` unit tests
- [ ] `Event::fake()` tests are complemented by listener logic tests
- [ ] `Bus::fake()` asserts `CallQueuedListener` dispatch
- [ ] `failed()` method has tests (if implemented)
- [ ] Retry exhaustion behavior is tested
- [ ] Coverage report confirms listener `handle()` is executed in tests

### Related Rules
- test-queued-listeners-directly

### Related Skills
- Queue Event Listeners with `ShouldQueue`

### Related Decision Trees
- ShouldQueue on Listener vs Inline Execution
