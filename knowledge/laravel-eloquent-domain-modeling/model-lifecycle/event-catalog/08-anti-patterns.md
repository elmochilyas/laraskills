# Event Catalog — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Event Catalog |
| Focus | Anti-patterns in event selection, halting behavior, and event phase misuse |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Validation in `*ed` Events (Cannot Halt) | Reliability | Critical |
| 2 | Side Effects in `*ing` Events (May Halt Unexpectedly) | Reliability | High |
| 3 | Using `saved` When `created`/`updated` Is More Specific | Maintainability | Medium |
| 4 | Using `retrieved` for Authorization | Security | Critical |
| 5 | Dead Soft-Delete Events on Non-Soft-Deletable Models | Maintainability | Low |
| 6 | Pivot Events Mixed with Model Events in Same Observer | Code Organization | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is putting validation in `*ed` events, where `return false` has no effect because the operation already committed
- Using `retrieved` for authorization is a security anti-pattern — data has already left the database before the check runs
- Triggering side effects in `*ing` events can abort the main operation unexpectedly if a return value is misinterpreted

---

## 1. Validation in `*ed` Events (Cannot Halt)

### Category
Reliability

### Description
Placing validation or authorization logic that returns `false` inside `*ed` events (`saved`, `created`, `updated`, `deleted`), where the return value has no effect because the database operation has already completed.

### Why It Happens
Developers either don't distinguish between `*ing` and `*ed` events, or they copy the pattern of returning `false` from `*ing` events and assume it works the same way in `*ed` events.

### Warning Signs
- `return false` or `return null` inside `saved()`, `created()`, `updated()`, `deleted()` methods
- Validation logic in observer methods that should prevent saves but the saves still happen
- Comments like "this validation doesn't seem to prevent the save"

### Why Harmful
- The operation is not prevented — validation is silently ignored
- Invalid data persists despite the developer's intent
- The developer believes they have a safety net but the logic has no effect

### Preferred Alternative
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        return false; // Halts the save
    }
    return null;
}

public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}"); // Side effect — no return value
}
```

### Detection Checklist
- [ ] Search for observer methods named `saved`, `created`, `updated`, `deleted` that return values
- [ ] Move validation to corresponding `*ing` methods
- [ ] Ensure `*ed` methods return `void`

### Related
| Rule | `05-rules.md` — Use `*ing` Events for Validation and Authorization, `*ed` Events for Side Effects |
| Decision Tree | `07-decision-trees.md` — Before vs After Event Selection |

---

## 2. Side Effects in `*ing` Events (May Halt Unexpectedly)

### Category
Reliability

### Description
Placing side effects (cache invalidation, external API calls, logging) in `*ing` events (`saving`, `creating`, `updating`, `deleting`) where the return value may be interpreted as a halt signal, or where the side effect runs even if the operation later fails.

### Why It Happens
Developers use `*ing` events as a catch-all before-operation hook without considering that the operation may fail after the side effect has already executed.

### Warning Signs
- External API calls or database writes inside `saving()`, `creating()`, `updating()`
- Cache invalidation that happens before the save, causing stale cache reads between invalidation and commit
- Side effects that are hard to roll back if the main operation fails
- Comments like "this runs before save — might cause double charges"

### Preferred Alternative
```php
public function saving(Order $order): void
{
    // Only operations that should halt the save belong here
}

public function saved(Order $order): void
{
    // Side effects after successful persistence
    Cache::forget("order:{$order->id}");
}
```

### Detection Checklist
- [ ] Review `*ing` observer methods for non-validation side effects
- [ ] Move side effects to corresponding `*ed` methods
- [ ] Keep `*ing` methods focused on validation and authorization

### Related
| Rule | `05-rules.md` — Use `*ing` Events for Validation and Authorization, `*ed` Events for Side Effects |

---

## 3. Using `saved` When `created`/`updated` Is More Specific

### Category
Maintainability

### Description
Using the generic `saved` event (fires on both insert and update) when the logic should only fire for one operation type, requiring inline `if ($order->wasRecentlyCreated)` checks.

### Why It Happens
Developers default to `saved` because it covers both cases. They add conditionals when they need to distinguish, rather than using the more specific event.

### Warning Signs
- `$model->wasRecentlyCreated` check inside a `saved()` observer method
- `$model->isDirty()` check inside a `saved()` method to determine what changed
- Comments like "only runs on create" paired with `saved` handler

### Preferred Alternative
```php
public function created(Order $order): void
{
    Mail::send(new WelcomeEmail($order)); // Only on insert
}

public function updated(Order $order): void
{
    // Only on update
}

public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}"); // Both insert and update
}
```

### Detection Checklist
- [ ] Search for `wasRecentlyCreated` or `isDirty()` in `saved()` handlers
- [ ] Replace with separate `created()` and `updated()` methods
- [ ] Use `saved()` only when logic truly applies to both

### Related
| Rule | `05-rules.md` — Use `created`/`updated` When the Operation Type Matters; Use `saved` When It Does Not |
| Decision Tree | `07-decision-trees.md` — Event Type Selection (created vs updated vs saved) |

---

## 4. Using `retrieved` for Authorization

### Category
Security

### Description
Using the `retrieved` event to check authorization (e.g., aborting if the user doesn't own the model) after the model has already been loaded from the database, leaking data through timing and debug backtraces.

### Why It Happens
Developers see `retrieved` as a convenient hook to "filter" data after retrieval, not realizing the data has already left the database.

### Warning Signs
- `retrieved` observer method that calls `abort(403)` or throws authorization exceptions
- `$model->user_id !== auth()->id()` checks in `retrieved`
- Authorization logic that runs after the query has already executed

### Preferred Alternative
```php
// In a policy or controller — authorization before query:
public function view(User $user, Order $order): bool
{
    return $order->user_id === $user->id;
}
```

### Detection Checklist
- [ ] Search for `retrieved` event handlers with authorization logic
- [ ] Move authorization to policies or global scopes
- [ ] Use `retrieved` only for transformations, not access control

### Related
| Rule | `05-rules.md` — Never Rely on `retrieved` for Authorization |

---

## 5. Dead Soft-Delete Events on Non-Soft-Deletable Models

### Category
Maintainability

### Description
Registering `trashed`, `trashing`, `restored`, `restoring`, `forceDeleting`, or `forceDeleted` event listeners on models that do not use the `SoftDeletes` trait, creating dead code that never executes.

### Why It Happens
Developers create a shared observer or copy observer patterns from other models without checking whether the model actually supports soft deletes.

### Warning Signs
- `trashed()` or `restored()` methods in observers registered on non-soft-deletable models
- `forceDeleting()` handler on models without `SoftDeletes` trait
- No `use SoftDeletes` on the model but soft-delete event handlers exist
- Comments like "this never seems to fire"

### Preferred Alternative
```php
// Only define soft-delete event handlers on soft-deletable models
class DocumentObserver
{
    public function trashed(Document $document): void
    {
        // Document uses SoftDeletes — this will fire
    }
}
```

### Detection Checklist
- [ ] Check each model for `SoftDeletes` trait — does it match its observer's event handlers?
- [ ] Remove soft-delete handlers from non-soft-deletable models
- [ ] Verify soft-delete handlers exist on models with `SoftDeletes`

### Related
| Rule | `05-rules.md` — Do Not Use `trashed`/`restored` Unless Using Soft Deletes |

---

## 6. Pivot Events Mixed with Model Events in Same Observer

### Category
Code Organization

### Description
Handling both model lifecycle events (`saved`, `created`, `deleted`) and pivot events (`pivotAttached`, `pivotDetached`) in the same observer class, conflating two distinct concerns.

### Why It Happens
Both types of events are related to the model, so developers naturally group them in the same observer without considering that pivot events belong to the relationship lifecycle, not the model lifecycle.

### Warning Signs
- Observer class contains both `updated()` and `pivotAttached()` methods
- Pivot logic is mixed with model persistence logic
- Testing pivot behavior requires also setting up model event mocks
- Comments like "pivot handling at the bottom of the observer"

### Preferred Alternative
```php
// Separate observer for pivot events
class OrderPivotObserver
{
    public function pivotAttached(Order $order, $relation, $ids): void
    {
        // Pivot-specific logic
    }
}
```

### Detection Checklist
- [ ] Search for `pivot` methods in model observers
- [ ] Extract pivot handlers to separate dedicated observer classes
- [ ] Register the pivot observer with `#[ObservedBy]` on the model

### Related
| Rule | `05-rules.md` — Register Pivot Event Listeners Separately From Model Event Listeners |
| Skill | `06-skills.md` — Set Up Before/After Event Pairing with Correct Halting Behavior |
