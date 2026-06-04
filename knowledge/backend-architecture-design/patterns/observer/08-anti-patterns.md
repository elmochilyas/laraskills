# Observer — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Observer pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Synchronous Listener Doing Heavy I/O | High |
| 2 | Listener Modifying Same Data as Event Origin | Critical |
| 3 | Not Handling Listener Exceptions | Critical |
| 4 | Too Many Events/Listeners | Medium |
| 5 | Event Payload Containing Entire Objects | High |

---

## 1. Synchronous Listener Doing Heavy I/O

### Category
Performance

### Description
A synchronous listener performs heavy I/O operations (HTTP calls, large DB queries, file processing) that block the main request/process response time.

### Why It Happens
Default listeners are synchronous. Developers add logging, email, or notification listeners without considering response time impact.

### Warning Signs
- Long response times traced to event listeners
- Synchronous listeners making external HTTP calls
- DB queries in listeners that could be queued
- Response time includes all listener execution time

### Why Harmful
Synchronous I/O in listeners directly increases response time. The request waits for all listeners to complete before returning.

### Consequences
- Slow response times
- User-facing latency
- Request timeouts
- Poor scalability

### Alternative
Implement `ShouldQueue` on listeners doing I/O. Use `Illuminate\Contracts\Queue\ShouldQueue`. Queue despatches async.

### Refactoring Strategy
1. Identify heavy I/O in listeners
2. Implement ShouldQueue interface
3. Test async listener execution
4. Verify response time improvement
5. Monitor queue throughput

### Detection Checklist
- [ ] Profile listener execution time
- [ ] Check for synchronous I/O in listeners
- [ ] Identify ShouldQueue candidates

### Related Rules/Skills/Trees
- Skills: Observer, Events, Queued Listeners
- Decision Trees: Sync vs Async Event Handling

---

## 2. Listener Modifying Same Data as Event Origin

### Category
Data Integrity

### Description
A listener modifies the same database record or object that triggered the event, causing conflicts, re-triggering events, or infinite loops.

### Why It Happens
Listeners performing related updates (e.g., "user.created" listener updating user's profile) that trigger more events.

### Warning Signs
- Event listener modifying the event's source model
- Infinite event loops (event → listener → same event)
- Stack overflow or max execution errors
- Conditions to prevent re-triggering events

### Why Harmful
Modifying source data in listeners causes cascading event storms, infinite loops, and unexpected state changes.

### Consequences
- Infinite event loops
- Stack overflow
- Unpredictable behavior
- Database conflicts
- Debugging difficulty

### Alternative
Listeners should handle side effects, not modify the source. Use separate events for cascading state changes. Avoid re-triggering the same event type.

### Refactoring Strategy
1. Identify source data modifications in listeners
2. Move to after-commit or separate transaction
3. Use event-specific guards to prevent loops
4. Consider dedicated "after" events

### Detection Checklist
- [ ] Check listeners for source data modification
- [ ] Test for event loops
- [ ] Verify event chain termination

### Related Rules/Skills/Trees
- Skills: Observer, Event Design
- Decision Trees: Event Listener Safety

---

## 3. Not Handling Listener Exceptions

### Category
Reliability

### Description
A synchronous listener throws an unhandled exception that propagates and crashes the entire request, preventing the primary operation from completing.

### Why It Happens
Listeners are treated as fire-and-forget. Exception handling is overlooked.

### Warning Signs
- Listener code without try-catch
- Request failures caused by listener errors
- Primary operation failing due to secondary effect failure
- No error handling in listeners

### Why Harmful
A failed side effect (email send failure, logging error) crashes the entire request, including the primary business operation.

### Consequences
- Request failures from secondary effects
- Primary operation lost due to listener failure
- Unnecessary error alerts
- Poor user experience

### Alternative
Wrap listener logic in try-catch. Log exceptions. Use queued listeners (failures are isolated to the queue). For critical listeners, implement fallback.

### Refactoring Strategy
1. Add try-catch to all listeners
2. Log caught exceptions
3. Convert to queued listeners for I/O operations
4. Test listener failure scenarios
5. Verify main operation succeeds despite listener failure

### Detection Checklist
- [ ] Review listener exception handling
- [ ] Test listener failure scenarios
- [ ] Verify primary operation survives listener failure

### Related Rules/Skills/Trees
- Skills: Observer, Exception Handling

---

## 4. Too Many Events/Listeners

### Category
Architecture

### Description
The event system is overused: every state change triggers events, creating a complex, hard-to-reason-about publish-subscribe network.

### Why It Happens
Events are cheap and easy to add. Teams use them for every internal state change without considering the complexity cost.

### Warning Signs
- 100+ event classes in the project
- Events triggering chains of 5+ listeners
- Hard to trace what happens when an event fires
- Event documentation missing or outdated
- Debugging requires following event chains

### Why Harmful
Overuse of events creates an implicit, untraceable control flow. Understanding system behavior requires reading every listener.

### Consequences
- Hidden control flow
- Hard-to-trace bugs
- Onboarding difficulty
- Event spaghetti
- Debugging complexity

### Alternative
Use events for clear side effects (notifications, logging, cross-context communication). Use direct method calls for in-process operations.

### Refactoring Strategy
1. List all events and listeners
2. Evaluate each: is the event necessary?
3. Replace in-process events with direct calls
4. Consolidate related listeners
5. Document remaining event flows

### Detection Checklist
- [ ] Count events and listeners
- [ ] Evaluate event necessity per usage
- [ ] Review event documentation completeness

### Related Rules/Skills/Trees
- Skills: Observer, Event Design
- Decision Trees: Event vs Direct Call

---

## 5. Event Payload Containing Entire Objects

### Category
Reliability

### Description
Event classes contain full model instances as payload, causing serialization issues for queued listeners and coupling event consumers to the model structure.

### Why It Happens
Passing the entire model is the most convenient way to provide data to listeners.

### Warning Signs
- Event properties typed as Eloquent models
- Event payload containing entire object graphs
- Queued listeners failing with serialization errors
- Event payload exceeding 1MB

### Why Harmful
Full model payloads cause serialization errors for queued listeners, couple listeners to Eloquent, and include more data than listeners need.

### Consequences
- Serialization failures
- Large queue payloads
- Listener-model coupling
- Unnecessary data transfer

### Alternative
Include only needed data (IDs, attribute values, or DTOs). Listeners fetch fresh data from the database.

### Refactoring Strategy
1. Replace model instances with IDs in events
2. Listeners fetch data in handle()
3. Create DTOs for event data
4. Test event serialization

### Detection Checklist
- [ ] Check event properties for model types
- [ ] Verify serialization for queued listeners
- [ ] Measure event payload size

### Related Rules/Skills/Trees
- Skills: Observer, Event Design, DTOs
- Decision Trees: Event Payload Design
