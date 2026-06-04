# Event Control — Quiet Operations — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Event Control — Quiet Operations |
| Focus | Anti-patterns in saveQuietly(), deleteQuietly(), withoutEvents(), and event suppression |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using `saveQuietly()` Instead of `withoutEvents()` for Scoped Suppression | Reliability | High |
| 2 | Not Documenting Why Events Are Suppressed | Maintainability | Medium |
| 3 | Using Quiet Operations to Silence Legitimate Side Effects | Design | Critical |
| 4 | Using Quiet Operations in Test Assertions | Testing | Critical |
| 5 | Nesting `withoutEvents()` Without Understanding Nesting Behavior | Framework Usage | Medium |
| 6 | Using Quiet Operations as Performance Optimization Without Measurement | Performance | Medium |
| 7 | Using Quiet Operations to Suppress Events Across HTTP Requests | Scalability | Critical |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is using quiet operations to silence side effects that should always run — this hides bugs and makes behavior unpredictable
- Using quiet operations in test assertions creates false-positive test passes that miss real event regressions
- Silent suppression (no documentation) leaves future developers debugging why events never fire

---

## 1. Using `saveQuietly()` Instead of `withoutEvents()` for Scoped Suppression

### Category
Reliability

### Description
Using individual quiet methods (`saveQuietly()`, `deleteQuietly()`) for each operation instead of wrapping the entire code block in `Model::withoutEvents()`, causing partial event suppression where subsequent operations in the same block are not suppressed.

### Warning Signs
- `$model->saveQuietly()` followed by `$model->items()->saveMany($items)`
- Intermittent unexpected event fires during bulk operations
- Comments like "need to remember to use quiet on each save"
- Mixed quiet and non-quiet calls in the same method

### Preferred Alternative
```php
Model::withoutEvents(function () use ($order, $items) {
    $order->save();
    $order->items()->saveMany($items); // Automatically suppressed
});
```

### Detection Checklist
- [ ] Search for `saveQuietly()`, `deleteQuietly()` usage
- [ ] Check if surrounding operations also need suppression
- [ ] Replace with `withoutEvents()` wrapping

### Related
| Rule | `05-rules.md` — Prefer `withoutEvents()` Over Individual Quiet Methods for Scoped Suppression |
| Decision Tree | `07-decision-trees.md` — Quiet vs Scoped Suppression |

---

## 2. Not Documenting Why Events Are Suppressed

### Category
Maintainability

### Description
Using `withoutEvents()` or quiet methods without a comment or docblock explaining the suppression reason, leaving future developers unaware that critical side effects are being bypassed.

### Warning Signs
- `withoutEvents()` call with no comment
- Developers removing suppression and causing infinite loops
- Comments like "why aren't events firing?"
- Suppression in data migrations or seeders without explanation

### Preferred Alternative
```php
// Suppress events during bulk seed to avoid firing 100 observer methods
Model::withoutEvents(fn () => User::factory()->count(100)->create());
```

### Detection Checklist
- [ ] Search for `withoutEvents(` calls without preceding comments
- [ ] Audit all quiet operation sites for documentation
- [ ] Update with suppression reason comments

### Related
| Rule | `05-rules.md` — Always Document Why Events Are Suppressed |

---

## 3. Using Quiet Operations to Silence Legitimate Side Effects

### Category
Design

### Description
Using `saveQuietly()` or `withoutEvents()` inside observer methods or service classes to prevent side effects from running, instead of fixing the underlying design issue that makes the side effects problematic.

### Warning Signs
- Observer method using `withoutEvents()` to silence its own side effects
- `saveQuietly()` used specifically to avoid triggering other observers
- Comments like "silencing events to avoid side effects"
- Side effects that run in production but are suppressed during bulk operations

### Preferred Alternative
```php
// Correct use — prevents infinite loop (observer saving its own model)
public function saved(AuditLog $log): void
{
    AuditLog::withoutEvents(fn () =>
        $this->pruneOldLogs()
    );
}
```

### Detection Checklist
- [ ] Review every `withoutEvents()` call — is it breaking a loop or hiding bugs?
- [ ] Move legitimate side effects to proper event listeners
- [ ] Use quiet operations only for infinite loop prevention and batch optimization

### Related
| Rule | `05-rules.md` — Use Quiet Operations to Break Infinite Event Loops, Not to Silence Legitimate Side Effects |

---

## 4. Using Quiet Operations in Test Assertions

### Category
Testing

### Description
Using `withoutEvents()` in the assertion phase of a test to suppress events, causing the test to pass even when event logic is broken because the events never fire.

### Warning Signs
- `withoutEvents()` inside test assertions
- Test asserts event behavior but uses quiet operations for the model under test
- Green tests that don't verify event dispatching
- Comments like "test passes but events don't fire in production"

### Preferred Alternative
```php
public function test_order_created_fires_event(): void
{
    Event::fake();
    $order = Order::factory()->create();
    Event::assertDispatched(OrderCreated::class);
}
```

### Detection Checklist
- [ ] Search for `withoutEvents(` in test files
- [ ] Move quiet operations to test setup (data seeding) only
- [ ] Use `Event::fake()` for assertion-phase event verification

### Related
| Rule | `05-rules.md` — Use Quiet Operations in Test Setup, Not in Test Assertions |

---

## 5. Nesting `withoutEvents()` Without Understanding Nesting Behavior

### Category
Framework Usage

### Description
Nesting `withoutEvents()` calls without understanding that the inner call restores the outer suppression state on exit, leading to confusion about which events are active at any point.

### Warning Signs
- Multiple levels of `withoutEvents()` nesting
- Events unexpectedly suppressed after inner block exits
- Comments like "events should be restored here"
- Deeply nested models with mixed event suppression states

### Preferred Alternative
```php
// Compose into a single suppression block instead of nesting
Model::withoutEvents(function () use ($order, $items) {
    $order->save();
    $order->items()->saveMany($items);
});
```

### Detection Checklist
- [ ] Search for nested `withoutEvents()` blocks
- [ ] Simplify into single suppression blocks where possible
- [ ] Document nesting behavior where nesting is unavoidable

### Related
| Rule | `05-rules.md` — Do Not Nest `withoutEvents()` Without Understanding the Nesting Behavior |

---

## 6. Using Quiet Operations as Performance Optimization Without Measurement

### Category
Performance

### Description
Applying `withoutEvents()` to gain performance without profiling first, bypassing essential side effects (cache invalidation, logging, sync) for negligible or non-existent performance gains.

### Warning Signs
- Comments like "optimization" with no profiling data
- Quiet operations on single-record saves, not batch operations
- Missing cache invalidations or audit logs discovered later
- Observer methods that are trivially fast (<1ms)

### Preferred Alternative
```php
// Profile first, then decide based on data
$order->save(); // Let observers run unless profiling proves otherwise
```

### Detection Checklist
- [ ] Audit `withoutEvents()` calls labeled as performance optimizations
- [ ] Verify profiling was done before optimization
- [ ] Remove premature performance-based quiet operations

### Related
| Rule | `05-rules.md` — Do Not Use Quiet Operations as a Performance Optimization Without Measurement |

---

## 7. Using Quiet Operations to Suppress Events Across HTTP Requests

### Category
Scalability

### Description
Persisting a "quiet mode" setting on the model or request that suppresses events across multiple HTTP requests, causing systematic side-effect loss for all users.

### Warning Signs
- `$model->quietMode` boolean property
- Model `save()` override that checks a request-scoped flag
- Events that work on first request but not subsequent ones
- Cache invalidation that succeeds locally but fails for other users

### Preferred Alternative
```php
// Suppress events per-operation, not per-request
$order = Model::withoutEvents(fn () => Order::create([...]));
```

### Detection Checklist
- [ ] Search for per-request or per-model quiet flags
- [ ] Replace with scoped `withoutEvents()` calls
- [ ] Verify event suppression does not leak across requests

### Related
| Rule | `05-rules.md` — Never Use Quiet Operations to Suppress Events Across HTTP Requests |
