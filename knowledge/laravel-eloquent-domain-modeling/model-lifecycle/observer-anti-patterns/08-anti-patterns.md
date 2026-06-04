# Observer Anti-Patterns — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Observer Anti-Patterns |
| Focus | Anti-patterns in observer architecture, business logic placement, and observer misuse |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Business Logic in Observers | Architecture | Critical |
| 2 | Observer as God Class (Single Observer Per Model) | Maintainability | High |
| 3 | Heavy Synchronous Operations in Observers | Performance | Critical |
| 4 | Infinite Event Loops From Saving Inside Observer | Reliability | Critical |
| 5 | Hidden Dependencies via Facades in Observers | Design | High |
| 6 | Accessing Unloaded Relationships in Observers (N+1) | Reliability | Medium |
| 7 | Throwing Exceptions From `*ed` Event Observers for Control Flow | Design | High |

## Repository-Wide Cross-Cutting Patterns

- The most common and severe anti-pattern is placing business logic in observers, scattering domain rules across infrastructure code
- God observers grow with every new side effect and become impossible to test or change safely
- Heavy synchronous operations in observers block HTTP responses and cause production timeouts

---

## 1. Business Logic in Observers

### Category
Architecture

### Description
Implementing business rules, domain calculations, or decision logic in observer methods instead of keeping observers focused on infrastructure concerns (cache, logs, sync).

### Warning Signs
- Discount application, status transitions, or fee calculations in observer methods
- Observer logic that references domain concepts unique to the business
- Business rules scattered across `saved()`, `created()` handlers
- Comments like "business rule applied here"

### Preferred Alternative
```php
// Business logic in a domain service
class ApplyVolumeDiscount
{
    public function execute(Order $order): void
    {
        if ($order->total_cents >= 10000) {
            $order->applyDiscount(0.1);
            $order->save();
        }
    }
}

// Observer only for infrastructure
class OrderCacheObserver
{
    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}");
    }
}
```

### Detection Checklist
- [ ] Review each observer for business logic (discounts, workflows, state machines)
- [ ] Extract business logic to domain services or action classes
- [ ] Keep observers limited to cache, logs, job dispatch

### Related
| Rule | `05-rules.md` — Never Put Business Logic in Observers |

---

## 2. Observer as God Class (Single Observer Per Model)

### Category
Maintainability

### Description
Creating a single observer per model that handles all side effects — cache invalidation, audit logging, notifications, external sync — instead of one observer per concern.

### Warning Signs
- Single observer with `saved()` doing cache, audit, notifications, and sync
- Observer class exceeding 50 lines
- Tests for one side effect break because another side effect changes
- Comments like "add new side effect to the observer"

### Preferred Alternative
```php
#[ObservedBy(OrderCacheObserver::class)]
#[ObservedBy(OrderAuditObserver::class)]
#[ObservedBy(OrderNotificationObserver::class)]
class Order extends Model {}
```

### Detection Checklist
- [ ] Check each model for a single "god" observer
- [ ] Split into per-concern observers
- [ ] Test each observer independently

### Related
| Rule | `05-rules.md` — Keep One Observer Per Infrastructure Concern |

---

## 3. Heavy Synchronous Operations in Observers

### Category
Performance

### Description
Making HTTP calls, processing images, sending emails, or generating reports synchronously inside observer methods, blocking the HTTP response until the operation completes.

### Warning Signs
- `Mail::send()` (not queued), `Http::post()`, image processing inside observers
- Slow model save/delete operations
- Request timeouts under load
- Comments like "synchronous API call"

### Preferred Alternative
```php
public function created(Order $order): void
{
    dispatch(new SendOrderConfirmation($order->id))->afterCommit();
    dispatch(new SyncOrderToExternal($order->id))->afterCommit();
}
```

### Detection Checklist
- [ ] Search for HTTP calls, mail sends, file processing in observer methods
- [ ] Replace synchronous heavy operations with queued jobs
- [ ] Verify observers execute in under 5ms

### Related
| Rule | `05-rules.md` — Dispatch Jobs for Heavy Operations in Observers — Never Execute Synchronously |

---

## 4. Infinite Event Loops From Saving Inside Observer

### Category
Reliability

### Description
An observer method saves the same model it's observing, creating an infinite loop: save → observer → save → observer → ... until stack overflow or timeout.

### Warning Signs
- Observer method calls `$model->save()` or `$model->update()`
- Stack overflow or max execution time errors during save
- Comments like "this causes infinite loop"
- Recursive observer logic

### Preferred Alternative
```php
public function saved(AuditLog $log): void
{
    AuditLog::withoutEvents(fn () =>
        $this->pruneOldLogs() // Manipulates model without triggering events
    );
}
```

### Detection Checklist
- [ ] Search for `save()`, `update()`, `delete()` calls inside observer methods
- [ ] Add `saveQuietly()` or `withoutEvents()` to break loops
- [ ] Verify no infinite recursion exists

### Related
| Rule | `05-rules.md` — Use `saveQuietly()` or `withoutEvents()` to Prevent Infinite Loops — Never Suppress Events Broadly |
| Skill | `06-skills.md` — Set Up Observers with Constructor Injection and Single Concern |

---

## 5. Hidden Dependencies via Facades in Observers

### Category
Design

### Description
Using facades (`\Cache`, `\Log`, `\Mail`) inside observer methods instead of injecting dependencies through the constructor, creating hidden coupling to the service container.

### Warning Signs
- `Cache::`, `Log::`, `Mail::`, `Queue::` facades in observer methods
- Observer tests that require `Facade::fake()` calls
- Comments like "can't unit test this observer"
- New observers that copy the facade pattern

### Preferred Alternative
```php
class OrderCacheObserver
{
    public function __construct(
        private readonly CacheManager $cache
    ) {}

    public function saved(Order $order): void
    {
        $this->cache->forget("order:{$order->id}");
    }
}
```

### Detection Checklist
- [ ] Search for facade calls in observer methods
- [ ] Replace with constructor injection
- [ ] Verify observers can be unit tested without facades

### Related
| Rule | `05-rules.md` — Use Constructor Injection in Observers — Never Facades or Global State |

---

## 6. Accessing Unloaded Relationships in Observers (N+1)

### Category
Reliability

### Description
Accessing relationships inside observer methods without checking if they're loaded, triggering N+1 queries invisible to the original caller.

### Warning Signs
- `$order->items->count()`, `$order->user->name` in observers without existence checks
- Unexpected database queries in observer execution
- Performance degradation correlated with observer activity
- Comments like "triggers extra queries"

### Preferred Alternative
```php
public function deleted(Order $order): void
{
    if ($order->relationLoaded('items')) {
        foreach ($order->items as $item) { /* ... */ }
    } else {
        $itemCount = $order->items()->count(); // Explicit query
    }
}
```

### Detection Checklist
- [ ] Review observer methods for relationship access
- [ ] Add `relationLoaded()` checks before accessing relationships
- [ ] Use explicit queries instead of lazy loading in observers

### Related
| Rule | `05-rules.md` — Do Not Access Relationships in Observers That May Not Be Loaded |

---

## 7. Throwing Exceptions From `*ed` Event Observers for Control Flow

### Category
Design

### Description
Throwing exceptions in `saved`, `created`, `updated`, or `deleted` observer methods to signal errors, even though the data has already been persisted and the exception cannot undo the database operation.

### Warning Signs
- `throw new \Exception()` inside `saved()`, `created()`, `deleted()` methods
- Catch blocks in controllers that catch exceptions from after-events
- Orphaned data in the database after exception
- Comments like "too late — data already saved"

### Preferred Alternative
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        Log::warning('Negative total prevented');
        return false; // Aborts before save — no data persisted
    }
    return null;
}
```

### Detection Checklist
- [ ] Search for `throw` in `*ed` observer methods
- [ ] Move validation to `*ing` methods
- [ ] Log errors in `*ed` methods instead of throwing

### Related
| Rule | `05-rules.md` — Never Throw Exceptions From `*ed` Event Observers to Control Flow |
