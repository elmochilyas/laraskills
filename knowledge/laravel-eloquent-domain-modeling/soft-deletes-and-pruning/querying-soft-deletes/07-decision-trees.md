# Decision Trees: Querying Soft Deletes

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Soft Deletes & Pruning |
| Knowledge Unit | Querying Soft Deletes |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Trashed scope selection | Primary |
| 2 | Trashed visibility in API endpoints | Architecture |
| 3 | Relationship trashed querying | Architecture |
| 4 | Route model binding for trashed records | Architecture |

---

## Decision 1: Trashed Scope Selection

### Context
`withTrashed()`, `onlyTrashed()`, and `withoutTrashed()` control whether soft-deleted records appear in query results. Choosing the wrong scope produces incorrect results or performance issues.

### Criteria
- Should the query include deleted records alongside active ones?
- Should the query return ONLY deleted records?
- Is the query for a public endpoint or admin panel?
- Is the query for a count/exists check?

### Decision Tree
```
Should the query include both active and soft-deleted records?
├── YES → withTrashed()
│   └── Admin panel, audit view, report that needs full picture
└── NO
    └── Should the query return ONLY soft-deleted records?
        ├── YES → onlyTrashed() — trash/recycle bin, batch restore, force delete
        └── NO → withoutTrashed() — default, active records only
```
```
Is this a count/exists query?
├── YES → Scopes apply to counts too
│   └── User::count() excludes trashed; User::withTrashed()->count() includes
└── NO → Standard scope behavior
```
```
Is this query chained after a previous scope call?
├── YES → Be aware of scope persistence
│   └── withTrashed() then onlyTrashed(): onlyTrashed's IS NOT NULL persists
│   └── onlyTrashed() then withTrashed(): withTrashed removes scope but IS NOT NULL from onlyTrashed remains
└── NO → Standard single-scope usage
```

### Rationale
Each scope serves a distinct purpose. `withTrashed()` is for admin/audit contexts where completeness matters. `onlyTrashed()` is for trash management operations. The default `withoutTrashed()` should be used in public API contexts. Scope chaining behavior — especially the persistence of `onlyTrashed()`'s `IS NOT NULL` — must be understood to avoid logic errors.

### Recommended Default
Use the default scope (`withoutTrashed()`) for all public-facing endpoints. Use `withTrashed()` for admin panels and audit views. Use `onlyTrashed()` exclusively for trash management operations (restore, force delete, recycle bin).

### Risks
- withTrashed() in public API: exposes deleted records to unauthorized users
- onlyTrashed() without checking auth: reveals existence of deleted records
- Chained scopes incorrectly: produces wrong WHERE clauses
- Count without considering trashed state: inaccurate metrics

### Related Rules/Skills
- withoutTrashed for Public (05-rules.md)
- withTrashed for Admin (05-rules.md)
- onlyTrashed for Trash Ops (05-rules.md)

---

## Decision 2: Trashed Visibility in API Endpoints

### Context
API endpoints need a consistent strategy for exposing trashed records. A query parameter pattern (`?trashed=with|only|without`) allows clients to control visibility while maintaining security.

### Criteria
- Does the API serve both public and admin consumers?
- Should clients control whether trashed records appear?
- Is the endpoint listing records or showing a single record?
- Does the API documentation specify trashed behavior?

### Decision Tree
```
Is this a public API endpoint?
├── YES → Default to withoutTrashed() — no trashed records
│   └── Should clients be able to opt into trashed visibility?
│       ├── YES → Support ?trashed=with|only|without query parameter
│       │   └── Require authentication for trashed=with/only
│       └── NO → Default only — no trashed visibility exposed
└── NO (admin/internal endpoint)
    └── Default to withTrashed() — admin sees all records
        └── Support ?trashed filter for flexibility
```
```
Is this a single-record show endpoint?
├── YES
│   └── Public → withoutTrashed() — 404 for trashed records
│       └── Route model binding without withTrashed: 404 for trashed
│   └── Admin → withTrashed() — find trashed records by ID
└── NO → Listing endpoint with trashed parameter support
```
```
Is the endpoint paginated?
├── YES → Ensure consistent scope across paginated pages
│   └── Different scope per page request: inconsistent page counts
└── NO → No pagination consistency concern
```

### Rationale
A consistent trashed query parameter pattern (`?trashed=`) provides flexibility without breaking defaults. Public endpoints default to active-only; authenticated users can opt into broader visibility. Admin endpoints default to full visibility with parameter overrides. This pattern is documented, testable, and predictable.

### Recommended Default
Implement a `?trashed=with|only|without` query parameter on all listing endpoints. Default to `without` for public endpoints, `with` for admin endpoints. Gate `with` and `only` behind authentication.

### Risks
- No trashed parameter in admin endpoints: admin sees only active records (confusing)
- No auth gate on trashed parameter: unauthorized users see deleted records
- Inconsistent default per endpoint: confusion for API consumers
- Pagination with changing scope: inconsistent results across pages

### Related Rules/Skills
- Trashed Query Parameter Convention (05-rules.md)
- Auth Gate for Trashed (05-rules.md)
- Admin Default withTrashed (05-rules.md)

---

## Decision 3: Relationship Trashed Querying

### Context
Query scopes on a parent model do NOT cascade to eager-loaded relationships. `User::with('posts')->withTrashed()` shows soft-deleted users but still excludes soft-deleted posts. Relationship trashed visibility must be explicitly requested.

### Criteria
- Does the eager-loaded relationship use SoftDeletes?
- Should the relationship include trashed records?
- Is the relationship loaded via with() or query builder?

### Decision Tree
```
Does the relationship model use SoftDeletes?
├── YES
│   └── Should the eager-loaded relationship include trashed records?
│       ├── YES → Explicit withTrashed() on the relationship
│       │   └── User::with('posts')->withTrashed() — WRONG, affects parent
│       │   └── User::with(['posts' => fn ($q) => $q->withTrashed()]) — CORRECT
│       └── NO → Default scope (active only) is correct
└── NO → No trashed concern for this relationship
```
```
Is the relationship queried directly (not eager loaded)?
├── YES → Standard scope applies
│   └── $user->posts()->withTrashed()->get() — correct
│   └── $user->posts()->onlyTrashed()->get() — correct
└── NO → Eager load constraint pattern above
```
```
Is a count withCondition needed for trashed children?
├── YES → withCount(['posts' => fn ($q) => $q->onlyTrashed()])
└── NO → No count concern
```

### Rationale
Parent `withTrashed()` does NOT affect relationships. Each relationship must independently specify its trashed scope. The closure-based constraint pattern (`['posts' => fn ($q) => $q->withTrashed()]`) is the explicit way to control relationship trashed visibility.

### Recommended Default
Always specify relationship trashed scope explicitly using closure constraints. Never assume parent scope cascades to relationships. Use `withCount` with scope constraints for metrics involving trashed children.

### Risks
- Assuming parent withTrashed cascades: relationship records missing
- Missing withTrashed on admin relationship queries: incomplete data
- Wrong withTrashed placement: parent scope changed instead of relationship
- withCount without considering trashed: incorrect aggregate counts

### Related Rules/Skills
- Relationship Scope Explicit (05-rules.md)
- Closure Constraint Pattern (05-rules.md)

---

## Decision 4: Route Model Binding for Trashed Records

### Context
Default route model binding excludes soft-deleted records (returns 404). Admin routes need `->withTrashed()` on the binding to look up deleted records by ID.

### Criteria
- Is the route for admin or public access?
- Should users be able to reference soft-deleted records by ID?
- Is the binding in a show, update, or restore endpoint?

### Decision Tree
```
Is the route for admin/internal use?
├── YES → Use ->withTrashed() on route binding
│   └── Allows admin to reference trashed records by ID
│   └── Route::get('/admin/users/{user}', ...)->withTrashed()
└── NO (public route)
    └── Default binding (404 for trashed) is correct
        └── Exception: public restore endpoint
            └── Explicit withTrashed() in controller instead
```
```
Is the route for a restore/force-delete action?
├── YES → MUST use withTrashed() — record is trashed and needs to be found
│   └── Route::post('/admin/users/{user}/restore', ...)->withTrashed()
└── NO → Standard binding or withTrashed() per route type
```
```
Is explicit binding with Model::resolveRouteBinding() used?
├── YES → Override to include trashed records conditionally
└── NO → Declarative ->withTrashed() on route is cleaner
```

### Rationale
Default route model binding applies the global scope, so trashed records return 404. `->withTrashed()` on the route definition removes the scope for that binding, allowing admin routes to look up deleted records. This is the cleanest pattern — declarative on the route, not in the controller.

### Recommended Default
Use `->withTrashed()` on all admin routes that need to reference soft-deleted records. Keep default binding (404 for trashed) for all public routes. Never use `Route::withTrashed()` globally — it would expose trashed records in all routes.

### Risks
- Missing withTrashed on admin restore route: 404 when trying to restore
- Global withTrashed on all routes: trashed records exposed in public endpoints
- withTrashed on wrong route parameter: binding for wrong model affected
- Controller-level workaround: Route::bind() overrides add complexity

### Related Rules/Skills
- withTrashed on Admin Routes (05-rules.md)
- Default Binding for Public (05-rules.md)
