# Decision Trees — Provider Fundamentals

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Fundamentals |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | New Provider vs Shortcut Properties | Whether to create a full provider class or use `$bindings`/`$singletons` on an existing provider | Every new binding | Medium |
| D02 | Eager vs Deferred Provider | Whether a provider should execute on every request or load on-demand | Every new provider | High |
| D03 | Which Method: `register()` vs `boot()` | Where to place a given operation within a provider | Every provider addition | High |
| D04 | Single Provider vs Multiple Providers | Whether to consolidate or split providers by domain | Architecture/refactoring | High |

---

## D01: New Provider vs Shortcut Properties

### Decision Context
You need to register a new service binding. You can either create a standalone provider class or add the binding to an existing provider's `$bindings`/`$singletons` shortcut properties.

### Criteria
1. **Binding count**: How many bindings does this service need?
2. **Package vs application**: Is this for a reusable package or the application itself?
3. **Domain separation**: Does this binding belong to a distinct domain?
4. **Boot-time registrations**: Are there routes/views/events to register too?

### Decision Tree
```
New binding needed
├── Is it a single trivial binding?
│   ├── Yes → Use $bindings or $singletons on existing provider
│   └── No → Does it have boot-time registrations (routes, views, events)?
│       ├── Yes → Create new provider
│       └── No → Does it belong to an existing domain?
│           ├── Yes → Add to that domain's provider
│           └── No → Create new provider
```

### Rationale
Shortcut properties (`$bindings`, `$singletons`) are perfect for trivial single-line registrations — they avoid boilerplate. But any provider with boot-time work (`loadRoutesFrom`, event listeners, blade directives) needs `register()`/`boot()` methods, which requires a full class. Domain separation keeps providers cohesive and testable.

### Default
Use shortcut properties for single trivial bindings; create a full provider for anything more complex.

### Risks
- Over-splitting creates provider sprawl — each provider adds bootstrap overhead.
- Over-consolidation creates a "God provider" that's hard to test and maintain.

### Related Rules/Skills
- Rule 3: Use `$app->booted()` for Logic Requiring All Providers to Boot
- Skill: Create and Register a Service Provider

---

## D02: Eager vs Deferred Provider

### Decision Context
You are creating a new provider and must decide whether it should be eager (runs on every request) or deferred (loads on-demand when its services are first requested).

### Criteria
1. **Service utilization**: On what percentage of routes are the provider's services used?
2. **Boot-time artifacts**: Does `boot()` register routes, views, event listeners, or middleware?
3. **Side effects**: Does `register()` have side effects that must run at startup?
4. **Performance budget**: Is bootstrap time currently a concern?

### Decision Tree
```
New provider being registered
├── Does boot() register routes, views, events, or middleware?
│   ├── Yes → MUST be eager (cannot defer)
│   └── No → Are services used on >70% of routes?
│       ├── Yes → Keep eager
│       └── No → Does register() have startup side effects (logging, file writes)?
│           ├── Yes → Keep eager
│           └── No → Implement DeferrableProvider (deferred)
```

### Rationale
Eager is the default for predictability, but every provider should justify its eagerness. Deferred providers eliminate bootstrap overhead entirely for routes that don't use their services, with the tradeoff of slightly slower first resolution.

### Default
Default to eager. Only convert to deferred when criteria are met.

### Risks
- Deferring a provider with boot-time registrations causes routes/events to be unavailable until the deferred service is first resolved.
- Partial `provides()` causes silent resolution failures.
- Manifest staleness after deployment causes production issues.

### Related Rules/Skills
- Rule 1: Keep `register()` Pure — Bindings Only
- Skill: Create and Register a Service Provider

---

## D03: Which Method: `register()` vs `boot()`

### Decision Context
You are adding code to a provider and must decide whether it belongs in `register()` or `boot()`.

### Criteria
1. **Operation type**: Is this a container binding, config merge, or something else?
2. **Dependency requirement**: Does this operation depend on bindings from other providers?
3. **Safety during config cache**: Can this operation run safely during `php artisan config:cache`?
4. **Post-boot timing**: Does this require ALL providers to have booted?

### Decision Tree
```
Operation to place in provider
├── Is it a container binding (bind, singleton, tag, contextual binding)?
│   ├── Yes → register()
│   └── No → Is it a config merge (mergeConfigFrom)?
│       ├── Yes → register()
│       └── No → Does it depend on services from other providers?
│           ├── Yes → boot()
│           └── No → Does it have side effects (I/O, logging, file writes)?
│               ├── Yes → boot() (never register())
│               └── No → Does it require ALL providers to have booted?
│                   ├── Yes → $app->booted()
│                   └── No → boot()
```

### Rationale
The two-phase model guarantees all `register()` calls complete before any `boot()`. Keeping `register()` pure (bindings and config merges only) eliminates non-deterministic order-dependent failures. Side effects in `register()` break config caching.

### Default
Bindings → `register()`. Everything else → `boot()`. Post-boot coordination → `$app->booted()`.

### Risks
- Resolving from container in `register()` causes intermittent "Target class does not exist" errors.
- I/O in `register()` fails silently during config caching.
- Registering routes in `register()` causes route loading before Router is bound.

### Related Rules/Skills
- Rule 1: Keep `register()` Pure — Bindings Only, Never Resolve from Container
- Rule 3: Use `$app->booted()` for Logic Requiring All Providers to Boot
- Skill: Create and Register a Service Provider

---

## D04: Single Provider vs Multiple Providers

### Decision Context
You have a set of related bindings and registrations and must decide whether they belong in one provider or multiple.

### Criteria
1. **Domain cohesion**: Do the bindings serve the same domain?
2. **Lifecycle differences**: Do all bindings share the same eager/deferred decision?
3. **Bootstrap overhead**: Will splitting add measurable overhead?
4. **Testability**: Can the provider be tested in isolation?

### Decision Tree
```
Set of related bindings/registrations
├── Do all bindings belong to the same domain?
│   ├── Yes → Can any binding be deferred while another must be eager?
│   │   ├── Yes → Split into separate providers (eager + deferred)
│   │   └── No → Single provider
│   └── No → Do the bindings share lifecycle characteristics?
│       ├── Yes → Consider consolidating if bootstrap overhead is a concern
│       └── No → Split into separate providers by domain
```

### Rationale
Providers are the unit of registration granularity in Laravel. One provider per domain provides clear separation and testability. However, splitting aggressively increases provider count and bootstrap overhead. The key driver for splitting is when lifecycle characteristics differ (one binding must be eager, another can be deferred).

### Default
One provider per domain, consolidated unless lifecycle characteristics differ.

### Risks
- Over-splitting: 50+ tiny providers each adding 0.1-0.5ms overhead.
- Over-consolidation: God provider with mixed eager/deferred needs.
- Testability degradation when unrelated bindings share a provider.

### Related Rules/Skills
- Rule 2: Order Providers Deliberately in `bootstrap/providers.php`
- Skill: Create and Register a Service Provider
