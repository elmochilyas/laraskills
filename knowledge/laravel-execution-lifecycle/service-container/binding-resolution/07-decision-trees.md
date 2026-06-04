# Binding Resolution — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Binding Resolution
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | `make()` vs constructor injection | Obtaining a service instance | Testability; design; dependency visibility |
| 2 | `make()` vs `makeWith()` vs `build()` | Resolution method selection | Lifecycle adherence; parameter handling |
| 3 | Pre-resolve during boot vs lazy resolution | Front-loading resolution cost | Performance; memory; bootstrap time |

---

## Decision 1: `make()` vs Constructor Injection

### Decision Context
A service or controller needs access to a dependency. Choose between calling `$app->make()` or declaring it in the constructor.

### Decision Criteria
- **Is this business logic?** Yes → constructor injection; No (factory, boot-time) → `make()`
- **Need to resolve dynamically?** Yes (which implementation varies at runtime) → factory class with `make()`; No → constructor
- **Testing requirement**: Must mock dependency → constructor injection (inject mock); `make()` requires container setup
- **Dependency visibility**: Should be explicit → constructor; Can be implicit → `make()` (but don't)

### Decision Tree
```
How to obtain a service instance?
├── Inside a CONTROLLER, JOB, COMMAND, or BUSINESS LOGIC
│   └── ALWAYS use constructor injection
│   ├── Declare dependency in constructor
│   └── Laravel auto-resolves via container
├── Inside a FACTORY CLASS
│   ├── Factory purpose is dynamic resolution (choose implementation at runtime)
│   │   └── Use make() — factory needs to resolve different implementations
│   └── Factory returns a single type
│       └── Use constructor injection — resolve at construction time
├── Inside a SERVICE PROVIDER boot()
│   ├── Need to register event listeners, configure services
│   │   └── Use make() — resolve services during boot
│   └── Can inject via provider constructor
│       └── Constructor injection is cleaner
├── Inside a MIDDLEWARE
│   ├── Middleware resolved per-request
│   │   └── Use constructor injection — declared dependencies resolved by container
│   └── Dependency varies by request
│       └── Use app()->make() in handle() — but consider if this is a service locator
└── In UNIT TESTS
    ├── Testing a service with dependencies
    │   └── Use constructor injection — pass mocks directly
    └── Testing container configuration
        └── Use $app->make() — test that resolution works
```

### Rationale
Constructor injection makes dependencies explicit, testable via mock injection, and visible at a glance. `make()` inside business logic creates a service locator pattern where dependencies are hidden, untestable without container bootstrapping, and invisible to static analysis.

### Default
Always use constructor injection in business logic. Use `make()` only in factories, service providers, and boot-time setup.

### Risks
- `make()` in controllers → hidden dependencies; tests need container bootstrapping
- Constructor with too many dependencies → violates SRP (but still better than service locator)
- `make()` inside a loop → performance issue (each call triggers resolution pipeline)

### Related Rules/Skills
- Inject Dependencies via Constructor, Never Resolve Inside Methods
- Use `make()` for All Application-Level Resolution
- Skill: Resolve Services Correctly with `make()`

---

## Decision 2: `make()` vs `makeWith()` vs `build()`

### Decision Context
Resolving a service. Choose between the three resolution methods.

### Decision Criteria
- **Need full lifecycle?** (extenders, callbacks, caching) → `make()` or `makeWith()`; No → `build()` (internal only)
- **Need primitive parameters?** Yes → `makeWith()`; No → `make()`
- **Application code?** Yes → `make()` or `makeWith()`; Never `build()`

### Decision Tree
```
Which resolution method?
├── Application code (controllers, services, providers)
│   ├── Class has no primitive constructor parameters
│   │   └── Use make(): $app->make(Service::class)
│   ├── Class has primitive parameters with defaults
│   │   ├── Using defaults is fine
│   │   │   └── Use make(): $app->make(Service::class)
│   │   └── Need to override defaults
│   │       └── Use makeWith(): $app->makeWith(Service::class, ['param' => 'value'])
│   └── Class has required primitives (no defaults)
│       └── Use makeWith(): MUST pass named parameters
├── Container internals / framework code
│   ├── Need to bypass extenders and callbacks
│   │   └── Use build() — raw construction (INTERNAL USE ONLY)
│   └── Application code — NEVER use build()
│       └── build() skips caching, extenders, resolution callbacks
└── Hot path optimization
    ├── Pre-resolve with make() during boot
    │   └── Use make() — caches singleton, front-loads reflection
    └── makeWith() is slower than make() (~2-5μs overhead)
        └── Use make() with explicit binding closure instead of makeWith()
```

### Rationale
`make()` is the standard resolution method that runs the full container lifecycle. `makeWith()` extends `make()` with parameter overrides. `build()` is an internal method that bypasses the lifecycle — it's for container internals only, never for application code.

### Default
Use `make()` for most resolutions. Use `makeWith()` only when primitive parameter overrides are needed. Never use `build()` in application code.

### Risks
- `build()` in application code → bypasses extenders, resolution callbacks, and caching
- Positional array in `makeWith()` → parameters silently ignored
- Using `make()` when `makeWith()` is needed → default values used, expected overrides don't apply

### Related Rules/Skills
- Use `make()` for All Application-Level Resolution
- Use `makeWith()` with Named Arrays, Not Positional Parameters
- Skill: Resolve Services Correctly with `make()`

---

## Decision 3: Pre-Resolve During Boot vs Lazy Resolution

### Decision Context
A service on a hot path (resolved every request). Decide whether to pre-resolve it during application boot or let it resolve lazily on first use.

### Decision Criteria
- **Resolution frequency**: Every request → consider pre-resolving; Rarely → lazy is fine
- **Reflection cost**: Deep dependency chain (3+ levels) → pre-resolve; Simple → lazy is fine
- **Deployment**: Octane → pre-resolve once per worker (cost amortized); FPM → pre-resolve every request (may not help)
- **Memory**: Pre-resolving creates instances earlier → may increase baseline memory

### Decision Tree
```
Pre-resolve during boot or resolve lazily?
├── Service is resolved on EVERY REQUEST
│   ├── Singleton/scoped — first resolution triggers reflection
│   │   ├── Under Octane
│   │   │   └── Pre-resolve during boot — cost paid once per worker
│   │   ├── Under FPM
│   │   │   └── Pre-resolve every request — same cost either way
│   │   └── Deep dependency chain (3+ levels of auto-resolution)
│   │       └── Pre-resolve — front-load the reflection cost
│   └── Transient (new instance every make())
│       ├── Expensive construction
│       │   └── Pre-resolving doesn't help (creates new instance anyway)
│       └── Cheap construction
│           └── Lazy resolution is fine
├── Service is resolved INFREQUENTLY
│   └── Lazy resolution — no benefit to pre-resolving
├── Memory consideration
│   ├── Singleton holds significant memory
│   │   └── Lazy — don't pre-resolve until needed
│   └── Service may not be needed on every request
│       └── Lazy — avoid unnecessary instantiation
└── Profile-guided optimization
    ├── Profiling shows resolution cost is significant
    │   └── Pre-resolve identified hot services
    └── Profiling shows no bottleneck
        └── Lazy resolution is simplest
```

### Rationale
Pre-resolving a service during boot pays the reflection cost once (per worker in Octane, or per request in FPM). This can improve response time for the first request that needs the service. However, it also increases boot time and baseline memory. The trade-off is worth it for hot-path services with deep dependency chains.

### Default
Don't pre-resolve unless profiling shows resolution overhead is a bottleneck. Under Octane, pre-resolving is more beneficial (cost paid once per worker lifetime).

### Risks
- Pre-resolving unused services → wasted memory and boot time
- Pre-resolving in FPM → same cost as lazy but earlier in lifecycle
- Pre-resolving order matters → dependencies must be registered before boot

### Related Rules/Skills
- Pre-Resolve Hot Services During Boot to Front-Load Cost
- Skill: Resolve Services Correctly with `make()`
