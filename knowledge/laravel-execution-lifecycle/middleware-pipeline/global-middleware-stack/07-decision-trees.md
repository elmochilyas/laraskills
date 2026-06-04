# Global Middleware Stack — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Global Middleware Stack
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Global vs group vs route middleware placement | Adding a new middleware | Performance; blast radius; correctness |
| 2 | Keep or remove default global middleware | Configuring stack for API-only vs web app | Performance; security; resource usage |
| 3 | Global middleware ordering | Positioning middleware within global array | Correctness; dependency satisfaction |

---

## Decision 1: Global vs Group vs Route Middleware Placement

### Decision Context
You have a new middleware and must decide which level to register it at.

### Decision Criteria
- **Must run on every request?** Yes → global; No → group or route
- **Infrastructure concern?** (maintenance mode, proxies, CORS, request size) → global
- **Shared across many routes?** → group
- **Single route or specific endpoint?** → route-level
- **Could failure take down health checks?** If yes → avoid global
- **Needs session/auth?** → group or route, not global (unless app-wide)

### Decision Tree
```
New middleware placement?
├── Does every single request need this?
│   ├── Yes — infrastructure concern (proxies, CORS, maintenance, request validation)
│   │   └── Add to GLOBAL stack
│   └── No — it's application-specific
│       ├── Shared across many routes (2+ route groups or files)?
│       │   ├── Yes → Create or use a middleware GROUP
│       │   └── No → Add to ROUTE-LEVEL middleware
│       └── Does it depend on session/auth/bindings?
│           └── Must be group or route level (not global)
├── Could this middleware break health checks?
│   ├── Yes (DB-dependent, external API call)
│   │   └── DO NOT add to global; use group or route
│   └── No (pure logic, no external dependencies)
│       └── Global may be acceptable if truly app-wide
└── Is this security middleware (auth, CSRF, throttling)?
    ├── It's a gate that should block before any processing
    │   └── Global (for app-wide security like CSRF)
    └── It's per-endpoint security (auth role, specific throttle)
        └── Group or route level
```

### Rationale
Global middleware is the broadest scope — it affects 100% of traffic including health checks, webhooks, and monitoring endpoints. Adding middleware globally should be a deliberate decision. The guiding question is "Does every single HTTP request need this?" If the answer is anything less than a definitive yes, use a more specific level.

### Default
Add middleware at the most specific level possible. Route > group > global. Default framework global stack is sufficient for most web apps.

### Risks
- Global middleware that depends on external services: takes down health checks and monitoring
- Session/cookie middleware in global for API-only apps: unnecessary I/O on every request
- Forgetting infrastructure middleware (TrustProxies): wrong IP resolution in all downstream code

### Related Rules/Skills
- Add Middleware at the Most Specific Level Possible
- Do Not Add Heavy or Service-Dependent Middleware to the Global Stack
- Skill: Configure Global Middleware Stack

---

## Decision 2: Keep or Remove Default Global Middleware

### Decision Context
Configuring the global stack for a new application — deciding which default middleware to keep, remove, or replace.

### Decision Criteria
- **Application type**: Traditional web → keep defaults; API-only → remove session/cookie/CSRF
- **Stateless vs stateful**: Stateless API → remove session/cookie; stateful SPA → depends on auth mechanism
- **CSRF handling**: API-only → remove; web app with SPA → may need API token CSRF
- **Performance requirements**: High-throughput API → strip unnecessary middleware
- **Framework version**: Laravel 11+ uses `bootstrap/app.php`; <11 uses Kernel property

### Decision Tree
```
Application type?
├── Traditional web application (Blade + sessions)
│   ├── Keep all default global middleware
│   ├── Keep EncryptCookies, StartSession, ShareErrorsFromSession, VerifyCsrfToken
│   └── Only remove if you understand the consequences
├── API-only application (stateless, token-based auth)
│   ├── Remove session middleware: StartSession, ShareErrorsFromSession
│   ├── Remove EncryptCookies (no cookies used)
│   ├── Remove VerifyCsrfToken (token-based auth, not cookie-based)
│   └── Keep: TrustProxies, HandleCors, PreventRequestsDuringMaintenance, ValidatePostSize, TrimStrings
├── SPA with Laravel Sanctum (cookie-based SPA auth)
│   ├── Keep EncryptCookies and StartSession (session-based auth)
│   ├── May need to adjust CSRF handling for SPA
│   └── Consider moving session to `api` group instead of global
└── Hybrid (web + API in same app)
    ├── Keep defaults for web routes
    └── Move session/cookie to `web` group only (not global)
        └── API routes in `api` group avoid session overhead
```

### Rationale
The default global middleware stack is designed for traditional Blade-based web applications with session auth. API-only and SPA applications have different needs. The key insight is that session middleware performs I/O on every request — for stateless API traffic, this is pure waste.

### Default
Keep default global middleware for web apps. For API-only apps, remove session, cookie, and CSRF middleware from global.

### Risks
- Removing EncryptCookies breaks session-based auth (session IDs in encrypted cookies)
- Removing CSRF globally without alternative protection exposes POST routes to CSRF attacks
- Keeping session middleware on high-throughput API routes causes unnecessary I/O and session storage pressure

### Related Rules/Skills
- Audit Default Global Middleware Before Production
- Skill: Configure Global Middleware Stack
- Skill: Create and Manage Middleware Groups

---

## Decision 3: Global Middleware Ordering

### Decision Context
Positioning middleware within the global stack array to satisfy dependency chains.

### Decision Criteria
- **IP dependency**: Middleware that inspects request IP → must run after TrustProxies
- **Blocking before processing**: Maintenance mode → should run first to block early
- **Request normalization**: TrimStrings, ConvertEmptyStringsToNull → before validation logic
- **Cookie dependency**: Session depends on decrypted cookies → EncryptCookies before StartSession
- **Session dependency**: Auth depends on session → StartSession before auth middleware

### Decision Tree
```
Positioning middleware in global stack?
├── Trust/infrastructure middleware (must run first)
│   ├── TrustProxies — must run before any IP inspection
│   ├── HandleCors — must run before request processing
│   ├── PreventRequestsDuringMaintenance — block before any processing
│   └── ValidatePostSize — validate before body parsing
│   └── → Place at TOP of global stack
├── Session/cookie middleware (dependency chain)
│   ├── EncryptCookies — decrypt cookies first
│   ├── AddQueuedCookiesToResponse — queue cookies after decryption
│   ├── StartSession — session depends on decrypted cookies
│   └── ShareErrorsFromSession — depends on session
│   └── → Place in order: EncryptCookies → AddQueuedCookies → StartSession → ShareErrors
├── Security middleware (depends on session)
│   ├── VerifyCsrfToken — depends on session
│   └── → Place after session middleware
├── Request normalization (after infrastructure, before application)
│   ├── TrimStrings — trim whitespace
│   ├── ConvertEmptyStringsToNull — normalize empty strings
│   └── → Place after security, before bindings
└── Route bindings (runs last in global)
    └── SubstituteBindings — depends on everything above
    └── → Place at BOTTOM of global stack
```

### Rationale
The ordering follows dependency chains: infrastructure first (trust proxies, maintenance), then state setup (cookies → session → CSRF), then normalization, then bindings. Each middleware depends on the ones before it.

### Default
Follow the default framework ordering. Only add custom middleware at the appropriate position based on its dependencies.

### Risks
- TrustProxies after IP-dependent middleware: all IPs are proxy IPs
- Maintenance mode after processing: application processes requests during maintenance
- EncryptCookies after StartSession: session cannot decrypt its own cookie ID
- VerifyCsrfToken before StartSession: cannot validate CSRF token without session

### Related Rules/Skills
- Order Global Middleware by Infrastructure Dependency
- Skill: Configure Global Middleware Stack
