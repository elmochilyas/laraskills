# Event Dispatch Order — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Event Dispatch Order |
| Focus | Anti-patterns in event sequence assumptions, halting behavior, and saved/created/updated confusion |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Assuming `saved` Fires Only for Inserts or Only for Updates | Reliability | Critical |
| 2 | Returning `false` From `*ed` Events (No Effect) | Design | Critical |
| 3 | Relying on `saved` Before `created`/`updated` Without Understanding Nesting | Framework Usage | High |
| 4 | Assuming Pivot Events Fire Before or After Model Events | Reliability | High |
| 5 | Assuming `deleted` and `saved` Have a Defined Ordering | Framework Usage | Medium |
| 6 | Not Checking `wasRecentlyCreated` in `saved` When Distinction Is Needed | Framework Usage | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is assuming `saved` fires only for inserts or updates — this causes duplicate welcome emails on every update
- Returning `false` from `*ed` events has no effect, creating a false sense of data integrity protection
- Pivot events and model events have no guaranteed ordering, making cross-chain assumptions dangerous

---

## 1. Assuming `saved` Fires Only for Inserts or Only for Updates

### Category
Reliability

### Description
Writing a `saved` listener that assumes it fires exclusively for inserts (e.g., sending welcome emails) or exclusively for updates, causing duplicate operations or missed side effects.

### Warning Signs
- Welcome emails, initial notifications, or one-time setup in `saved` handler
- `saved` handler that triggers on the wrong operation type
- Bugs that only appear when a model is created and then updated
- Comments like "this runs once" on `saved`

### Preferred Alternative
```php
public function created(Order $order): void
{
    Mail::send(new OrderConfirmation($order)); // Only on insert
}
public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}"); // Both insert and update
}
```

### Detection Checklist
- [ ] Search for `saved` event handlers — should any be `created` or `updated`?
- [ ] Check for `wasRecentlyCreated` checks in `saved`
- [ ] Split operation-type-specific logic into `created`/`updated`

### Related
| Rule | `05-rules.md` — Never Rely on `saved` Firing Only for Inserts or Only for Updates |
| Decision Tree | `07-decision-trees.md` — Event Type Selection |

---

## 2. Returning `false` From `*ed` Events (No Effect)

### Category
Design

### Description
Returning `false` from `saved`, `created`, `updated`, `deleted`, `trashed`, `restored`, `forceDeleted` — events that fire after the database operation — believing the operation will be halted.

### Warning Signs
- `return false` inside `saved()`, `created()`, `updated()`, `deleted()` methods
- Comments like "prevents save" paired with `*ed` event
- Data persists despite validation logic in `*ed` handlers
- `?bool` return type on `*ed` observer methods

### Preferred Alternative
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        return false; // Correctly aborts the save
    }
    return null;
}
```

### Detection Checklist
- [ ] Search for `return false` or `return null` in `*ed` observer methods
- [ ] Move halting logic to corresponding `*ing` methods
- [ ] Keep `*ed` method return types as `void`

### Related
| Rule | `05-rules.md` — Only Return `false` From `*ing` Events to Halt — Never From `*ed` Events |

---

## 3. Relying on `saved` Before `created`/`updated` Without Understanding Nesting

### Category
Framework Usage

### Description
Registering both `saving`/`saved` and `creating`/`created` or `updating`/`updated` listeners and assuming they execute in a specific order, or not accounting for `saving` wrapping the other events.

### Warning Signs
- Both `saving` and `creating` listeners registered with ordering assumptions
- `saving` abort assumed to prevent `updating` from firing (incorrect for creates)
- Comments like "saving runs first" without accounting for the full chain
- Validation split across `saving` and `creating` with order dependencies

### Preferred Alternative
```php
// Shared validation in saving, operation-specific in creating
public function saving(Order $order): ?bool   { /* fires first */ }
public function creating(Order $order): ?bool  { /* fires second */ }
```

### Detection Checklist
- [ ] Review models with both `saving`/`creating` or `saved`/`created` listeners
- [ ] Verify ordering assumptions are correct
- [ ] Document the intended dispatch sequence

### Related
| Rule | `05-rules.md` — Remember That `saving` Wraps `creating`/`updating`; Listeners in `saving` Fire First |

---

## 4. Assuming Pivot Events Fire Before or After Model Events

### Category
Reliability

### Description
Writing code that assumes pivot events (`pivotAttached`, `pivotDetached`) fire in a specific order relative to the parent model's save events, leading to race conditions and intermittent bugs.

### Warning Signs
- Pivot and model event handlers that share state
- Assumptions about model state in pivot handlers
- Intermittent bugs that depend on timing
- Comments like "pivot should be available here"

### Preferred Alternative
```php
// Treat pivot and model events as independent chains
// Use separate observers with independent concerns
```

### Detection Checklist
- [ ] Search for models with both pivot and model event handlers sharing state
- [ ] Decouple pivot and model event logic
- [ ] Use explicit synchronization instead of ordering assumptions

### Related
| Rule | `05-rules.md` — Handle Pivot Events Separately From Main Model Events — Order Is Not Guaranteed |

---

## 5. Assuming `deleted` and `saved` Have a Defined Ordering

### Category
Framework Usage

### Description
Writing code that assumes `deleted` fires before or after `saved` on the same model, or that the two event chains have any temporal relationship.

### Warning Signs
- Shared cache keys updated in both `saved` and `deleted`
- Logic that increments in `saved` and decrements in `deleted`
- Comments like "deleted runs before next saved"
- Concurrent operation bugs

### Preferred Alternative
```php
// Handle cache independently per operation
public function saved(Order $order): void { Cache::forget("order:{$order->id}"); }
public function deleted(Order $order): void { Cache::forget("order:{$order->id}"); }
```

### Detection Checklist
- [ ] Review models with both `saved` and `deleted` handlers that share state
- [ ] Decouple shared state into independent operations
- [ ] Handle each event chain independently

### Related
| Rule | `05-rules.md` — Do Not Expect `deleted` to Fire Before `saved` on the Same `save()` Call |

---

## 6. Not Checking `wasRecentlyCreated` in `saved` When Distinction Is Needed

### Category
Framework Usage

### Description
Using a single `saved` handler for logic that should differ between creates and updates, without checking `$model->wasRecentlyCreated` to distinguish the operation.

### Warning Signs
- `saved` handler that sends welcome emails or performs one-time setup
- Comments like "should only run on create" without implementation
- Duplicate side effects on subsequent updates
- Separate `created` handler exists but `saved` also runs the same logic

### Preferred Alternative
```php
public function saved(Order $order): void
{
    if ($order->wasRecentlyCreated) {
        Mail::send(new OrderConfirmation($order));
    }
    Cache::forget("order:{$order->id}");
}
```

### Detection Checklist
- [ ] Search for `saved` handlers with operation-type-specific side effects
- [ ] Add `wasRecentlyCreated` checks or split into `created`/`updated`
- [ ] Verify side effects run on the correct operation

### Related
| Rule | `05-rules.md` — Check `$order->wasRecentlyCreated` in `saved` When Distinction Is Needed |
