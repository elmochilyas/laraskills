# Anti-Patterns: Event-Driven Architecture with Webhook Event Sourcing (CQRS/ES)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | Event-Driven Architecture with Webhook Event Sourcing (CQRS/ES) |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Event Sourcing for Every Webhook Regardless of Criticality | Architecture | High |
| 2 | Unversioned Events | Maintenance | Critical |
| 3 | Business Logic in Reactors Instead of Projectors | Architecture | High |
| 4 | Projectors Dependent on External Services | Reliability | Critical |
| 5 | No Snapshot Strategy for Long-Running Aggregates | Performance | Medium |

---

## Anti-Pattern 1: Event Sourcing for Every Webhook Regardless of Criticality

### Category
Architecture

### Description
Applying full CQRS/event sourcing (event store, projectors, reactors, replay infrastructure) to every webhook delivery, including low-criticality notifications and activity feeds.

### Why It Happens
Teams adopt event sourcing as a golden hammer after experiencing its benefits for critical payment webhooks. The same infrastructure is applied uniformly without evaluating whether the complexity is justified for each use case.

### Warning Signs
- Event sourcing infrastructure manages notification emails and activity feed updates
- Non-critical webhooks go through the same replay infrastructure as payment webhooks
- Developers complain about the complexity of adding a simple webhook handler
- Storage costs grow linearly with all webhook types, including ephemeral notifications

### Why Harmful
Event sourcing adds significant complexity: event store tables, projector classes, reactor infrastructure, replay orchestration, and snapshot management. For non-critical webhooks, a simple audit table + logging provides sufficient traceability at a fraction of the operational cost.

### Real-World Consequences
- Developer productivity drops: adding a simple webhook handler takes days instead of hours
- Event store storage costs 10x higher than necessary
- Replay takes hours because it processes millions of notification events nobody ever replays
- Infrastructure complexity causes incidents during simple webhook configuration changes

### Preferred Alternative
Use event sourcing only for critical webhook delivery paths (payment, account changes, compliance events). Use simpler patterns (Spatie webhook-server + audit table) for non-critical webhooks.

```php
// Critical: event sourcing
event(new WebhookDeliveryAttempted($webhook));
// Non-critical: audit log
Log::info('Webhook received', ['type' => $event->type, 'provider' => $provider]);
```

### Refactoring Strategy
1. Classify all webhook types by criticality (critical: payment, auth, compliance; standard: notifications, activity)
2. Keep event sourcing for critical paths; migrate standard paths to audit-table logging
3. Remove non-critical event types from projectors and replay operations
4. Add storage and replay time monitoring to validate the separation
5. Document the classification criteria for future webhook additions

### Detection Checklist
- [ ] Webhook types are classified by criticality
- [ ] Only critical webhooks use full event sourcing infrastructure
- [ ] Non-critical webhooks use simpler patterns (audit table + logging)
- [ ] Replay operations exclude non-critical event types
- [ ] Storage costs are proportional to critical webhook volume

### Related Rules/Skills/Trees
- Rule: Use event sourcing only for critical webhook delivery paths
- Rule: Use simpler pattern for standard webhook delivery without CQRS overhead
- Skill: Projector classes for delivery status views

---

## Anti-Pattern 2: Unversioned Events

### Category
Maintenance

### Description
Storing webhook delivery events without a version identifier, making it impossible to handle schema changes in event payloads over time.

### Why Happens
When event sourcing is first implemented, there is only one version of each event. Developers skip versioning, planning to add it later. "Later" never comes until a schema change breaks replay.

### Warning Signs
- Event classes have no `$event->version()` method or similar version identifier
- Event payload structure has never changed since initial implementation
- Adding a new field to an event requires modifying existing projectors
- Replay from scratch fails after event schema changes

### Why Harmful
Without versioning, any change to an event's schema is a breaking change. Existing events in the store use the old schema; projectors processing them during replay expect the new schema. This makes schema migration a manual, risky, per-event operation.

### Real-World Consequences
- Adding one field to `WebhookDeliverySucceeded` breaks all existing events in the store
- Production replay requires running custom migration scripts before it can proceed
- Teams avoid adding useful fields to events because "it will break everything"
- Data loss: old events that fail deserialization are skipped during replay

### Preferred Alternative
Add a version field to every event class from the initial implementation, even if there is only one version. Use upcasters to convert old event versions to the current schema during replay.

```php
class WebhookDeliverySucceeded extends Event {
    public function version(): int {
        return 2; // Current version
    }
}

// Upcaster for old events
class WebhookDeliverySucceededUpcaster implements EventUpcaster {
    public function upcast(StoredEvent $event): StoredEvent {
        if ($event->event_version >= 2) return $event;
        $payload = $event->payload;
        $payload['delivered_at'] = $payload['timestamp'] ?? null; // Field renamed
        return $event->withPayload($payload)->withVersion(2);
    }
}
```

### Refactoring Strategy
1. Add version property to all existing event classes (set to 1)
2. Implement an upcaster registry that converts events to current version during replay
3. When schema changes are needed, increment the version and create an upcaster
4. Test replay with old-format fixtures to verify upcasters work
5. Document event schema changes alongside code changes

### Detection Checklist
- [ ] Every event class has a version identifier
- [ ] Version is added from initial implementation (even version 1)
- [ ] Upcasters exist for each schema change
- [ ] Replay test covers events of all known versions
- [ ] Projector position tracking handles versioned events correctly

### Related Rules/Skills/Trees
- Rule: Version events from day 1, even with only one version
- Rule: Event versioning implemented from day 1
- Related KU: Spatie laravel-event-sourcing (event upcasting)

---

## Anti-Pattern 3: Business Logic in Reactors Instead of Projectors

### Category
Architecture

### Description
Placing core business logic and state calculation in reactors (side-effect handlers) instead of projectors (read model builders), making the system's primary processing path asynchronous and unreliable.

### Why Happens
Reactors are intuitive: "when this event happens, do this thing." Developers put decision-making and state updates in reactors because it feels like the natural place to respond to events.

### Warning Signs
- Reactors modify database state or make decisions based on event data
- Projectors only store data; reactors contain the real logic
- Replay produces incorrect state because reactor side effects are not replayed
- Reactors fail independently, causing business logic to be skipped silently

### Why Harmful
Reactors are designed for side effects (notifications, alerts), not for state management. They are not replayed during event replay, so business logic in reactors is invisible during recovery. Reactor failures are silent (side effects may fail without affecting event processing), leading to undetected data inconsistency.

### Real-World Consequences
- After a replay, delivery status read models show correct state but financial calculations (in reactors) are wrong
- A reactor failure during payment processing means the customer is charged but not notified (and reactor doesn't retry)
- Audit team asks why payment calculations during replay differ from original run (because reactors don't replay)
- Debugging business logic requires checking two different code locations

### Preferred Alternative
Place business logic and state calculation in projectors, which are replayed. Reactors should only handle side effects: notifications, third-party calls, logging.

```php
// Correct: business logic in projector
class PaymentStatusProjector extends Projector {
    public function onPaymentReceived(PaymentReceived $event): void {
        PaymentAggregate::updateOrCreate(
            ['id' => $event->aggregateUuid()],
            ['status' => 'pending', 'amount' => $event->amount]
        );
    }
}

// Reactor handles only side effects
class PaymentNotificationReactor extends Reactor {
    public function onPaymentReceived(PaymentReceived $event): void {
        Mail::to($event->userEmail)->send(new PaymentNotification($event));
    }
}
```

### Refactoring Strategy
1. Audit all reactors for business logic and state manipulation
2. Move state changes and calculations from reactors to projectors
3. Ensure projectors contain all logic needed for replay correctness
4. Keep reactors only for side effects (email, Slack, third-party API calls)
5. Test replay produces identical state regardless of reactor execution

### Detection Checklist
- [ ] Projectors contain all state calculation and business logic
- [ ] Reactors only handle side effects (notifications, external calls)
- [ ] Replay produces identical state without reactors running
- [ ] Reactor failures do not affect event processing or state consistency
- [ ] Reactor-side effects are idempotent (safe to retry)

### Related Rules/Skills/Trees
- Rule: Use projectors for delivery status views, not direct event store queries
- Rule: Use reactors for cross-cutting concerns (notifications, reconciliation)
- Related KU: CQRS fundamentals (command-query responsibility segregation)

---

## Anti-Pattern 4: Projectors Dependent on External Services

### Category
Reliability

### Description
Projectors that call external APIs, databases, or services during event processing, making replay dependent on the availability and state of those external systems.

### Why Happens
Projectors need data from other systems to build read models. Developers inject repository or HTTP client dependencies directly into projectors instead of sourcing all required data from the event itself.

### Warning Signs
- Projector constructor accepts external service dependencies (Http, Redis, external repositories)
- Replay requires all external systems to be available and in correct state
- Replay makes thousands of external API calls, taking hours and exhausting rate limits
- Replay succeeds in development but fails in production due to external system state differences

### Why Harmful
Event replay should rebuild application state from events alone. When projectors depend on external services, replay becomes dependent on those services being available, having the correct data, and not rate-limiting the replay. This makes disaster recovery fragile and time-consuming.

### Real-World Consequences
- Disaster recovery replay fails because the external CRM API is unavailable
- Replay rate-limited by external service after 1000 API calls (and there are 1M events)
- Replay produces different results because external data has changed since events were recorded
- Compliance audit requires running replay; takes 3 days and requires multiple external system coordination

### Preferred Alternative
Include all data needed for projection in the event payload itself. If external data is needed, fetch it in a reactor and store it as additional events before the projector runs.

```php
// Bad: projector fetches external data
class BadProjector extends Projector {
    public function __construct(private UserRepository $users) {}
    public function onPaymentReceived(PaymentReceived $event): void {
        $user = $this->users->find($event->userId); // External dependency!
        $event->setUserName($user->name);
    }
}

// Good: all data in the event
class PaymentReceived {
    public function __construct(
        public readonly string $userId,
        public readonly string $userName,  // Included in event
        public readonly int $amount,
    ) {}
}
```

### Refactoring Strategy
1. Identify all external dependencies in projectors
2. Expand event payloads to include all data needed by projectors
3. If data availability is a concern, create intermediate events (UserLookupCompleted) populated by reactors
4. Move external data enrichment to reactors that fire before the projection step
5. Test replay produces identical results without external systems

### Detection Checklist
- [ ] Projectors do not call external APIs or databases
- [ ] All data needed for projection is in the event payload
- [ ] Replay produces identical results regardless of external system state
- [ ] Event payloads are self-contained for projection purposes
- [ ] Any enrichment uses intermediate events, not projector dependencies

### Related Rules/Skills/Trees
- Rule: Projectors must handle idempotency for safe replay
- Rule: Test replay regularly to ensure projectors can rebuild from scratch
- Related KU: Reactors for side effects separate from delivery logic

---

## Anti-Pattern 5: No Snapshot Strategy for Long-Running Aggregates

### Category
Performance

### Description
Allowing webhook aggregate event streams to grow unbounded without snapshots, causing replay to process the entire event stream from the beginning every time.

### Why Happens
Snapshot strategies are often deferred as a future optimization. Teams focus on getting event sourcing working and don't plan for how replay performance degrades as event streams grow.

### Warning Signs
- Replay time increases linearly with event store size
- Single webhook aggregate has thousands of events (retries, status changes)
- No aggregate snapshot code exists in the codebase
- Replay of long-running aggregates times out or exceeds resource limits

### Why Harmful
Without snapshots, every replay processes every event in the aggregate's lifetime. A webhook delivery with 100 retry attempts and status changes requires replaying all 100+ events to reach current state. Over months, this makes replay prohibitively slow for aggregates with many events.

### Real-World Consequences
- Replay takes 6+ hours for aggregates with 50K+ events
- Disaster recovery RTO (Recovery Time Objective) missed because replay is too slow
- Developers avoid replaying because it takes too long
- Snapshot added as emergency measure during production incident

### Preferred Alternative
Implement snapshot strategies for long-running aggregates. Take periodic snapshots of aggregate state so replay can start from the most recent snapshot instead of the beginning.

```php
class WebhookDeliveryAggregate extends AggregateRoot {
    public function takeSnapshot(): void {
        $this->snapshot(new WebhookDeliverySnapshot(
            aggregateUuid: $this->uuid(),
            state: $this->getState(), // Current aggregate state
            lastEventId: $this->lastEventId(),
        ));
    }
}

// During replay, start from snapshot
$aggregate = WebhookDeliveryAggregate::retrieveFromSnapshot($uuid);
// Only replays events since the last snapshot
```

### Refactoring Strategy
1. Measure aggregate event stream lengths to identify aggregates needing snapshots
2. Implement snapshot creation at configurable intervals (every 100 events, daily, or on terminal state)
3. Update replay logic to start from the most recent snapshot
4. Add snapshot compression for storage efficiency
5. Monitor snapshot age and trigger snapshot creation for stale aggregates

### Detection Checklist
- [ ] Snapshot strategy is implemented for long-running aggregates
- [ ] Replay starts from most recent snapshot, not beginning
- [ ] Snapshots are taken at configured intervals or event counts
- [ ] Snapshot storage is monitored for growth
- [ ] Aggregate terminal states trigger a final snapshot

### Related Rules/Skills/Trees
- Rule: Snapshots for long-running aggregates to speed up replay
- Rule: Append-only event store grows unbounded; implement cleanup policies
- Decision Tree: Snapshot strategy selection based on aggregate event volume
