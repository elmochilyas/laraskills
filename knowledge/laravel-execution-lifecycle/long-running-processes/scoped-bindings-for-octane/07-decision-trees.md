# Decision Trees: Scoped Bindings for Octane

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Scoped Bindings for Octane
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-SB-01 | Singleton vs Scoped vs Transient Decision | Architecture | High | Per service binding |
| DT-SB-02 | Registration Context for Scoped Bindings | Architecture | Medium | Per provider setup |
| DT-SB-03 | Class-Name vs Closure Registration | Performance | Low | Per scoped binding |

---

## DT-SB-01: Singleton vs Scoped vs Transient Decision

### Decision Context
- **When to decide:** When registering a new service in the container
- **Stakeholders:** Backend Developers
- **Trigger:** Adding a `$this->app->bind()`, `->singleton()`, or `->scoped()` call
- **Constraint:** Wrong choice causes either cross-request leaks or unnecessary overhead

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| State mutability | High | Does the service store mutable per-request data? |
| Instantiation cost | Medium | Expensive → singleton or scoped; cheap → transient |
| Runtime environment | High | Octane requires scoped for per-request state; FPM allows singleton |

### Decision Tree

```
Does the service hold any mutable state that changes between requests?
├── No — stateless/immutable (config readers, HTTP clients, loggers)
│   ├── Is instantiation expensive?
│   │   ├── Yes — use singleton()
│   │   │   └── Reuse across requests; no state risk
│   │   └── No — use bind() (transient)
│   │       └── New instance per resolution; no risk
│   └── (singleton or transient, both safe)
│
├── Yes — holds mutable per-request state (auth, session, tenant, locale)
│   ├── Is this Octane or PHP-FPM?
│   │   ├── Octane — use scoped()
│   │   │   ├── Same instance within request
│   │   │   ├── Fresh instance per request
│   │   │   └── Automatic lifecycle via sandbox flush
│   │   │
│   │   └── PHP-FPM — singleton() is safe
│   │       └── Process isolation provides per-request freshness
│   │
│   └── (scoped is required for Octane)
│
└── (scoped is the default for any service with per-request state under Octane)
```

### Rationale
Scoped bindings provide the same performance as singletons within a request (shared instance on multiple `make()` calls) while guaranteeing a fresh instance per request. This makes them the correct choice for any service that holds per-request mutable state under Octane.

### Default Path
Use `scoped()` for any service with per-request state under Octane. Use `singleton()` for stateless or immutable services. Use `bind()` for cheap, stateless services.

### Risks
- Using singleton for per-request state = cross-request data leaks
- Using scoped for stateless infrastructure (connection pools, config) = unnecessary overhead and broken persistence
- Using transient for expensive services = repeated instantiation cost

### Related Rules/Skills
- Default to scoped for any service interacting with per-request data
- Never use `scoped()` for global infrastructure services
- Skill: Convert Singletons to Scoped Bindings for Per-Request Isolation

---

## DT-SB-02: Registration Context for Scoped Bindings

### Decision Context
- **When to decide:** When deciding where to register a scoped binding
- **Stakeholders:** Backend Developers
- **Trigger:** Implementing scoped() call in a service provider
- **Constraint:** Bindings in master container's register() may not activate scoped lifecycle in sandbox

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Provider context | High | Does the provider implement OctaneSandbox? |
| Registration phase | High | register() vs boot() determines sandbox awareness |
| Service per-request state | High | Does the service need per-sandbox re-registration? |

### Decision Tree

```
Does the service provider implement the OctaneSandbox contract?
├── Yes — boot() method runs per-sandbox
│   └── Register scoped bindings in boot()
│       ├── $this->app->scoped(TenantService::class);
│       ├── Runs on every sandbox creation (every request)
│       └── Correct — scoped lifecycle activates
│
├── No — standard service provider
│   ├── Does the scoped binding need per-request re-registration?
│   │   ├── Yes — must implement OctaneSandbox
│   │   │   └── Add implements OctaneSandbox, move scoped() to boot()
│   │   │
│   │   └── No — registering in register() is sufficient
│   │       └── Example: stateless service registered as scoped for
│   │           safety margin — still works correctly
│   │
│   └── (OctaneSandbox required for scoped bindings with per-request state)
│
└── (if unsure, implement OctaneSandbox)
```

### Rationale
Bindings registered in a standard provider's `register()` run once per worker. For scoped lifecycle to work correctly with per-request state, the provider must implement `OctaneSandbox` so that the `boot()` method (and its `scoped()` calls) re-execute on each sandbox creation.

### Default Path
Implement `OctaneSandbox` on any provider that registers scoped bindings for per-request state. Register `scoped()` calls in `boot()`, not `register()`.

### Risks
- Registering scoped in register() without OctaneSandbox — scoped lifecycle never activates, binding behaves as singleton
- Not implementing OctaneSandbox — sandbox skips re-registration, per-request freshness lost
- Moving too much logic to boot() — per-request overhead increases

### Related Rules/Skills
- Register scoped bindings inside `OctaneSandbox` providers
- Skill: Convert Singletons to Scoped Bindings for Per-Request Isolation

---

## DT-SB-03: Class-Name vs Closure Registration

### Decision Context
- **When to decide:** When writing the scoped() call
- **Stakeholders:** Backend Developers
- **Trigger:** Implementing scoped binding in provider
- **Constraint:** Closures cannot be optimized by opcode caches as effectively as class names

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Auto-wiring capability | High | Can the class be auto-resolved? |
| Runtime configuration | Medium | Does the binding need request data or env values? |
| Performance requirement | Medium | Closure adds ~0.1ms per sandbox creation |

### Decision Tree

```
Can the service class be auto-resolved (no constructor params from config)?
├── Yes — all dependencies are type-hinted and resolvable
│   └── Use class-name registration:
│       ├── $this->app->scoped(Service::class);
│       └── Fastest option; opcode-cacheable
│
├── Yes, with interface/contract
│   └── Use class-name with concrete:
│       ├── $this->app->scoped(ServiceContract::class, Service::class);
│       └── Also opcode-cacheable; explicit binding
│
├── No — needs runtime configuration (env, config, request data)
│   └── Use closure registration:
│       ├── $this->app->scoped(Service::class, fn($app) => new Service(
│       │       $app->make(Config::class)->get('service.key')
│       │   ));
│       └── Slower but necessary for dynamic configuration
│
└── (prefer class-name for performance)
```

### Rationale
Class-name registration allows Laravel to defer instantiation until first use and allows PHP opcode caches (OpCache) to optimize the binding definition. Closures capture scope variables, prevent opcode optimization, and allocate additional memory. Use closures only when runtime configuration is required.

### Default Path
Use `$this->app->scoped(Class::class)` for auto-resolvable services. Use closures only when the binding depends on runtime configuration.

### Risks
- Closure-based registration for all bindings — adds measurable overhead per request
- Class-name registration when auto-wiring fails — BindingResolutionException at runtime
- Over-optimizing: the difference is ~0.1ms per binding — not worth refactoring existing closures

### Related Rules/Skills
- Prefer class-name registration over closures for scoped bindings
- Skill: Convert Singletons to Scoped Bindings for Per-Request Isolation
