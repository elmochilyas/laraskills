# Domain Event vs Model Event — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Domain Event vs Model Event |
| Focus | Anti-patterns in event type selection and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Business Logic in Model Event Observers | Architecture | Critical |
| 2 | Domain Events Dispatched From Model Events | Architecture | Critical |
| 3 | Model Instances in Domain Event Payloads | Architecture | High |
| 4 | Model Events Not Disabled for Bulk Operations | Performance | High |
| 5 | Domain Events Mapped via `$dispatchesEvents` | Framework Usage | High |
| 6 | Incorrect Naming: Domain Events vs Model Events | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- Model event observers are the most common location for misplaced business logic that should be domain events
- Domain events dispatched from `$dispatchesEvents` or `saved`/`created` observers fire on every persistence operation, including irrelevant saves
- Bulk imports and seeding rarely disable model events, causing order-of-magnitude performance degradation

---

## 1. Business Logic in Model Event Observers

### Category
Architecture

### Description
Placing business logic (notifications, status transitions, cross-aggregate workflows) inside Eloquent model event observers (`saved`, `created`, `updated`). The logic fires on every persistence operation, including `touch()` calls, mass updates, and factory creation.

### Why It Happens
Observers are convenient: they automatically fire on model changes. Developers may not distinguish between "something was saved" and "something meaningful happened." The observer pattern seems like the right place for reactive logic.

### Warning Signs
- `Mail::send()`, `Event::dispatch()`, or `DB::insert()` inside observer methods
- Observer methods with `if ($model->wasChanged('status'))` guarding business logic
- Business workflows triggered during factory creation in tests
- Side effects during `touch()` calls or mass `update()` operations
- Observer methods that load relationships and perform cross-aggregate operations
- Factories that trigger emails, notifications, or API calls during test setup

### Why Harmful
- Business logic fires on every `save()`, including `touch()` and incidental updates
- Test factories trigger business side effects (emails, API calls) during setup
- `touch()` on a model fires observers, triggering business workflows for a timestamp update
- Bulk `update()` queries trigger observers for each record
- Impossible to save a model without triggering business reactions

### Consequences
- Phantom emails sent for `touch()` operations
- Test pollution: factory creation triggers business side effects
- Performance degradation: bulk operations trigger observers per record
- Hard-to-debug side effects from seemingly innocuous saves
- Impossible to perform admin data fixes without triggering business workflows

### Preferred Alternative
```php
// Model event — infrastructure only
class OrderObserver
{
    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}");
    }
}

// Domain method dispatches business event explicitly
class Order extends Model
{
    public function place(): void
    {
        $this->status = 'placed';
        $this->save();
        Event::dispatch(new OrderPlaced($this->id));
    }
}
```

### Refactoring Strategy
1. Identify business logic in observer methods
2. Create domain event classes for each business occurrence
3. Move business logic from observers to domain event listeners
4. Replace `$model->save()` with explicit domain method calls that dispatch events
5. Restrict observers to infrastructure concerns only

### Detection Checklist
- [ ] Search observer methods for `Mail::`, `Event::dispatch`, `Notification::`, `Http::`, `dispatch(`
- [ ] Check observer methods for business-specific conditions (`wasChanged('status')`)
- [ ] Review test output for unexpected side effects during factory creation
- [ ] Check if `touch()` triggers business workflows
- [ ] Profile bulk operations for unexpected observer execution

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Model Events Only for Infrastructure Side Effects |
| Rule | `05-rules.md` — Never Write Business Logic in Model Event Observers |
| Decision Tree | `07-decision-trees.md` — Model Event vs Domain Event Selection |
| Skill | `06-skills.md` — Choose the Correct Event Type for a Side Effect |

---

## 2. Domain Events Dispatched From Model Events

### Category
Architecture

### Description
Configuring model events (`$dispatchesEvents` property or observer methods) to dispatch domain event classes. The domain event fires on every `save()`, regardless of business significance, creating phantom events.

### Why It Happens
The `$dispatchesEvents` property provides a simple mapping from Eloquent lifecycle events to custom event classes. Developers see it as a shortcut to "dispatch when saved." The business significance of the save is not considered.

### Warning Signs
- `protected $dispatchesEvents = ['saved' => OrderPlaced::class]` in model classes
- Observer methods that call `Event::dispatch(new OrderPlaced(...))` inside `saved()` or `created()`
- Domain events firing during `touch()`, factory creation, or mass `update()`
- Phantom event entries in queue or log for non-business operations
- `wasChanged()` checks in the dispatched event's listeners to filter out irrelevant saves
- Duplicate domain events: one from `$dispatchesEvents` and one from the domain method

### Why Harmful
- Domain events fire for every save, not just business-significant ones
- `touch()` calls trigger domain events (timestamp update is not a business occurrence)
- Bulk `update()` triggers domain events per record
- Factories and seeders trigger domain events during development
- Event listeners cannot distinguish between business and non-business saves

### Consequences
- Phantom domain events in the event log and queue
- Listeners processing irrelevant state changes
- Audit trail contamination with non-business events
- Performance overhead from dispatching events on unnecessary saves
- Confusion about which operations are business-significant

### Preferred Alternative
```php
// Domain event dispatched explicitly from the domain method
class Order extends Model
{
    public function place(): void
    {
        $this->status = 'placed';
        $this->save();
        Event::dispatch(new OrderPlaced($this->id)); // Only when business operation occurs
    }
}
```

### Refactoring Strategy
1. Remove domain event mappings from `$dispatchesEvents`
2. Extract domain events from observer methods into explicit domain methods
3. Dispatch domain events only from the specific domain methods that represent business occurrences
4. Add domain methods for each business operation if they don't exist
5. Update listeners to process only genuine business events

### Detection Checklist
- [ ] Search for `$dispatchesEvents` in model files — check its values
- [ ] Search for `Event::dispatch(` inside observer methods
- [ ] Check if `touch()` or mass update operations produce domain events in logs
- [ ] Verify that factory creation does not trigger domain events
- [ ] Review queue/event log for non-business events

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Dispatch Domain Events Explicitly from Domain Methods, Never from Model Events |
| Rule | `05-rules.md` — Use `$dispatchesEvents` Only for Persistence-Level Infrastructure |
| Decision Tree | `07-decision-trees.md` — Event Dispatch Trigger Point |

---

## 3. Model Instances in Domain Event Payloads

### Category
Architecture

### Description
Passing full Eloquent model instances in domain event payloads instead of IDs and value objects. This couples event consumers to the model's internal structure, causes serialization issues for queued listeners, and risks stale data.

### Why It Happens
Model instances are the most convenient way to pass data. The event's constructor accepts `Order $order` and the payload is "complete." The developer may not anticipate queued processing or stale data scenarios.

### Warning Signs
- `public readonly Order $order` in domain event constructor
- Event constructors with Eloquent model type hints
- Queued listeners that fail with serialization errors
- Large queue payloads containing full model data and relations
- Listeners accessing `$event->order->status` directly from the event
- Stale data bugs where queued listeners receive outdated status

### Why Harmful
- Queued listeners may process stale data (model state at dispatch vs processing time)
- Full model serialization is expensive (all columns, relations, appends)
- Serialization failures for non-serializable model attributes (closures, binary data)
- Coupling: changing a model attribute breaks all event listeners that access it directly
- Listener cannot trust the event's model data — must reload from database anyway

### Consequences
- Stale data in async processing (notification sent with wrong status)
- Failed queue jobs from serialization errors
- Large database/Redis storage for queue payloads
- Tight coupling between event consumers and model schema
- N+1 queries from lazy-loading relations on the serialized model

### Preferred Alternative
```php
// Model event — Laravel passes the model instance (synchronous, intentional)
class OrderObserver
{
    public function saved(Order $order): void { ... }
}

// Domain event — only IDs and value objects
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
1. Identify domain events carrying Eloquent model instances
2. Replace model properties with primitive IDs and value objects
3. Update listeners to load fresh data from the database by ID
4. Remove serialization concerns from event classes
5. Add correlation IDs for tracing

### Detection Checklist
- [ ] Search for domain event constructors with Eloquent model type hints
- [ ] Check queue payload size in Horizon/dashboard for event jobs
- [ ] Review listeners — do they access `$event->order->property` directly?
- [ ] Test queued listener with model state changed between dispatch and processing
- [ ] Verify that model serialization (appends, hidden) doesn't leak into events

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Carry Model Instances in Model Events, Carry IDs in Domain Events |
| Knowledge | `04-standardized-knowledge.md` — Carry IDs and value objects, not model instances |

---

## 4. Model Events Not Disabled for Bulk Operations

### Category
Performance

### Description
Performing bulk insert, update, or import operations without disabling model events using `saveQuietly()`, `withoutEvents()`, or `insert()`. Each record triggers full observer chains, causing order-of-magnitude performance degradation.

### Why It Happens
The default `create()` and `save()` methods fire events automatically. Developers use `create()` in loops because it's the standard Eloquent API. The performance cost of observers per record isn't obvious during development with small datasets.

### Warning Signs
- `Model::create()` inside foreach loops for bulk operations
- 10,000 records taking 30+ seconds to import (should be <1 second with `insert()`)
- Observer methods executing during data migrations and seeds
- Cache invalidation firing for every imported record
- Database transaction log overflow from per-record observer operations
- Import scripts that time out for large datasets

### Why Harmful
- Observer execution scales linearly with record count
- 10,000 records × 5 observer methods = 50,000 method calls
- Each observer may perform I/O (cache clear, log write, search index update)
- Import scripts become unusable for production data volumes
- Simple data migrations become downtime events

### Consequences
- Import jobs timing out for moderate datasets
- Database server load from per-record observer I/O
- Cache stampedes from mass cache invalidation
- Migration scripts that must be run during maintenance windows
- Developer workarounds (raw SQL) that bypass model logic entirely

### Preferred Alternative
```php
Order::withoutEvents(function () use ($records) {
    foreach ($records as $data) {
        Order::create($data);
    }
});

// Or for pure inserts:
Order::insert($records);
```

### Refactoring Strategy
1. Identify bulk operations using `create()` or `save()` in loops
2. Wrap bulk operations in `Model::withoutEvents()` or use `saveQuietly()`
3. For pure inserts without Eloquent benefits, use `Model::insert()`
4. Move post-bulk cache invalidation or indexing to a single operation after the batch
5. Profile import speed improvement (typically 10-100x faster)

### Detection Checklist
- [ ] Search for `::create(` inside loops or foreach blocks
- [ ] Search for `->save()` inside loops or foreach blocks
- [ ] Check import, seed, and migration commands for bulk operations
- [ ] Profile import time and count observer executions
- [ ] Verify that post-bulk operations (cache, index) run once, not per record

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Disable Model Events for Bulk Operations Using `saveQuietly()` |
| Skill | `06-skills.md` — Choose the Correct Event Type for a Side Effect |

---

## 5. Domain Events Mapped via `$dispatchesEvents`

### Category
Framework Usage

### Description
Using the `$dispatchesEvents` property on models to map domain event classes directly to Eloquent lifecycle events. The domain event fires on every save, regardless of business significance.

### Why It Happens
`$dispatchesEvents` provides a clean-looking mapping from lifecycle events to custom event classes. It's a built-in Laravel feature that "works." Developers may not realize it fires on every save without business context.

### Warning Signs
- `protected $dispatchesEvents = ['saved' => OrderPlaced::class]` — domain event mapped to model event
- Domain event names in `$dispatchesEvents` values
- Listeners for these events that receive stale or irrelevant data
- No corresponding domain method that dispatches the same event explicitly
- Tests showing events firing during `touch()` or factory creation
- Confusion about why events fire during non-business operations

### Why Harmful
- Events that should be business-significant fire on every persistence operation
- Impossible to distinguish between a business operation and an incidental save
- The model's business API is bypassed — any `save()` produces domain events
- Audit trails are polluted with non-business events
- Event listeners must filter out irrelevant saves, adding complexity

### Consequences
- Phantom domain events in queues and logs
- Listeners processing "order placed" events for order status checks
- Business metrics inflated by non-business events
- Debugging confusion: events appear for operations that didn't involve business logic
- Violation of the explicit dispatch principle

### Preferred Alternative
```php
// $dispatchesEvents for infrastructure only:
protected $dispatchesEvents = [
    'saved' => InvalidateOrderCache::class, // Infrastructure — OK
];

// Domain events from explicit domain methods:
public function place(): void
{
    $this->status = 'placed';
    $this->save();
    Event::dispatch(new OrderPlaced($this->id));
}
```

### Refactoring Strategy
1. Identify domain event classes in `$dispatchesEvents` values
2. For each mapped event, add an explicit domain method that dispatches it
3. Move the event reference from `$dispatchesEvents` to the domain method
4. Replace `$model->save()` calls in controllers with domain method calls
5. Add infrastructure-only events back to `$dispatchesEvents` if needed

### Detection Checklist
- [ ] Search all `$dispatchesEvents` property definitions
- [ ] Check if any values are domain event classes (past tense, business names)
- [ ] Verify each domain event has a corresponding domain method dispatch
- [ ] Test that `touch()` does not produce domain events
- [ ] Review factory creation — does it trigger domain events?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use `$dispatchesEvents` Only for Persistence-Level Infrastructure |
| Decision Tree | `07-decision-trees.md` — Event Dispatch Trigger Point |

---

## 6. Incorrect Naming: Domain Events vs Model Events

### Category
Maintainability

### Description
Naming domain events with Eloquent lifecycle terms (e.g., `saved_order`) or naming model event observers with domain language (e.g., `OrderPlaced` as an observer method). The naming convention doesn't signal the event type.

### Why It Happens
No established naming convention. Developers may not think about the distinction between event types when naming classes. Copy-paste from older projects with different conventions.

### Warning Signs
- Domain event classes named `saved_order_status` or `order_updated`
- Observer methods named `OrderPlaced` (business naming, not lifecycle naming)
- Mix of past tense and lifecycle naming in the events directory
- Difficulty determining whether a class is a domain event or an observer by name alone
- Documentation that confuses model events and domain events

### Why Harmful
- Class names don't communicate intent — is this a persistence event or business event?
- Developers may place business logic in model events because the naming suggests it
- Code reviews require extra context to understand the event's role
- New developers cannot distinguish between event systems by reading names
- Inconsistent conventions reduce codebase coherence

### Consequences
- Misplaced business logic in model events due to naming confusion
- Code review overhead: "is this a model event or domain event?"
- Difficulty finding the right event type for new features
- Inconsistent naming patterns across the codebase
- Onboarding confusion about the project's event conventions

### Preferred Alternative
```php
// Domain event — past tense business language
class OrderPlaced { ... }
class PaymentReceived { ... }

// Model event — Eloquent lifecycle convention
class OrderObserver
{
    public function saved(Order $order): void { ... }
    public function created(Order $order): void { ... }
}
```

### Refactoring Strategy
1. List all event classes and categorize as domain vs model events
2. Rename domain events to past tense business language
3. Rename model event classes to follow Eloquent observer convention
4. Update all references and listeners
5. Add naming conventions to the project's coding standards

### Detection Checklist
- [ ] List all class names in `App\Events` directory — check for naming consistency
- [ ] Check observer method names for business language vs lifecycle language
- [ ] Verify that past tense is used for all domain events
- [ ] Verify that lifecycle terms (`saved`, `created`) are used for model events
- [ ] Add a project convention document for event naming

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Name Domain Events in Past Tense, Model Events in Eloquent's Convention |
| Skill | `06-skills.md` — Choose the Correct Event Type for a Side Effect |
