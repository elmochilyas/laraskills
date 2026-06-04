# Decision Trees: Detection

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Detection |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | N+1 detection tool selection | Primary |
| 2 | Query count threshold strategy | Architecture |
| 3 | Detection in CI/CD pipeline | Architecture |

---

## Decision 1: N+1 Detection Tool Selection

### Context
N+1 detection requires tooling — the bug is invisible without it. Debugbar provides instant visual feedback, Telescope persists queries for analysis, middleware offers custom monitoring, and test assertions catch regressions. The right tool depends on environment and workflow.

### Criteria
- Is this development, staging, CI, or production?
- Is it a web or API-only application?
- Are query logs with stack traces needed?
- Is automated regression detection required?

### Decision Tree
```
What environment is being configured?
├── Development (local)
│   └── Is it a web application (Blade views)?
│       ├── YES → Install Debugbar (instant visual feedback in browser toolbar)
│       └── NO (API-only) → Install Telescope (no toolbar, query log UI)
├── CI/CD (automated tests)
│   └── Use assertQueryCountLessThan() in test suite
│       └── Are seed data random or deterministic?
│           ├── Deterministic → Reliable query count assertions
│           └── Random → Switch to deterministic seeds for flake-free tests
├── Staging
│   └── Use Telescope with stack traces (deep analysis, no production risk)
└── Production
    └── Use sampling-based monitoring (APM, slow query log)
        └── Never enable full query logging in production
```

### Rationale
Each tool targets a different gap. Debugbar makes violations visible in the browser during development. Telescope captures queries with stack traces for post-hoc analysis. Test assertions prevent regressions at merge time. Production monitoring catches data-volume-triggered N+1 that tests miss. No single tool covers all gaps.

### Recommended Default
Debugbar in development + `assertQueryCountLessThan()` in CI + Telescope in staging + APM monitoring in production.

### Risks
- Debugbar in production: exposes schema, config, and queries to end users
- Telescope full logging in production: memory exhaustion on high-traffic apps
- Flaky query count tests: developers lose trust in the assertion
- No production detection: N+1 from data growth goes unnoticed

### Related Rules/Skills
- Enable N+1 Detection in Development (05-rules.md)
- Set Route-Specific Query Count Thresholds (05-rules.md)
- Use Deterministic Seed Data for Query Count Tests (05-rules.md)
- Prevent N+1 with Proactive Eager Loading Strategies (06-skills.md)

---

## Decision 2: Query Count Threshold Strategy

### Context
A global query cap across all routes produces false positives on complex pages and false negatives on simple ones. Route-specific thresholds accurately reflect each endpoint's expected query budget.

### Criteria
- How many queries does each route legitimately use?
- Is there a baseline established for each endpoint?
- Are there dashboard pages with many widgets?
- Are there simple CRUD pages with single-model access?

### Decision Tree
```
Does the application have diverse endpoint complexity?
├── YES (dashboard pages + simple CRUD + complex reports)
│   └── Implement route-specific thresholds
│       └── Are baselines established for each route?
│           ├── YES → Set thresholds at baseline + 20% buffer
│           └── NO → Profile each route first, then set thresholds
└── NO (< 5 routes, all similar complexity)
    └── Single global cap is acceptable
        └── What is the typical query count?
            ├── < 5 → Set cap at 10
            ├── 5-15 → Set cap at 25
            └── > 15 → Consider refactoring first
```

### Rationale
A dashboard page rendering 5 widgets with 5 queries each legitimately uses 25 queries. A simple post show page should use 2-3. A global cap of 10 would flag the dashboard as a violation while missing a regression on the show page from 2 to 8 queries. Route-specific thresholds eliminate both false positives and false negatives.

### Recommended Default
Route-specific thresholds defined in middleware, with profiling data establishing baselines. Start with generous thresholds and tighten over time.

### Risks
- Thresholds too generous: real regressions pass through
- Thresholds too tight: developers disable the middleware
- Stale thresholds: refactored routes have outdated limits
- No baseline data: guessing leads to incorrect thresholds

### Related Rules/Skills
- Set Route-Specific Query Count Thresholds (05-rules.md)
- Use Deterministic Seed Data for Query Count Tests (05-rules.md)
- Always Eager-Load in Controllers (05-rules.md)

---

## Decision 3: Detection in CI/CD Pipeline

### Context
Without automated detection in CI, N+1 regressions ship to production. The CI pipeline must catch both obvious violations (lazy loading) and subtle ones (serialization-triggered loads).

### Criteria
- Are query count assertions included in critical endpoint tests?
- Is `Model::preventLazyLoading()` enabled in the test suite?
- Are API response tests also covered (serialization N+1)?
- Are seed data deterministic for reliable assertions?

### Decision Tree
```
Is Model::preventLazyLoading() enabled in TestCase::setUp()?
├── YES
│   └── Are there query count assertions on critical endpoints?
│       ├── YES
│       │   └── Is deterministic seed data used?
│       │       ├── YES → CI pipeline is well-equipped to catch N+1
│       │       └── NO → Fix seed data (random data causes flaky assertions)
│       └── NO → Add assertQueryCountLessThan() to list/detail endpoint tests
└── NO → Enable preventLazyLoading() in TestCase::setUp() first
    └── Add shouldBeStrict() for comprehensive protection
```

### Rationale
`preventLazyLoading()` in the test suite catches dynamic property access violations immediately with clear stack traces. Query count assertions catch method-chain lazy loads and regression from added `with()` calls. Together they provide complementary coverage. Deterministic seed data ensures assertions are reliable — rerunning a test with different random data should not change the query count.

### Recommended Default
Enable `Model::preventLazyLoading()` in `TestCase::setUp()`. Add `assertQueryCountLessThan()` to tests for all list and show endpoints. Use deterministic factory states for seed data.

### Risks
- Only testing in-memory access, not serialization: `$post->toArray()` triggers lazy loads of unloaded relations
- Random seed data: flaky assertions that developers learn to ignore
- Third-party package lazy loading: false failures that lead to global disable
- Missing test for new endpoints: no regression protection for newly added code

### Related Rules/Skills
- Use Deterministic Seed Data for Query Count Tests (05-rules.md)
- Enable preventLazyLoading in Development with Throw Behavior (05-rules.md)
- Prevent N+1 with Proactive Eager Loading Strategies (06-skills.md)
