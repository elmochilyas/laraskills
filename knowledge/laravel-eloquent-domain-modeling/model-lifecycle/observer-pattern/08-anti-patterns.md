# Observer Pattern — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Observer Pattern |
| Focus | Anti-patterns in observer structure, registration, business logic, and method design |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Business Logic in Observers (Use Domain Events Instead) | Architecture | Critical |
| 2 | Single "God" Observer Per Model Instead of Per-Concern | Maintainability | High |
| 3 | Observer Methods Longer Than 5 Lines | Maintainability | Medium |
| 4 | Calling Observer Methods Directly (Bypassing Event System) | Design | High |
| 5 | Type-Hinting Generic `Model` Instead of Specific Model | Maintainability | Medium |
| 6 | Registering Observers in Service Provider Instead of `#[ObservedBy]` | Code Organization | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is putting business logic in observers instead of domain event listeners — this scatters domain rules across infrastructure code and causes unintended side effects during seeding and testing
- God observers grow with every new feature and become untestable monoliths
- Calling observer methods directly bypasses the entire event dispatch system, skipping other registered observers

---

## 1. Business Logic in Observers (Use Domain Events Instead)

### Category
Architecture

### Description
Putting business rule reactions (discounts, workflows, state machines, fee calculations) in Eloquent observer methods instead of domain event listeners, causing business logic to fire in contexts where it should not (seeding, testing, migrations).

### Warning Signs
- Discount or promotion logic in `created()` or `saved()` handlers
- Workflow state transitions triggered by observers
- Business logic that fires unexpectedly in test setup or seeders
- Comments like "observer applies business rules"

### Preferred Alternative
```php
// Domain event dispatched explicitly
class PlaceOrderAction
{
    public function execute(Order $order): void
    {
        $order->save();
        event(new OrderPlaced($order));
    }
}
```

### Detection Checklist
- [ ] Review observer methods for business logic references
- [ ] Extract business reactions to domain event listeners
- [ ] Keep observers limited to infrastructure: cache, logs, sync, job dispatch

### Related
| Rule | `05-rules.md` — Do Not Put Business Logic in Observers — Use Domain Events Instead |

---

## 2. Single "God" Observer Per Model Instead of Per-Concern

### Category
Maintainability

### Description
Creating a single `OrderObserver` that handles cache invalidation, audit logging, notifications, and external sync in one class, instead of one observer per concern.

### Warning Signs
- Single observer class per model handling multiple concerns
- Observer class growing with every new feature
- Tests for one side effect breaking due to another concern's changes
- Merge conflicts when multiple developers edit the same observer

### Preferred Alternative
```php
#[ObservedBy(OrderCacheObserver::class)]
#[ObservedBy(OrderAuditObserver::class)]
#[ObservedBy(OrderNotificationObserver::class)]
class Order extends Model {}
```

### Detection Checklist
- [ ] Check each model for a single observer handling >2 concerns
- [ ] Split into per-concern observers
- [ ] Register all with `#[ObservedBy]` attributes

### Related
| Rule | `05-rules.md` — Keep Observer Classes Focused on a Single Infrastructure Concern |

---

## 3. Observer Methods Longer Than 5 Lines

### Category
Maintainability

### Description
Observer methods that exceed 5 lines, indicating misplaced responsibility where the logic should have been extracted to a dedicated class or job.

### Warning Signs
- `saved()` method with multiple cache operations, API calls, conditionals
- Observer methods requiring significant setup to test
- Comments that section off different responsibilities within one method
- Inline business logic mixed with infrastructure code

### Preferred Alternative
```php
public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}");
}
```

### Detection Checklist
- [ ] Review observer methods for excessive length
- [ ] Extract logic beyond 5 lines to dedicated classes
- [ ] Keep observer methods as thin dispatch points

### Related
| Rule | `05-rules.md` — Keep Observer Method Bodies Under 5 Lines |

---

## 4. Calling Observer Methods Directly (Bypassing Event System)

### Category
Design

### Description
Directly instantiating an observer and calling its methods (e.g., `$observer->saved($order)`) instead of letting Eloquent dispatch events through the normal lifecycle, bypassing other registered observers and halting logic.

### Warning Signs
- `new OrderCacheObserver()` then `->saved($order)` calls
- Direct observer method calls in controllers or services
- Only one observer fires instead of all registered observers
- Comments like "force observer execution"

### Preferred Alternative
```php
$order->save(); // All observers fire through Eloquent's event system
```

### Detection Checklist
- [ ] Search for `->saved(`, `->created(`, `->deleted(` method calls on observers
- [ ] Replace with model persistence methods
- [ ] Use `Event::fake()` + dispatch for testing specific observers

### Related
| Rule | `05-rules.md` — Do Not Call Other Models' Observer Methods Directly |

---

## 5. Type-Hinting Generic `Model` Instead of Specific Model

### Category
Maintainability

### Description
Type-hinting the generic `Model` base class in observer method signatures instead of the specific model class, losing IDE autocompletion and static analysis benefits.

### Warning Signs
- `public function saved(Model $model)` instead of `saved(Order $order)`
- Observer could accept any model — risk of wrong model passed
- Comments like "generic observer for all models"
- `$model->getTable()` dynamic queries in generic observers

### Preferred Alternative
```php
public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}");
}
```

### Detection Checklist
- [ ] Search for `Model $model` in observer signatures
- [ ] Replace with specific model type hints
- [ ] Use generic `Model` only for polymorphic observers

### Related
| Rule | `05-rules.md` — Type-Hint the Specific Model Class in Observer Methods, Not `Model` |

---

## 6. Registering Observers in Service Provider Instead of `#[ObservedBy]`

### Category
Code Organization

### Description
Registering observers via `Model::observe()` in a service provider's `boot()` method instead of using the `#[ObservedBy]` attribute on the model, hiding registration from the model class.

### Warning Signs
- `Order::observe(OrderObserver::class)` in `AppServiceProvider` or `EventServiceProvider`
- No `#[ObservedBy]` attribute on the model
- Developers adding observers to the service provider by convention
- Comments like "remember to register in the provider"

### Preferred Alternative
```php
#[ObservedBy(OrderCacheObserver::class)]
class Order extends Model {}
```

### Detection Checklist
- [ ] Search for `::observe(` calls in service providers
- [ ] Move unconditional registrations to `#[ObservedBy]` on the model
- [ ] Keep `observe()` only for conditional registrations

### Related
| Rule | `05-rules.md` — Register Observers With the `#[ObservedBy]` Attribute |
| Decision Tree | `07-decision-trees.md` — Observer Registration Method |
