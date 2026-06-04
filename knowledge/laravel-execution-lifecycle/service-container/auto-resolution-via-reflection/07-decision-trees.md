# Auto-Resolution via Reflection — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Auto-Resolution via Reflection
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Interface binding vs auto-resolution for concrete classes | Handling constructor type-hints | Correctness; runtime errors |
| 2 | Primitive defaults vs `makeWith()` | Handling non-class constructor parameters | Reliability; API design |
| 3 | Reflection-based vs explicit binding for hot paths | Optimizing resolution performance | Speed; reflection overhead |

---

## Decision 1: Interface Binding vs Auto-Resolution

### Decision Context
A constructor type-hints an interface, abstract class, or concrete class. Decide whether auto-resolution works or a binding is required.

### Decision Criteria
- **Type is concrete class?** → auto-resolution works (no binding needed)
- **Type is interface or abstract?** → MUST register binding
- **Type is concrete but may change?** → bind interface for flexibility

### Decision Tree
```
Constructor type-hint handling?
├── Type-hint is a CONCRETE CLASS
│   ├── Class is instantiable (not abstract, not interface)
│   │   └── Auto-resolution works — no binding required
│   └── Class has its own interface dependencies
│       └── Those interfaces need bindings, but the concrete class auto-resolves
├── Type-hint is an INTERFACE
│   ├── Interface has a registered binding
│   │   └── Resolution works — binding maps to concrete
│   └── Interface has NO registered binding
│       └── RESOLUTION FAILS — BindingResolutionException: "Target is not instantiable"
│       └── MUST register: $app->bind(Interface::class, Concrete::class)
├── Type-hint is an ABSTRACT CLASS
│   ├── Abstract has a registered binding
│   │   └── Resolution works
│   └── Abstract has NO registered binding
│       └── RESOLUTION FAILS — same as interface
├── Type-hint is a BUILT-IN TYPE (string, int, array)
│   ├── Has a default value
│   │   └── Auto-resolution works — uses default
│   └── No default value
│       └── RESOLUTION FAILS — "Unresolvable dependency" unless makeWith() used
└── Type-hint is NULLABLE (?Type $param = null)
    ├── Interface without binding and null default
    │   └── Auto-resolution works — injects null if no binding exists
    └── Concrete class with null default
        └── Auto-resolution works — resolves class or injects null if can't
```

### Rationale
Auto-resolution via `ReflectionClass::getConstructor()` can only create instances of concrete, instantiable classes. Interfaces and abstract classes are not instantiable — they must have a binding that tells the container which concrete class to use. This is the most common source of container resolution errors.

### Default
Let concrete classes auto-resolve. Register bindings for all interfaces and abstract classes used as type-hints.

### Risks
- Adding interface dependency without binding → `BindingResolutionException` at runtime
- Assuming auto-resolution works for interfaces → silent failure or exception
- Nullable interface with null default → injects null if no binding (may be intentional or a bug)

### Related Rules/Skills
- Register Bindings for Every Interface Type-Hint
- Skill: Debug Auto-Resolution Failures

---

## Decision 2: Primitive Defaults vs `makeWith()`

### Decision Context
A constructor has primitive parameters (string, int, array, bool). Decide whether to provide defaults or require callers to use `makeWith()`.

### Decision Criteria
- **Is the parameter used by all callers?** Yes → provide default or use `makeWith()`; No → provide default
- **Will callers use `make()` directly?** Yes → MUST provide default; No (all use `makeWith()`) → defaults optional
- **Parameter value changes per use?** Yes → `makeWith()` is appropriate; No → provide default

### Decision Tree
```
Handling primitive constructor parameters?
├── Provide DEFAULT VALUES for all primitives
│   ├── Simple default works for most use cases
│   │   └── string $format = 'pdf', int $limit = 100
│   ├── No sensible default — parameter is always required
│   │   └── Cannot use auto-resolution; must use makeWith() always
│   └── Default is nullable
│       └── ?string $token = null — callers that need it can override
├── Do NOT add defaults — require callers to use makeWith()
│   ├── Pro: forces explicit parameters, no unexpected defaults
│   ├── Pro: parameter is required logic
│   ├── Con: ALL callers must use makeWith() — breaks simple make() calls
│   └── Con: adding a primitive later breaks existing make() callers
├── HYBRID: defaults for common cases, makeWith() for overrides
│   ├── Most callers use the default
│   │   └── Provide default, use makeWith() for exceptions
│   └── Every caller uses different values
│       └── Register explicit binding with closure that calls makeWith()
└── REGISTER EXPLICIT BINDING as alternative
    ├── Binding closure handles parameter logic internally
    │   └── $app->bind(Service::class, fn($app) => new Service('specific-value'))
    └── Removes primitive from the public resolution API
```

### Rationale
Default values make `make()` work without parameters. Without defaults, all callers must use `makeWith()` or register an explicit binding. The safest approach is to provide sensible defaults so that `make()` works out of the box, and let advanced callers use `makeWith()` to override.

### Default
Provide default values for all primitive constructor parameters. Use `makeWith()` only for meaningful overrides.

### Risks
- No default on required primitive → `make()` breaks for all callers
- Default that is silently wrong → hard-to-debug behavior
- Too many primitives in constructor → consider a parameter object DTO

### Related Rules/Skills
- Provide Default Values for Primitive Constructor Parameters
- Skill: Debug Auto-Resolution Failures

---

## Decision 3: Reflection-Based vs Explicit Binding for Hot Paths

### Decision Context
A service class on a hot code path (resolved every request). Decide whether to rely on auto-resolution or register an explicit binding.

### Decision Criteria
- **Resolution frequency**: Every request → consider explicit binding
- **Dependency chain depth**: 3+ levels → explicit binding saves significant reflection
- **Deployment**: Octane → reflection cost paid once per worker (less benefit); FPM → paid every request (more benefit)
- **Measured overhead**: Profiling shows resolution as bottleneck → explicit binding

### Decision Tree
```
Auto-resolution vs explicit binding for performance?
├── Class has ZERO constructor dependencies
│   ├── Reflection cost: ~1-2μs (just check constructor exists)
│   │   └── Auto-resolution is fine — trivial cost
│   └── Registration: $this->app->bind(Class::class) adds no benefit
├── Class has 1-3 typed dependencies
│   ├── Reflection cost: ~10-50μs per resolution chain
│   │   └── Auto-resolution is acceptable — unless on extreme hot path
│   └── Explicit binding saves ~10-40μs per resolution
├── Class has 4+ typed dependencies (deep chain)
│   ├── Reflection cost: ~50-200μs
│   │   └── Explicit binding on hot path is worthwhile
│   └── Pre-register in provider: $app->bind(Class::class, fn() => new Class(...))
├── Controller classes (resolved per-request)
│   ├── Laravel already uses optimized resolution for controllers
│   │   └── Auto-resolution is fine — framework handles this
│   └── Additional custom explicit binding not needed
└── Profiling results available
    ├── Resolution shown as bottleneck (XHProf, Blackfire, Telescope)
    │   └── Register explicit binding for identified classes
    └── No profiling — auto-resolution by default
        └── Don't optimize prematurely
```

### Rationale
Auto-resolution via reflection costs ~50-200μs per resolution chain for classes with deep dependency graphs. In an FPM environment where every request is a new process, this cost is paid fresh each time. In Octane, it's paid once per worker per class. Explicit bindings replace reflection with pre-compiled closure resolution, roughly 10x faster.

### Default
Use auto-resolution by default. Register explicit bindings for hot-path classes only when profiling shows resolution cost is a bottleneck.

### Risks
- Pre-mature optimization: adding bindings for every class = maintenance burden with little benefit
- ReflectionCache (Laravel 12+): enables cached reflection at the container level, reducing the need for explicit bindings
- Explicit binding with closure: must manually handle dependencies that auto-resolution would handle automatically

### Related Rules/Skills
- Pre-register Hot-Path Bindings to Bypass Reflection
- Skill: Optimize Reflection Resolution for Hot Paths
