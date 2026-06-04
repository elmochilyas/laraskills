# Decision Trees: Singleton State Leaks

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Singleton State Leaks
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-SL-01 | Singleton Leak Risk Classification | Architecture | Medium | Per binding audit |
| DT-SL-02 | Singleton-to-Scoped Conversion Decision | Architecture | Medium | Per unsafe singleton |
| DT-SL-03 | Sequential Testing for Leak Detection | Testing | Low | Per feature audit |

---

## DT-SL-01: Singleton Leak Risk Classification

### Decision Context
- **When to decide:** During binding audit for Octane readiness
- **Stakeholders:** Backend Developers
- **Trigger:** Evaluating a singleton for state safety
- **Constraint:** Singletons with mutable state are the #1 Octane bug

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| State mutability | High | Does the service store per-request data? |
| Data sensitivity | High | Auth, tenant, session = critical |
| Transitive contamination | High | Dependencies may introduce leaks |

### Decision Tree

```
Does the singleton directly store mutable per-request state?
├── No — all properties are immutable or stateless
│   └── Check dependency graph:
│       ├── All dependencies are safe → SAFE SINGLETON (no action)
│       └── Any dependency is unsafe → TRANSITIVELY UNSAFE (must fix)
│
├── Yes — stores mutable state that changes per request
│   ├── What type of data?
│   │   ├── Auth/User identity → CRITICAL (data leak, auth spoofing)
│   │   ├── Tenant/Team/Locale/Session → CRITICAL (data leak)
│   │   ├── Config/Feature flags → HIGH (configuration drift)
│   │   ├── Payment/Financial → HIGH (financial data contamination)
│   │   ├── Cached query results → MEDIUM (stale/wrong results)
│   │   └── Logging/metrics accumulators → LOW (performance, not correctness)
│   │
│   └── (prioritize fixes by risk level)
│
└── Unknown — cannot determine from static analysis
    └── Flag as NEEDS REVIEW
        └── Write sequential test to detect leakage
```

### Rationale
Singleton state leaks are classified by data sensitivity. Auth and tenant leaks are critical because they cause cross-user data exposure. Config and payment leaks are high because they cause financial or behavioral drift. Low-risk leaks (logging accumulators) affect memory but not correctness.

### Default Path
Classify every singleton. Fix CRITICAL and HIGH before Octane deployment. Monitor MEDIUM and LOW.

### Risks
- False classification of safe singleton as unsafe — unnecessary conversion to scoped adds overhead
- Missing transitive contamination — safe-looking singleton leaks through its dependencies
- Classification drift — singleton behavior changes over time without re-audit

### Related Rules/Skills
- Audit every singleton for mutable per-request state
- Score and prioritize remediation by risk impact
- Skill: Identify Singleton State Leaks Through Sequential Request Testing

---

## DT-SL-02: Singleton-to-Scoped Conversion Decision

### Decision Context
- **When to decide:** When fixing a leaky singleton
- **Stakeholders:** Backend Developers
- **Trigger:** Identifying a singleton that leaks per-request state
- **Constraint:** Converting to scoped adds per-request overhead but is simplest fix

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Service complexity | Medium | Simple services convert easily; complex ones may need redesign |
| Performance impact | Medium | Scoped adds ~0.5-2ms per binding per request |
| Usage pattern | Medium | Is the service resolved many times per request? |
| Runtime config | Low | Does the service need singleton semantics for persistence? |

### Decision Tree

```
Can the service be converted to scoped()?
├── Yes — no reliance on singleton persistence
│   ├── Change $this->app->singleton() → $this->app->scoped()
│   ├── Ensure provider implements OctaneSandbox (if per-request state)
│   ├── Use class-name registration for performance
│   └── Test: app(Service::class) returns same instance within request, different across requests
│
├── No — service needs singleton persistence (connection pool, event dispatcher)
│   └── Two alternative fixes:
│       ├── Stateless redesign: remove mutable properties, load data per method call
│       │   └── Most performant; requires code changes
│       │
│       └── RequestTerminated reset: add listener to reset service state after each request
│           └── Simpler but adds cleanup overhead
│
└── Partial — some state is per-request, some is global
    └── Split the service:
        ├── Singleton for global state
        └── Scoped wrapper for per-request state
            └── Most flexible; requires refactoring
```

### Rationale
Converting to `scoped()` is the simplest fix for most leaky singletons — it requires minimal code changes and leverages the container's built-in lifecycle management. However, services that need singleton semantics (connection pools, event dispatchers) require stateless redesign or explicit cleanup.

### Default Path
Convert to `scoped()` for simple leaky singletons. Use stateless redesign for services needing persistence. Use `RequestTerminated` cleanup as last resort.

### Risks
- Converting connection pools to scoped = connection storms on every request
- Stateless redesign may miss some mutable state — partial fix leaves residual leak
- RequestTerminated reset may not cover all state paths — cleanup incomplete

### Related Rules/Skills
- Convert request-aware singletons to `scoped()`
- Never use `app()->instance()` for per-request state
- Skill: Identify Singleton State Leaks Through Sequential Request Testing

---

## DT-SL-03: Sequential Testing for Leak Detection

### Decision Context
- **When to decide:** When testing Octane readiness
- **Stakeholders:** Backend Developers
- **Trigger:** After fixing leaky bindings — verifying no regression
- **Constraint:** Single-request tests cannot detect cross-request leaks

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Request sequence | High | Must send 2+ requests with different user context |
| Data isolation assertion | High | Second request must not contain first request's data |
| Test isolation | Medium | Must run in same PHP process to simulate worker persistence |

### Decision Tree

```
What type of leak is being tested?
├── Auth/user identity leak
│   └── Alice/Bob test:
│       1. Send request as User Alice to warms-singleton endpoint
│       2. Send request as User Bob to data-sensitive endpoint
│       3. Assert Bob's response does NOT contain Alice's data
│
├── Tenant/locale leak
│   └── Sequential test with different tenant/locale context:
│       1. Send request with Tenant A context
│       2. Send request with Tenant B context
│       3. Assert Tenant B response does NOT contain Tenant A data
│
├── Configuration drift
│   └── Sequential test with config mutation:
│       1. Send request that changes config value
│       2. Send request that reads same config value
│       3. Assert second request sees original config, not mutated value
│
└── Generic data isolation
    └── Two-request pattern (applies to any endpoint):
        1. First request warms singletons with context A
        2. Second request uses context B
        3. Assert complete isolation
```

### Rationale
Two-request sequential testing is the minimal reproducible test for singleton leaks. The first request "warms" the singleton (creating the shared instance). The second request demonstrates whether state from the first request persists. Single-request tests catch nothing because the warm instance doesn't exist yet.

### Default Path
Write Alice/Bob sequential tests for all user-data endpoints. Add to CI as regression prevention.

### Risks
- Testing with same user for both requests — identical data doesn't reveal contamination
- Not testing the right endpoint — leak may only appear on specific code paths
- Test environment not simulating worker persistence — using `refreshApplication()` between requests clears state artificially

### Related Rules/Skills
- Test with two sequential requests for different users
- Skill: Identify Singleton State Leaks Through Sequential Request Testing
