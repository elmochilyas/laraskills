# Decomposition: Application Builder Configuration

## Boundary Analysis
The KU covers the `ApplicationBuilder` class and its fluent API. The boundary includes all `with*()` methods, the `create()` method, the `booting()`/`booted()` hooks, and the Configurator sub-objects (`RoutingConfigurator`, `MiddlewareConfigurator`, `ExceptionsConfigurator`). The boundary excludes the `Application::configure()` static factory (covered in the Bootstrap App PHP File KU) and the lifecycle execution of registered callbacks (covered in the Bootstrapper Sequence KU).

**In scope:** All public methods of `ApplicationBuilder`, Configurator object creation, deferred callback registration.
**Out of scope:** Callback execution, kernel construction, route loading, default configuration values inherited from parent classes.

## Atomicity Assessment
**Status:** ⚡ Splittable (2–4 units)

**Proposed split:**
1. **Application Builder Core** — the builder's `__construct()`, `create()`, and lifecycle hooks (`booting()`, `booted()`). This is the orchestration layer.
2. **Configuration Methods (sub-units):** Each `with*()` method could stand alone as a micro-KU, but the strongest candidates are:
   - **Kernel Configuration Methods** (`withRouting()`, `withMiddleware()`, `withExceptions()`) — these are tightly coupled to kernel internals.
   - **Service Registration Methods** (`withProviders()`, `withEvents()`, `withBroadcasting()`, `withCommands()`) — related to service discovery.
   - **Container Manipulation Methods** (`withSingletons()`, `withScopedSingletons()`, `withBindings()`) — thin wrappers around container methods.

**Splitting rationale:** Kernel configuration methods are the most complex and most frequently misunderstood. They could be extracted if the KU exceeds 500 words.

## Dependency Graph
```
┌──────────────────────────────┐
│ Application::configure()     │
│  (static factory,            │
│   returns ApplicationBuilder)│
└─────────────────┬────────────┘
                  │
                  ▼
┌──────────────────────────────┐
│   ApplicationBuilder Core    │
│  ┌────────────────────────┐  │
│  │ withRouting()          │──┼──► RoutingConfigurator
│  │ withMiddleware()       │──┼──► MiddlewareConfigurator
│  │ withExceptions()       │──┼──► ExceptionsConfigurator
│  │ withProviders()        │  │
│  │ withEvents()           │  │
│  │ withBroadcasting()     │  │
│  │ withCommands()         │  │
│  │ withSingletons()       │  │
│  │ withScopedSingletons() │  │
│  │ withBindings()         │  │
│  │ booting() / booted()   │  │
│  └────────────────────────┘  │
│              │                │
│              ▼                │
│         create()              │
│              │                │
│              ▼                │
│     Configured Application   │
└──────────────────────────────┘
```

## Follow-up Opportunities
- **Configurator Deep Dive:** Dedicated KUs or documentation blobs for `MiddlewareConfigurator`, `ExceptionsConfigurator`, and `RoutingConfigurator` — each has its own API surface and internal mechanics.
- **Builder vs Manual Configuration:** A comparative analysis of pre-Laravel 11 manual kernel binding vs ApplicationBuilder, quantifying boilerplate reduction and error prevention.
- **Builder Extensibility for Package Authors:** How to create custom `with*()` methods for third-party packages that integrate with the builder pattern.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization