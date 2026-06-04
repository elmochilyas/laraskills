# Manual Event Firing — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Manual Event Firing |
| Focus | Anti-patterns in fireModelEvent(), dispatchEvents(), custom observables, and manual event misuse |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Replacing Normal Persistence With Manual Event Firing | Design | Critical |
| 2 | Using `dispatchEvents()` Without Saving | Reliability | High |
| 3 | Firing Custom Events Without Passing `halt = false` | Framework Usage | Medium |
| 4 | Defining `$observables` Far From Where Events Are Fired | Maintainability | Medium |
| 5 | Using Standard Events Instead of Custom `$observables` for Domain Hooks | Design | Medium |
| 6 | Always Using Factory `create()` Instead of `fireModelEvent()` in Tests | Testing | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is using manual event firing as a replacement for `save()` — data is never persisted and phantom events fire with no backing records
- Firing custom events without passing `halt = false` allows any misbehaving listener to block the entire event chain
- Tests that always use `factory()->create()` instead of `fireModelEvent()` are slower and coupled to the database

---

## 1. Replacing Normal Persistence With Manual Event Firing

### Category
Design

### Description
Using `fireModelEvent()` or `dispatchEvents()` as a substitute for `save()`, `delete()`, or other persistence methods, causing listener code to execute without any actual database changes.

### Warning Signs
- `fireModelEvent('created')` or `fireModelEvent('saved')` called without a preceding save
- `dispatchEvents()` called instead of `save()`
- Comments like "fire events without saving"
- Phantom data patterns — listeners receive model state that never reached the database

### Preferred Alternative
```php
public function saveOrder(Order $order): void
{
    $order->save(); // Persists and fires events automatically
}
```

### Detection Checklist
- [ ] Search for `fireModelEvent(` calls and verify a `save()` also occurs
- [ ] Search for `dispatchEvents(` without preceding `save()`
- [ ] Ensure manual events supplement, not replace, persistence

### Related
| Rule | `05-rules.md` — Never Replace Normal Persistence With Manual Event Firing |

---

## 2. Using `dispatchEvents()` Without Saving

### Category
Reliability

### Description
Calling `Model::dispatchEvents()` to flush the queued event buffer without having saved the model, firing events that listeners interpret as persistence events when no data was written.

### Warning Signs
- `$model->dispatchEvents()` not preceded by `$model->save()`
- Listeners that re-fetch the model from the database and find stale or no data
- Cache invalidation that runs when no data changed
- Comments like "fire existing events without saving"

### Preferred Alternative
```php
$order->status = 'placed';
$order->save(); // Persists and dispatches events together
```

### Detection Checklist
- [ ] Search for `dispatchEvents()` calls
- [ ] Verify each call is paired with a persistence operation
- [ ] Replace with explicit `save()` where possible

### Related
| Rule | `05-rules.md` — Use `Model::dispatchEvents()` Only When You Need to Fire Queued Events Without Saving |

---

## 3. Firing Custom Events Without Passing `halt = false`

### Category
Framework Usage

### Description
Calling `$model->fireModelEvent('custom_event')` without the second argument `false`, leaving the default `halt = true` so that any listener returning `false` silently blocks the rest of the event chain.

### Warning Signs
- `fireModelEvent('custom_name')` without `false` as second argument
- Custom events that mysteriously stop firing after a listener change
- Comments like "some events don't fire" for custom events
- Halting behavior on events that should not be haltable

### Preferred Alternative
```php
$this->fireModelEvent('processing', false); // Listeners cannot halt
```

### Detection Checklist
- [ ] Search for `fireModelEvent(` calls without `false` second argument
- [ ] Add `false` for custom events that should not halt
- [ ] Keep `halt = true` only for events designed to be haltable

### Related
| Rule | `05-rules.md` — Always Pass `false` as the Second Argument to `fireModelEvent()` When Firing Without Halting |

---

## 4. Defining `$observables` Far From Where Events Are Fired

### Category
Maintainability

### Description
Declaring custom events in the `$observables` array in a distant parent class while firing them in a subclass or trait, making it hard to discover which events are available.

### Warning Signs
- `$observables` defined in a base class, custom events fired in traits or subclasses
- Developers unsure which custom events exist for a model
- Comments like "where does this event come from?"
- `$observables` in a file far from where `fireModelEvent` is called

### Preferred Alternative
```php
trait HasProcessingEvent
{
    protected $observables = ['processing'];

    public function process(): void
    {
        $this->fireModelEvent('processing', false);
    }
}
```

### Detection Checklist
- [ ] Search for `$observables` declarations and trace where events are fired
- [ ] Co-locate `$observables` with the methods that fire the events
- [ ] Move observables to traits or into the same class that fires them

### Related
| Rule | `05-rules.md` — Keep `$observables` Declarations Close to Where Custom Events Are Fired |

---

## 5. Using Standard Events Instead of Custom `$observables` for Domain Hooks

### Category
Design

### Description
Firing a standard Laravel Event through the `Event` facade instead of adding a custom model observable via `$observables` and `fireModelEvent()`, bypassing the model's observer infrastructure.

### Warning Signs
- `event(new OrderProcessing($order))` instead of `$order->fireModelEvent('processing')`
- Observers that cannot react to domain-specific transitions
- Two different event systems used for similar lifecycle hooks
- Comments like "this event is dispatched manually"

### Preferred Alternative
```php
class Order extends Model
{
    protected $observables = ['processing'];

    public function process(): void
    {
        $this->fireModelEvent('processing', false);
    }
}
```

### Detection Checklist
- [ ] Search for `event(new ...)` with model parameter in domain methods
- [ ] Register custom events via `$observables` and `fireModelEvent()`
- [ ] Use `Event` facade only for domain events not related to model lifecycle

### Related
| Rule | `05-rules.md` — Use `$observables` to Register Custom Model Events, Then Fire Them With `fireModelEvent()` |

---

## 6. Always Using Factory `create()` Instead of `fireModelEvent()` in Tests

### Category
Testing

### Description
Always using `Order::factory()->create()` in tests when only observer behavior needs to be verified, making tests slower and database-dependent when `fireModelEvent()` would suffice.

### Warning Signs
- All observer tests use `factory()->create()` — slow test suite
- Tests that verify cache invalidation or logging but actually create database records
- Comments like "need database just to test observer"
- Test suite takes minutes due to observer-related tests

### Preferred Alternative
```php
public function test_order_created_invalidates_cache(): void
{
    $order = Order::factory()->make(); // In-memory only
    $order->fireModelEvent('created', false);
    // Assert cache invalidation
}
```

### Detection Checklist
- [ ] Review observer tests for unnecessary database hits
- [ ] Replace `create()` with `make()` + `fireModelEvent()` where possible
- [ ] Keep `create()` only when persistence is required for the test scenario

### Related
| Rule | `05-rules.md` — Use `fireModelEvent()` for Testing Observer Logic Without Persistence |
