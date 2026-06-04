# Dispatching Domain Events — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Dispatching Domain Events |
| Focus | Anti-patterns in domain event dispatching |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Dispatching Events Before Transaction Commit | Reliability | Critical |
| 2 | Eloquent Model Instance in Event Payload | Architecture | High |
| 3 | No Correlation ID in Events | Scalability | Medium |
| 4 | Scattered Event Listener Registration | Code Organization | Medium |
| 5 | Synchronous Listeners for Non-Critical Side Effects | Performance | Medium |
| 6 | Present/Future Tense Event Naming | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- Events dispatched inline during transactions (before commit) is the most dangerous pattern — ghost events trigger side effects for rolled-back operations
- Eloquent model instances in event payloads are common, causing stale data in listeners and serialization issues for queues
- Correlation IDs are almost always absent, making event chain tracing impossible

---

## 1. Dispatching Events Before Transaction Commit

### Category
Reliability

### Description
Dispatching domain events inside a database transaction, before the transaction has committed. If the transaction rolls back after dispatch, the event's side effects (email, API call, projection update) have already executed based on data that doesn't exist.

### Why It Happens
The natural flow is to dispatch the event right after the state change, which often happens inside the transaction. Developers may not realize that `DB::transaction()` wraps the event dispatch. The rolled-back transaction with event side effects may not be tested.

### Warning Signs
- `Event::dispatch()` called inside a `DB::transaction()` closure
- Events dispatched before `DB::afterCommit()` or `$afterCommit = true`
- Model events (`created`, `updated`) dispatched automatically inside the transaction
- Ghost notifications: users receive emails for orders that were rolled back
- Projections updated for transactions that never completed
- Phantom audit trail entries for failed operations

### Why Harmful
- Users receive notifications for operations that never completed
- External API calls are made based on invalid data
- Read models / projections are updated speculatively
- Audit trails contain phantom entries
- Debugging is confusing: side effects exist but the source data doesn't

### Consequences
- Customer confusion from phantom order confirmations
- Data inconsistency between projections and source of truth
- External system pollution (API calls for rolled-back operations)
- Audit trail contamination with incomplete operations
- Wasted resources on reverted side effects

### Preferred Alternative
```php
DB::transaction(function () use ($order) {
    $order->place();
});

DB::afterCommit(fn () => Event::dispatch(new OrderPlaced($order->id)));
```

### Refactoring Strategy
1. Identify all events dispatched inside `DB::transaction()` closures
2. Move event dispatch outside the transaction or use `DB::afterCommit()`
3. For model events (created/updated), set `$afterCommit = true` on the event class
4. Verify that events only fire when data is fully persisted
5. Add tests that roll back transactions and assert no events were dispatched

### Detection Checklist
- [ ] Search for `Event::dispatch(` inside `DB::transaction(` closures
- [ ] Check model events for `$afterCommit` configuration
- [ ] Verify that no side effects are triggered on transaction rollback
- [ ] Test transaction rollback scenarios and check for ghost events
- [ ] Review queue worker logs for operations that lack corresponding source data

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Dispatch Domain Events Only After the Database Transaction Commits |
| Decision Tree | `07-decision-trees.md` — Dispatch Timing |
| Skill | `06-skills.md` — Dispatch a Domain Event After Transaction Commit |

---

## 2. Eloquent Model Instance in Event Payload

### Category
Architecture

### Description
Passing the full Eloquent model instance as a domain event payload. The model carries the entire database row state, may be stale by the time a queued listener processes it, and serializes unnecessary data.

### Why It Happens
Convenience: the model has all the data needed. It's a single constructor parameter. The developer may not anticipate that the event will be queued, or that the model's state may change between dispatch and listener execution.

### Warning Signs
- `public readonly Order $order` in event class constructor
- Event payload includes `$model`, `$user`, `$order` Eloquent instances
- Listeners accessing `$event->order->status` or similar model properties
- Queued listeners failing with serialization errors
- Large event payloads in queue logs containing full model data
- Stale data bugs: listener receives an old state of the model

### Why Harmful
- Queued listeners may receive stale data if the model is updated between dispatch and processing
- Full model serialization is expensive (all relations, appends, hidden attributes)
- Serialization failures when the model graph contains closures or non-serializable types
- Tight coupling: listeners depend on the full Eloquent model structure
- The event payload contains data the listener may not need (violation of principle of least privilege)

### Consequences
- Queued listeners process outdated data (order was cancelled, listener thinks it's placed)
- Serialization exceptions in queue workers
- Large queue payloads increasing Redis/database storage
- Coupling: changing a model attribute name breaks all event listeners
- Performance: serializing full model graphs for every event dispatch

### Preferred Alternative
```php
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $customerId,
        public readonly int $totalCents,
    ) {}
}
```

### Refactoring Strategy
1. Identify events carrying Eloquent model instances
2. Replace the model property with primitive properties (IDs and value objects)
3. Update listeners to load the model by ID if needed
4. Update tests to construct events with primitives
5. Remove model serialization logic from event classes

### Detection Checklist
- [ ] Search for `public readonly \w+ \$` in event classes — are they models or primitives?
- [ ] Check event constructors for model type hints
- [ ] Review listener usage of event data — do they access model properties directly?
- [ ] Check queue payloads in Horizon or queue dashboard for model data
- [ ] Test queued listeners with model state changes between dispatch and processing

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Carry Identity and Value Objects, Not Model Instances |
| Decision Tree | `07-decision-trees.md` — Event Payload Strategy |
| Skill | `06-skills.md` — Dispatch a Domain Event After Transaction Commit |

---

## 3. No Correlation ID in Events

### Category
Scalability

### Description
Domain event payloads without a correlation ID, making it impossible to trace a chain of events across bounded contexts, queues, and services triggered by a single user action.

### Why It Happens
Correlation IDs seem like infrastructure concerns that add "noise" to event classes. The application may not have a distributed tracing requirement yet. Simple logging appears sufficient for debugging.

### Warning Signs
- Event classes with only business data (orderId, customerId) and no `correlationId`
- No `Str::uuid()` or trace ID generation at event dispatch time
- Difficulty tracing user actions through event chains during debugging
- No correlation ID in log entries for event listener execution
- Event chains across contexts cannot be linked together
- Multiple log entries for the same user action without a common identifier

### Why Harmful
- Debugging multi-step event chains requires manual log correlation
- Distributed tracing across contexts is impossible without a common ID
- Performance issues in event chains cannot be traced end-to-end
- Error tracking cannot group events from the same user action together
- Auditing across bounded contexts requires manual record linkage

### Consequences
- Extended debugging time for event-driven failures
- Inability to trace a user's action through multiple event listeners
- Poor observability in production event chains
- Difficulty identifying performance bottlenecks in event processing
- Manual correlation of logs during incident response

### Preferred Alternative
```php
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $customerId,
        public readonly string $correlationId,
    ) {}
}

// Dispatch:
Event::dispatch(new OrderPlaced(
    orderId: $order->id,
    customerId: $order->user_id,
    correlationId: Str::uuid(),
));
```

### Refactoring Strategy
1. Add `correlationId` property to all domain event classes
2. Generate a UUID at the start of each request and pass it through event dispatch
3. Include the correlation ID in all log messages during event processing
4. Update listeners to forward the correlation ID to any downstream events
5. Set up log aggregation to correlate events by correlation ID

### Detection Checklist
- [ ] Search event class constructors for `correlationId` or `traceId` properties
- [ ] Check if a request-scoped correlation ID exists and is passed to events
- [ ] Review log entries — can you trace a single user action through the logs?
- [ ] Test multi-step event chains and verify correlation IDs propagate
- [ ] Check monitoring/tracing tools for event correlation capabilities

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Include Correlation IDs in Every Domain Event |
| Skill | `06-skills.md` — Dispatch a Domain Event After Transaction Commit |

---

## 4. Scattered Event Listener Registration

### Category
Code Organization

### Description
Registering domain event listeners via `Event::listen()` calls spread across multiple service providers, boot methods, and files, instead of centralizing in the `EventServiceProvider::$listen` array.

### Why It Happens
Adding an inline `Event::listen()` in the nearest service provider is convenient. Developers may not know about the `$listen` array pattern. Teams may have multiple service providers that each register their own events.

### Warning Signs
- `Event::listen()` calls in `AppServiceProvider`, route providers, or custom providers
- No or minimal entries in `EventServiceProvider::$listen`
- Need to search multiple files to find all listeners for a given event
- Listeners registered conditionally based on environment or configuration
- Duplicate listener execution (same listener registered twice)
- Listeners registered in package service providers mixed with application listeners

### Why Harmful
- No single source of truth for event-subscriber relationships
- Auditing event handling requires searching the full codebase
- New events may have listeners registered that are hard to discover
- Removing an event requires finding all registration points
- Adding a developer requires learning where listeners are registered

### Consequences
- Listeners not found when refactoring events (orphaned registrations)
- Debugging difficulty: "does this event have a listener?"
- Duplicate listener execution from multiple registrations
- Onboarding confusion about listener registration conventions
- Git conflicts when multiple teams register listeners in different files

### Preferred Alternative
```php
// In EventServiceProvider:
protected $listen = [
    OrderPlaced::class => [
        SendOrderConfirmation::class,
        UpdateInventoryProjection::class,
        CreateShipment::class,
    ],
];
```

### Refactoring Strategy
1. Search for all `Event::listen()` calls across the codebase
2. Collect all event-to-listener mappings into a single list
3. Move them to `EventServiceProvider::$listen`
4. Remove scattered `Event::listen()` calls
5. Add a team convention about adding listeners only to `EventServiceProvider`

### Detection Checklist
- [ ] Search for `Event::listen(` across all PHP files
- [ ] Check `EventServiceProvider::$listen` for completeness
- [ ] Review each event class — does it have listeners in the provider?
- [ ] Check for listener registration in tests, helpers, or config files
- [ ] Verify no listeners are registered multiple times

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Register All Domain Event Listeners in EventServiceProvider |
| Skill | `06-skills.md` — Dispatch a Domain Event After Transaction Commit |

---

## 5. Synchronous Listeners for Non-Critical Side Effects

### Category
Performance

### Description
Running non-critical side effects (notifications, projections, logging, external API calls) synchronously in the HTTP response path instead of queuing them. Users wait for side effects that don't affect the response.

### Why It Happens
Default listeners are synchronous. Implementing `ShouldQueue` is an explicit choice. Developers may not realize that the listener extends the response time. Queue infrastructure may not be set up.

### Warning Signs
- Listeners that send emails, notifications, or make HTTP calls without `implements ShouldQueue`
- Slow API responses traced to listener execution time
- Timeouts from external API calls in listeners
- Users waiting for emails to be "sent" before seeing a response
- Listener failures causing HTTP 500 errors for non-critical side effects
- Queue worker infrastructure exists but listeners are not configured to use it

### Why Harmful
- HTTP response time includes all side effect execution time
- External API latency in listeners blocks the user response
- Non-critical side effect failures cause 500 errors
- Retry logic for failed side effects is not available (sync = no retry)
- Queue capacity is underutilized while listeners run synchronously

### Consequences
- Slow page load times from synchronous email sending or API calls
- User-facing timeouts when external systems are slow
- 500 errors from non-critical side effect failures
- No automatic retry for failed notifications or projections
- Higher server resource usage during peak traffic (sync IO blocks PHP processes)

### Preferred Alternative
```php
class SendOrderConfirmation implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        Mail::send(...); // Runs on queue — response is immediate
    }
}
```

### Refactoring Strategy
1. Identify listeners performing I/O (email, API calls, file writes, log aggregation)
2. Add `implements ShouldQueue` to listeners whose output is not needed for the response
3. Set up queue worker if not already configured
4. Move synchronous-only critical listeners to sync, everything else to queue
5. Update tests to handle queued listeners (use `Queue::fake()` or run workers)

### Detection Checklist
- [ ] Review each listener class — does it implement `ShouldQueue`?
- [ ] Profile response time with and without listeners (disable listeners temporarily)
- [ ] Check for `Mail::send()`, `Http::post()`, `Log::info()` in synchronous listener paths
- [ ] Review queue worker configuration — is it running?
- [ ] Monitor queue for non-critical listeners that should be async

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use ShouldQueue for Non-Critical Side Effects |
| Decision Tree | `07-decision-trees.md` — Synchronous vs Queued Listeners |
| Skill | `06-skills.md` — Dispatch a Domain Event After Transaction Commit |

---

## 6. Present/Future Tense Event Naming

### Category
Maintainability

### Description
Naming domain event classes in present or future tense (`OrderPlacing`, `OrderWillBePlaced`, `PlaceOrder`) instead of past tense (`OrderPlaced`). The naming creates confusion about whether the event represents something that has already happened or something still in progress.

### Why It Happens
Developers may not have a naming convention for events. Present tense seems natural for event-like classes in some frameworks. The distinction between commands (imperative) and events (past tense) may not be clear.

### Warning Signs
- Event classes named `OrderPlace`, `OrderPlacing`, `PaymentReceive`
- Confusion in code reviews about whether a class is a command or an event
- Listeners that try to prevent the "event" from happening (treating it as interceptable)
- Documentation that refers to events in present tense
- No consistent naming pattern across event classes
- Mix of past tense and present tense in the same Events directory

### Why Harmful
- Ambiguous naming makes it unclear if the event is a notification of something that happened or a request to do something
- Commands and events become hard to distinguish at the class level
- Developers may incorrectly try to prevent an event from executing
- New developers cannot infer the event's semantics from its name
- Inconsistent naming convention reduces codebase coherence

### Consequences
- Code review confusion: "is OrderPlace a command or an event?"
- Incorrect usage patterns: treating events as interceptable hooks
- Listener logic that attempts to "block" past-tense events
- Naming debates in code reviews instead of focusing on logic
- Inconsistent namespace: some events are past tense, some are present

### Preferred Alternative
```php
class OrderPlaced { ... }  // Past tense — it happened
class PaymentReceived { ... }  // Past tense — it happened
class SubscriptionCancelled { ... }  // Past tense — it happened
```

### Refactoring Strategy
1. Identify event classes with present or future tense names
2. Rename to past tense (e.g., `OrderPlacing` → `OrderPlaced`)
3. Update all references (dispatch calls, listener type hints, tests)
4. Add a naming convention to the project's coding standards
5. Separate commands (imperative tense) from events (past tense) in the directory structure

### Detection Checklist
- [ ] List all event class names and check for tense consistency
- [ ] Search for patterns like `Order`, `Payment`, `User` ending in present tense
- [ ] Verify command classes (if any) use a different naming convention
- [ ] Check test names for correct event tense
- [ ] Review the Events directory for inconsistent naming patterns

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Name Domain Events in Past Tense |
| Skill | `06-skills.md` — Dispatch a Domain Event After Transaction Commit |
