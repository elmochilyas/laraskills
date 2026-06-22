# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Backend Architecture Design |
| Subdomain | Event Sourcing |
| Knowledge Unit | Laravel events are NOT event sourcing |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel Events system, Eloquent model events, Event-driven architecture basics |
| Related KUs | Domain events in Eloquent, After-commit events and jobs, Model observers and lifecycle signals |
| Source | domain-analysis.md |

# Overview

Laravel events (`illuminate/events`) are a decoupling and side-effect mechanism — fire-and-forget or queued listeners. They are NOT event sourcing. Event sourcing requires an append-only event store, aggregates that produce events, projections that build read models from events, snapshots for performance, versioned events with schema evolution, and replay capability. Confusing Laravel events with event sourcing leads to incorrect architectural claims about rebuilding state or replaying history. If you are merely logging what happened, call it an "audit log" or "event audit table" — not "event sourcing."

# Core Concepts

- **Laravel events**: Synchronous or queued side-effect dispatching via `event()`. Used for decoupling notifications, queued work, audit triggers, and lifecycle signals. They are fire-and-forget — the event may or may not be persisted; listeners handle side effects.
- **Event sourcing**: Architectural pattern where the state of an aggregate is derived by replaying a sequence of immutable, append-only domain events. The event store is the source of truth. Projections build read models from the event stream.
- **Required event sourcing components**: (1) append-only event store, (2) aggregates that produce events, (3) projections that build read models, (4) snapshots for performance, (5) versioned events with schema evolution, (6) replay capability.
- **Laravel `$dispatchesEvents` property**: Models with `protected $dispatchesEvents` fire Laravel lifecycle events — `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `deleting`, `deleted`. These are lifecycle hooks for side effects, NOT domain events in the event sourcing sense.
- **Audit log vs event store**: An audit log records what happened for debugging/compliance. An event store is the primary source of truth from which state is derived. They serve different purposes.

# When To Use Laravel Events

- Decoupling side effects from business logic (send email on order placed, invalidate cache on post updated)
- Firing notifications to multiple channels (email, Slack, in-app)
- Dispatching queued work asynchronously
- Audit triggers that log what happened (not rebuild state)
- Lifecycle signals: `created`, `updated`, `deleted` hooks
- Any time you need to notify other parts of the system that something happened, without the notifier knowing who is listening

# When Event Sourcing Is Appropriate

Event sourcing is appropriate ONLY when:
- Full audit history is legally required (finance, healthcare, compliance)
- Temporal queries are needed: "what did this record look like last Tuesday?"
- Complex state machines need undo/redo capabilities
- The domain naturally expresses as a sequence of events (banking transactions, supply chain)
- You need to rebuild read models from history
- Compliance-heavy domains (SOX, HIPAA, PCI-DSS)

Do NOT claim "we use event sourcing" unless the architecture explicitly includes: event store, aggregates, projections, snapshots, versioned events, and replay strategy.

# When Laravel Events Are NOT Event Sourcing

- If you fire `event(new OrderPlaced($order))` and listeners send email or update a dashboard, that's decoupled side effects — not event sourcing.
- If you store events in a `model_events` table for debugging, that's an audit log — not event sourcing.
- If your model has `$dispatchesEvents = ['created' => UserCreated::class]`, those are lifecycle hooks — not domain events.
- If you cannot replay all events from the beginning to rebuild the current state of any aggregate, you do not have event sourcing.

# Best Practices (WHY)

- **Use "audit log" or "event audit table" terminology**: Reason: If you persist events only for debugging/compliance, calling it "event sourcing" creates false expectations about replayability and state derivation. Be precise about what your system does.
- **Use Laravel events for decoupling side effects**: Reason: This is what they are designed for. They excel at notifying email services, cache layers, and search indexes without coupling the core business logic.
- **Use `$dispatchesEvents` for lifecycle hooks, not domain events**: Reason: Lifecycle events (`created`, `updated`) fire during the Eloquent lifecycle. Domain events (`OrderPlaced`, `SubscriptionCancelled`) should be dispatched explicitly in business logic, not implicitly via model hooks.
- **Only adopt event sourcing when you need it**: Reason: Event sourcing adds significant complexity (event store, projections, versioning, snapshots, replay). Most applications do not need it. Start with plain CRUD + side-effect events.

# Architecture Guidelines

- **Terminology precision**: If events are persisted for debugging/compliance, call it "audit log" or "event audit table." If events rebuild state, call it "event sourcing." Never conflate the two.
- **Event store distinct from application database**: A proper event store is append-only with immutable events. Do not use the same database tables that your application writes to as an "event store."
- **Projections vs listeners**: Event sourcing projections rebuild read models. Laravel event listeners handle side effects. They serve different purposes.
- **Package selection**: `spatie/laravel-event-sourcing` provides real event sourcing components (aggregates, projectors, reactors, snapshots). `spatie/laravel-event-projector` is the predecessor. Regular Laravel events need no package.

# Performance Considerations

- Laravel events add minimal overhead (~microseconds for synchronous dispatch). Queued listeners add queue overhead.
- Event sourcing replay on large event streams can be slow. Snapshots are essential for performance (store aggregate state every N events).
- Event store growth: millions of events consume significant storage. Plan for partitioning, archiving, or snapshot-based truncation.
- Projection rebuild time: rebuilding all projections from the full event stream can take hours on large systems. Design for incremental projections.

# Security Considerations

- Event store events are immutable and append-only — they cannot be deleted or modified. Ensure PII handling complies with GDPR right-to-erasure (consider crypto-shredding or PII-free events).
- Event payloads persist forever in the event store. Never include secrets, tokens, or raw passwords in event data.
- Projections may cache sensitive data from events. Apply the same access controls to projections as to the original data.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Calling Laravel events "event sourcing" | Misunderstanding the architectural pattern | Stakeholders expect replay, temporal queries, and state derivation — which don't exist | Use precise terminology: "domain events" for decoupling, "event sourcing" only when the full pattern is implemented |
| Treating `$dispatchesEvents` as domain events | Laravel docs show lifecycle hooks on models | Business events fire during save (not at the right semantic boundary), couple to ORM lifecycle | Dispatch domain events explicitly in actions/services, not via model hooks |
| Storing events in a `model_events` table and calling it "event sourcing" | Wanting to sound architecturally sophisticated | Team treats the audit log as a source of truth, tries to rebuild state from incomplete data | Call it "audit log" or "event audit table." If you need event sourcing, use a proper event store |
| Using Laravel events for state transitions | Convenience of `event()` and listeners | State transitions happen in listeners, not in the aggregate. Side effects can't roll back with the transaction | Move state transitions to the aggregate; use events only for side-effect notification |
| Assuming Laravel events can be replayed | Misunderstanding of fire-and-forget semantics | Listeners are not idempotent; replaying events sends duplicate emails, creates duplicate records | Laravel events are not designed for replay. Use an event store with projectors if replay is needed |

# Anti-Patterns

- **"Event sourcing" without an event store**: Claiming event sourcing but using a regular database table that allows updates and deletes. The source of truth must be append-only.
- **"Event sourcing" without replay capability**: If you cannot drop all projections and rebuild them from the event stream, you don't have event sourcing.
- **"Event sourcing" without aggregates**: If every service can fire arbitrary events without an aggregate enforcing invariants, you have an event firehose, not event sourcing.
- **Domain events via model hooks**: `$dispatchesEvents = ['created' => OrderPlaced::class]` — the event fires during `save()`, coupling domain semantics to ORM persistence. Domain events should be explicit in business logic.
- **Side-effect listeners that mutate state**: A listener for `OrderPlaced` that changes the order status from "placed" to "confirmed." State mutations belong in the aggregate or action, not in listeners.

# Examples

**Laravel events (decoupling side effects) — NOT event sourcing**
```php
// Domain event — decouples side effects
class OrderPlaced
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Order $order) {}
}

// Explicit dispatch in business logic
class PlaceOrderAction
{
    public function execute(PlaceOrderDTO $dto): Order
    {
        $order = DB::transaction(function () use ($dto) {
            $order = Order::create([...]);
            $order->items()->createMany($dto->items);
            return $order;
        });

        // Side effects: decoupled, fire-and-forget
        event(new OrderPlaced($order))->afterCommit();

        return $order;
    }
}

// Listeners handle side effects (notifications, cache, search index)
class SendOrderConfirmation
{
    public function handle(OrderPlaced $event): void
    {
        // Send email — side effect, not state derivation
        Mail::to($event->order->user)->send(new OrderConfirmation($event->order));
    }
}
```

**Audit log (debugging/compliance) — NOT event sourcing**
```php
// This is an audit log, not an event store
Schema::create('model_events', function (Blueprint $table) {
    $table->id();
    $table->morphs('eventable');
    $table->string('event_type');      // 'created', 'updated', 'status_changed'
    $table->json('old_values')->nullable();
    $table->json('new_values');
    $table->foreignId('user_id')->nullable();
    $table->timestamps();
});

// Record for debugging — NOT the source of truth
ModelEvent::create([
    'eventable_type' => Order::class,
    'eventable_id' => $order->id,
    'event_type' => 'status_changed',
    'old_values' => ['status' => 'pending'],
    'new_values' => ['status' => 'paid'],
    'user_id' => auth()->id(),
]);
```

**Real event sourcing (with aggregate, event store, projection)**
```php
// Event sourcing aggregate — produces events
class OrderAggregate extends AggregateRoot
{
    public function placeOrder(CreateOrderDTO $dto): self
    {
        $this->recordThat(new OrderPlacedEvent(
            orderId: $dto->orderId,
            userId: $dto->userId,
            items: $dto->items,
            total: $dto->total,
        ));

        return $this;
    }

    public function markAsPaid(): self
    {
        // Aggregate enforces invariant
        if ($this->status !== OrderStatus::Placed) {
            throw new \DomainException('Only placed orders can be paid');
        }

        $this->recordThat(new OrderPaidEvent(
            orderId: $this->orderId,
            paidAt: now(),
        ));

        return $this;
    }

    // State is rebuilt from events — NOT stored as current state
    protected function applyOrderPlacedEvent(OrderPlacedEvent $event): void
    {
        $this->orderId = $event->orderId;
        $this->status = OrderStatus::Placed;
        $this->total = $event->total;
    }

    protected function applyOrderPaidEvent(OrderPaidEvent $event): void
    {
        $this->status = OrderStatus::Paid;
        $this->paidAt = $event->paidAt;
    }
}

// Projection — builds read model from events
class OrderProjection extends Projector
{
    public function onOrderPlaced(OrderPlacedEvent $event): void
    {
        OrderReadModel::create([
            'uuid' => $event->orderId,
            'user_id' => $event->userId,
            'status' => 'placed',
            'total' => $event->total,
        ]);
    }

    public function onOrderPaid(OrderPaidEvent $event): void
    {
        OrderReadModel::where('uuid', $event->orderId)
            ->update(['status' => 'paid', 'paid_at' => $event->paidAt]);
    }
}
```

# Related Topics

- Domain events in Eloquent (explicit business event dispatching)
- After-commit events and jobs (deferring side effects until transaction commits)
- Model observers and lifecycle signals (Eloquent's built-in lifecycle hooks)
- Event sourcing patterns with spatie/laravel-event-sourcing
- CQRS (Command Query Responsibility Segregation — often paired with event sourcing)
- Audit logging patterns

# AI Agent Notes

- Never describe Laravel events as "event sourcing" in generated code, documentation, or explanations. Use "domain events" or "side-effect events" instead.
- When a user says "we use event sourcing" but their code only has `event(new SomethingHappened(...))` and listeners that send emails, gently clarify the distinction and suggest using precise terminology.
- If a user asks "should I use event sourcing?", first ask if they have requirements for: full audit history, temporal queries, undo/redo, or state replay. If none of these apply, recommend sticking with Laravel events + audit logs.
- When generating event-sourcing code, ensure all required components are present: event store, aggregate, events, projections, snapshots, and replay capability.
- For audit log generation, use "audit log" or "event audit table" naming. Do not name it "events" or "event_store" unless it is a real event store.

# Verification

- [ ] Terminology is precise: "audit log" vs "event sourcing" vs "domain events" vs "lifecycle hooks"
- [ ] Event sourcing claims backed by: event store, aggregates, projections, snapshots, versioning, replay
- [ ] Laravel events used only for side-effect decoupling, not for state derivation
- [ ] `$dispatchesEvents` used only for lifecycle hooks, not domain events
- [ ] No claims about "replaying events to rebuild state" unless event sourcing infrastructure exists
- [ ] Audit logs named as "audit log" or "model_events" — not "event_store"
- [ ] Domain events dispatched explicitly in business logic, not implicitly via model hooks
