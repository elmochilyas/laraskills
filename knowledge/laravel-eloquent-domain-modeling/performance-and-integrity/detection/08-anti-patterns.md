# Detection — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Detection |
| Focus | Anti-patterns in N+1 detection, query monitoring, test assertions, and Debugbar/Telescope usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No N+1 Detection Tooling (Query Log Blindness) | Performance | Critical |
| 2 | Global Query Cap Without Route Context | Maintainability | Medium |
| 3 | Deploying Debugbar to Production | Security | Critical |
| 4 | Using Random/Flaky Seed Data for Query Count Tests | Testing | High |
| 5 | Relying Only on `preventLazyLoading()` Without Query Count Assertions | Testing | High |
| 6 | Relying Only on Debugbar Without Automated Tests | Testing | Medium |

---

## 1. No N+1 Detection Tooling (Query Log Blindness)

### Category
Performance

### Description
Running development without Debugbar, Telescope, or any query monitoring tool, relying on user complaints to discover N+1 issues.

### Preferred Alternative
```php
// composer require barryvdh/laravel-debugbar --dev
// Debugbar shows 101 queries for 100 users — immediately visible
```

### Detection Checklist
- [ ] Install debug toolbar or Telescope in development
- [ ] Enable query count display
- [ ] Make N+1 violations visible during development

### Related
| Rule | `05-rules.md` — Enable N+1 Detection in Development |

---

## 2. Global Query Cap Without Route Context

### Category
Maintainability

### Description
Enforcing a single `MAX_QUERIES=10` limit across all routes, causing false positives on complex dashboard pages and false negatives on simple pages.

### Preferred Alternative
Set route-specific thresholds:
```php
private array $thresholds = [
    'posts.index' => 5,
    'dashboard' => 25,
    'users.show' => 3,
];
```

### Detection Checklist
- [ ] Review query counting middleware for global caps
- [ ] Replace with route-specific thresholds
- [ ] Document each route's expected query budget

### Related
| Rule | `05-rules.md` — Set Route-Specific Query Count Thresholds |

---

## 3. Deploying Debugbar to Production

### Category
Security

### Description
Installing Debugbar as a production dependency, exposing database queries, configuration, and environment variables to any user.

### Preferred Alternative
```json
{
    "require-dev": {
        "barryvdh/laravel-debugbar": "^3.0"
    }
}
```

### Detection Checklist
- [ ] Check `composer.json` — is Debugbar in `require` or `require-dev`?
- [ ] Remove from production dependencies
- [ ] Verify `APP_DEBUG=false` in production `.env`

### Related
| Rule | `05-rules.md` — Never Deploy Debugbar to Production |

---

## 4. Using Random/Flaky Seed Data for Query Count Tests

### Category
Testing

### Description
Using random factory data (e.g., `rand(0, 5)` comments) in query count test assertions, producing flaky results that sometimes pass and sometimes fail.

### Preferred Alternative
```php
Post::factory(10)
    ->has(Comment::factory()->count(3)) // Fixed count — deterministic
    ->create();
```

### Detection Checklist
- [ ] Review query count tests for random factory values
- [ ] Replace with fixed, deterministic seed data
- [ ] Verify assertions produce consistent results

### Related
| Rule | `05-rules.md` — Use Deterministic Seed Data for Query Count Tests |

---

## 5. Relying Only on `preventLazyLoading()` Without Query Count Assertions

### Category
Testing

### Description
Enabling `preventLazyLoading()` but never adding `assertQueryCountLessThan()` assertions, missing method-chain N+1 violations (`$model->relation()->where(...)->get()`).

### Preferred Alternative
```php
Model::preventLazyLoading();
$response = $this->get('/posts');
$this->assertQueryCountLessThan(10); // Catches both patterns
```

### Detection Checklist
- [ ] Add `assertQueryCountLessThan()` to critical endpoint tests
- [ ] Pair with `preventLazyLoading()` for full coverage
- [ ] Set route-appropriate query count thresholds

### Related
| Rule | `05-rules.md` — Combine Automated Tests with Production Monitoring |

---

## 6. Relying Only on Debugbar Without Automated Tests

### Category
Testing

### Description
Depending solely on visual inspection via Debugbar during development, without automated test assertions that catch regressions in CI/CD.

### Preferred Alternative
```php
// CI test:
$this->assertQueryCountLessThan(10);
// Production monitoring:
// Datadog alert on p95 duration > 500ms
```

### Detection Checklist
- [ ] Add query count assertions to CI pipeline
- [ ] Keep Debugbar for local development feedback
- [ ] Add production monitoring for post-deployment detection

### Related
| Rule | `05-rules.md` — Combine Automated Tests with Production Monitoring |
