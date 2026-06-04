# Binding Extending — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Binding Extending
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | `extend()` vs `resolving()` callback | Adding cross-cutting behavior to resolved services | Correctness of composition; lifecycle order |
| 2 | Extender ordering (generic vs specific) | Multiple extenders on the same binding | Composition chain; wrapping correctness |
| 3 | Decorator class vs inline closure in `extend()` | How to implement the extender logic | Maintainability; testability; composition |

---

## Decision 1: `extend()` vs `resolving()` Callback

### Decision Context
Adding behavior that runs after service resolution. Choose between `extend()` (decorator wrapping) and `resolving()` (post-construction configuration).

### Decision Criteria
- **Need to wrap/replace instance?** Yes → `extend()`; No → `resolving()`
- **Need to configure properties?** Yes → `resolving()`; No → `extend()`
- **Need stacking (multiple independent behaviors)?** Yes → `extend()` (composable); No → either
- **Must see the fully extended instance?** Yes → `resolving()` (runs after extenders)

### Decision Tree
```
Cross-cutting behavior after resolution?
├── WRAP or REPLACE the instance
│   ├── Decorate with logging, caching, retry logic
│   │   └── Use extend() — returns decorator wrapping original
│   └── Return different type
│       └── Use extend() — designed for instance replacement
├── CONFIGURE the instance (set properties, call methods)
│   ├── Set cache TTL, configure credentials, attach listeners
│   │   └── Use resolving() — runs after extenders
│   └── No instance replacement needed
│       └── Use resolving() — configuration only (no return value)
├── INTERCEPTION POINT within resolution pipeline
│   ├── Must wrap before configuration
│   │   └── Use extend() — runs before resolving()
│   ├── Must run after ALL decoration
│   │   └── Use resolving() — runs after extend()
│   └── Must run after instance is cached
│       └── Use afterResolving() — side effects only
└── Multiple providers register extensions
    ├── Composable stacking needed
    │   └── Use extend() — decorators wrap independently
    └── Single concern, no stacking needed
        └── Either works; extend() is future-proof
```

### Rationale
`extend()` runs before `resolving()` in the resolution pipeline. Extenders wrap the instance (returning a decorator), while `resolving()` callbacks configure it (not replacing it). Using `resolving()` for decoration can silently overwrite the extender's output if the callback returns a non-null value.

### Default
Use `extend()` for wrapping/decoration. Use `resolving()` for post-construction property configuration. Never use `resolving()` to replace the instance.

### Risks
- `resolving()` returning non-null replaces the instance, losing extender output
- Using `extend()` for configuration → need to return the instance unchanged (works but `resolving()` is cleaner)
- Calling `make()` on same abstract inside extender → recursion or undecorated instance

### Related Rules/Skills
- Use `extend()` for Decoration, `resolving()` for Configuration
- Return a Decorator Instance, Not a Modification
- Skill: Implement Service Decoration via `extend()`

---

## Decision 2: Extender Ordering

### Decision Context
Multiple extenders registered on the same abstract. Decide the order in which they should be registered.

### Decision Criteria
- **Cross-cutting vs specific**: Generic behavior (monitoring, logging) first; specific behavior (business logic) last
- **Dependency**: One extender wraps the output of another → ordering matters
- **Transactional vs observatory**: Transactional (retry, circuit breaker) wrap closer to core; observatory (logging, metrics) wrap outside

### Decision Tree
```
Multiple extenders on the same binding?
├── All extenders are INDEPENDENT
│   ├── Observational (logging, metrics, tracing)
│   │   └── Register first (outermost wrapper) — wraps everything
│   ├── Configurational (setTtl, attach handler)
│   │   └── Use resolving() instead — runs after all extenders
│   └── No ordering dependency
│       └── Any order works; document for clarity
├── Extenders have STACKING DEPENDENCY
│   ├── Innermost: original service
│   ├── Layer 1: cache decorator (wraps original)
│   ├── Layer 2: retry decorator (wraps cached)
│   └── Layer 3: logging decorator (wraps retry)
│   └── Register from SPECIFIC to GENERIC:
│       1. Cache (most specific — wraps original)
│       2. Retry (medium — wraps cached)
│       3. Logging (most generic — outermost)
├── Transactional vs observatory distinction
│   ├── Transactional (retry, circuit breaker, rate limit)
│   │   └── Register first (close to core)
│   ├── Observatory (logging, metrics, tracing)
│   │   └── Register last (outermost)
│   └── Pattern: transactional → caching → observatory
└── Debugging extender order
    ├── Check registration order in provider boot()
    │   └── First registered = inner wrapper; last registered = outer wrapper
    └── Log extender chain in development
        └── Temporarily add logging to verify wrapping order
```

### Rationale
Later extenders wrap earlier ones — the last registered extender is the outermost wrapper. Generic cross-cutting concerns (logging, monitoring) should be outermost so they see all effects. Specific business concerns (caching, retry) should be innermost, closest to the original service.

### Default
Register in order: business logic decorators first (innermost), cross-cutting decorators last (outermost).

### Risks
- Incorrect ordering causes wrong behavior — metrics wrap retries (good) or retries wrap metrics (bad — retries re-execute on metric failures)
- Modifying instance in-place instead of wrapping → non-composable
- Not documenting ordering → confusion when adding new extenders

### Related Rules/Skills
- Order Extenders from Generic to Specific
- Return a Decorator Instance, Not a Modification
- Skill: Debug Extender Ordering Conflicts

---

## Decision 3: Decorator Class vs Inline Closure

### Decision Context
Implementing the extender. Choose between a proper decorator class or an inline closure.

### Decision Criteria
- **Complexity**: Simple (one method override) → closure; Complex (multiple methods) → decorator class
- **Testability**: Needs testing → decorator class; Trivial → closure
- **Reusability**: Used in multiple places → decorator class; One-off → closure
- **Type safety**: Important → decorator class implements same interface

### Decision Tree
```
How to implement the extender?
├── SIMPLE LOGIC (one method delegation)
│   ├── Logging decorator — log before/after single method
│   │   └── Inline closure is acceptable
│   ├── Environment-specific config (enableQueryLog)
│   │   └── Inline closure is fine — no wrapping needed
│   └── Single responsibility, trivial
│       └── Inline closure keeps it simple
├── COMPLEX LOGIC (multiple methods, stateful)
│   ├── Retry decorator with 5+ lines of logic
│   │   └── Use DECORATOR CLASS — testable, maintainable
│   ├── Caching decorator with TTL and invalidation
│   │   └── Use DECORATOR CLASS — needs dedicated tests
│   └── Multiple method overrides
│       └── Use DECORATOR CLASS — cleaner than closure
├── REUSABILITY
│   ├── Same decoration applied to multiple services
│   │   └── Use DECORATOR CLASS — DRY
│   ├── Packaged/ready to distribute
│   │   └── Use DECORATOR CLASS — professional API
│   └── One-off, app-specific
│       └── Inline closure is fine
└── TYPE SAFETY
    ├── Decorator class implements the same interface
    │   └── Suggests decorator class — IDE autocomplete, static analysis
    └── Closure returns duck-typed object
        └── Inline closure — but document return type
```

### Rationale
Inline closures are convenient for trivial, single-method decorators and environment-specific configuration. Decorator classes are required for any non-trivial wrapping logic that needs testing, reusability, or multiple method overrides. The class provides type safety, testability, and clear separation of concerns.

### Default
Use decorator classes for production code. Use inline closures only for trivial, one-off configuration.

### Risks
- Inline closure too complex → hard to test, hard to maintain
- Decorator class for trivial logic → over-engineering
- Not implementing the same interface → type errors at consumer site

### Related Rules/Skills
- Return a Decorator Instance, Not a Modification
- Skill: Implement Service Decoration via `extend()`
