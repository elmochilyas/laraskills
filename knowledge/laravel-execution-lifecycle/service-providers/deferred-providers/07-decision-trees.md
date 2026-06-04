# Decision Trees — Deferred Providers

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Deferred Providers |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Eager vs Deferred Decision | Whether a given provider should be eager or deferred | Every provider creation | High |
| D02 | Complete provides() vs Partial | Determining every service identifier that must be listed in `provides()` | Every deferred provider | High |
| D03 | Split Eager + Deferred vs Single | Whether to split a provider that has both boot-time artifacts and deferrable services | Architecture/refactoring | High |
| D04 | Manifest Rebuild Timing | When to rebuild the deferred manifest after changes | Every code change affecting providers | Medium |

---

## D01: Eager vs Deferred Decision

### Decision Context
You have a service provider and must decide whether it should implement `DeferrableProvider` and be deferred, or remain eager.

### Criteria
1. **Boot-time registration**: Does `boot()` call `loadRoutesFrom`, `loadViewsFrom`, register event listeners, middleware, or Blade directives?
2. **Service utilization**: On what percentage of routes are the provider's services used?
3. **Startup side effects**: Does `register()` have side effects (I/O, logging, cache writes) that must run at application start?
4. **Performance requirements**: Is TTFB optimization a current priority?

### Decision Tree
```
Provider being evaluated for deferral
├── Does boot() register routes, views, event listeners, or middleware?
│   ├── Yes → Provider MUST be eager (cannot defer)
│   └── No → Does register() have startup side effects that must execute at boot?
│       ├── Yes → Provider MUST be eager
│       └── No → Are services used on >70% of routes?
│           ├── Yes → Keep eager (deferred overhead > savings)
│           └── No → Are services used on <30% of routes?
│               ├── Yes → Implement DeferrableProvider
│               └── No → Is bootstrap time a current concern?
│                   ├── Yes → Defer (marginal gains are worth it)
│                   └── No → Keep eager (simpler, no manifest management)
```

### Rationale
Deferred providers eliminate bootstrap overhead but introduce complexity: manifest management, first-use latency, and the requirement that all registered services are listed in `provides()`. The 30%/70% thresholds are guidelines based on typical overhead tradeoffs. Providers that register boot-time artifacts CANNOT be deferred — routes and event listeners must be available at application start.

### Default
Eager by default. Convert to deferred when service utilization is <30% or when bootstrap time optimization is specifically targeting this provider.

### Risks
- Deferring a provider with boot-time artifacts: routes/events unavailable until first service resolution.
- Deferring a provider used on most routes: deferred overhead > savings.
- Stale manifest: silent resolution failures after deployment.

### Related Rules/Skills
- Rule 1: Defer Rarely-Used Services to Optimize Bootstrap Time
- Rule 3: Never Defer Providers That Register Routes, Event Listeners, or Views in `boot()`
- Skill: Implement a Deferred Provider

---

## D02: Complete provides() vs Partial

### Decision Context
You are implementing `provides()` for a deferred provider and must list every service identifier that `register()` binds.

### Criteria
1. **Registered identifiers**: All class names, interfaces, and aliases registered via `bind()`, `singleton()`, `tag()`, or contextual binding.
2. **Container access pattern**: How will consumers resolve the service (by class, interface, or alias)?

### Decision Tree
```
Implementing provides() for deferred provider
├── List every identifier passed to bind()/singleton() in register()
├── Include all aliases registered alongside concrete/interface bindings
├── Include all interfaces that bound classes implement (if consumers type-hint them)
├── Do NOT include services only used internally in boot() (not bound in container)
└── Validate: resolve each listed identifier from container and confirm it works
```

### Rationale
The deferred manifest maps service identifiers → provider classes. When `$app->make('service')` is called and the service is in the manifest, the provider loads. If `provides()` omits any identifier that consumers use to resolve the service, the provider will never load and the resolution silently fails. Every identifier bound in `register()` must be returned.

### Default
Return every argument passed to `bind()`, `singleton()`, and contextual `give()` from `register()`.

### Risks
- Partial `provides()` = silent resolution failures on specific identifiers.
- Over-including identifiers not actually bound = manifest entries that waste lookups.
- Forgetting to update `provides()` when `register()` changes.

### Related Rules/Skills
- Rule 2: Always Implement `provides()` with Every Registered Service Identifier
- Rule 5: Keep `provides()` in Exact Sync with `register()` Bindings
- Skill: Implement a Deferred Provider

---

## D03: Split Eager + Deferred vs Single

### Decision Context
A provider needs to register boot-time artifacts (must be eager) AND bind deferrable services (could be deferred). You must decide whether to keep one eager provider or split into two.

### Criteria
1. **Separation effort**: How tightly coupled are the boot-time registrations and the service bindings?
2. **Performance impact**: How much bootstrap overhead does the eager portion save by splitting?
3. **Maintenance complexity**: Will two providers be harder to maintain than one?

### Decision Tree
```
Provider with both boot-time artifacts and deferrable services
├── Can the boot-time artifacts be separated from the service bindings?
│   ├── Yes → Would the bootstrap savings justify the split?
│   │   ├── Yes → Split into:
│   │   │   ├── Eager provider (routes, views, events only)
│   │   │   └── Deferred provider (service bindings, DeferrableProvider)
│   │   └── No → Keep as eager single provider
│   └── No (tightly coupled) → Keep as eager single provider
```

### Rationale
Splitting allows the service bindings to be deferred while boot-time artifacts from `boot()` still run at startup. This provides the best of both worlds: routes/events available at boot, services loaded on-demand. However, the split adds a provider file and registration entry, and requires maintaining two classes. The savings must justify the complexity.

### Default
Keep as single eager provider unless the deferred services are used on <30% of routes AND the boot-time artifacts can be cleanly separated.

### Risks
- Creating two providers that are tightly coupled and hard to maintain separately.
- Splitting for negligible performance gain (services used on 60%+ of routes).
- Forgetting to register the new deferred provider.

### Related Rules/Skills
- Rule 3: Never Defer Providers That Register Routes, Event Listeners, or Views in `boot()`
- Skill: Implement a Deferred Provider
- Skill: Audit and Optimize Eager Provider Overhead

---

## D04: Manifest Rebuild Timing

### Decision Context
You have made changes to a deferred provider (added/removed bindings, changed `provides()`, or added/removed the `DeferrableProvider` interface). When should the deferred manifest be rebuilt?

### Criteria
1. **Change type**: What changed — provider deferral status, `provides()` contents, or `register()` bindings?
2. **Deployment stage**: Are you in development or deploying to production?
3. **Impact urgency**: Will the change cause immediate failures if the manifest is stale?

### Decision Tree
```
Change made to deferred provider
├── Added/removed DeferrableProvider interface?
│   ├── Yes → Rebuild immediately (provider changes between eager/deferred)
│   └── No → Changed provides() or register() bindings?
│       ├── Yes → Rebuild before next deployment
│       └── No → No rebuild needed
├── In development?
│   ├── Yes → Run php artisan optimize:clear (clears all caches including manifest)
│   └── In production?
│       ├── Yes → Include php artisan optimize in deployment script
│       └── No manual rebuild needed
```

### Rationale
The deferred manifest (`bootstrap/cache/services.php`) is a cached mapping that is only rebuilt when explicitly refreshed. In development, `php artisan optimize:clear` clears all caches. In production, the deployment script must include `php artisan optimize` to regenerate the manifest. Without this, changes to deferred providers silently don't take effect.

### Default
Include `php artisan optimize` in every deployment. Run `php artisan optimize:clear` after deferred provider changes in development.

### Risks
- Stale manifest after deployment = silent resolution failures in production.
- Development changes not taking effect if manifest is not cleared.
- Manifest out of sync with code after package updates.

### Related Rules/Skills
- Rule 4: Always Rebuild the Deferred Manifest After Code Changes
- Skill: Diagnose and Fix Deferred Manifest Issues
