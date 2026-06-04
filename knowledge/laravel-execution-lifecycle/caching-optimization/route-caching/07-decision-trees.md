# Decision Trees: Route Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Knowledge Unit:** Route Caching
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-RC-01 | Route Handler Type Selection | Architecture | Medium | Per route definition |
| DT-RC-02 | Dynamic vs Static Route Registration | Architecture | High | Per application design |
| DT-RC-03 | Route Cache in Deployment Sequence | Reliability | Low | Per deployment |

---

## DT-RC-01: Route Handler Type Selection

### Decision Context
- **When to decide:** When defining a new route
- **Stakeholders:** Backend Developers
- **Trigger:** Adding a route to routes/web.php or routes/api.php
- **Constraint:** Closure routes block route:cache entirely

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Cache compatibility | High | Closures cause LogicException on route:cache |
| Route simplicity | Medium | Simple views/redirects have cacheable helpers |
| Application scale | Medium | Small apps may accept uncached routes; large apps cannot |

### Decision Tree

```
What kind of route handler is needed?
├── Simple view response
│   ├── Route::view('/path', 'view.name')
│   └── Cacheable (converts to internal controller)
│
├── Simple redirect response
│   ├── Route::redirect('/old', '/new')
│   └── Cacheable (converts to internal controller)
│
├── Permanent redirect
│   ├── Route::permanentRedirect('/old', '/new')
│   └── Cacheable (converts to internal controller)
│
├── Custom handler logic
│   ├── Is the route used in a production app with 100+ routes?
│   │   ├── Yes
│   │   │   └── Use controller class: [Controller::class, 'method']
│   │   │
│   │   └── No
│   │       ├── Small app — Closure is acceptable
│   │       └── Accept that route:cache cannot be used
│   │
│   └── (controller classes are preferred for cacheability)
│
└── (a single Closure blocks caching for ALL routes)
```

### Rationale
A single Closure route in the application blocks `route:cache` entirely — all routes (including controller-based ones) run uncached. `Route::view()`, `Route::redirect()`, and `Route::permanentRedirect()` are helper methods that internally use controller classes and are fully cacheable.

### Default Path
Always use controller class strings for route handlers. Use `Route::view()` and `Route::redirect()` for simple cases.

### Risks
- A single Closure route blocks caching for all routes — 20-40ms overhead per request
- LogicException during deployment blocks the entire optimize pipeline
- Route helpers are often overlooked as alternatives to Closures

### Related Rules/Skills
- Use controller strings instead of Closures for all routes
- Use `Route::view()` and `Route::redirect()` instead of Closures
- Skill: Cache Routes for Production

---

## DT-RC-02: Dynamic vs Static Route Registration

### Decision Context
- **When to decide:** During application architecture design
- **Stakeholders:** Backend Developers
- **Trigger:** Designing route structure for multi-tenant or feature-flagged apps
- **Constraint:** Cached routes are an immutable snapshot — runtime conditions are frozen at build time

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Runtime condition type | High | Environment-stable vs per-request |
| Alternative pattern | High | Middleware-based filtering vs conditional registration |
| Performance impact | Medium | Middleware adds per-request overhead |

### Decision Tree

```
Are routes registered conditionally at runtime?
├── No — all routes are unconditional
│   └── Always enable route caching
│       └── php artisan route:cache in deployment
│
├── Yes — conditions depend on environment (APP_ENV, config)
│   ├── Conditions are stable per deployment
│   ├── Evaluated at cache-build time
│   └── Route caching works correctly
│       └── Conditional registration in RouteServiceProvider
│
└── Yes — conditions vary per request (tenant, user, feature flag)
    ├── Can filtering be moved to middleware?
    │   ├── Yes — register all routes statically, filter in middleware
    │   │   ├── Example: one route, middleware checks tenant feature
    │   │   ├── All routes cached
    │   │   └── Per-request filtering in middleware
    │   │
    │   └── No — truly dynamic per-tenant route sets
    │       └── Accept uncached routes
    │           ├── Document the performance impact (20-40ms per request)
    │           └── Consider caching base routes, adding dynamic ones separately
    │
    └── (middleware-based routing is cache-compatible)
```

### Rationale
Dynamic route registration (e.g., `if (featureFlag()) { Route::... }`) is frozen at cache-build time — the condition runs once during `route:cache`. For per-request conditions, move filtering logic to middleware where it executes correctly with cached routes.

### Default Path
Use fully static route definitions. For multi-tenant, use middleware-based filtering on cached static routes.

### Risks
- Dynamic routes frozen at cache-build time = wrong routes for different tenants
- Middleware-based routing adds per-request overhead (minimal compared to uncached registration)
- Transition from dynamic to static routes requires restructuring route service providers

### Related Rules/Skills
- Avoid dynamic route registration in cached applications
- Skill: Cache Routes for Production

---

## DT-RC-03: Route Cache in Deployment Sequence

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
Is this a full deployment or targeted route change?
├── Full deployment (config + routes + events + providers)
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
│       ├── php artisan route:cache (config cache must exist)
│       ├── php artisan route:list --format=json (verify)
│       └── Restart PHP workers (flush OpCache)
│
└── Deployment with Closure routes (cannot cache)
    └── Skip route:cache
        └── Accept 20-40ms uncached route registration overhead
```

### Rationale
Route caching depends on resolved configuration — URL defaults, middleware parameters, and route group settings may read config values. If `config:cache` hasn't run, routes are cached with unresolved `env()` calls or incorrect defaults. The deployment sequence must respect this dependency chain.

### Default Path
Run `config:cache` before `route:cache` in every deployment script.

### Risks
- Running route:cache before config:cache produces inconsistent artifacts
- Skipping route:cache after route changes = 404 errors on new routes
- Not verifying route:list after caching may miss silent failures

### Related Rules/Skills
- Cache config before caching routes
- Validate all routes before caching
- Run `route:cache` in every production deployment
