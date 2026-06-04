# Observer Registration — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Observer Registration |
| Focus | Anti-patterns in #[ObservedBy] usage, duplicate registration, ordering, and naming |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Registering Observers in Service Provider Instead of `#[ObservedBy]` | Code Organization | High |
| 2 | Duplicate Observer Registration (Attribute + Service Provider) | Reliability | Critical |
| 3 | Using `observe()` for Unconditional Registration | Design | Medium |
| 4 | Scattering `observe()` Calls Across Multiple Providers | Code Organization | Medium |
| 5 | Passing Array of Observers to a Single `#[ObservedBy]` | Maintainability | Medium |
| 6 | Wrong Observer Registration Order With Dependencies | Reliability | High |
| 7 | Inconsistent Observer Filenames and Locations | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- The most severe anti-pattern is duplicate registration (both `#[ObservedBy]` and `observe()`), which silently fires every observer method twice
- Defaulting to service provider registration hides bindings from the model class and scatters registration across files
- Wrong registration order causes subtle bugs when observers depend on each other's side effects

---

## 1. Registering Observers in Service Provider Instead of `#[ObservedBy]`

### Category
Code Organization

### Description
Calling `Model::observe()` in a service provider for unconditional registrations instead of using the `#[ObservedBy]` attribute on the model, hiding registration from developers reading the model class.

### Warning Signs
- `Order::observe(OrderObserver::class)` in `AppServiceProvider::boot()`
- No `#[ObservedBy]` attribute on the model class
- New team members wondering where observers are registered
- Comments like "don't forget to register in the provider"

### Preferred Alternative
```php
#[ObservedBy(OrderCacheObserver::class)]
class Order extends Model {}
```

### Detection Checklist
- [ ] Search for `::observe(` in service providers
- [ ] Move all unconditional registrations to `#[ObservedBy]`
- [ ] Keep `observe()` only for conditional cases

### Related
| Rule | `05-rules.md` — Default to `#[ObservedBy]` Attribute for Observer Registration |
| Decision Tree | `07-decision-trees.md` — Observer Registration Method |

---

## 2. Duplicate Observer Registration (Attribute + Service Provider)

### Category
Reliability

### Description
Registering the same observer both via `#[ObservedBy]` on the model and via `Model::observe()` in a service provider, causing every observer method to execute twice for each event.

### Warning Signs
- Same observer class in both `#[ObservedBy]` and `::observe()` call
- Double cache invalidation per save
- Duplicate log entries per event
- Double email sends or notifications
- Comments like "events fire twice"

### Preferred Alternative
```php
#[ObservedBy(OrderCacheObserver::class)] // Single source of truth
class Order extends Model {}
```

### Detection Checklist
- [ ] Compare `#[ObservedBy]` attributes with `::observe()` calls
- [ ] Remove one registration path for each observer
- [ ] Verify each side effect fires exactly once

### Related
| Rule | `05-rules.md` — Do Not Register the Same Observer Multiple Times on the Same Model |

---

## 3. Using `observe()` for Unconditional Registration

### Category
Design

### Description
Using `Model::observe()` in a service provider for observers that always register, when `#[ObservedBy]` would be simpler and more discoverable.

### Warning Signs
- `::observe()` calls with no conditional wrapping
- Observers that register in every environment
- No config or feature flag dependency
- Comments like "always registered"

### Preferred Alternative
```php
// Conditional — wrap in if statement
if (config('app.debug')) {
    Order::observe(DebugOrderObserver::class);
}
```

### Detection Checklist
- [ ] Review each `::observe()` call — is it conditional?
- [ ] Move unconditional observers to `#[ObservedBy]`
- [ ] Use `observe()` only when an `if` condition gates registration

### Related
| Rule | `05-rules.md` — Use `Model::observe()` Only for Conditional Registration |

---

## 4. Scattering `observe()` Calls Across Multiple Providers

### Category
Code Organization

### Description
Placing `Model::observe()` calls in multiple service providers (`AppServiceProvider`, `AuthServiceProvider`, `EventServiceProvider`), making it difficult to audit all registered observers.

### Warning Signs
- `::observe()` calls in 3+ different service providers
- Developers unsure where to add new observer registrations
- Duplicate registrations from missed coordination
- Comments like "check all providers for observers"

### Preferred Alternative
```php
class ObserverServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (config('app.debug')) {
            Order::observe(DebugOrderObserver::class);
        }
    }
}
```

### Detection Checklist
- [ ] Search all service providers for `::observe(` calls
- [ ] Consolidate into a single `ObserverServiceProvider`
- [ ] Remove scattered registration calls

### Related
| Rule | `05-rules.md` — Group All `observe()` Calls in One Service Provider |

---

## 5. Passing Array of Observers to a Single `#[ObservedBy]`

### Category
Maintainability

### Description
Attempting to pass an array of observer classes to a single `#[ObservedBy]` attribute instead of stacking multiple attributes.

### Warning Signs
- `#[ObservedBy([...])]` with an array argument
- Compilation errors or runtime warnings
- Code review feedback about attribute syntax
- Comments like "trying to pass multiple classes"

### Preferred Alternative
```php
#[ObservedBy(OrderCacheObserver::class)]
#[ObservedBy(OrderAuditObserver::class)]
class Order extends Model {}
```

### Detection Checklist
- [ ] Search for `#[ObservedBy([` in codebase
- [ ] Replace with stacked attributes
- [ ] Verify each observer is independently listed

### Related
| Rule | `05-rules.md` — Register Multiple Observers With Multiple `#[ObservedBy]` Attributes, Not One Array |

---

## 6. Wrong Observer Registration Order With Dependencies

### Category
Reliability

### Description
Registering observers in the wrong order when one observer depends on side effects from another, causing one observer to see stale or incomplete state.

### Warning Signs
- Observers that depend on each other's side effects
- Intermittent bugs that depend on registration order
- Comments like "observer A must run before observer B"
- Hard-to-reproduce ordering bugs

### Preferred Alternative
```php
#[ObservedBy(OrderAuditObserver::class)]        // Runs first
#[ObservedBy(OrderNotificationObserver::class)] // Depends on audit data
```

### Detection Checklist
- [ ] Review `#[ObservedBy]` order against observer dependencies
- [ ] Document ordering requirements
- [ ] Order by dependency: foundational first, dependent last

### Related
| Rule | `05-rules.md` — Order `#[ObservedBy]` Attributes and `observe()` Calls by Dependency |

---

## 7. Inconsistent Observer Filenames and Locations

### Category
Maintainability

### Description
Placing observer files in inconsistent directories or naming them inconsistently, making them hard to locate via navigation tools.

### Warning Signs
- Observers in `app/Observers/`, `app/Helpers/`, `app/Services/`
- `OrderCacheObserver.php`, `order_audit_observer.php`, `ObserverOrder.php`
- Developers searching for observers across directories
- Comments like "where is this observer defined?"

### Preferred Alternative
```php
// app/Observers/OrderCacheObserver.php
// app/Observers/OrderAuditObserver.php
```

### Detection Checklist
- [ ] Search for observer files outside `app/Observers/`
- [ ] Move all observers to `app/Observers/`
- [ ] Rename files to match class names and conventions

### Related
| Rule | `05-rules.md` — Keep Observer Filenames Consistent With the Registered Class Name |
