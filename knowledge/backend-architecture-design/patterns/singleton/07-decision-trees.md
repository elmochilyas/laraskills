# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Singleton pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: GoF Singleton vs Service Container singleton binding
* Decision 2: Singleton lifetime — container singleton vs scoped vs transient
* Decision 3: Singleton immutability — stateful vs stateless singletons

---

# Architecture-Level Decision Trees

---

## Decision: GoF Singleton vs Service Container Singleton Binding

---

## Decision Context

Choose between the classic GoF Singleton (private constructor + static instance) and Laravel's Service Container singleton binding (`$this->app->singleton()`).

---

## Decision Criteria

* performance considerations: GoF Singleton is slightly faster (no container resolution); Container singleton adds ~0.1-1ms first call
* architectural considerations: GoF Singleton is globally accessible, cannot be replaced; Container singleton is injectable and replaceable
* security considerations: GoF Singleton cannot be mocked; Container singleton uses standard DI mocking
* maintainability considerations: GoF Singleton creates hidden dependencies (coupled via `::getInstance()`); Container singleton is explicit via constructor injection

---

## Decision Tree

Does the class need to be replaced in tests (mocked/stubbed)?
↓
YES → Service Container singleton binding (never GoF Singleton)
    ↓
    `$this->app->singleton(ServiceInterface::class, ConcreteService::class)`
    Test: `$this->mock(ServiceInterface::class)` — container replaces the singleton
    ↓
    Is the class consumed via `app()->make()` or `resolve()`?
    YES → Container singleton — always resolve through container, never `::getInstance()`
        ↓
        Resolve via DI constructor parameter or `app()->make()`
        NO → Constructor injection — inject interface, container resolves singleton
    NO → Is the class framework-agnostic (pure domain logic)?
        YES → Neither GoF nor Container — inject as a regular dependency
            ↓
            Domain layer should not depend on framework container
            Pass the instance as a constructor parameter from the composition root
            NO → GoF Singleton only for zero-dependency utility classes (e.g., pure math helpers)
                ↓
                Even here, prefer DI with shared instance over GoF Singleton
                GoF Singleton is effectively obsolete in Laravel
NO → Container singleton binding (GoF Singleton provides no benefit over container)
    ↓
    GoF Singleton limitations:
    → Cannot be mocked without `Mockery::mock('alias:...')`
    → Hidden coupling: `SomeClass::getInstance()` obscures the dependency
    → Not compatible with Octane/roadrunner (static state persists across requests)
    ↓
    Container singleton is always preferred — even for simple utility classes

---

## Rationale

The GoF Singleton pattern is obsolete in Laravel. The Service Container provides the same single-instance guarantee without the pattern's harmful side effects: hidden dependencies, global state, and testability problems. Every GoF Singleton can be replaced by a container singleton binding + constructor injection.

---

## Recommended Default

**Default:** Service Container singleton binding (`$this->app->singleton()`) for all single-instance needs. Never use the GoF Singleton pattern in new code.
**Reason:** Container singleton supports DI, mocking, Octane compatibility, and explicit dependencies. GoF Singleton provides zero benefits over the container approach.

---

## Risks Of Wrong Choice

GoF Singleton in modern Laravel: untestable (requires static method mocking), hidden coupling, breaks in Octane (cross-request state). No singleton binding when needed: multiple instances created, wasted resources, inconsistent state. Container singleton for request-scoped state in Octane: cross-request data contamination.

---

## Related Rules

- Rule 1: Never use GoF Singleton in new Laravel code — use container singleton binding
- Rule 2: Inject via constructor; never call `::getInstance()` or `app()->make()` inside classes

---

## Related Skills

- Bind Singleton in Container
- Mock Container Singleton in Tests
- Refactor GoF Singleton to Container Singleton

---

## Decision: Singleton Lifetime — Container Singleton vs Scoped vs Transient

---

## Decision Context

Choose the appropriate binding lifetime: singleton (shared across entire application), scoped (shared per request/job), or transient (new instance every time).

---

## Decision Criteria

* performance considerations: singleton is fastest (resolved once); scoped resolves per request; transient resolves per injection
* architectural considerations: singleton persists across requests in Octane; scoped resets per request; transient is stateless
* security considerations: singleton holds state across requests (Octane) — risk of data leaking between requests
* maintainability considerations: singleton lifetime must be documented; scoped is self-documenting per request

---

## Decision Tree

Is the service stateless (no mutable properties, all input comes from method parameters)?
↓
YES → Container singleton (safe to share across requests, no state contamination risk)
    ↓
    Examples: HTTP client, logger, configuration service, mailer, event dispatcher
    ↓
    Will this run in Octane (long-running process)?
    YES → Stateless singleton is still safe — no state to leak between requests
        ↓
    Singleton persists in memory across all requests
    Method parameters carry all per-request data
    NO → Stateless singleton — no concerns, any lifetime works
NO → Does the service hold request-scoped state?
    YES → Scoped binding (`$this->app->scoped()`) — new instance per request/job
        ↓
        In Octane: scoped resets after each request (singleton would leak between requests)
        In FPM: scoped and singleton behave identically (one request per process)
        ↓
        Examples: authenticated user context, current request data, DB transaction state
        ↓
        Is the service consumed in long-running jobs (queues)?
        YES → Scoped binding resets per job — correct behavior
            ↓
            Each job gets its own scoped instance
            Singleton would hold state across jobs — unpredictable
            NO → Scoped binding is the default for stateful services
    NO → Is the service expensive to create but potentially stateful?
        YES → Singleton + internal stateless design (refactor state out)
            ↓
            Make the service stateless by moving state to method parameters
            Singleton safe, no state contamination
            NO → Transient binding (new instance every time — safest but slowest)
                ↓
                Transient allocates new instance on every resolution
                Safest for stateful services, but memory overhead
                Acceptable unless instantiation is very expensive

---

## Rationale

Singleton is the default for stateless services. Scoped is for request-stateful services in Octane. Transient is for stateful services that cannot be refactored. The key insight: stateless services can always be singletons — the lifetime concern only matters when state is involved.

---

## Recommended Default

**Default:** Singleton for stateless services. Scoped for request-stateful services in Octane. Transient only for services that are stateful and expensive to refactor.
**Reason:** Singleton provides best performance. Scoped provides correct isolation. Transient is safest but costliest.

---

## Risks Of Wrong Choice

Singleton for stateful service in Octane: cross-request data leaks (User A sees User B's data). Scoped for stateless service: unnecessary per-request allocation. Transient for everything: performance overhead from repeated resolution and construction.

---

## Related Rules

- Rule 3: Stateless services = singleton. Request-stateful services = scoped (in Octane).
- Rule 4: Never put request-scoped mutable state in a singleton — use scoped binding

---

## Related Skills

- Configure Singleton Binding
- Configure Scoped Binding
- Detect Cross-Request State Leaks

---

## Decision: Singleton Immutability — Stateful vs Stateless Singletons

---

## Decision Context

Choose whether a singleton service should be immutable (stateless, all state passed via method params) or mutable (internal state changes over time).

---

## Decision Criteria

* performance considerations: mutability avoids parameter passing overhead (negligible); immutability simplifies reasoning
* architectural considerations: immutable singletons are thread-safe; mutable singletons require synchronization
* security considerations: mutable state in singletons can leak between requests (Octane); immutable is always safe
* maintainability considerations: immutable singletons are easier to reason about; mutable requires understanding state transitions

---

## Decision Tree

Does the service hold configuration that changes during runtime?
↓
YES → Configuration is best modeled as immutable singleton (set once at boot, never changes)
    ↓
    Set configuration in service provider (`register()`/`boot()`)
    After boot, configuration is read-only
    ↓
    Does the configuration need to change during a request?
    YES → Re-evaluate approach — runtime configuration changes indicate design issue
        ↓
        Options:
        → Use Repository pattern with DB-backed config
        → Pass config values as method parameters
        → Use scoped binding with per-request config
        NO → Immutable singleton — set at boot, frozen for lifetime
    NO → Does the service cache results internally?
        YES → Immutable cache store (write-once, read-many — safe)
            ↓
            Internal cache is populated at first use, then read-only
            Example: cached list of permissions, routes, or feature flags
            ↓
            Is the cache valid for the entire application lifetime?
            YES → Immutable singleton with internal cache (safe, no invalidation needed)
                ↓
                Cache gets populated once, never changes
                NO → Use cache service (Redis, DB) with TTL — not singleton internal state
                    ↓
                    Singleton internal state that needs invalidation → state management complexity
                    External cache (Redis) handles TTL, invalidation, and is shared across processes
NO → Is the service purely functional (input → output, no side effects)?
    YES → Stateless, immutable singleton (ideal — safest, simplest)
    ↓
    All dependencies are stateless singletons too
    Example: `StringFormatterService`, `PriceCalculator`
    NO → Refactor state out of the singleton into method parameters
        ↓
        Mutable state in singletons is the #1 cause of subtle bugs
        Move state to: method parameters, DTOs passed between methods, or request-scoped objects
        ↓
        Can the state be externalized to a collaborator (repository, cache, session)?
        YES → Externalize state, singleton becomes stateless coordinator
        NO → Consider scoped binding instead of singleton

---

## Rationale

Immutable/stateless singletons are always safe, testable, and predictable. Mutable state in singletons is the root cause of cross-request contamination bugs in Octane, subtle test ordering issues, and race conditions. The rule: make singletons stateless; if they need state, pass it as parameters or use scoped bindings.

---

## Recommended Default

**Default:** Stateless, immutable singletons. All mutable state should be passed as method parameters or extracted to external services (cache, DB, session).
**Reason:** Stateless singletons have zero risk of cross-request contamination, require no synchronization, and are trivially testable.

---

## Risks Of Wrong Choice

Mutable singleton in Octane: cross-request data contamination (random failures, user data leaks). Mutable singleton in tests: test ordering dependencies (Test B fails when run after Test A). Refactoring everything to method parameters: parameter lists become unwieldy — use DTOs for grouping.

---

## Related Rules

- Rule 5: Singletons must be stateless — all state passed as method parameters
- Rule 6: Use scoped binding, not singletons, for request-scoped mutable state

---

## Related Skills

- Design Stateless Singleton
- Externalize State from Singleton
- Use Scoped Binding for State
