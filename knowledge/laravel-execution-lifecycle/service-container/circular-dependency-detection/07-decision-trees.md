# Circular Dependency Detection — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Circular Dependency Detection
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Factory pattern vs setter injection vs event-driven | Breaking a circular dependency cycle | Architecture; laziness; testability |
| 2 | Singleton masking vs structural break | Avoiding the cycle detection via binding type | Correctness; determinism; maintenance |
| 3 | CI cycle detection test strategy | Catching cycles before deployment | Prevention; early detection; reliability |

---

## Decision 1: Factory vs Setter Injection vs Event-Driven

### Decision Context
Two services have a circular constructor dependency (A → B → A). Choose the best pattern to break the cycle.

### Decision Criteria
- **Is the reverse dependency truly needed at construction?** Yes → factory; No → setter injection
- **Can the services communicate indirectly?** Yes → event-driven; No → direct break needed
- **Can one service operate in degraded state?** Yes → setter injection; No → factory
- **Relationship is synchronous?** → factory or setter; Asynchronous → event-driven

### Decision Tree
```
Breaking a circular dependency (A → B → A)?
├── FACTORY PATTERN (most common)
│   ├── BOTH dependencies are needed at construction time
│   │   └── Inject a factory that lazily resolves the cycle
│   ├── A needs B immediately, B needs A later
│   │   └── A gets B directly; B gets A via factory
│   ├── Implementation: class A { __construct(B $b) }
│   │   └── class B { __construct(Factory $factory) }
│   │   └── class Factory { make(): A { return container->make(A::class) } }
│   └── Pros: lazy, clean, explicit dependency direction
├── SETTER INJECTION
│   ├── One service can operate WITHOUT the other initially
│   │   └── Make one dependency nullable; use setter for post-construction wiring
│   ├── Implementation: class A { __construct(?B $b = null) }
│   │   └── class A { setB(B $b): void }
│   │   └── class B { __construct(A $a) } // No cycle — A accepts null
│   ├── Pros: simple, no extra class
│   └── Cons: two-phase initialization contract — caller must call setB()
├── EVENT-DRIVEN COMMUNICATION
│   ├── Services interact through dispatched events, not direct calls
│   │   └── A dispatches event; B listens; no constructor dependency needed
│   ├── Implementation: class A { event(new AEvent($this)) }
│   │   └── class B { listen(AEvent::class, fn($e) => $e->a->... }
│   ├── Pros: fully decoupled
│   └── Cons: async context; harder to trace flow
└── Which to choose?
    ├── Both need each other at construction → FACTORY
    ├── One can be null initially → SETTER INJECTION
    ├── Indirect interaction (A triggers, B reacts) → EVENT-DRIVEN
    └── Default → FACTORY pattern — clearest, most predictable
```

### Rationale
The factory pattern is the most common and cleanest break — it defers the reverse dependency construction to a separate class. Setter injection is simpler but creates a hidden initialization contract. Event-driven decoupling works for indirect relationships but adds indirection for direct dependencies.

### Default
Use the factory pattern to break circular dependencies. Use setter injection when one service can operate in a degraded state. Use event-driven only when the relationship is naturally asynchronous.

### Risks
- Factory that leakily captures the container → passes full container access to consumers
- Setter injection without documentation → callers don't know to call setB()
- Event-driven for synchronous needs → adds unnecessary complexity

### Related Rules/Skills
- Break Circular Dependencies with the Factory Pattern
- Use Setter Injection for One Direction of a Cycle
- Use Event-Driven Communication to Eliminate Cycles
- Skill: Break Circular Dependencies

---

## Decision 2: Singleton Masking vs Structural Break

### Decision Context
A circular dependency is detected. Choose between changing to `singleton()` to mask the cycle or breaking the structure.

### Decision Criteria
- **Is the cycle real or an artifact of resolution order?** Real → must break; Artifact → still break
- **Can you change the architecture?** Yes → break structurally; No (legacy) → masking is temporary
- **Testing reliability**: Singleton masking is order-dependent → unreliable in tests

### Decision Tree
```
Responding to CircularDependencyException?
├── STRUCTURAL BREAK (CORRECT)
│   ├── Add factory, setter, or event to eliminate the cycle
│   │   └── Clean dependency graph — no cycles
│   ├── Testable in any resolution order
│   │   └── Reliable — behavior doesn't depend on which service resolves first
│   └── Long-term fix
│       └── DOES NOT accumulate technical debt
├── SINGLETON MASKING (WRONG)
│   ├── Change one binding to singleton to "hide" the cycle
│   │   └── Only works if the singleton is already resolved before cycle is hit
│   ├── Resolution-order-dependent
│   │   └── Works in dev (different resolution order), fails in production
│   ├── Tickling time bomb
│   │   └── Breaks when resolution order changes (new route, new provider)
│   └── Accumulates technical debt
│       └── Future developer doesn't know the cycle exists — can't safely refactor
├── Why singleton masking fails
│   ├── If BOTH services are unresolved → cycle still detected
│   │   └── Singleton doesn't help — build stack tracks resolution in progress
│   ├── If one is already cached → cycle avoided (but fragile)
│   │   └── Depends on when the singleton was first resolved
│   └── Cache flush (forgetInstance) → cycle reappears immediately
└── When masking seems to work (but hasn't)
    ├── Test passes because resolution order happens to avoid the cycle
    ├── Production breaks because different routes resolve in different order
    └── Never trust a cycle that "sometimes works"
```

### Rationale
Singleton masking creates a fragile, order-dependent system that works by coincidence rather than design. A structural break (factory, setter, event) eliminates the cycle entirely, making the dependency graph deterministic regardless of resolution order.

### Default
Always break circular dependencies structurally. Never use `singleton()` to mask a cycle.

### Risks
- Masked cycle works in development, fails in production
- Masked cycle works with one request, fails with another (different resolution order)
- Cache flush or Octane reset exposes the cycle at runtime

### Related Rules/Skills
- Avoid Using Singletons to Mask Circular Dependencies
- Skill: Break Circular Dependencies

---

## Decision 3: CI Cycle Detection Test Strategy

### Decision Context
Setting up automated detection of circular dependencies. Decide the test strategy for catching cycles before deployment.

### Decision Criteria
- **Number of custom bindings**: Few (<20) → resolve all; Many → benchmark approach
- **CI time budget**: Tight → resolve key bindings; Generous → resolve all
- **Deployment frequency**: High → fast cycle detection needed; Low → full resolution is fine

### Decision Tree
```
CI test strategy for circular dependencies?
├── ALL CUSTOM BINDINGS test (recommended)
│   ├── Iterate all registered bindings, call make() for each
│   ├── Catch CircularDependencyException
│   ├── Pro: catches ALL cycles
│   ├── Con: resolves every binding — test time depends on binding count
│   └── Best for: applications with <100 custom bindings
├── KEY SERVICE test
│   ├── Test only core business services
│   ├── Skip framework bindings, rarely-resolved utilities
│   ├── Pro: faster CI pipeline
│   ├── Con: may miss cycles in less-used services
│   └── Best for: applications with 100+ bindings, tight CI budget
├── TEST STRATEGY implementation
│   ├── Get all bindings: container->getBindings()
│   ├── For each binding that is a custom (not framework) binding:
│   │   └── try { container->make($abstract) } catch (CircularDependencyException) { fail }
│   ├── Test runs in CI before each deploy
│   └── Fails fast — identifies exact abstract names in cycle
└── MAINTENANCE
    ├── Add new bindings → test automatically includes them
    ├── Refactor services → test catches new cycles
    └── Run on PR, merge to main, and pre-deploy
```

### Rationale
Circular dependencies are only detected at runtime — there is no static analysis. A CI test that resolves registered bindings is the only way to catch cycles before they reach production. The test should be a gate in the CI pipeline, failing the build if any `CircularDependencyException` is thrown.

### Default
Write a CI test that resolves every custom registered binding and fails on `CircularDependencyException`.

### Risks
- Not testing all bindings → cycles lurk in untested services
- Test that doesn't catch all resolution orders → cycle may depend on which service is resolved first
- Test that boots the full application → slow; consider isolating to container-level test

### Related Rules/Skills
- Test All Registered Bindings for Circular Dependencies in CI
- Skill: Detect Cycles via CI Testing
