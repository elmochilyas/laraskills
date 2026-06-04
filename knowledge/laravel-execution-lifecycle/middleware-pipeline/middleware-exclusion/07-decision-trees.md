# Middleware Exclusion — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **KU:** Middleware Exclusion
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Exclude middleware vs redesign middleware assignment | Route needs to skip a specific middleware | Security; correctness; architecture |
| 2 | `withoutMiddleware()` vs `ShouldSkipMiddleware` | Conditionally skipping middleware per-route vs per-condition | Flexibility; testability; maintainability |
| 3 | FQCN vs alias string in `withoutMiddleware()` | Writing the exclusion argument | Correctness — silent exclusion failure |

---

## Decision 1: Exclude vs Redesign Middleware Assignment

### Decision Context
A route should not run a specific middleware. Decide whether to use `withoutMiddleware()` or restructure how the middleware is assigned.

### Decision Criteria
- **How many routes need exclusion?** 1-2 → exclude; Many → redesign assignment
- **Why does it need exclusion?** Special case (webhook not providing CSRF) → exclude acceptable; Design flaw → redesign
- **Can middleware be moved to group instead?** Yes → redesign; No (must be global) → exclude
- **Route type**: Health checks, webhooks, public callbacks → exclude acceptable; Regular routes → redesign

### Decision Tree
```
Route needs to skip a middleware?
├── Only 1-2 routes need exclusion
│   ├── Legitimate technical reason (webhook can't provide CSRF)
│   │   └── USE withoutMiddleware() — document rationale
│   ├── Health check / monitoring endpoint
│   │   └── USE withoutMiddleware() — acceptable pattern
│   └── Convenience during development
│       └── DO NOT exclude for dev convenience — use env condition
├── Many routes (3+) need exclusion
│   ├── Middleware is too broad (added globally but shouldn't be)
│   │   └── REDESIGN: remove from global, add to specific groups/routes
│   ├── Middleware doesn't belong on this route type
│   │   └── REDESIGN: use middleware groups instead of global + exclude
│   └── Feature only applies to certain routes
│       └── REDESIGN: use route-level middleware, not global
├── Middleware is security-critical (auth, CSRF, rate limit)
│   ├── Legitimate bypass (webhook without CSRF)
│   │   └── USE withoutMiddleware() — but DOCUMENT THOROUGHLY
│   └── No legitimate reason
│       └── DO NOT exclude — find a different approach
└── Middleware is infrastructure (maintenance, proxies, CORS)
    └── SHOULD NOT be excluded — these must run on every request
```

### Rationale
`withoutMiddleware()` is for legitimate exceptions to a middleware that is otherwise correctly assigned. If many routes need to exclude a middleware, it's a sign that the middleware is assigned too broadly. The "global + exclude" pattern is an antipattern — prefer groups for shared middleware and route-level for specific middleware.

### Default
Use exclusion for 1-2 legitimate exceptions (webhooks, health checks). Redesign middleware assignment if 3+ routes need exclusion.

### Risks
- Excluding auth middleware: security bypass
- Not documenting exclusion rationale: future developers don't know why it's excluded
- Using exclusion as crutch for poor middleware assignment: accumulates over time

### Related Rules/Skills
- Prefer Route-Specific Middleware Assignment Over Global-Plus-Exclude
- Document Every Middleware Exclusion with a Rationale Comment
- Skill: Audit Middleware Exclusion in Routes

---

## Decision 2: `withoutMiddleware()` vs `ShouldSkipMiddleware`

### Decision Context
Middleware needs to be conditionally skipped. Choose between per-route exclusion or conditional skipping via `ShouldSkipMiddleware`.

### Decision Criteria
- **Condition depends on route** → `withoutMiddleware()`
- **Condition depends on environment/state** → `ShouldSkipMiddleware`
- **Condition is permanent (this route never needs it)** → `withoutMiddleware()`
- **Condition is temporary/conditional (only in testing)** → `ShouldSkipMiddleware`

### Decision Tree
```
Conditional middleware skipping?
├── Condition depends on the ROUTE
│   ├── Specific URI should never run this middleware
│   │   └── USE withoutMiddleware() — per-route exclusion
│   └── Webhook endpoints, health checks
│       └── USE withoutMiddleware()
├── Condition depends on ENVIRONMENT or STATE
│   ├── Should skip in testing environment
│   │   └── USE ShouldSkipMiddleware — shouldSkip($request) checks env
│   ├── Should skip during maintenance
│   │   └── USE ShouldSkipMiddleware — shouldSkip($request) checks app state
│   └── Should skip for specific user types
│       └── USe within the handle() method itself (simpler)
├── Condition is TEMPORARY
│   ├── During development/demo
│   │   └── USE ShouldSkipMiddleware or env condition
│   └── Feature flag
│       └── USE ShouldSkipMiddleware — clean, self-contained
└── Combination: route + environment
    ├── Different routes have different skip conditions
    │   └── USE withoutMiddleware() on route, ShouldSkip inside middleware (both)
    └── Complex logic
        └── Handle inside middleware with custom logic
```

### Rationale
`withoutMiddleware()` is a static, route-level declaration — "this route never needs this middleware." `ShouldSkipMiddleware` is dynamic — it checks runtime conditions before each request. Use the former for permanent, route-specific exclusions. Use the latter for environment or state-dependent skipping.

### Default
Use `withoutMiddleware()` for route-specific permanent exclusions. Use `ShouldSkipMiddleware` for environment- or state-based conditional skipping.

### Risks
- ShouldSkipMiddleware for permanent route exclusions: adds unnecessary method call per request
- withoutMiddleware for temporary conditions: easy to forget and leave in production
- Both have exclusion failure modes: string mismatch (withoutMiddleware) and exceptions (shouldSkip)

### Related Rules/Skills
- Always Use FQCN in `withoutMiddleware()`, Never Aliases
- Skill: Audit Middleware Exclusion in Routes

---

## Decision 3: FQCN vs Alias String in `withoutMiddleware()`

### Decision Context
Writing the argument to `withoutMiddleware()`. Choose between the fully qualified class name or the alias string.

### Decision Criteria
- **Reliability**: FQCN is always correct → Use FQCN
- **Alias resolution**: Alias must be resolved to class name, but matching is strict → risk of mismatch
- **Framework behavior**: Exclusion compares resolved class names, not alias strings

### Decision Tree
```
Argument to withoutMiddleware()?
├── Always use FULLY QUALIFIED CLASS NAME (FQCN)
│   └── \App\Http\Middleware\VerifyCsrfToken::class
├── NEVER use alias string
│   └── 'csrf' — may not match resolved class name
├── Why FQCN works?
│   ├── Exclusion compares resolved class names (after alias resolution)
│   ├── FQCN is the resolved class name — guaranteed match
│   └── Alias is a key — may resolve to a different string
├── When alias string might fail?
│   ├── Alias maps to a different FQCN than the string you pass
│   ├── Route caching changes alias resolution behavior
│   └── Package re-registers alias with different class
└── Exception (risky)
    └── If you've verified via route:list -v that alias matches resolved name
    └── Still prefer FQCN — no benefit to using alias here
```

### Rationale
`withoutMiddleware()` works by comparing the class name you provide against the resolved middleware class names in the pipeline. The comparison is a string match — if the string doesn't match exactly, the exclusion silently fails. FQCN guarantees a match. Alias strings may or may not match depending on how the alias was registered.

### Default
Always use FQCN in `withoutMiddleware()`. Never use alias strings.

### Risks
- Alias string mismatch: middleware silently continues to run
- Typo in FQCN: no match → exclusion silently fails (same as mismatch)
- Using deprecated or wrong class name: exclusion fails, middleware runs

### Related Rules/Skills
- Always Use FQCN in `withoutMiddleware()`, Never Aliases
- Verify Exclusions with `route:list -v` Before Deployment
- Skill: Audit Middleware Exclusion in Routes
