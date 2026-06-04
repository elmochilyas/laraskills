# Decision Trees — Register vs Boot Methods

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Register vs Boot Methods |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Where to Place an Operation | Whether a specific operation belongs in `register()`, `boot()`, or `$app->booted()` | Every provider addition | High |
| D02 | Boot Method Injection vs Manual Resolution | Whether to use type-hinted boot parameters or `$this->app->make()` in `boot()` | Every provider with dependencies | Medium |
| D03 | Deferred vs Immediate Registration After Boot | How to handle `$app->register()` calls made outside of `bootstrap/providers.php` | Conditional registration pattern | Medium |

---

## D01: Where to Place an Operation

### Decision Context
You are adding a line of code inside a service provider and must decide whether it goes in `register()`, `boot()`, or wrapped in an `$app->booted()` callback.

### Criteria
1. **Is it a binding?** Container bindings, singletons, tags, contextual bindings.
2. **Is it a config merge?** `mergeConfigFrom()` calls.
3. **Does it depend on other providers' bindings?** Any call to `make()`, `resolve()`, or injection.
4. **Does it register boot-time artifacts?** Routes, views, event listeners, middleware, Blade directives.
5. **Does it perform I/O?** File writes, logging, HTTP calls, database queries.
6. **Does it require all providers to be booted?** Depends on another provider's `boot()` side effects.

### Decision Tree
```
Provider operation
├── Container binding (bind, singleton, tag, contextual)?
│   ├── Yes → register()
│   └── No → Config merge (mergeConfigFrom)?
│       ├── Yes → register()
│       └── No → Boot-time artifact (routes, views, events, middleware, Blade)?
│           ├── Yes → boot()
│           └── No → I/O, logging, HTTP, or database operations?
│               ├── Yes → boot() (NEVER register())
│               └── No → Service resolution (make, resolve, injection)?
│                   ├── Yes → Does it depend on another provider's boot() side effects?
│                   │   ├── Yes → $app->booted()
│                   │   └── No → boot()
│                   └── No → Does it require the application fully booted?
│                       ├── Yes → $app->booted()
│                       └── No → boot()
```

### Rationale
The two-phase model exists specifically to eliminate provider ordering dependencies. `register()` must remain pure — bindings and config merges only — because other providers' bindings don't exist yet. Boot-time artifacts need the Router, View, and Event dispatcher which are registered by core providers during their `register()` phase. Post-boot callbacks handle the rare case where coordination between multiple providers' `boot()` methods is needed.

### Default
Bindings → `register()`. Artifacts, resolution, and side effects → `boot()`. Cross-provider coordination → `$app->booted()`.

### Risks
- Placing resolution in `register()` = intermittent "Target class does not exist" errors.
- Placing I/O in `register()` = config cache failures.
- Using `boot()` when `$app->booted()` is needed = order-dependent boot failures.

### Related Rules/Skills
- Rule 1: Never Resolve from the Container Inside `register()`
- Rule 2: Place Route, View, Event Listener, and Middleware Registration in `boot()`
- Rule 3: Keep `register()` Pure — Bindings and Config Merges Only, No Side Effects
- Rule 5: Use `$app->booted()` for Actions Requiring the Entire Application to Be Booted
- Skill: Distinguish register() from boot() Responsibilities

---

## D02: Boot Method Injection vs Manual Resolution

### Decision Context
Inside `boot()`, you need access to a service. You can either type-hint it as a parameter (boot method injection) or call `$this->app->make()` manually.

### Criteria
1. **Dependency count**: How many services do you need?
2. **Documentation value**: Would type hints help document the provider's dependencies?
3. **Conditional resolution**: Is the dependency needed only in certain code paths?
4. **Performance**: Is this dependency resolved once or multiple times?

### Decision Tree
```
Service needed in boot()
├── Single dependency needed in all code paths?
│   ├── Yes → Use boot method injection (type-hint parameter)
│   └── No → Multiple dependencies needed in different code paths?
│       ├── Yes → Use $this->app->make() conditionally as needed
│       └── No → Dependency needed only under a condition?
│           ├── Yes → Use $this->app->make() inside conditional block
│           └── No → Use boot method injection
```

### Rationale
Boot method injection auto-documents the provider's dependencies and leverages the container's resolution caching. The container resolves parameters once, not on every call. However, if a dependency is only conditionally needed, forcing injection wastes resources instantiating it on every request. Manual `make()` inside conditional blocks is more efficient for rarely-needed dependencies.

### Default
Use boot method injection by default (documents intent, auto-resolves once). Fall back to `$this->app->make()` for conditional resolutions.

### Risks
- Conditional dependencies injected unconditionally waste bootstrap time.
- Excessive `make()` calls bypass the clarity of explicit dependencies.

### Related Rules/Skills
- Rule 4: Use Boot Method Injection for Auto-Resolved Dependencies
- Skill: Distinguish register() from boot() Responsibilities

---

## D03: Deferred vs Immediate Registration After Boot

### Decision Context
You need to call `$app->register()` conditionally (e.g., from another provider or middleware). The timing of the call determines whether `boot()` runs immediately or is deferred.

### Criteria
1. **Application state**: Has the application booted yet?
2. **Registration source**: Is this from within a provider's `register()`, `boot()`, or elsewhere?
3. **Required timing**: Does the new provider's `boot()` need to run before your code continues?

### Decision Tree
```
Calling $app->register() outside bootstrap/providers.php
├── Is the application already booted?
│   ├── Yes → Both register() and boot() run immediately
│   └── No → Is this from within register()?
│       ├── Yes → New provider's register() runs, boot() is deferred
│       └── No → Is immediate boot of the new provider required?
│           ├── Yes → Ensure $app->register() is called after app boots
│           └── No → Deferred boot is fine
```

### Rationale
When `$app->register()` is called before the application has booted, only `register()` runs immediately — `boot()` is queued for the later boot phase. When called after booting, both `register()` and `boot()` execute immediately. This behavior is critical for conditional provider registration: if you conditionally register a provider in your `register()` method, its `boot()` won't run until the main boot phase.

### Default
Assume deferred boot when calling `$app->register()` during bootstrap; assume immediate boot when calling after the application has booted.

### Risks
- If you depend on the new provider's `boot()` side effects before the main boot phase completes, you'll encounter non-deterministic behavior.
- Calling `$app->register()` from `register()` with expectation that both phases run immediately.

### Related Rules/Skills
- Rule 1: Never Resolve from the Container Inside `register()`
- Skill: Distinguish register() from boot() Responsibilities
