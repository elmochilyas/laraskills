# Scoped Instance Management — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Scoped Instance Management
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | `scoped()` vs `singleton()` for per-request state | Octane-safe shared service registration | Data leakage; correctness under concurrency |
| 2 | Full flush vs selective flush | Clearing scoped instances at scope boundaries | Performance; mid-request state changes |
| 3 | Cache scoped reference in singleton vs re-resolve | Performance optimization vs correctness | Stale data; memory leaks |

---

## Decision 1: `scoped()` vs `singleton()` for Per-Request State

### Decision Context
A service holds state derived from the current request. Choose between `scoped()` (scope-bound) and `singleton()` (process-wide).

### Decision Criteria
- **Holds per-request mutable state?** Yes → MUST use `scoped()`; No → maybe `singleton()`
- **Deployment environment**: Octane or queue workers → `scoped()`; FPM-only → either (but prefer `scoped()`)
- **State source**: Request, auth, session, tenant → `scoped()`; Config, env, static data → `singleton()`

### Decision Tree
```
Shared service: scoped or singleton?
├── Service holds PER-REQUEST STATE
│   ├── Auth user, current tenant, locale, request ID
│   │   └── MUST use scoped() — prevents cross-request data leaks
│   ├── Caches per-request computed data
│   │   └── MUST use scoped() — cache must be fresh per request
│   ├── Depends on Request, Auth::user(), Session
│   │   └── MUST use scoped() — these are per-request dependencies
│   └── Will break under Octane if singleton
│       └── MUST use scoped()
├── Service is PROCESS-SCOPED (stateless or immutable)
│   ├── Configuration reader (immutable after boot)
│   │   └── Use singleton() — safe, efficient
│   ├── Stateless utility (logger without per-request context)
│   │   └── Use singleton() — never changes per request
│   ├── Cache manager (shared across requests)
│   │   └── Use singleton() — intended shared state
│   └── Router, config, event dispatcher
│       └── Use singleton() — framework standard
├── UNSURE if service has per-request state
│   ├── Check constructor dependencies — does it require Request, Auth, Session?
│   │   ├── Yes → scoped()
│   │   └── No → might still hold request state via setters
│   ├── Check setter methods — are they called per-request?
│   │   ├── Yes → scoped() (state changes per request)
│   │   └── No → likely singleton-safe
│   └── When in doubt → scoped() (safe default for shared bindings)
└── FPM vs Octane behavior
    ├── FPM: scoped() and singleton() are IDENTICAL
    │   └── But still use scoped() for request-state — future-proof
    ├── Octane: scoped() flushed per request; singleton() persists
    │   └── Using singleton() for request-state = DATA LEAK
    └── Queue workers: same as Octane — scoped() between jobs
```

### Rationale
`singleton()` instances persist for the process lifetime. Under Octane, a singleton holding the authenticated user from request 1 will still hold that user for request 2 — a data leak. `scoped()` instances are automatically flushed at scope boundaries (after each Octane request or queue job), making them safe for per-request state.

### Default
Use `scoped()` for any shared binding that holds per-request mutable state. Use `singleton()` only for truly stateless, process-wide services.

### Risks
- Mutable singleton under Octane → #1 cause of cross-user data leaks
- Using `scoped()` for stateless services → unnecessary flush overhead (minor)
- Singleton depending on scoped → stale scoped reference after flush

### Related Rules/Skills
- Audit All `singleton()` Bindings Before Octane Deployment
- Use `scoped()` for Any Service Holding Per-Request State
- Skill: Migrate Singletons to Scoped for Octane

---

## Decision 2: Full Flush vs Selective Flush

### Decision Context
Clearing scoped instances at a scope boundary or mid-request. Choose between flushing all scoped instances or only specific ones.

### Decision Criteria
- **Scope boundary (request end)?** → full flush (all scoped instances stale)
- **Mid-request scope change?** (tenant switch) → selective flush (only affected services)
- **Queue job boundary?** → full flush (all scoped instances from previous job)
- **Performance**: Full flush O(N) where N = scoped instances; selective flush O(K) where K = selected

### Decision Tree
```
Flush scoped instances?
├── END OF REQUEST/JOB (scope boundary)
│   ├── Octane: automatic full flush via WorkerState::endRequest()
│   │   └── No action needed — Octane handles it
│   ├── Queue worker: must call manually
│   │   └── Use FULL FLUSH: $app->flushScoped() — all scoped instances stale
│   └── End of scope → all scoped instances from this scope are invalid
│       └── FULL FLUSH is correct
├── MID-REQUEST SCOPE CHANGE
│   ├── Tenant switch: old tenant's scoped instances must be cleared
│   │   └── Use SELECTIVE FLUSH: $app->flushScoped([TenantContext::class, ...])
│   ├── Auth user changes mid-request (rare)
│   │   └── Use SELECTIVE FLUSH — only auth-related scoped instances
│   ├── Locale change
│   │   └── Use SELECTIVE FLUSH — LocaleContext and any caching depending on it
│   └── Goal: clear affected instances without disrupting unrelated scoped services
├── Performance consideration
│   ├── Full flush O(N): 50 scoped instances → ~2-5μs
│   ├── Selective flush O(K): flush 3 of 50 → ~0.3μs
│   └── For <100 scoped instances, full flush cost is negligible
└── Safety consideration
    ├── Selective flush may MISS related scoped instances
    │   └── If TenantContext is flushed but TenantAwareCache isn't → stale cache
    ├── Full flush is safer — clears ALL request-scoped state
    └── Prefer full flush at scope boundaries; selective only for mid-request changes
```

### Rationale
At natural scope boundaries (end of request, end of job), all scoped instances are stale — a full flush is correct and the O(N) cost is negligible. Mid-request scope changes require selective flushing to clear affected services without disrupting unrelated ones. When in doubt, full flush is safer.

### Default
Full flush at scope boundaries. Selective flush only for mid-request scope changes where you need to preserve unrelated scoped instances.

### Risks
- Selective flush misses related instances → stale state served
- Full flush in wrong place → unnecessary re-resolution of scoped instances
- Not flushing at all in queue workers → state leaks between jobs

### Related Rules/Skills
- Ensure `flushScoped()` Is Called at Scope Boundaries in Queue Workers
- Skill: Configure Scope Boundaries in Queue Workers

---

## Decision 3: Cache Scoped Reference in Singleton vs Re-Resolve

### Decision Context
A singleton needs data from a scoped service. Choose between caching the scoped reference or re-resolving each time.

### Decision Criteria
- **Performance**: Re-resolving adds `make()` call overhead; caching is faster
- **Correctness**: Cached reference becomes stale after flush; re-resolving always fresh
- **State volatility**: Scoped state changes mid-request → re-resolve; Stable within scope → cache via factory

### Decision Tree
```
Singleton accessing scoped data?
├── Singleton holds DIRECT REFERENCE to scoped instance
│   ├── $this->scopedService resolved once, held forever
│   │   └── WRONG — becomes stale after flushScoped()
│   ├── After flush: singleton holds old object, container provides new
│   │   └── Different code paths see different state
│   └── NEVER do this
├── Singleton uses FACTORY to re-resolve scoped data
│   ├── Inject TenantContextFactory, not TenantContext
│   │   └── CORRECT — factory returns fresh scoped instance each call
│   ├── method(): $this->factory->make()->getTenantId()
│   │   └── Always gets current scope's instance
│   └── Pattern: inject factory, resolve on each access
├── Singleton depends on STABLE scoped data (immutable snapshot)
│   ├── Scoped service captures value at construction, never changes
│   │   └── Caching in singleton is acceptable — snapshot is immutable
│   ├── Example: RequestId captured at request start, never modified
│   │   └── Singleton holds the snapshot — won't change
│   └── Risk: still becomes stale after flush, but for immutable snapshots this is fine
└── Common patterns
    ├── CORRECT: Singleton → TenantContextFactory → make() → TenantContext
    ├── WRONG: Singleton → TenantContext (resolved once, cached)
    └── ACCEPTABLE: Singleton → RequestId (immutable snapshot, no stale issue)
```

### Rationale
A singleton holding a direct reference to a scoped instance becomes stale after `flushScoped()` — the container provides fresh instances to new consumers, but the singleton's reference still points to the old, potentially garbage-collected object. The factory pattern ensures the singleton always accesses the current scope's instance.

### Default
Never cache scoped references in singletons. Always inject a factory that re-resolves scoped data on each access. The only exception is for immutable snapshots that capture value at construction and never change.

### Risks
- Stale scoped reference → old data served silently, intermittent bugs
- Different code paths see different versions of scoped data
- Memory leak: singleton holding reference prevents GC of scoped instance

### Related Rules/Skills
- Never Cache Scoped Instances in Singletons
- Skill: Migrate Singletons to Scoped for Octane
