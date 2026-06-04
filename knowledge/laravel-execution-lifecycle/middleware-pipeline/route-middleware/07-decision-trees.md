# Route Middleware — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Route Middleware
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Inline vs controller constructor middleware | Assigning middleware to routes/controllers | Visibility; maintainability; code organization |
| 2 | Route group vs individual route middleware | Structuring middleware for multiple routes | DRY; readability; duplication risk |
| 3 | Middleware alias vs FQCN in route definitions | Writing route middleware references | Readability; decoupling; route caching |

---

## Decision 1: Inline vs Controller Constructor Middleware

### Decision Context
You need middleware on specific controller actions. Choose between inline `->middleware()` on route definitions or `$this->middleware()` in the controller constructor.

### Decision Criteria
- **New code vs legacy**: New code → inline; existing codebase with controller middleware → maintain consistency
- **Resource controller**: Standard CRUD controller → controller middleware with `only`/`except` is acceptable
- **Visibility need**: Security middleware → MUST be inline (visible in route files)
- **Method filtering**: Need to apply to specific methods only → controller middleware with `only`/`except` is cleaner
- **Number of routes**: Few routes → inline; many resource routes → controller middleware reduces repetition

### Decision Tree
```
Middleware assignment style?
├── New code / greenfield project
│   ├── Route-specific middleware
│   │   └── Use inline: ->middleware('auth') on route definition
│   ├── Group of routes sharing middleware
│   │   └── Use Route::middleware(['auth'])->group(...) — still inline
│   └── Resource controller with method filtering
│       ├── Only 2-3 routes → inline each route
│       └── Full CRUD (7+ routes) → controller middleware with only/except
├── Legacy codebase with existing controller middleware
│   ├── Maintaining consistency
│   │   └── Continue using controller middleware for existing patterns
│   └── New routes in same codebase
│       └── Prefer inline for new routes
├── Security-critical middleware (auth, roles, permissions)
│   └── ALWAYS use inline — must be visible in route files
└── Method-specific middleware on resource controller
    ├── All methods except 1-2 → controller middleware with except()
    ├── Only 1-2 specific methods → controller middleware with only()
    └── Complex, non-standard filtering → inline each route
```

### Rationale
Inline middleware is visible in route definitions, making it obvious which middleware runs on which route. Controller middleware is hidden in the constructor and requires inspecting the controller class. The exception is resource controllers with `only`/`except`, where the method-level filtering is more concise.

### Default
Use inline middleware for new code. Use controller middleware only for resource controller method filtering.

### Risks
- Security middleware in controller constructor: invisible in route files — can be missed during security audits
- Inline on every resource route: repetitive and error-prone
- `only`/`except` with wrong method name: middleware applies to wrong action

### Related Rules/Skills
- Prefer Inline Middleware Over Controller Constructor Middleware
- Use `only`/`except` Instead of Applying Middleware to Each Controller Method
- Skill: Assign Route Middleware Correctly

---

## Decision 2: Route Group vs Individual Route Middleware

### Decision Context
You have middleware to apply to multiple routes. Decide whether to create/build a group or apply individually.

### Decision Criteria
- **Shared middleware count**: 2+ routes share middleware → group; 1 route → individual
- **Route file organization**: Routes in the same file often → group; scattered across files → individual
- **Conditional application**: Some routes in group need subset → individual or nested groups
- **Group already exists**: Group with most of the needed middleware already → add to existing group
- **Group expansion visibility**: Need to clearly see what runs on each route → individual may be clearer

### Decision Tree
```
Applying middleware to multiple routes?
├── Only 1 route needs this middleware
│   └── Use individual: ->middleware('throttle:10,1')
├── 2-3 routes share same middleware
│   ├── All in close proximity in route file
│   │   └── Use Route::middleware(['auth'])->group(...)
│   └── Routes are scattered across files
│       └── Use individual on each — creating a group adds indirection
├── Many routes (4+) share same middleware
│   ├── All related routes (admin panel, API version)
│   │   └── Create a route GROUP
│   └── Routes are across different controllers
│       └── Still use group — middleware defined in one place
├── Some routes in group need extra middleware
│   ├── Create nested group with additional middleware
│   │   └── Route::middleware(['auth'])->group(function () {
│   │       Route::middleware(['verified'])->group(...);
│   │   });
│   └── Or add individually to specific routes
│       └── Route::get(...)->middleware(['auth', 'verified'])
└── Route file is already mapped to a default group (web/api)
    ├── Middleware already in default group
    │   └── No action needed — it's already applied
    └── Need additional middleware on top of default group
        └── Use nested group or individual middleware
```

### Rationale
Groups reduce repetition when multiple routes share middleware. The threshold is typically 2+ routes — at that point, a group is cleaner than repeating middleware on each route definition. Groups also make it easier to add/remove middleware for all routes at once.

### Default
Use groups for 2+ routes sharing middleware. Use individual middleware for one-off route-specific concerns.

### Risks
- Group with too many routes: hard to see which routes get which middleware
- Nested groups too deep: confusing expansion order
- Duplicating group middleware on individual routes: middleware runs twice

### Related Rules/Skills
- Use Route Groups for Middleware Shared Across Multiple Routes
- Do Not Duplicate Group Middleware on Individual Routes
- Skill: Assign Route Middleware Correctly

---

## Decision 3: Middleware Alias vs FQCN in Route Definitions

### Decision Context
Writing middleware references in route files — choose between a short alias string or the fully-qualified class name.

### Decision Criteria
- **Alias registered?** Yes → use alias; No → use FQCN or register alias
- **Frequency of use**: Used in many route files → alias; one-off → either
- **Readability**: Alias is clear (`'throttle:60,1'`) → alias; alias is cryptic → FQCN
- **Framework upgrade path**: Concern about class location changes → alias decouples
- **Package middleware**: Package registers its own alias → use package alias

### Decision Tree
```
Middleware reference in route definition?
├── Alias is already registered
│   ├── Alias is standard and well-known ('auth', 'throttle', 'verified')
│   │   └── USE ALIAS — concise, readable, decoupled
│   ├── Custom alias is registered
│   │   ├── Alias is clear and descriptive ('log-requests', 'verify-tenant')
│   │   │   └── USE ALIAS — improves route readability
│   │   └── Alias is cryptic or confusing ('m1', 'custom')
│   │       └── USE FQCN or rename alias to be descriptive
│   └── Alias is a package middleware
│       └── USE ALIAS — package guarantees alias registration
├── Alias is NOT registered
│   ├── Middleware used in multiple route files
│   │   └── REGISTER ALIAS first, then use alias
│   ├── Middleware used only once
│   │   ├── FQCN is short (<30 chars)
│   │   │   └── USE FQCN — alias registration is unnecessary boilerplate
│   │   └── FQCN is long (>30 chars)
│   │       └── REGISTER ALIAS — improves route readability
│   └── Temporary/experimental middleware
│       └── USE FQCN — will be removed soon
└── Production route with caching
    ├── Route cache will be used
    │   └── USE ALIAS — resolved at cache time, eliminates per-request resolution
    └── Route cache not used
        └── Either is fine; alias is still preferred for readability
```

### Rationale
Aliases decouple route definitions from class locations, improve readability, and are resolved at route-cache time. The only reason to use FQCN is when the alias doesn't exist and the middleware is used once with a short class name.

### Default
Use aliases for all route middleware references in production routes. Register an alias if one doesn't exist.

### Risks
- Alias not registered → `InvalidArgumentException` at runtime
- Alias collision with framework defaults → silent behavior override
- Forgetting to re-cache routes after alias changes → stale class references in cache

### Related Rules/Skills
- Register Custom Aliases for All Application Middleware
- Never Register Custom Aliases That Collide with Framework Defaults
- Re-Cache Routes After Adding or Changing Aliases
- Skill: Register and Use Middleware Aliases
