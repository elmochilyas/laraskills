# Middleware Configuration in Bootstrap — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Middleware Configuration in Bootstrap
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Bootstrap vs Kernel configuration approach | Choosing the configuration method for middleware | Compatibility; correctness; maintainability |
| 2 | `replace()` vs `remove()` + `append()` for swapping middleware | Replacing a default middleware with a custom one | Completeness; consistency across groups |
| 3 | Global `append()`/`prepend()` vs group-specific methods | Adding middleware to the right scope | Blast radius; organizational clarity |

---

## Decision 1: Bootstrap vs Kernel Configuration

### Decision Context
Configuring middleware in a Laravel project. Choose between `bootstrap/app.php` with `withMiddleware()` or the traditional `App\Http\Kernel` properties.

### Decision Criteria
- **Laravel version**: 11+ → bootstrap; <11 → kernel
- **Migration status**: Actively migrating from <11 to 11 → bootstrap; not yet migrated → kernel
- **Consistency**: Don't mix approaches — use one exclusively

### Decision Tree
```
Middleware configuration approach?
├── Laravel 11+
│   └── MUST use ->withMiddleware() in bootstrap/app.php
│   ├── Kernel $middleware, $middlewareGroups, $routeMiddleware are IGNORED
│   └── Using kernel = silent failure (middleware never registered)
├── Laravel <11 (10, 9, etc.)
│   └── MUST use App\Http\Kernel properties
│   ├── $middleware, $middlewareGroups, $routeMiddleware
│   └── bootstrap/app.php middleware config not supported
├── Migrating from Laravel 10 to 11
│   ├── Move all middleware config from Kernel to bootstrap/app.php
│   ├── Delete the Kernel file or remove middleware properties
│   └── Test that all middleware still applies
└── NEVER mix both approaches
    ├── Kernel properties in Laravel 11 = silent no-op
    └── Some config in kernel, some in bootstrap = inconsistent behavior
```

### Rationale
Laravel 11 intentionally stops reading kernel middleware properties. The bootstrap approach centralizes configuration and provides a fluent, IDE-friendly API. Using the old kernel approach in Laravel 11 silently does nothing — middleware is never registered, which can cause security gaps or functionality breakage.

### Default
Laravel 11+ → `withMiddleware()` in `bootstrap/app.php`. Laravel <11 → `App\Http\Kernel` properties.

### Risks
- Editing `App\Http\Kernel` in Laravel 11: configuration silently ignored
- Forgetting `use` statement for `Middleware` class: runtime error
- Not re-caching after changes: stale configuration in production

### Related Rules/Skills
- Always Use `withMiddleware()` for Laravel 11+ Middleware Configuration
- Re-Cache Configuration After Any `bootstrap/app.php` Changes
- Skill: Configure Middleware in Bootstrap

---

## Decision 2: `replace()` vs `remove()` + `append()`

### Decision Context
You want to swap a default framework middleware with a custom implementation. Choose between `replace()` or manually removing and re-adding.

### Decision Criteria
- **Where does the middleware live?** Multiple groups (web, api, global) → `replace()` is simpler; Single group → either
- **Correctness requirement**: Must replace in ALL groups → `replace()`; Only need to replace in specific group → `remove()` + `append()`
- **Risk of missing a group**: High with manual approach → `replace()`; Low (single group) → either

### Decision Tree
```
Swapping a default middleware?
├── Middleware is in MULTIPLE groups/stack
│   ├── In global stack AND web group (appears in multiple places)
│   │   └── USE replace() — handles all locations automatically
│   ├── In web group AND api group
│   │   └── USE replace() — replaces in both
│   └── You don't know all the groups it's in
│       └── USE replace() — don't guess
├── Middleware is in ONE specific group only
│   ├── Only in web group
│   │   └── remove() + append() to that specific group works
│   └── Only in global stack
│       └── remove() + append() works
├── Middleware is completely REMOVED (no replacement)
│   └── USE remove() — no replacement needed, clear intent
└── Middleware is ADDED (no existing middleware to replace)
    └── Use append() / prepend() — replace() is for swapping only
```

### Rationale
`replace()` automatically finds the target middleware in every group and global stack and swaps it. This is correct even when you don't know exactly which groups the middleware belongs to. Manual `remove()` + `append()` requires knowing every group — if you miss one, the old middleware still runs in that group while the new one also runs.

### Default
Use `replace()` for swapping middleware. Use `remove()` only when completely removing without replacement. Use `append()`/`prepend()` when adding new middleware (not replacing).

### Risks
- `replace()` target not found: silently does nothing — middleware stack unchanged
- `remove()` + `append()` missing a group: old middleware runs in that group, new middleware also runs
- Using `replace()` when target doesn't exist: no error, no effect — verify with `route:list -v`

### Related Rules/Skills
- Use `replace()` Instead of `remove()` + `append()` for Swapping
- Skill: Configure Middleware in Bootstrap

---

## Decision 3: Global `append()`/`prepend()` vs Group-Specific Methods

### Decision Context
Adding middleware to the configuration. Choose between global `append()`/`prepend()` (applies to global stack) and group-specific methods like `web()`, `api()`, `group()`.

### Decision Criteria
- **Should it run on EVERY request?** Yes → global `append()`/`prepend()`; No → group-specific
- **Which routes need it?** All routes → global; Specific groups → group methods
- **Is it infrastructure?** Yes (proxies, CORS, maintenance) → global; No → group

### Decision Tree
```
Where to add the middleware?
├── Must run on EVERY request
│   ├── Infrastructure: trust proxies, CORS, maintenance, force HTTPS
│   │   └── Use global: $middleware->append() or $middleware->prepend()
│   └── Security: check all requests for something
│       └── Use global: $middleware->append()
├── Must run on a SPECIFIC GROUP of routes
│   ├── Session/cookie middleware → web group
│   │   └── Use group-specific: $middleware->web(append: [...])
│   ├── Throttling → api group
│   │   └── Use group-specific: $middleware->api(prepend: [...])
│   └── Custom route type (admin, tenant)
│       └── Use custom group: $middleware->group('admin', [...])
└── Should NOT run on all routes (most middleware cases)
    ├── Application-specific middleware
    │   └── Use group-specific — never global
    ├── Auth-dependent middleware
    │   └── Use group-specific — must be after session
    └── Performance-sensitive middleware
        └── Use group-specific — avoid global overhead
```

### Rationale
Global `append()`/`prepend()` affects every route — it's appropriate only for true infrastructure middleware. Group-specific methods affect only routes in that group, which is the correct scope for most application middleware. The global stack is not a "shared middleware" container — it's for non-bypassable infrastructure only.

### Default
Use group-specific methods for all application middleware. Use global `append()`/`prepend()` only for infrastructure middleware that must run on every request.

### Risks
- Using global `append()` for application middleware: affects health checks and all routes
- Using group-specific when global is needed: some routes miss infrastructure middleware
- Using `append()` when `prepend()` is needed for ordering: wrong position in stack

### Related Rules/Skills
- Use Group-Specific Methods Instead of Global `append()`/`prepend()`
- Skill: Configure Middleware in Bootstrap
- Skill: Configure Global Middleware Stack
