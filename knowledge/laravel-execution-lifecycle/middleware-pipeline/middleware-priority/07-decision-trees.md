# Middleware Priority — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Middleware Priority
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Priority vs group array ordering | Ensuring correct middleware execution order | Correctness; global vs local impact |
| 2 | Position custom middleware relative to SubstituteBindings | Middleware that accesses route model bindings | Functionality; null reference prevention |
| 3 | Extend vs reorder default priority entries | Adding custom middleware to the priority list | Stability; framework upgrade safety |

---

## Decision 1: Priority vs Group Array Ordering

### Decision Context
Custom middleware needs to run in a specific order relative to other middleware. Decide whether to use the priority system or simply order entries correctly in the group array.

### Decision Criteria
- **Source of middleware**: All middleware in same array → group ordering; different sources (global, group, route) → priority
- **Scope of ordering**: Affects all routes → priority; localized to one group → group array
- **Number of middleware to order**: Few (1-2) → group array; many → priority may be needed
- **Dependency chain**: Middleware depends on framework middleware (session, auth) → priority likely needed

### Decision Tree
```
Resolving middleware ordering?
├── All middleware comes from the SAME array
│   ├── Same group array (e.g., all in 'web' group)
│   │   └── ORDER THE ARRAY DIRECTLY — simple, localized, explicit
│   └── Same global stack array
│       └── ORDER THE ARRAY DIRECTLY — no priority needed
├── Middleware comes from DIFFERENT sources
│   ├── Custom middleware must run before/after framework middleware
│   │   ├── Framework middleware is in global stack
│   │   │   └── Use PRIORITY — cross-source ordering
│   │   ├── Framework middleware is in route-level assignment
│   │   │   └── Use PRIORITY — cross-source ordering
│   │   └── Framework middleware is in the same group
│   │       └── ORDER THE ARRAY — priority not needed
│   └── Custom middleware from two different groups must interleave
│       └── Use PRIORITY — only way to reorder across groups
├── Does the ordering apply to every route?
│   ├── Yes (e.g., auth must ALWAYS run before your middleware)
│   │   └── Priority is appropriate
│   └── No (ordering only matters for some routes)
│       └── Reconsider — priority is global; use different group arrays instead
└── Number of middleware to order
    ├── 1-2 entries → group array ordering is sufficient
    ├── 3-5 entries → priority may be simpler
    └── 6+ entries → priority list is probably wrong — fix the group organization
```

### Rationale
Priority is a global override that affects every route. It exists for the specific case where middleware from different sources must maintain a relative order. For middleware within the same array, ordering the array directly is simpler, localized, and doesn't have global side effects.

### Default
Order arrays directly within the same source. Use priority only when middleware crosses source boundaries (global vs group vs route).

### Risks
- Using priority when array ordering suffices: unnecessary global constraint affecting other routes
- Not using priority when needed: middleware from different sources runs in wrong order
- Priority list that grows too long: becomes hard to maintain; indicates organizational problem

### Related Rules/Skills
- Use Priority Sparingly — Prefer Group Array Ordering First
- Understand That Priority Affects All Routes Globally
- Skill: Configure Middleware Priority

---

## Decision 2: Position Relative to SubstituteBindings

### Decision Context
Custom middleware accesses route model bindings (e.g., `$request->route('user')`). Decide where to position it in the priority list relative to `SubstituteBindings`.

### Decision Criteria
- **Accesses route models?** Yes → must run after SubstituteBindings
- **Works with raw parameters?** (validating ID format, checking parameter existence) → before SubstituteBindings
- **Both model access and raw parameter access?** → after SubstituteBindings (models are richer)
- **Dependency on auth?** Runs after Authenticate → already after SubstituteBindings by default chain

### Decision Tree
```
Middleware accesses route parameters?
├── Accesses resolved model instances
│   ├── Uses $request->route('user')->name, $request->user()
│   │   └── MUST run AFTER SubstituteBindings — models are resolved here
│   └── Checks model properties or relationships
│       └── MUST run AFTER SubstituteBindings
├── Works with raw route parameters only
│   ├── Validates ID format: is_numeric($request->route('id'))
│   │   └── MUST run BEFORE SubstituteBindings — raw parameter before model resolution
│   ├── Checks parameter existence only
│   │   └── Can run before or after (both work)
│   └── Transforms raw parameters before binding
│       └── MUST run BEFORE SubstituteBindings — modification before resolution
└── Accesses both raw params and resolved models
    ├── Primary purpose is model access
    │   └── Run AFTER SubstituteBindings — models are the richer data
    ├── Primary purpose is raw param validation
    │   └── Run BEFORE — validate early, let downstream resolve
    └── Needs both equally
        └── Run AFTER — models include raw IDs via ->id or ->getKey()
├── Position in priority list (if AFTER SubstituteBindings)
│   └── Add AFTER \Illuminate\Routing\Middleware\SubstituteBindings::class
└── Position in priority list (if BEFORE SubstituteBindings)
    └── Add BEFORE \Illuminate\Routing\Middleware\SubstituteBindings::class
```

### Rationale
Middleware before `SubstituteBindings` receives raw route parameter strings (IDs like `"42"`). Middleware after receives resolved Eloquent models. If your middleware accesses model properties and runs before bindings, it will receive null or strings and fail. The position must match the data format the middleware expects.

### Default
Most custom middleware that accesses route parameters should run AFTER `SubstituteBindings` to work with model instances.

### Risks
- Middleware after SubstituteBindings that expects raw IDs: gets model objects instead
- Middleware before SubstituteBindings that expects models: null reference errors, 500 responses
- Not using priority at all when needed: middleware position relative to SubstituteBindings is undefined

### Related Rules/Skills
- Always Place Middleware That Depends on Route Bindings After `SubstituteBindings`
- Skill: Configure Middleware Priority

---

## Decision 3: Extend vs Reorder Default Priority Entries

### Decision Context
Adding custom middleware to the priority list. Decide whether to extend (add without modifying defaults) or reorder (change default entry positions).

### Decision Criteria
- **Nature of change**: Adding custom middleware → extend; fixing framework issue → risky reorder
- **Framework version**: Upgraded Laravel → preserve defaults; old version → check if defaults are correct
- **Custom middleware dependency**: After a specific framework middleware → insert after it (extend)
- **Framework bug**: Rarely need to reorder defaults — almost never justified

### Decision Tree
```
Adding to the priority list?
├── Adding NEW custom middleware only
│   ├── Identify which framework middleware it depends on
│   │   ├── Depends on session → place AFTER StartSession
│   │   ├── Depends on auth → place AFTER Authenticate
│   │   ├── Depends on bindings → place AFTER SubstituteBindings
│   │   └── No framework dependency → place at end of priority list
│   └── Implementation
│       └── $middleware->priority([
│           \Illuminate\Session\Middleware\StartSession::class,
│           \App\Http\Middleware\YourMiddleware::class, // Just add yours
│           \Illuminate\Routing\Middleware\SubstituteBindings::class,
│       ]);
│       └── Note: Only list the entries relevant to your ordering; defaults are inherited
├── MODIFYING existing default entries
│   ├── Removing a default from priority
│   │   └── NEVER — breaks framework ordering assumptions
│   ├── Reordering defaults
│   │   └── NEVER — see "Consequences" below
│   └── Overwriting the entire priority array
│       └── NEVER — unless you have re-implemented the entire framework middleware ordering
└── Framework upgrade scenario
    ├── New Laravel version added middleware to default priority
    ├── Your custom priority list doesn't include it
    │   └── Harmless — new middleware operates at default order
    ├── Your custom priority list is still from old version
    │   ├── Still works — defaults are inherited
    │   └── Verify during upgrade that dependencies are still satisfied
    └── Best practice: audit priority list during upgrades
```

### Rationale
The default priority list encodes the framework's carefully designed dependency chain: cookies → session → errors → auth → authorization → bindings. Reordering or removing entries from this chain can break any middleware that depends on that ordering. Extending by adding custom middleware at specific positions preserves the framework's guarantees.

### Default
Only add your custom middleware entries. Do not repeat, reorder, or remove default entries from the priority list.

### Risks
- EncryptCookies after StartSession: session must read encrypted cookie → fails
- Authenticate before StartSession: auth checks without an active session → always unauthenticated
- SubstituteBindings before Authenticate: bindings resolved before user known → wasteful (and breaks policies that rely on the authenticated user)
- Stale priority entry after removing middleware: harmless but misleading — clean up during maintenance

### Related Rules/Skills
- Never Remove or Reorder Default Priority Entries — Only Extend
- Add Middleware to the Priority List at the Same Time as Registration
- Audit the Priority List During Framework Upgrades
- Skill: Configure Middleware Priority
