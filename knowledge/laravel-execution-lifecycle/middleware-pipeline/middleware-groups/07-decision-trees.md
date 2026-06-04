# Middleware Groups — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Middleware Groups
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Modify default group vs create custom group | Adding middleware that applies to a set of routes | Blast radius; maintainability; clarity |
| 2 | Route group vs individual route-level middleware | Structuring middleware for a route set | DRY; visibility; flexibility |
| 3 | Flat group vs nested groups | Organizing groups that share middleware | Complexity; expansion predictability |

---

## Decision 1: Modify Default Group vs Create Custom Group

### Decision Context
You need middleware that applies to a subset of routes that happen to be in the `web` or `api` group. Decide whether to append to the default group or create a new custom group.

### Decision Criteria
- **Applies to ALL routes in the default group?** Yes → modify default; No → custom group
- **Route type is new/unique?** (admin, tenant, SPA) → custom group
- **Risk of affecting future routes?** Concern about new routes getting unintended middleware → custom group
- **Package routes affected?** Packages register routes in `web` — they'd get your middleware → custom group

### Decision Tree
```
Adding middleware to a set of routes?
├── Does EVERY route in the default group need this middleware?
│   ├── Yes
│   │   ├── Middleware is a cross-cutting concern for all web routes (e.g., localization)
│   │   │   └── Append to default group: $middleware->web(append: [...])
│   │   └── Middleware is truly infrastructure (should have been global)
│   │       └── Move to global stack instead
│   └── No — only some routes need it
│       ├── Route type is distinct (admin panel, admin routes)
│       │   └── CREATE CUSTOM GROUP: 'admin', 'tenant', 'spa'
│       ├── Middleware is for a specific feature (paid-tier, beta)
│       │   └── CREATE CUSTOM GROUP or use route-level middleware
│       └── Only 1-2 routes need it
│           └── Use route-level middleware instead of a group
├── Are there package routes in the default group?
│   ├── Yes — packages may register routes in web
│   │   └── CREATE CUSTOM GROUP — avoid affecting unexpected routes
│   └── No — no package routes to worry about
│       └── Modifying default may be acceptable
└── Could this middleware break any route it touches?
    ├── Yes (auth, rate limiting, data validation)
    │   └── CREATE CUSTOM GROUP — explicit opt-in
    └── No (logging, headers, monitoring)
        └── Modifying default may be acceptable
```

### Rationale
Default groups (`web`, `api`) are applied to a broad set of routes, including those added by packages, future developers, or scaffolding. Adding middleware to a default group silently affects all those routes. A custom group makes the middleware explicit — routes must opt in by referencing the group name.

### Default
Create custom groups for distinct route types. Modify default groups only when the middleware genuinely applies to every route in that group.

### Risks
- Appending to `web` group affects package routes and future routes unexpectedly
- Custom groups that are too granular: too many groups to manage
- Forgetting to assign routes to the custom group: middleware doesn't run (silent omission)

### Related Rules/Skills
- Create Custom Groups for Distinct Route Types Instead of Modifying Defaults
- Keep Routes in Their Correct File Based on Group Mapping
- Skill: Create and Manage Middleware Groups

---

## Decision 2: Route Group vs Individual Route-Level Middleware

### Decision Context
You have multiple routes that need common middleware. Choose between a route group or individual `->middleware()` calls.

### Decision Criteria
- **Number of routes**: 2+ routes sharing middleware → group; 1 route → individual
- **Conditional exceptions**: Some routes in group need to skip middleware → nested groups or individual
- **Route file organization**: Routes already in a logical block → group; scattered → individual
- **Clarity**: Group makes the shared middleware visible once vs repeating it → group is clearer

### Decision Tree
```
Multiple routes with shared middleware?
├── 1 route only
│   └── Individual ->middleware() — no group needed
├── 2-3 routes
│   ├── Routes are contiguous in the route file
│   │   └── Use Route::middleware(['auth'])->group(...)
│   └── Routes are scattered across different files
│       └── Individual middleware on each — group would cross file boundaries
├── 4+ routes (resource controller, admin section)
│   └── Use route group for clarity and maintainability
├── All routes in group need same middleware EXCEPT some
│   ├── Use group for the common middleware
│   │   └── Route::middleware(['auth'])->group(function () {
│   │       Route::get('/public', ...)->withoutMiddleware('auth'); // Exception
│   │   });
│   └── Or use nested groups with selective middleware
│       └── Route::middleware(['auth'])->group(function () {
│           Route::get('/dashboard', ...);
│           Route::withoutMiddleware(['auth'])->group(function () {
│               Route::get('/public', ...);
│           });
│       });
└── Routes already have a group from file mapping (web/api)
    ├── Additional middleware needed
    │   └── Create nested group inside the route file
    └── Default group is sufficient
        └── No additional group needed
```

### Rationale
Route groups reduce repetition and make middleware intent visible at a glance. They also simplify future changes — add or remove middleware in one place. The trade-off is reduced granularity: all routes in the group get the same middleware.

### Default
Use route groups for any set of 2+ routes that share middleware. Use individual middleware for route-specific exceptions.

### Risks
- Group too broad: applying middleware to routes that shouldn't have it
- `withoutMiddleware()` on a route: cannot bypass global middleware, only group/route
- Nested groups with conflicting middleware: hard to trace final merged list

### Related Rules/Skills
- Use Route Groups for Middleware Shared Across Multiple Routes
- Verify Group Middleware Expansion with `route:list -v`
- Skill: Create and Manage Middleware Groups

---

## Decision 3: Flat Group vs Nested Groups

### Decision Context
Organizing middleware groups when some groups contain middleware that is also needed by other groups.

### Decision Criteria
- **Group size**: Small (2-3 middleware) → flat; large (6+) → may benefit from nesting
- **Reuse pattern**: Other groups use the same subset → nesting avoids duplication
- **Expansion depth**: 1 level of nesting → acceptable; 3+ levels → too complex
- **Debugging ease**: Need to quickly see what runs → flat is clearer; nested hides middleware

### Decision Tree
```
Organizing middleware groups?
├── All middleware lists are independent (no shared subsets)
│   └── Keep groups FLAT — each group defines its own array
├── Groups share a common subset of middleware
│   ├── Only 1-2 middleware overlap
│   │   └── Keep FLAT — duplication is acceptable for clarity
│   ├── Large overlap (4+ middleware shared)
│   │   └── Consider NESTING: create base group, reference from others
│   └── Overlap is complex and changes frequently
│       └── NESTING reduces maintenance burden
├── Nesting depth
│   ├── 1 level (group references another group)
│   │   └── Acceptable — framework handles one level well
│   ├── 2 levels
│   │   └── Acceptable but monitor expansion for correctness
│   └── 3+ levels
│       └── AVOID — expansion order becomes hard to predict
└── Groups are in different files/locations
    ├── Same bootstrap/app.php file
    │   └── Nesting is manageable
    └── Different files or packages
        └── Keep FLAT — cross-file group nesting is hard to debug
```

### Rationale
Flat groups are simpler to understand and debug — the middleware list is explicit. Nesting reduces duplication when groups share large middleware subsets but adds indirection. The framework supports nesting but at the cost of clarity.

### Default
Keep groups flat unless there's a clear duplication problem with 4+ shared middleware entries.

### Risks
- Deeply nested groups: unpredictable expansion order
- Circular group nesting: framework may prevent this, but still a design smell
- Debugging nested groups: need to mentally expand to understand what runs

### Related Rules/Skills
- Do Not Deeply Nest Groups Within Groups
- Verify Group Middleware Expansion with `route:list -v`
- Skill: Create and Manage Middleware Groups
