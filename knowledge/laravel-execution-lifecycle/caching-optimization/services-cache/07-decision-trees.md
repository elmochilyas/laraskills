# Decision Trees: Services Cache

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** Services Cache
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-SC-01 | Deferred vs Eager Provider Decision | Performance | Medium | Per provider creation |
| DT-SC-02 | Services Cache Regeneration Timing | Reliability | Low | Per provider/composer change |

---

## DT-SC-01: Deferred vs Eager Provider Decision

### Decision Context
- **When to decide:** When implementing a new service provider
- **Stakeholders:** Backend Developers
- **Trigger:** Creating a provider that binds services to the container
- **Constraint:** Deferred providers cannot register middleware, routes, or event listeners in boot()

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Service usage pattern | High | Is the service needed on every request? |
| Provider responsibilities | High | Does boot() register middleware, routes, or listeners? |
| Bootstrap cost | Medium | Each eager provider adds 0.5-3ms overhead even if unused |

### Decision Tree

```
Does the provider register middleware, routes, or event listeners in boot()?
├── Yes — MUST be eager
│   └── Deferred providers skip boot() until first service resolution
│       └── Middleware/routes/listeners registered in boot() would not execute
│
├── No — only binds services to the container
│   ├── Is the bound service needed on every request?
│   │   ├── Yes — eager provider (same cost either way)
│   │   │   └── Standard ServiceProvider without DeferrableProvider
│   │   │
│   │   └── No — only used on specific features or pages
│   │       └── Implement DeferrableProvider
│   │           ├── implements DeferrableProvider
│   │           ├── public function provides(): array { return [Service::class]; }
│   │           ├── register() runs only when Service::class is first resolved
│   │           └── Saves 0.5-3ms per request when service is not used
│   │
│   └── (deferred = lazy loading for infrequently used services)
│
└── Unknown — audit usage pattern
    └── Start eager; profile to identify candidates for deferral
```

### Rationale
Deferred providers save bootstrap cost for services not used on every request by delaying `register()` and `boot()` execution until first resolution. However, providers that register middleware, routes, or event listeners cannot be deferred because those actions must execute during the boot phase of every request.

### Default Path
Start with eager providers. Profile to identify infrequently-used services, then convert their providers to deferred.

### Risks
- Deferred provider with boot() registering middleware = middleware never registered
- Deferred provider with complex dependencies = latency spike on first resolution
- Converting from eager to deferred requires verifying all consumers use container resolution

### Related Rules/Skills
- Use deferred providers for infrequently used services
- Monitor eager provider count for optimization opportunities
- Skill: Regenerate Services Cache After Provider Changes

---

## DT-SC-02: Services Cache Regeneration Timing

### Decision Context
- **When to decide:** After any provider or composer change
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Adding/removing providers, composer install/update
- **Constraint:** Manifest is a snapshot — changes are invisible until regeneration

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Change type | High | Addition vs removal have different consequences |
| Environment | High | Production vs development urgency |
| Risk level | High | Stale manifest causes missing or crashed providers |

### Decision Tree

```
What type of change occurred?
├── Provider added to config/app.php
│   ├── Run php artisan optimize:clear && php artisan optimize
│   ├── Verify new provider appears in services.php
│   └── Risk if skipped: provider never registered — services unavailable
│
├── Provider removed from config/app.php
│   ├── Run php artisan optimize:clear && php artisan optimize
│   ├── CRITICAL: stale manifest references deleted class
│   └── Risk if skipped: ClassNotFoundException on bootstrap
│
├── Provider reordered in config/app.php
│   ├── Run php artisan optimize:clear && php artisan optimize
│   └── Order in manifest must match config/app.php
│
├── Deferred status changed (implemented/removed DeferrableProvider)
│   ├── Run php artisan optimize:clear && php artisan optimize
│   └── Verify deferred section in manifest
│
├── composer install or composer update
│   └── Run php artisan optimize:clear && php artisan optimize
│       └── Critical if packages register new providers
│
└── Manual edit of services.php (anti-pattern)
    └── Revert and run php artisan optimize:clear && php artisan optimize
        └── Manual edits are overwritten and may break bootstrap
```

### Rationale
The services manifest (`bootstrap/cache/services.php`) is a snapshot of all providers and their deferred status. Adding a provider without regenerating means the new provider is never registered. Removing a provider without regenerating causes a fatal `ClassNotFoundException` when the container tries to load the old provider's deferred services. Regeneration must happen immediately after any provider or composer change.

### Default Path
Run `php artisan optimize:clear && php artisan optimize` after every provider or composer dependency change.

### Risks
- Adding provider without regeneration = new provider services never available
- Removing provider without regeneration = runtime ClassNotFoundException
- Optimize may silently skip regeneration if bootstrap/cache/ permissions prevent writes

### Related Rules/Skills
- Clear cache after every service provider change
- Run optimize after every composer package change
- Never edit `bootstrap/cache/services.php` manually
- Skill: Regenerate Services Cache After Provider Changes
