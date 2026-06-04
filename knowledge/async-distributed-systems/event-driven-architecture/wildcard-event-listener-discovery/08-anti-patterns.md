---
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: K029 — Wildcard Event Listener Discovery
Knowledge ID: K029
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Catch-All Listener as Event Router | Design | High |
| 2 | Wildcard Listener That Dispatches Matching Events | Reliability | Critical |
| 3 | Using `handle(* $event)` for Business Logic | Architecture | High |
| 4 | Mutating Event State in Wildcard Listeners | Design | Medium |
| 5 | Heavy I/O in Wildcard Listeners | Performance | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Wildcard-as-Router (switch statement on event type) | High — defeats purpose of dedicated listeners | Use explicit event→listener bindings |
| Infinite Loop via Self-Dispatch | Critical — recursive event dispatch crashes workers | Never dispatch events from catch-all handlers |
| Performance Degradation from Heavy Wildcards | Medium — wildcard cost scales with event frequency | Keep wildcards fast; profile under load |

---

## 1. Catch-All Listener as Event Router

### Category
Design

### Description
A single `handle(* $event)` listener containing a large switch/if-else statement that routes events to different logic based on their class. This centralizes all event handling in one class, defeating the purpose of the event system's explicit listener binding.

### Why It Happens
- Developer wants "one place to see all event handling"
- Organic growth — starts with 2-3 branches and accretes more over time
- Misunderstanding that the event system supports per-listener discovery
- Convenience of adding a new case to an existing switch

### Warning Signs
- Listener named `EventHandler` or `GlobalEventListener` with `* $event`
- Switch statement with 5+ `instanceof` or `get_class()` checks
- Listener exceeds 200 lines with unrelated event handling logic
- New developer cannot determine which events the listener handles without reading the entire class
- `event:list` shows only one listener for many events

### Why Harmful
- Defeats the event system's discoverability — `event:list` shows one catch-all instead of per-event mappings
- Violates Single Responsibility — one class handles multiple unrelated events
- New listeners cannot be added without modifying the central router
- Testing requires mocking multiple unrelated events in one test
- Performance: every event dispatch runs through the entire switch

### Consequences
- Centralized bottleneck — every event change requires modifying the router
- Merge conflicts from multiple developers editing the same listener
- Code review cannot see the event flow from registration alone
- Event system becomes a monolith in disguise

### Alternative
- One listener class per event with explicit `handle(EventType $event)` method
- Use event subscribers for related events (3-5 max per domain)
- Let auto-discovery or `$listen` array define the event→listener mapping

### Refactoring Strategy
1. List all event types handled in the catch-all router
2. Create one listener class per event type
3. Move each `case` block to its respective listener
4. Register new listeners (auto-discovery or `$listen`)
5. Verify each listener fires independently
6. Delete the catch-all router class

### Detection Checklist
- [ ] No listener with `handle(* $event)` contains business logic routing
- [ ] All business logic listeners have exact-match event type-hints
- [ ] `event:list` shows per-event mappings, not catch-all
- [ ] No switch/if-else on event class in any listener
- [ ] New events don't require modifying existing listeners

### Related Rules
- wildcards-for-infrastructure-only
- no-catchall-for-business-logic

### Related Skills
- Use Wildcard Event Listener Discovery

### Related Decision Trees
- Wildcard (*) vs Explicit Event Matching

---

## 2. Wildcard Listener That Dispatches Matching Events

### Category
Reliability

### Description
A wildcard listener that dispatches events matching the same wildcard pattern, creating an infinite loop. The dispatched event is caught by the same wildcard listener, which dispatches again, until memory exhaustion or stack overflow.

### Why It Happens
- Listener for `order.*` dispatches `order.processing` (matches `order.*`)
- Catch-all `* $event` listener dispatches any event
- Developer doesn't realize the dispatched event will be caught
- Testing doesn't catch the loop (test environment may have different dispatch behavior)

### Warning Signs
- Worker process crashes with memory exhaustion
- Endless loop in event dispatch trace
- Queue fills with identical jobs from the wildcard listener
- Application hangs or becomes unresponsive after a specific event
- CPU spikes to 100% on a single request/worker

### Why Harmful
- Crashes the worker or request with memory exhaustion or stack overflow
- Consumes all available workers if multiple events hit the wildcard
- Fills queue backends with duplicate jobs
- No built-in loop protection — the application must handle this explicitly
- Production incident requiring immediate worker restart

### Consequences
- Complete service degradation (all workers crash)
- Lost jobs and data from crashed workers
- High cloud costs from runaway queue job creation
- Emergency deployment to fix the loop
- Reputation damage from extended downtime

### Alternative
- Never dispatch events in wildcard listeners
- If async processing is needed, dispatch jobs directly (not events):
  ```php
  ProcessOrder::dispatch($order); // Job, not event
  ```
- If event dispatch is unavoidable, add loop detection:
  ```php
  public function handle(* $event): void
  {
      static $depth = 0;
      if ($depth > 5) return;
      $depth++;
      SomeEvent::dispatch();
      $depth--;
  }
  ```

### Refactoring Strategy
1. Identify all wildcard listeners that dispatch events
2. Replace `Event::dispatch()` with direct job dispatch where possible
3. If event dispatch is required, add recursion guard with max depth
4. Add monitoring for event dispatch frequency to detect loops
5. Set up alert on worker crash/out-of-memory events

### Detection Checklist
- [ ] No wildcard listener dispatches matching events
- [ ] Catch-all listeners never call `Event::dispatch()`, `Bus::dispatch()` with event-matching jobs
- [ ] Recursion guard present if event dispatch is unavoidable
- [ ] Monitor in place for unusual event dispatch frequency
- [ ] Load test verifies no infinite loops under high concurrency

### Related Rules
- no-catchall-for-business-logic

### Related Skills
- Use Wildcard Event Listener Discovery

### Related Decision Trees
- Wildcard (*) vs Explicit Event Matching

---

## 3. Using `handle(* $event)` for Business Logic

### Category
Architecture

### Description
Implementing business logic in a `handle(* $event)` listener that catches ALL events, including framework internal events (`illuminate.queue.*`, `illuminate.cache.*`, `illuminate.log.*`). The listener processes domain events but also inadvertently processes framework events.

### Why It Happens
- Developer wants to "catch all" without realizing framework events exist
- Method-based wildcard (`*`) is easier than listing multiple specific events
- Assumption that only application events are dispatched through the system
- Copy-paste from infrastructure listener that correctly uses `*`

### Warning Signs
- Listener with `handle(* $event)` contains database writes, API calls, or email sending
- Framework events appear in listener error logs
- Cache clears or queue jobs are processed by the wildcard listener
- Infinite loop or strange behavior after cache/queue operations
- `illuminate.*` events appearing in wildcard listener traces

### Why Harmful
- Framework internal events are also dispatched through the event system
- Cache events, queue events, log events all trigger the business logic listener
- Can cause infinite loops (cache flush triggers event → listener clears cache → event again)
- Business logic operates on framework event objects (wrong type, missing properties)
- Side effects are unpredictable and hard to debug

### Consequences
- Cache corruption from listener clearing cache during a cache event
- Queue worker instability from listener processing queue events
- Business logic errors from operating on framework event objects
- Data corruption from unintended listener execution on framework events
- Production incidents that are extremely hard to reproduce

### Alternative
- Use exact-match listeners for business logic:
  ```php
  public function handle(OrderShipped $event): void
  ```
- Use name-based wildcards (`order.*`) with narrow scope
- Keep `*` only for infrastructure (logging, metrics) that is safe for ALL events

### Refactoring Strategy
1. Identify all `handle(* $event)` listeners with business logic
2. Determine which specific events each listener should handle
3. Replace `* $event` with `SpecificEvent $event` type-hints
4. Or replace with name-based wildcards scoped to the domain
5. Verify no framework events are processed
6. Test with framework events to confirm they are ignored

### Detection Checklist
- [ ] No business logic listener uses `handle(* $event)`
- [ ] All domain listeners have exact-match event type-hints
- [ ] Framework events (`illuminate.*`) not processed by application listeners
- [ ] `*` only used in infrastructure listeners (logging, metrics, audit)
- [ ] No domain side effects from framework events

### Related Rules
- no-catchall-for-business-logic
- wildcards-for-infrastructure-only

### Related Skills
- Use Wildcard Event Listener Discovery

### Related Decision Trees
- Wildcard (*) vs Explicit Event Matching

---

## 4. Mutating Event State in Wildcard Listeners

### Category
Design

### Description
Wildcard listeners that modify properties on the event object. Events are shared objects passed to all listeners — mutation in a wildcard listener affects subsequent listeners unpredictably, especially since wildcard listeners run after exact-match listeners.

### Why It Happens
- Developer treats event as private to the listener
- Not understanding that events are shared references across all listeners
- Adding fields to events for convenience without considering listener ordering
- Pattern copied from systems where events are immutable

### Warning Signs
- Wildcard listener sets properties on `$event` (e.g., `$event->processed = true`)
- Downstream listeners check for properties set by wildcard listeners
- Inconsistent behavior depending on listener ordering
- Tests fail when run in different order
- `@property` annotations on events for fields set by listeners

### Why Harmful
- Exact-match listeners may depend on default state that the wildcard changes
- Wildcard listeners run AFTER exact-match listeners (per dispatcher design)
- A wildcard setting `$event->processed = true` may skip processing for exact-match listeners that check it
- Behavior is ordering-dependent and non-deterministic
- Adding/removing a wildcard listener breaks other listeners

### Consequences
- Subtle bugs from corrupted event state
- Listeners that work in isolation fail when wildcards are present
- Debugging requires understanding the entire listener execution order
- Tests must replicate production listener registration exactly
- Listener ordering changes break features

### Alternative
- Wildcard listeners must be read-only observers
- Use separate data channels (not event mutation) for cross-listener communication
- If state sharing is needed, use a scoped service, not event mutation

### Refactoring Strategy
1. Identify all wildcard listeners that mutate event properties
2. Move mutation logic out of wildcard listener
3. If state sharing is needed between listeners, use a dedicated service or context
4. Replace event mutation with separate data store (log, cache, scoped service)
5. Verify wildcard listeners no longer modify event state

### Detection Checklist
- [ ] No wildcard listener modifies event properties
- [ ] Event objects are treated as read-only in wildcard handlers
- [ ] No downstream listener depends on state set by a wildcard listener
- [ ] Listener execution order can be changed without breaking features
- [ ] Tests verify event immutability through wildcard listeners

### Related Rules
- never-mutate-event-in-wildcard

### Related Skills
- Use Wildcard Event Listener Discovery

### Related Decision Trees
- Wildcard (*) vs Explicit Event Matching

---

## 5. Heavy I/O in Wildcard Listeners

### Category
Performance

### Description
Wildcard listeners performing slow operations (HTTP calls, database queries, file I/O) that execute on every matching event dispatch. The performance impact scales with event frequency, degrading the entire application.

### Why It Happens
- Treating wildcard listeners like any other listener without considering frequency
- Developer only tests with low event volume
- Adding analytics/audit calls without profiling their impact
- Not considering that wildcards match many events, multiplying the cost

### Warning Signs
- Wildcard listener makes HTTP API calls or database queries
- Event dispatch time increases linearly with event frequency
- Profiling shows wildcard listener consuming majority of dispatch time
- Application slows down under normal event load
- External API rate limits hit by wildcard listener calls

### Why Harmful
- The wildcard listener runs for every matching event — even high-frequency internal events
- A 200ms API call in a wildcard listener blocks every event dispatch for 200ms
- 10 events/second × 200ms = 2 seconds of blocking per second → degraded throughput
- External dependencies (APIs, databases) are hammered by every event
- Performance impact is invisible in low-volume testing

### Consequences
- Application latency spikes under normal load
- External API rate limits exhausted
- Database connection pool drained by wildcard queries
- Event dispatch becomes the application bottleneck
- Scaling the application doesn't help — the wildcard is in the critical path

### Alternative
- Keep wildcard listeners fast: logging, metrics increment, cache tags
- If I/O is required, dispatch a queued job:
  ```php
  public function handle(* $event): void
  {
      ProcessAnalytics::dispatch($event); // Async — doesn't block dispatch
  }
  ```
- Use name-based wildcards to narrow the scope, reducing event frequency

### Refactoring Strategy
1. Profile wildcard listener execution time per event dispatch
2. Calculate total overhead: execution time × matching events/second
3. Move I/O operations from wildcard listener to queued jobs
4. Or narrow the wildcard pattern to reduce matching events
5. Verify dispatch time is under 1ms for infrastructure listeners

### Detection Checklist
- [ ] Wildcard listeners don't make HTTP calls or perform heavy I/O
- [ ] Dispatch time for infrastructure events is under 1ms
- [ ] Profiling shows wildcard listener is not the dispatch bottleneck
- [ ] High-frequency events don't trigger I/O in wildcard listeners
- [ ] I/O operations are dispatched as async jobs from wildcard listeners

### Related Rules
- keep-wildcards-fast-and-safe

### Related Skills
- Use Wildcard Event Listener Discovery

### Related Decision Trees
- Wildcard (*) vs Explicit Event Matching
