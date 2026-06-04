# Middleware vs Route Binding Ordering — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Middleware vs Route Binding Ordering
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Before or after SubstituteBindings | Custom middleware that accesses route parameters | Correctness; null references |
| 2 | Group array ordering vs priority list | Ensuring correct relative position | Simplicity; global vs local scope |
| 3 | Auth before vs after SubstituteBindings | Authentication middleware placement | Performance; model loading optimization |

---

## Decision 1: Before or After SubstituteBindings

### Decision Context
Custom middleware accesses route parameters like `$request->route('user')`. Decide whether it should run before or after route model binding.

### Decision Criteria
- **Needs model instances?** Yes → after SubstituteBindings; No (raw IDs) → before
- **Accesses model methods/properties?** Yes → after; Only checks existence/format → before
- **Is an auth/guard check?** → before (raw IDs sufficient for rejection)
- **Is a resource ownership check?** → after (needs bound model)

### Decision Tree
```
Middleware accesses route parameters?
├── Middleware needs Eloquent MODEL INSTANCES
│   ├── Check resource ownership: $post->user_id === auth()->id()
│   │   └── MUST run AFTER SubstituteBindings
│   ├── Authorization gate: $this->authorize('update', $post)
│   │   └── MUST run AFTER SubstituteBindings
│   ├── Multi-tenant resolution: $tenant = $request->route('tenant')
│   │   └── MUST run AFTER SubstituteBindings
│   └── Eager load relationships on bound model
│       └── MUST run AFTER SubstituteBindings
├── Middleware works with RAW ROUTE PARAMETERS
│   ├── Validate ID format: is_numeric($request->route('id'))
│   │   └── CAN run BEFORE SubstituteBindings (no model needed)
│   ├── Check parameter existence
│   │   └── CAN run BEFORE SubstituteBindings
│   ├── Transform parameters before binding
│   │   └── MUST run BEFORE SubstituteBindings
│   └── Rate limit by route parameter
│       └── CAN run BEFORE SubstituteBindings
├── Middleware does BOTH (raw params AND models)
│   ├── Primary purpose is model access
│   │   └── Run AFTER SubstituteBindings — use model's ->id for raw ID
│   └── Primary purpose is validation
│       └── Run BEFORE SubstituteBindings — validate early
└── Unknown / no clear dependency
    └── Run AFTER SubstituteBindings — safer (params are accessible either way)
```

### Rationale
Before `SubstituteBindings`, `$request->route('param')` returns the raw string ID from the URL. After `SubstituteBindings`, it returns the resolved Eloquent model instance. If your middleware calls methods on the parameter assuming it's a model, running before binding causes `Error: Call to a member function on string`.

### Default
Run after `SubstituteBindings` unless you specifically need raw parameter IDs before model resolution.

### Risks
- Calling model methods on raw ID string → fatal error
- Authorization gates before binding → model is null, gate fails
- Not verifying `$request->route('param')` type → silent string-as-model bugs

### Related Rules/Skills
- Place Model-Accessing Middleware After `SubstituteBindings` in the Group Array
- Never Assume `$request->route('param')` Is a Model Instance
- Skill: Resolve Middleware and Route Binding Ordering

---

## Decision 2: Group Array Ordering vs Priority List

### Decision Context
Ensuring custom middleware runs before or after `SubstituteBindings`. Choose between ordering in the group array or using the priority list.

### Decision Criteria
- **Same source**: Custom middleware in same group array as SubstituteBindings → group array ordering
- **Different sources**: Custom middleware in group A, SubstituteBindings in group B → priority list
- **Scope of change**: Only affects this group → group array; Affects all routes → priority

### Decision Tree
```
Ensuring relative position to SubstituteBindings?
├── Custom middleware is in the SAME group array
│   ├── Both in web group array
│   │   └── ORDER THE ARRAY — simple, localized
│   │   └── Place SubstituteBindings before your middleware
│   └── Both in api group array
│       └── ORDER THE ARRAY — same approach
├── Custom middleware is in a DIFFERENT source
│   ├── Custom middleware in global stack, SubstituteBindings in web group
│   │   └── Use PRIORITY LIST — only way to order across sources
│   ├── Custom middleware in route-level, SubstituteBindings in group
│   │   └── Use PRIORITY LIST — cross-source ordering
│   └── Custom middleware in custom group, SubstituteBindings in default group
│       └── Use PRIORITY LIST — different groups
├── Priority list implications
│   ├── Affects ALL routes — not just this group
│   ├── Must test that other routes are not affected
│   └── Add both SubstituteBindings and your middleware to priority
└── Which is simpler?
    ├── Same array → definitely array ordering
    ├── Different sources → priority is the only option
    └── Both work → array ordering is simpler and more localized
```

### Rationale
Group array ordering is localized, visible, and doesn't affect other routes. Priority is global — it affects every route and must be tested broadly. Use the simplest approach that works: array ordering when in the same group, priority only when middleware sources differ.

### Default
Use group array ordering when both middlewares are in the same array. Use priority when they come from different sources.

### Risks
- Group array ordering when sources differ: no effect (priority overrides)
- Priority when array ordering suffices: unnecessary global constraint
- Not adding to either: execution order is undefined and may behave inconsistently

### Related Rules/Skills
- Use Priority Sparingly — Prefer Group Array Ordering First
- Skill: Resolve Middleware and Route Binding Ordering

---

## Decision 3: Auth Before vs After SubstituteBindings

### Decision Context
Authentication middleware placement relative to route model binding. Decide performance vs convenience trade-off.

### Decision Criteria
- **Auth method**: Session-based → before binding; Token-based → before binding
- **Unauthenticated traffic ratio**: High → auth before binding saves significant DB queries; Low → less impact
- **Binding complexity**: Simple `find()` → cost is low; Complex scoped binding → cost is higher
- **Route mix**: Some routes public, some protected → auth before binding optimizes public routes

### Decision Tree
```
Auth middleware vs SubstituteBindings order?
├── AUTH BEFORE SubstituteBindings (recommended — default behavior)
│   ├── Pros:
│   │   ├── Unauthenticated requests rejected before any model loading
│   │   ├── Saves DB queries for every rejected request
│   │   └── Significant perf gain on high-traffic apps with many unauthenticated requests
│   ├── Cons:
│   │   └── Auth middleware cannot access bound models (only raw IDs)
│   └── Default position — matches framework's own ordering
├── AUTH AFTER SubstituteBindings
│   ├── Pros:
│   │   └── Auth middleware can access bound models (e.g., check user via tenant)
│   ├── Cons:
│   │   ├── Loads models even for unauthenticated requests (wasted DB queries)
│   │   └── Higher TTFB for rejected requests
│   └── Only use when auth logic DEPENDS on bound models
└── Decision factors
    ├── Does auth need access to route model bindings?
    │   ├── YES (multi-tenant auth resolves tenant from route)
    │   │   └── Auth AFTER binding — necessary for functionality
    │   └── NO (auth checks session/token only)
    │       └── Auth BEFORE binding — performance optimization
    ├── Ratio of unauthenticated to authenticated requests
    │   ├── High (% of unauthenticated) → auth before binding (huge savings)
    │   └── Low (mostly authenticated) → either way, binding cost incurred anyway
    └── Binding cost (number and complexity of bound models)
        ├── Expensive (3+ models, complex scoped queries) → auth before binding
        └── Cheap (1 simple find) → less critical
```

### Rationale
The default framework ordering places auth before `SubstituteBindings` intentionally: unauthenticated requests are rejected before any model binding queries execute. This is a significant performance optimization for high-traffic applications. Only put auth after binding if your authentication logic genuinely depends on bound models (e.g., multi-tenant auth that resolves the tenant from the route).

### Default
Auth before `SubstituteBindings` — keeps the default framework optimization. Only change if auth logic needs bound models.

### Risks
- Auth after binding without need: wasted DB queries on every rejected request
- Auth before binding when auth needs models: cannot access bound models, need manual resolution
- Changing default priority without testing both auth and unauth paths

### Related Rules/Skills
- Keep Auth Middleware Before `SubstituteBindings` for Performance
- Skill: Resolve Middleware and Route Binding Ordering
- Skill: Configure Middleware Priority
