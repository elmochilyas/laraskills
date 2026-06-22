# Rules: Laravel Events vs Event Sourcing

**Domain:** Backend Architecture Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Laravel Events vs Event Sourcing

---

## Rule 1: Never Call Laravel Events "Event Sourcing"

**Category:** Terminology / Architecture

**Rule:** Use precise terminology. Laravel's `event()` system is a "domain event" or "side-effect dispatch" mechanism. Event sourcing is a specific architectural pattern requiring: append-only event store, aggregates, projections, snapshots, versioned events, and replay capability. If you don't have all of these, you don't have event sourcing.

**Reason:** Calling Laravel events "event sourcing" creates false expectations. Stakeholders expect temporal queries ("what did this order look like last Tuesday?"), state replay ("rebuild the read model from history"), and full auditability. Laravel events provide none of these. Imprecise terminology leads to architectural misunderstandings and compliance gaps.

**Bad Example:**
```php
// DANGER: claiming "event sourcing" for Laravel event dispatch
event(new OrderPlaced($order));

// Documentation says: "We use event sourcing to track order lifecycle"
// Reality: This is a fire-and-forget notification. Events are not persisted.
// Stakeholders expect replay capability that doesn't exist.
```

**Good Example:**
```php
// Correct: precise terminology
// "We use Laravel domain events to decouple side effects from business logic.
//  We maintain a separate audit log for compliance. We do not use event sourcing."

event(new OrderPlaced($order)); // Domain event — decouples side effects

// Audit log — separate table for compliance, not an event store
OrderAudit::create([
    'order_id' => $order->id,
    'event' => 'placed',
    'data' => $order->toArray(),
]);
```

**Exceptions:** None. Terminology precision is a professional obligation. If stakeholders misunderstand your architecture because of imprecise language, the fault is in the communication.

**Consequences Of Violation:** Compliance auditors expect event sourcing capabilities that don't exist. New team members try to "replay events" and find it's impossible. Technical due diligence (acquisitions, SOC2 audits) reveals the gap, eroding trust.

---

## Rule 2: Dispatch Domain Events Explicitly in Business Logic, Not via Model Lifecycle Hooks

**Category:** Architecture

**Rule:** Domain events like `OrderPlaced`, `SubscriptionCanceled`, `PaymentFailed` should be dispatched explicitly in actions or services. Do not dispatch them via Eloquent's `$dispatchesEvents` property or model observers. Model lifecycle hooks are for persistence concerns (generating slugs, setting UUIDs, invalidating caches), not business events.

**Reason:** `$dispatchesEvents = ['created' => OrderPlaced::class]` couples domain semantics to ORM persistence. If an order is created via a factory, seeder, or import script, the domain event fires — but "order placed" is a business concept that only makes sense when a customer places an order. The ORM lifecycle is the wrong semantic boundary for domain events.

**Bad Example:**
```php
// DANGER: domain event tied to ORM lifecycle
#[ObservedBy(OrderObserver::class)]
class Order extends Model
{
    protected $dispatchesEvents = [
        'created' => OrderPlaced::class, // Fires on seeder, factory, import too
    ];
}
```

**Good Example:**
```php
// Correct: domain event dispatched explicitly at the right semantic boundary
class PlaceOrderAction
{
    public function execute(PlaceOrderDTO $dto): Order
    {
        $order = DB::transaction(function () use ($dto) {
            $order = Order::create([...]);
            $order->items()->createMany($dto->items);
            return $order;
        });

        // Domain event — dispatched at the business boundary, not the ORM boundary
        event(new OrderPlaced($order))->afterCommit();

        return $order;
    }
}
```

**Exceptions:** Audit logging (recording every create/update/delete for compliance) is appropriate via model observers — but this is an audit concern, not a domain event. The observer logs "model was created" not "order was placed."

**Consequences Of Violation:** Domain events fire during seeders (flooding notification queues), data imports (spamming customers), and tests (triggering side effects unintentionally). The business logic boundary is lost — the ORM lifecycle becomes the de facto business boundary.

---

## Rule 3: If You Store Events for Debugging, Call It an "Audit Log" — Not an "Event Store"

**Category:** Terminology / Architecture

**Rule:** If you persist events to a database table for debugging, compliance, or operational visibility, name it `model_events`, `audit_log`, or `activity_log`. Do not name it `events`, `event_store`, or `domain_events`. An event store is the append-only primary source of truth from which aggregate state is derived — an audit log is a diagnostic record of what happened.

**Reason:** Naming the table `event_store` implies it's the source of truth. Team members will try to rebuild state from it and find it's incomplete or inconsistent. This wastes engineering time and creates incorrect assumptions about data integrity. Name communicates intent — make it accurate.

**Bad Example:**
```php
// DANGER: table named "event_store" but it's just an audit log
Schema::create('event_store', function (Blueprint $table) {
    $table->id();
    $table->string('event_type');
    $table->json('data');
    $table->timestamps();
    // Updates allowed, no aggregate ID, no versioning — NOT an event store
});
```

**Good Example:**
```php
// Correct: audit log with appropriate naming
Schema::create('model_events', function (Blueprint $table) {
    $table->id();
    $table->morphs('eventable');     // Polymorphic — any model
    $table->string('event_type');    // 'created', 'updated', 'status_changed'
    $table->json('old_values')->nullable();
    $table->json('new_values');
    $table->foreignId('user_id')->nullable();
    $table->timestamps();
});
```

**Exceptions:** If your system genuinely uses event sourcing with spatie/laravel-event-sourcing, the `stored_events` table from that package IS an event store — because it's append-only, contains versioned events with aggregate IDs, and is used by projectors to build read models. The naming is accurate.

**Consequences Of Violation:** Engineers waste days trying to rebuild state from a table that was never designed for it. Auditors question why "the event store" allows updates and deletes. The system's architecture is misrepresented in documentation and reviews.

---

## Rule 4: Only Adopt Event Sourcing When Requirements Demand It

**Category:** Architecture

**Rule:** Event sourcing adds significant complexity: event store management, event schema versioning, projection rebuilds, snapshot strategies, and eventual consistency between event store and read models. Default to plain CRUD with domain events for side-effect decoupling. Only adopt event sourcing when you have concrete requirements: full audit/replay, temporal queries, undo/redo, or compliance-mandated immutability.

**Reason:** Event sourcing roughly doubles the architectural complexity of a system. For most SaaS applications, CRUD + domain events + audit log is sufficient and simpler to develop, test, and operate. Premature event sourcing is over-engineering.

**Bad Example:**
```php
// DANGER: event sourcing for a simple task management app
// Problem: no temporal query requirements, no compliance mandate, no undo/redo
// Cost: event store, aggregates, projectors, snapshots, replay tests — all unnecessary
class TaskAggregate extends AggregateRoot
{
    public function createTask(string $title): self
    {
        $this->recordThat(new TaskCreated($title));
        return $this;
    }
    // ... dozens of boilerplate for simple CRUD
}
```

**Good Example:**
```php
// Correct: simple CRUD + domain events for a task app
class CreateTaskAction
{
    public function execute(CreateTaskDTO $dto): Task
    {
        $task = Task::create($dto->toArray());

        event(new TaskCreated($task))->afterCommit();

        return $task;
    }
}
```

**Exceptions:** Financial systems, healthcare systems, compliance-heavy domains, supply chain systems with chain-of-custody requirements. These domains naturally express as event sequences and benefit from event sourcing's guarantees.

**Consequences Of Violation:** Months of development spent on event sourcing infrastructure that provides no business value. Team struggles with event versioning, projection rebuilds, and eventual consistency bugs. The complexity drags on feature velocity for years.

---

## Rule 5: Event Sourcing Requires Append-Only Immutability — Never Mutate or Delete Events

**Category:** Data Integrity

**Rule:** If you implement event sourcing, the event store must be append-only and immutable. Never allow UPDATE or DELETE operations on stored events. State is derived by replaying events, not by mutating them. If an event was recorded incorrectly, record a compensating/correcting event — never modify the original.

**Reason:** The entire premise of event sourcing is that the event store is the definitive, auditable record of everything that happened. If events can be modified, the audit trail is compromised and state derivation becomes non-deterministic. Immutability is the foundational property.

**Bad Example:**
```php
// DANGER: mutating a stored event — destroys audit trail
$event = StoredEvent::find($eventId);
$data = $event->event_data;
$data['amount'] = 9999; // "Fixing" a wrong amount
$event->update(['event_data' => $data]);
```

**Good Example:**
```php
// Correct: compensating event preserves the audit trail
$aggregate = OrderAggregate::retrieve($orderId);
$aggregate->correctAmount(originalAmount: 10000, correctedAmount: 9999);
$aggregate->persist();

// This records an OrderAmountCorrected event AFTER the original OrderPlaced event.
// The event store now shows: Placed(10000) → Corrected(9999)
// The audit trail is preserved — both the mistake and the correction are visible.
```

**Exceptions:** GDPR right-to-erasure may require PII removal from events. Use crypto-shredding (delete the encryption key, not the event data) or field-level nullification (set PII fields to null, preserving the rest of the event).

**Consequences Of Violation:** The audit trail is compromised. State derivation from events becomes non-deterministic. Compliance certifications (SOC2, PCI-DSS) are invalidated. The fundamental value proposition of event sourcing is destroyed.
