# Binding Types — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Binding Types
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | `bind()` vs `singleton()` | Choosing transient or shared lifecycle | Performance; memory; state management |
| 2 | `singleton()` vs `scoped()` | Octane safety for request-state services | Data leakage; correctness under concurrency |
| 3 | `instance()` vs closure-based binding | Injecting pre-constructed object vs factory | Flexibility; lifecycle hook availability |

---

## Decision 1: `bind()` vs `singleton()`

### Decision Context
Registering a service. Choose between `bind()` (new instance each time) and `singleton()` (same instance every time).

### Decision Criteria
- **Service has state?** Mutable → `bind()`; Stateless/immutable → either
- **Construction cost**: Expensive (>5ms) and resolved multiple times → `singleton()`; Cheap → `bind()`
- **Resolution frequency**: 10+ times per request → consider `singleton()`; Once → `bind()`
- **Shared state risk**: Must not share state → `bind()`; Safe to share → either

### Decision Tree
```
Binding type: transient vs singleton?
├── Service holds MUTABLE STATE
│   ├── State is request-scoped (auth user, tenant)
│   │   └── Use scoped() — not bind() or singleton()
│   ├── State is across consumers within same request
│   │   └── Use bind() — fresh instance per consumer; no shared state leaks
│   └── State is designed to be shared (counter, cache)
│       └── Use singleton() — intentional shared state
├── Service is STATELESS / IMMUTABLE
│   ├── Construction is EXPENSIVE (>5ms, DB queries, API calls)
│   │   └── Use singleton() — pay cost once
│   ├── Resolved MANY TIMES per request (10+)
│   │   └── Consider singleton() — repeated allocation adds up
│   └── Construction is CHEAP and resolved few times
│       └── Use bind() — default; simplest, safest
├── Profiling data available?
│   ├── Construction cost confirmed as bottleneck
│   │   └── Use singleton() or scoped()
│   └── No profiling — default to bind()
│       └── bind() is safe; promote later if needed
└── Service DEPENDS on per-request data
    ├── Depends on request, auth, session
    │   └── Use scoped() — not singleton() (data leaks) or bind() (overhead if expensive)
    └── Depends on config, environment
        └── singleton() is safe — immutable data
```

### Rationale
`bind()` is the safe default — it prevents shared-state bugs by creating fresh instances. `singleton()` is an optimization for services that are expensive to construct and safe to share. Promote from `bind()` to `singleton()` only when profiling confirms it's a bottleneck.

### Default
Use `bind()` as default. Promote to `singleton()` only for expensive, stateless services resolved multiple times per request.

### Risks
- Mutable singleton → shared state bugs (especially in Octane)
- Expensive service as `bind()` → repeated allocation overhead on hot paths
- Singleton depending on transient → stale dependency after first resolution

### Related Rules/Skills
- Default to `bind()` for Stateless Services
- Skill: Select the Correct Binding Type

---

## Decision 2: `singleton()` vs `scoped()`

### Decision Context
A service needs shared instances. Choose between `singleton()` (process-wide) and `scoped()` (per-scope).

### Decision Criteria
- **Holds request-specific state?** Yes → `scoped()`; No → `singleton()`
- **Deployment target**: Octane/queue workers → `scoped()` for request-state; FPM-only → either (same behavior)
- **State is truly process-wide?** (config, router, cache manager) → `singleton()`
- **State is per-request?** (auth user, tenant, locale) → MUST use `scoped()`

### Decision Tree
```
Shared binding: singleton vs scoped?
├── Service holds REQUEST-SCOPED STATE
│   ├── Auth user, current tenant, locale, request ID
│   │   └── MUST use scoped() — prevents data leaks across requests
│   ├── Caches per-request data
│   │   └── MUST use scoped() — cache must be fresh per request
│   └── Mutable and depends on current request
│       └── MUST use scoped()
├── Service is TRULY PROCESS-SCOPED
│   ├── Configuration (immutable after boot)
│   │   └── Use singleton() — never changes per request
│   ├── Stateless utility (logger, parser, router)
│   │   └── Use singleton() — safe, efficient
│   └── Cache manager (shared across requests in Octane)
│       └── Use singleton() — intended shared state
├── Deployment environment
│   ├── Octane or queue workers (long-running)
│   │   └── MUST differentiate — scoped() for request-state, singleton() for process-state
│   ├── FPM-only (short-lived)
│   │   └── singleton() and scoped() behave identically — but still use scoped() for request-state
│   └── Future-proofing
│       └── Always use scoped() for request-state — works in both FPM and Octane
└── Audit existing singletons before Octane deployment
    ├── Each singleton classified as process-scoped or request-scoped
    ├── Request-scoped singletons → convert to scoped()
    └── Process-scoped singletons → keep as singleton()
```

### Rationale
Under Octane and queue workers, `singleton()` instances persist across requests. A singleton holding the authenticated user from request 1 will still hold that user for request 2 — a data leak. `scoped()` instances are automatically flushed at scope boundaries, making them safe for per-request state.

### Default
Use `scoped()` for any service holding per-request mutable state. Use `singleton()` only for truly process-wide, stateless, or immutable services.

### Risks
- Mutable singleton under Octane → #1 cause of cross-user data leaks
- Using `scoped()` where `singleton()` intended → service unnecessarily reconstructed per scope (minor overhead)
- Singleton depending on scoped service → stale scoped data after first resolution

### Related Rules/Skills
- Use `scoped()` for Any Service Holding Per-Request State
- Audit All `singleton()` Bindings Before Octane Deployment
- Skill: Select the Correct Binding Type

---

## Decision 3: `instance()` vs Closure-Based Binding

### Decision Context
You have a pre-constructed object to register. Choose between `instance()` (direct injection) and closure-based `singleton()`/`bind()`.

### Decision Criteria
- **Need extenders/resolution callbacks?** Yes → closure; No → `instance()` is fine
- **Testing**: Mock injection in tests → `instance()` is convenient
- **Production registration**: Prefer closure; `instance()` bypasses lifecycle
- **Object may need decoration later?** Yes → closure; No → either

### Decision Tree
```
How to register a pre-constructed object?
├── In PRODUCTION service providers
│   ├── Object may need extenders or resolution callbacks
│   │   └── Use closure: $app->singleton(Service::class, fn() => $object)
│   ├── Object may be decorated via extend() later
│   │   └── Use closure — instance() bypasses decoration
│   └── Object is final, no decoration needed
│       └── instance() is acceptable but closure is still preferred
├── In TESTS
│   ├── Mock injection
│   │   └── Use instance() — simplest, most direct
│   ├── Restoring original binding in tearDown()
│   │   └── Use forgetInstance() + instance() for clean restore
│   └── Swap implementations per test
│       └── Use instance() — clear and explicit
├── In BOOT-TIME setup
│   ├── Object configured before binding
│   │   └── instance() is acceptable — object already fully built
│   └── Object depends on other container services
│       └── Use closure — let container resolve dependencies
└── Performance consideration
    ├── instance() — fastest possible resolution (O(1) array lookup)
    └── Closure singleton — also O(1) after first resolution
```

### Rationale
`instance()` bypasses the container lifecycle — no extenders, no resolution callbacks, no rebound events. This makes it ideal for tests (swap mocks quickly) but less ideal for production (misses cross-cutting behavior). Closure-based bindings participate in the full container lifecycle.

### Default
Use `instance()` in tests and boot-time setup only. Use closure-based `singleton()` or `bind()` for production service provider registrations.

### Risks
- `instance()` in production provider → service can't be extended or intercepted
- Forgetting `forgetInstance()` after test → stale instance pollutes other tests
- `instance()` with incomplete object → service resolved without all dependencies configured

### Related Rules/Skills
- Use `instance()` Only in Tests or Boot-Time Setup
- Skill: Select the Correct Binding Type
