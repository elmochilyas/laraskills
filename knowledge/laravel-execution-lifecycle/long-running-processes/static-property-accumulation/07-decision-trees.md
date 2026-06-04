# Decision Trees: Static Property Accumulation

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Static Property Accumulation
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-SPA-01 | Static vs Instance Caching Decision | Architecture | Medium | Per class design |
| DT-SPA-02 | Static Accumulator Remediation | Reliability | Medium | Per identified accumulation |
| DT-SPA-03 | One-Time Registration Guarding | Maintainability | Low | Per Macroable or directive registration |

---

## DT-SPA-01: Static vs Instance Caching Decision

### Decision Context
- **When to decide:** When implementing caching in a service class
- **Stakeholders:** Backend Developers
- **Trigger:** Need to cache computed results within a request or across requests
- **Constraint:** Static properties persist across all requests in a worker — instance properties are scoped to the object

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Cache lifetime | High | Need cache to cross request boundaries (static) or stay within request (instance)? |
| Container management | High | Can the instance be managed via scoped bindings? |
| Accumulation risk | High | Unique keys per request → static cache grows unbounded |

### Decision Tree

```
Should the cached data persist across requests or only within a request?
├── Across requests (truly global — config values, version info, class metadata)
│   └── Static caching is correct
│       ├── public static array $supportedLocales = [...];
│       └── Initialized once, never grows
│
├── Within a single request only (user data, request context, computed results)
│   ├── Is the class managed by the container as a scoped binding?
│   │   ├── Yes — use instance property on scoped binding
│   │   │   ├── private array $cache = [];
│   │   │   └── Container manages lifecycle — cleared per request
│   │   │
│   │   └── No — refactor to use scoped binding
│   │       └── Register as $this->app->scoped(Service::class)
│   │
│   └── (instance property on scoped binding = correct pattern)
│
└── (static properties for per-request caching cause unbounded memory growth)
```

### Rationale
Static properties are class-level and persist for the worker's lifetime. Using them for per-request caching causes unbounded memory growth because keys accumulate across requests. Instance properties on scoped bindings are automatically discarded at request end, providing the same caching benefit without memory accumulation.

### Default Path
Use instance properties on scoped bindings for per-request caching. Use static properties only for truly global, never-modified constants.

### Risks
- Static cache with unique per-request keys = unbounded memory growth
- Static cache with fixed keys = safe (e.g., `$supportedLocales`)
- Refactoring from static to instance requires changing all call sites from `Class::method()` to `$service->method()`

### Related Rules/Skills
- Replace static property caching with instance-based caching
- Never use static arrays as request-scoped caches
- Skill: Identify and Fix Static Property Accumulation

---

## DT-SPA-02: Static Accumulator Remediation

### Decision Context
- **When to decide:** When a static accumulator has been identified in code audit
- **Stakeholders:** Backend Developers
- **Trigger:** Static property scan reveals growing static arrays
- **Constraint:** Vendor code statics cannot be refactored to instance properties

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Code ownership | High | Application code vs vendor code |
| Accumulation rate | Medium | Bytes per request × expected requests before recycle |
| Reset method availability | High | Does the class expose a public reset/clear method? |

### Decision Tree

```
Is the static accumulator in application code or vendor code?
├── Application code — can refactor
│   └── Replace static caching with instance-based caching
│       ├── Change static::$cache to private $cache (instance property)
│       ├── Register class as scoped() binding
│       └── Update call sites from Service::method() to app(Service::class)->method()
│
├── Vendor code — cannot modify directly
│   ├── Does the class have a public reset/clear method?
│   │   ├── Yes — register RequestTerminated cleanup
│   │   │   ├── Event::listen(RequestTerminated::class, fn() => VendorClass::reset());
│   │   │   └── Fast and upgrade-safe
│   │   │
│   │   └── No — check for:
│   │       ├── Macroable trait → use clearMacros() or ->flushMacros()
│   │       ├── Internal cache → use reflection to clear (fragile, last resort)
│   │       └── No access → lower max_requests as temporary mitigation
│   │
│   └── (RequestTerminated cleanup is the standard fix for vendor code)
│
└── (application code: refactor to instance; vendor code: cleanup listener)
```

### Rationale
Application code statics can be permanently fixed by refactoring to instance-based caching on scoped bindings. Vendor code statics require `RequestTerminated` cleanup listeners that call the vendor's reset method. Reflection-based clearing is fragile and should be a last resort.

### Default Path
Application code: refactor to instance property on scoped binding. Vendor code: register `RequestTerminated` cleanup calling the class's reset method.

### Risks
- Reset method may not fully clear all state — residual accumulation
- Reflection-based clearing is fragile — vendor code changes may break it
- max_requests masking — lowering max_requests instead of fixing the root cause only delays OOM

### Related Rules/Skills
- Register `RequestTerminated` cleanup for known leaky static registries
- Never use static arrays as request-scoped caches
- Do not rely solely on `max_requests` to mitigate static leaks
- Skill: Identify and Fix Static Property Accumulation

---

## DT-SPA-03: One-Time Registration Guarding

### Decision Context
- **When to decide:** When calling Blade::directive(), Collection::macro(), Str::macro(), or similar one-time registrations
- **Stakeholders:** Backend Developers
- **Trigger:** Registering a callback, directive, or macro
- **Constraint:** Each call appends to a static array — repeated calls cause unbounded accumulation

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Registration location | High | Service provider boot() vs controller/middleware |
| Guard mechanism | Medium | Octane::once() vs manual flag |
| Registration idempotency | High | Must only register once per worker lifetime |

### Decision Tree

```
Where is the registration call located?
├── In a service provider's boot() method
│   ├── Service providers may be called multiple times (Deferred, Octane sandbox, worker restart)
│   ├── Guard with Octane::once():
│   │   ├── Octane::once(function () { Blade::directive('name', ...); });
│   │   └── Purpose-built guard for Octane one-time operations
│   │
│   └── Alternative: manual flag:
│       └── if (! $this->app->bound('directive_registered')) {
│               Blade::directive('name', ...);
│               $this->app->instance('directive_registered', true);
│           }
│
├── In a controller or middleware (WRONG!)
│   ├── Called on every request — massive accumulation
│   ├── Move registration to service provider boot() with guard
│   └── NEVER register directives/macros inside request lifecycle
│
└── (always register in boot() with Octane::once() guard)
```

### Rationale
Each call to `Blade::directive()`, `Collection::macro()`, or similar registration methods appends to a static array. If called on every request (in a controller or middleware), the static array grows by N entries per request. Even in `boot()`, service providers can be called multiple times under Octane, requiring explicit guard.

### Default Path
Use `Octane::once()` to guard all one-time registrations in service provider `boot()` methods.

### Risks
- Registering in controller/middleware = N duplicate directives/macros per request
- Not guarding in boot() = duplicate registrations on provider re-call
- Octane::once() is Octane-only — guard with fallback for non-Octane environments

### Related Rules/Skills
- Use `Octane::once()` for one-time registration guards
- Skill: Identify and Fix Static Property Accumulation
