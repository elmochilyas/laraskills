# Decision Trees: Route Caching (ku-02)

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** ku-02-route-caching
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-K02-01 | Closure vs Controller Route Handlers | Architecture | Medium | Per route definition |
| DT-K02-02 | Static vs Dynamic Route Registration | Architecture | High | Per application design |
| DT-K02-03 | Route Cache in Deployment Sequence | Reliability | Low | Per deployment |

---

## DT-K02-01: Closure vs Controller Route Handlers

### Decision Context
- **When to decide:** When defining a new route
- **Stakeholders:** Backend Developers
- **Trigger:** Adding a route to `routes/web.php` or `routes/api.php`
- **Constraint:** Closure routes block `route:cache` entirely — all routes must be controller strings

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Cache compatibility | High | Closures cause LogicException on route:cache |
| Route complexity | Medium | Simple views/redirects have special cacheable helpers |
| Application scale | Medium | Small apps may accept uncached routes; large apps cannot |

### Decision Tree

```
Is this route handler simple enough to use a helper?
├── Yes — use a cacheable helper
│   ├── Simple view: Route::view('/path', 'view.name')
│   ├── Simple redirect: Route::redirect('/old', '/new')
│   ├── Permanent redirect: Route::permanentRedirect('/old', '/new')
│   └── All are cacheable — they use internal controller classes
│
├── No — needs custom handler logic
│   ├── Is the route used in a production app with 100+ routes?
│   │   ├── Yes — always use a controller class
│   │   │   └── Route::get('/path', [Controller::class, 'method'])
│   │   │
│   │   └── No — small app, Closure is acceptable
│   │       └── Route::get('/path', fn() => ...)
│   │           └── Accept that route:cache cannot be used
│   │
│   └── (controller classes are preferred for cacheability)
│
└── (Closure routes block caching for ALL routes)
```

### Rationale
A single Closure route in the application blocks `route:cache` entirely for all routes. `Route::view()` and `Route::redirect()` are helper methods that internally use controller classes and are fully cacheable. Controller classes are the safest choice for any route in an application that may need route caching.

### Default Path
Always use controller class strings for route handlers in applications targeting production.

### Risks
- A single Closure route blocks caching for all routes — 20-40ms overhead on every request
- LogicException during deployment blocks the entire optimize pipeline
- Route helpers (view, redirect) are often overlooked as alternatives to Closures

### Related Rules/Skills
- Use controller strings instead of Closures for all routes
- Use `Route::view()` and `Route::redirect()` instead of Closures
- Skill: Cache Routes for Production

---

## DT-K02-02: Static vs Dynamic Route Registration

### Decision Context
- **When to decide:** During application architecture design
- **Stakeholders:** Backend Developers
- **Trigger:** Designing route structure, especially for multi-tenant apps
- **Constraint:** Cached routes are an immutable snapshot — dynamic conditions are frozen at build time

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Multi-tenancy | High | Tenant-specific routes conflict with static cache |
| Feature flags | Medium | Runtime feature conditions frozen at cache-build |
| Route count per tenant | Medium | Many conditional routes = complex caching strategy |

### Decision Tree

```
Does the application register routes conditionally at runtime?
├── No — all routes are unconditionally registered
│   └── Always enable route caching
│       └── php artisan route:cache in deployment
│
├── Yes — routes depend on runtime conditions
│   ├── Are conditions stable per deployment (env-based)?
│   │   ├── Yes — conditionals run at cache-build time
│   │   │   └── Route caching works correctly
│   │   │       └── Routes are cached per-environment
│   │   │
│   │   └── No — conditions vary per-request (tenant, user)
│   │       ├── Can the dynamic routing be moved to middleware?
│   │       │   ├── Yes — register all routes statically, filter in middleware
│   │       │   │   └── Cache all routes; middleware decides per-request
│   │       │   │
│   │       │   └── No — truly dynamic per-tenant routes
│   │       │       └── Accept uncached route registration
│   │       │           ├── Document the performance impact
│   │       │           └── Consider caching base routes only
│   │       │
│   │       └── (middleware-based routing is cache-compatible)
│   │
│   └── (env-conditional route registration caches correctly)
│
└── (static route definitions are the cacheable norm)
```

### Rationale
Dynamic route registration (e.g., `if (tenant()->isEnterprise()) { Route::... }`) is frozen at cache-build time — the runtime condition is evaluated once during `route:cache`. For per-request conditions, move filtering logic to middleware where it works correctly with cached routes.

### Default Path
Use fully static route definitions. For multi-tenant, use middleware-based filtering on top of cached static routes.

### Risks
- Dynamic routes frozen at cache-build time = wrong routes served for different tenants
- Middleware-based routing adds per-request overhead, but less than uncached route registration
- Transitioning from dynamic to static routes requires restructuring route service providers

### Related Rules/Skills
- Avoid dynamic route registration in cached applications
- Skill: Cache Routes for Production

---

## DT-K02-03: Route Cache in Deployment Sequence

### Decision Context
- **When to decide:** When writing deployment scripts
- **Stakeholders:** Backend Developers, DevOps
- **Trigger:** Including cache commands in deployment pipeline
- **Constraint:** Route caching depends on resolved configuration

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Cache dependency order | High | Config → Routes — routes read config values |
| Deployment safety | High | Failed route:cache should halt deployment |
| Verification | Medium | Confirm routes resolve correctly after caching |

### Decision Tree

```
What is the deployment sequence?
├── Full deployment with all cache types
│   └── Cache in dependency order
│       ├── php artisan migrate --force
│       ├── php artisan optimize:clear
│       ├── php artisan config:cache (prerequisite)
│       ├── php artisan route:cache
│       ├── php artisan event:cache
│       └── php artisan view:cache
│
├── Route-only deployment
│   └── Targeted route cache
│       ├── php artisan route:cache (config cache must already exist)
│       ├── php artisan route:list --format=json (verify)
│       └── Restart PHP workers
│
└── Deployment with Closure routes (cannot cache)
    └── Skip route:cache
        └── Accept 20-40ms uncached route registration overhead
```

### Rationale
Route caching depends on resolved configuration — URL defaults, middleware parameters, and route group settings may read config values. If `config:cache` hasn't run, routes are cached with unresolved `env()` calls or incorrect defaults. The deployment sequence must respect this dependency chain.

### Default Path
Run `config:cache` before `route:cache` in every deployment script that includes route caching.

### Risks
- Running route:cache before config:cache produces inconsistent artifacts
- Skipping route:cache after route changes = 404 errors on new routes
- Not verifying route:list after caching may miss silent failures

### Related Rules/Skills
- Cache config before caching routes
- Validate all routes before caching
- Run `route:cache` in every production deployment
