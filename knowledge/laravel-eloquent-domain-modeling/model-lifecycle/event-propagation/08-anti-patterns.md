# Event Propagation — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Event Propagation |
| Focus | Anti-patterns in halting events, return type confusion, silent aborts, and queued listener halting |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Returning `false` From `*ed` Events (Halting Has No Effect) | Design | Critical |
| 2 | Silent Halts — Returning `false` Without Logging or Exception | Maintainability | High |
| 3 | Returning `true` From `*ing` Events Instead of `null` | Framework Usage | Medium |
| 4 | Using Event Halting as Primary Validation Mechanism | Design | High |
| 5 | Relying on Event Halting in Queued Listeners | Reliability | Critical |
| 6 | Using `replicating` Halting for Data Validation | Design | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is returning `false` from `*ed` events, where it has no effect and creates a false sense of protection
- Silent halts (no log, no exception) make debugging nearly impossible — you see a failed save but have no idea which observer caused it
- Event halting in queued listeners is always ineffective because the save already committed before the queue processes

---

## 1. Returning `false` From `*ed` Events (Halting Has No Effect)

### Category
Design

### Description
Returning `false` from `created`, `saved`, `updated`, `deleted`, `trashed`, `restored`, or `forceDeleted` event listeners, believing the operation will be halted when Eloquent silently ignores the return value.

### Warning Signs
- `return false` inside `saved()`, `created()`, `updated()`, `deleted()` methods
- Validation logic in `*ed` events that should prevent persistence
- Data still persists despite validation in after-events
- Comments like "this should prevent the save" in `*ed` handler

### Preferred Alternative
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        return false; // Aborts before the database operation
    }
    return null;
}
```

### Detection Checklist
- [ ] Search for `return false` in `*ed` event handlers
- [ ] Move to corresponding `*ing` event handlers
- [ ] Keep `*ed` return type as `void`

### Related
| Rule | `05-rules.md` — Only Return `false` From `*ing` Events to Halt the Operation |
| Skill | `06-skills.md` — Set Up Before/After Event Pairing with Correct Halting Behavior |

---

## 2. Silent Halts — Returning `false` Without Logging or Exception

### Category
Maintainability

### Description
Returning `false` from a halting event listener without logging the reason or throwing an exception, making it impossible to determine why a model operation was aborted.

### Warning Signs
- `return false` with no preceding log statement
- Failed saves with no trace in logs
- Developers adding debug statements to find why a model won't save
- Comments like "figure out why this is failing"

### Preferred Alternative
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        Log::warning('Attempted save with negative total', [
            'order_id' => $order->id,
            'total_cents' => $order->total_cents,
        ]);
        return false;
    }
    return null;
}
```

### Detection Checklist
- [ ] Search for `return false` in `*ing` handlers without preceding logs
- [ ] Add `Log::warning()` or throw exceptions before each `return false`
- [ ] Verify halting events are discoverable in production logs

### Related
| Rule | `05-rules.md` — Throw an Exception or Log Before Returning `false` |

---

## 3. Returning `true` From `*ing` Events Instead of `null`

### Category
Framework Usage

### Description
Returning `true` from `*ing` event listeners when the operation should proceed, misleading readers into thinking the listener is affirmatively allowing the operation.

### Warning Signs
- `return true` in `saving()`, `creating()`, `updating()`, `deleting()` methods
- Reader confusion about what `true` means in context
- Inconsistent return patterns across observers
- Comments like "returning true to allow"

### Preferred Alternative
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        return false;
    }
    return null; // No explicit "allowing" needed
}
```

### Detection Checklist
- [ ] Search for `return true` in `*ing` event handlers
- [ ] Replace with `return null` or no return statement
- [ ] Standardize return pattern across observers

### Related
| Rule | `05-rules.md` — Return `null` (Not `true`) From Halting Events When You Want the Operation to Continue |

---

## 4. Using Event Halting as Primary Validation Mechanism

### Category
Design

### Description
Relying on `return false` from `*ing` events as the primary means of data validation, hiding business rules in observers where they are not discoverable from the save call site.

### Warning Signs
- Complex validation logic in `saving()` or `creating()` observers
- No FormRequest or model method validation for the same rules
- Developers surprised by silent save failures
- Comments like "validation is in the observer"

### Preferred Alternative
```php
// FormRequest handles primary validation
class StoreOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return ['total_cents' => ['required', 'integer', 'min:0']];
    }
}
```

### Detection Checklist
- [ ] Review `*ing` event handlers for business validation logic
- [ ] Move primary validation to FormRequests or model methods
- [ ] Keep only cross-cutting ORM-level validation in observers

### Related
| Rule | `05-rules.md` — Do Not Use Event Halting as the Primary Validation Mechanism |

---

## 5. Relying on Event Halting in Queued Listeners

### Category
Reliability

### Description
Adding `ShouldQueue` to an event listener that returns `false` to halt the operation, not realizing the listener executes asynchronously after the save already committed.

### Warning Signs
- `implements ShouldQueue` on a listener that returns `false`
- Invalid data persisting despite queued halting logic
- Comments like "halting should prevent this"
- Queued validation listeners

### Preferred Alternative
```php
class ValidateOrder // Synchronous — halting works
{
    public function saving(Order $order): ?bool
    {
        if ($order->total_cents < 0) return false;
        return null;
    }
}
```

### Detection Checklist
- [ ] Search for `ShouldQueue` on listeners that return values
- [ ] Remove queuing from halting listeners
- [ ] Move validation to synchronous context

### Related
| Rule | `05-rules.md` — Never Rely on Event Halting in Queued Listeners |

---

## 6. Using `replicating` Halting for Data Validation

### Category
Design

### Description
Using `return false` from the `replicating` event for data validation purposes, when `replicating` only controls whether the in-memory copy is created — it does not prevent the original model from being saved.

### Warning Signs
- Validation logic in `replicating()` handler
- `replicating` halting intended to enforce business rules
- Comments like "prevent replication of invalid data"
- Confusion between replication halting and save halting

### Preferred Alternative
```php
public function replicating(Order $order): ?bool
{
    if ($order->is_archived) {
        return false; // Prevent copying archived orders — mutation control
    }
    return null;
}
```

### Detection Checklist
- [ ] Review `replicating` handlers for validation logic
- [ ] Use `replicating` only for mutation control, not data validation
- [ ] Move validation to `saving` or `creating` events

### Related
| Rule | `05-rules.md` — Do Not Halt in `replicating` for Validation — Halt for Mutation Control Only |
