# Decision Trees: Lazy Loading Violations

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Lazy Loading Violations |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Strict mode enablement strategy by environment | Primary |
| 2 | preventLazyLoading vs shouldBeStrict selection | Architecture |
| 3 | Custom handler for third-party compatibility | Architecture |

---

## Decision 1: Strict Mode Enablement Strategy by Environment

### Context
`preventLazyLoading()` and `shouldBeStrict()` enforce eager loading discipline by converting lazy loads into exceptions. The behavior must differ by environment — throw in development, log in staging, disable in production.

### Criteria
- Which environment is being configured (local, staging, production)?
- Is graceful degradation needed (log instead of throw)?
- Are third-party packages that lazy-load present?
- Is there a risk of production breakage from missed lazy loads?

### Decision Tree
```
What environment is being configured?
├── Development (local)
│   └── Enable with throw behavior
│       └── Any third-party packages?
│           ├── YES → Use shouldBeStrict() with custom handler for exceptions
│           └── NO → Use shouldBeStrict() directly
├── Staging
│   └── Enable with custom logging handler
│       ├── Log violations → Monitor for analysis
│       └── Never throw in staging (disrupts QA testing)
├── CI/CD (automated tests)
│   └── Enable with throw behavior in TestCase::setUp()
│       └── Combined with query count assertions for full coverage
└── Production
    └── Do NOT enable with throw behavior
        └── Use custom handler with sampling if violation monitoring needed
            └── Log at info level, never warn/error (expected to be zero)
```

### Rationale
Throwing in development catches violations immediately with a clear stack trace. Logging in staging provides visibility without disrupting QA. Disabling throw in production prevents a single lazy load from breaking the entire request. The test suite combines both `preventLazyLoading()` and query count assertions for comprehensive coverage.

### Recommended Default
`Model::shouldBeStrict()` in development. Custom logging handler in staging. `Model::preventLazyLoading()` in `TestCase::setUp()`. No throw behavior in production.

### Risks
- Enabling throw in production: 500 errors on any lazy load, denial of service
- Disabling globally for packages: all enforcement lost
- Not enabling in test suite: violations ship to production
- Only using `preventLazyLoading()`: misses method-chain lazy loads

### Related Rules/Skills
- Enable preventLazyLoading in Development with Throw Behavior (05-rules.md)
- Enable shouldBeStrict in Development and CI (05-rules.md)
- Never Enable Throw Behavior in Production (05-rules.md)
- Prevent N+1 with Proactive Eager Loading Strategies (06-skills.md)

---

## Decision 2: preventLazyLoading vs shouldBeStrict Selection

### Context
`shouldBeStrict()` (Laravel 10+) bundles `preventLazyLoading()`, `preventSilentlyDiscardingAttributes()`, and `preventAccessingMissingAttributes()`. Using `preventLazyLoading()` alone misses two other important data integrity protections.

### Criteria
- Is the application on Laravel 10+?
- Are there packages that trigger `preventSilentlyDiscardingAttributes()`?
- Do any accessors access model attributes that may not be loaded?
- Is there a need for individual control over each protection?

### Decision Tree
```
Is the application on Laravel 10+?
├── YES
│   └── Can all three protections be enabled together?
│       ├── YES → Use shouldBeStrict() (single call, comprehensive)
│       └── NO (third-party package compatibility)
│           └── Disable individual modes, keep others active
│               ├── Disable preventSilentlyDiscardingAttributes if needed
│               └── Keep preventLazyLoading and preventAccessingMissingAttributes
└── NO (Laravel < 10)
    └── Use preventLazyLoading() only
        └── Add separate preventAccessingMissingAttributes() if available
```

### Rationale
`shouldBeStrict()` provides three protections in one call: N+1 prevention, attribute integrity (no silently discarded fill values), and missing attribute access prevention (accessing unloaded columns throws instead of returning null). Using only `preventLazyLoading()` leaves the other two protections disabled.

### Recommended Default
`Model::shouldBeStrict()` for Laravel 10+ projects. Disable individual modes only when third-party packages require it.

### Risks
- `preventSilentlyDiscardingAttributes()` may break packages that rely on unguarded mass assignment
- `preventAccessingMissingAttributes()` may break code that intentionally accesses unloaded columns
- Disabling all protections because one fails: comprehensive integrity loss

### Related Rules/Skills
- Enable shouldBeStrict in Development and CI (05-rules.md)
- Enable preventLazyLoading in Development with Throw Behavior (05-rules.md)
- Never Enable Throw Behavior in Production (05-rules.md)

---

## Decision 3: Custom Handler for Third-Party Compatibility

### Context
Third-party packages may lazy-load internally. Disabling strict mode globally because of packages loses enforcement for application code. A custom handler selectively ignores known violations while keeping enforcement active.

### Criteria
- Which packages trigger lazy loading violations?
- Which model/relation combinations are involved?
- Is a global disable or selective ignore appropriate?
- Are package upgrades tested for strict mode compatibility?

### Decision Tree
```
Do third-party packages trigger lazy loading violations?
├── YES
│   └── Are the violations from specific known model/relation pairs?
│       ├── YES → Use custom handler to ignore specific pairs
│       │   └── Is a custom handler implementation present?
│       │       ├── YES → Add known pairs to ignore list
│       │       └── NO → Implement preventLazyLoading(false, $callback)
│       └── NO (widespread, many unknown violations)
│           └── Is the package essential?
│               ├── YES → Report issue to package maintainer
│               │   └── Temporarily disable only for that package's models
│               └── NO → Consider replacing the package
└── NO → No custom handler needed, use strict mode directly
```

### Rationale
A custom handler receives `($model, $relation)` for each violation and can selectively allow or throw. This keeps strict mode active for all application code while accommodating known package violations. The handler maintains a list of allowed model/relation combinations and throws for everything else.

### Recommended Default
Custom handler that ignores specific package model/relation pairs and throws for all others. Pin package versions and test upgrades for strict mode compatibility.

### Risks
- Ignore list too broad: actual violations in application code go undetected
- Ignore list too narrow: test failures from package lazy loads
- Package upgrade changes internals: previously ignored violations now come from different models
- No notification when package fixes the lazy load: ignore list becomes stale

### Related Rules/Skills
- Enable preventLazyLoading in Development with Throw Behavior (05-rules.md)
- Enable shouldBeStrict in Development and CI (05-rules.md)
- Detect N+1 with Automated Tooling (06-skills.md)
