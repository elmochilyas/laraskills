# Lazy Loading Violations — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Lazy Loading Violations |
| Focus | Anti-patterns in preventLazyLoading, strict mode, production enforcement, and test coverage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Enabling Throw Behavior in Production | Reliability | Critical |
| 2 | Global Disable Because of Package Violations | Performance | Critical |
| 3 | Strict-Mode-Only Enforcement (Without Query Count Assertions) | Testing | High |
| 4 | Not Enabling `preventLazyLoading()` in Test Suite | Testing | Critical |
| 5 | Not Enabling `shouldBeStrict()` in Development and CI | Maintainability | High |
| 6 | No Custom Handler for Known Package Lazy Loads | Maintainability | Medium |

---

## 1. Enabling Throw Behavior in Production

### Category
Reliability

### Description
Passing `true` to `preventLazyLoading()` or enabling `shouldBeStrict()` in production, causing a single lazy load to crash the entire request for all users.

### Preferred Alternative
```php
Model::preventLazyLoading(false, function ($model, $relation) {
    Log::warning("Lazy load: {$model->getTable()}.{$relation}");
});
```

### Detection Checklist
- [ ] Search for `preventLazyLoading(true)` or `shouldBeStrict()` without environment guard
- [ ] Replace with logging handler in production
- [ ] Gate throw behavior with `app()->isLocal()`

### Related
| Rule | `05-rules.md` — Never Enable Throw Behavior in Production |

---

## 2. Global Disable Because of Package Violations

### Category
Performance

### Description
Disabling `preventLazyLoading()` entirely because a third-party package triggers violations, removing all N+1 enforcement for the entire application.

### Preferred Alternative
```php
Model::preventLazyLoading(false, function ($model, $relation) {
    $ignored = ['media' => SpatieMediaLibrary::class];
    if (($ignored[$relation] ?? null) === get_class($model)) {
        return; // Allow known package behavior
    }
    throw new LazyLoadingViolationException($model, $relation);
});
```

### Detection Checklist
- [ ] Search for `preventLazyLoading(false)` without handler
- [ ] Replace with custom handler that ignores specific package violations
- [ ] Keep enforcement active for application code

### Related
| Rule | `05-rules.md` — Configure Custom Handler for Package Compatibility |

---

## 3. Strict-Mode-Only Enforcement (Without Query Count Assertions)

### Category
Testing

### Description
Relying solely on `preventLazyLoading()` for N+1 prevention, missing method-chain lazy loads (`$model->relation()->where(...)->get()`) that are not caught.

### Preferred Alternative
```php
Model::preventLazyLoading();
$response = $this->get('/posts');
$this->assertQueryCountLessThan(10);
```

### Detection Checklist
- [ ] Add `assertQueryCountLessThan()` to critical endpoint tests
- [ ] Pair with `preventLazyLoading()` for full coverage
- [ ] Document that strict mode alone is insufficient

### Related
| Rule | `05-rules.md` — Combine with Query Count Assertions for Full Coverage |

---

## 4. Not Enabling `preventLazyLoading()` in Test Suite

### Category
Testing

### Description
Not adding `Model::preventLazyLoading()` to the base `TestCase::setUp()`, allowing N+1 violations to pass CI and reach production.

### Preferred Alternative
```php
class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Model::preventLazyLoading();
    }
}
```

### Detection Checklist
- [ ] Check `TestCase::setUp()` for lazy loading prevention
- [ ] Add `Model::preventLazyLoading()` call
- [ ] Verify tests fail on lazy loading violation

### Related
| Rule | `05-rules.md` — Enable in TestCase::setUp |

---

## 5. Not Enabling `shouldBeStrict()` in Development and CI

### Category
Maintainability

### Description
Enabling only `preventLazyLoading()` without `preventSilentlyDiscardingAttributes()` and `preventAccessingMissingAttributes()`, missing subtle attribute-related bugs.

### Preferred Alternative
```php
if (app()->isLocal()) {
    Model::shouldBeStrict();
}
```

### Detection Checklist
- [ ] Check if only `preventLazyLoading()` is enabled without other protections
- [ ] Enable `shouldBeStrict()` for comprehensive enforcement
- [ ] Disable individual modes only for package compatibility

### Related
| Rule | `05-rules.md` — Enable shouldBeStrict in Development and CI |

---

## 6. No Custom Handler for Known Package Lazy Loads

### Category
Maintainability

### Description
Having third-party packages that lazy-load internally with no custom handler, forcing enforcement to be disabled or causing exceptions in development.

### Preferred Alternative
```php
Model::preventLazyLoading(false, function ($model, $relation) {
    $ignored = ['media' => SpatieMediaLibrary::class];
    if (($ignored[$relation] ?? null) === get_class($model)) {
        return;
    }
    throw new LazyLoadingViolationException($model, $relation);
});
```

### Detection Checklist
- [ ] Identify third-party packages that trigger lazy loading
- [ ] Configure custom handler with allow-list
- [ ] Keep enforcement for non-package code

### Related
| Rule | `05-rules.md` — Configure Custom Handler for Package Compatibility |
