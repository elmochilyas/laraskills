# Decision Trees: Prevention Strategies

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Prevention Strategies |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Controller eager loading responsibility | Primary |
| 2 | $with vs explicit with() selection | Architecture |
| 3 | Constrained loading for nested relations | Architecture |

---

## Decision 1: Controller Eager Loading Responsibility

### Context
Controllers should eagerly load all relationships that views or API resources will consume. This creates a clear contract: the controller fetches everything needed; the downstream only renders. Without this, views trigger N+1.

### Criteria
- Does the view or API resource access relationships on the models?
- Are the relationships known at controller time?
- Is the controller the right place for data-fetching?
- Could the same model collection be used in multiple views with different relation needs?

### Decision Tree
```
Does the view/API resource access relationships on the models?
├── YES
│   └── Are the relationships known at controller time?
│       ├── YES → Eager load with with() in the controller
│       │   └── Is the same data used in multiple views?
│       │       ├── YES → Load all needed relations (some views may not use all)
│       │       └── NO → Load only this view's required relations
│       └── NO (dynamic relation access based on user state/features)
│           └── Use load() in the controller after determining which relations needed
└── NO (view/resource only uses model scalar attributes)
    └── No eager loading needed in controller
        └── Verify with preventLazyLoading() enabled
```

### Rationale
Loading relationships in the controller rather than the view makes data dependencies explicit. When a new relationship is added to the view, the controller must be updated — creating an auditable change. Views should never trigger lazy loads; they should only render pre-loaded data.

### Recommended Default
Always eager-load in controllers for list endpoints. Use `with()` for known relations, `load()` for conditional relations. Verify with query count middleware.

### Risks
- Over-eager loading: loading relations never used by the view (wasted queries)
- Under-eager loading: N+1 in views despite eager loading in controller (missing a relation)
- View added later without controller update: lazy loading in production
- Repository pattern obscuring the loading: controllers delegate to repositories that may not eager-load

### Related Rules/Skills
- Always Eager-Load in Controllers (05-rules.md)
- Prefer Explicit with() Over $with Model Property (05-rules.md)
- Use Different Select Sets for List vs. Detail Views (05-rules.md)

---

## Decision 2: $with vs Explicit with() Selection

### Context
`$with` on the model applies globally to every query. Explicit `with()` is scoped to a specific query path. `$with` is convenient but forces every query to load relations that may only be needed in some contexts.

### Criteria
- Is the relation needed in nearly all queries (> 80%)?
- Is the relation used in count/subquery contexts where loading is wasteful?
- Can the relation logically belong to a broader model concern?
- Is there a performance budget for the extra JOINs?

### Decision Tree
```
Is the relation needed in nearly every query (> 80% of accesses)?
├── YES
│   └── Is the relation lightweight (no extra JOIN, no subquery)?
│       ├── YES → $with may be appropriate
│       │   └── Is there any query path where this relation is NOT needed?
│       │       ├── YES → Use $with but add withoutEagerLoads() on exception paths
│       │       └── NO → $with is acceptable
│       └── NO (heavy relation with JOIN/subquery)
│           └── Use explicit with() — $with adds overhead to every query
└── NO (relation needed in specific query paths only)
    └── Use explicit with() in controllers/repositories
        └── Is $with currently used for this relation?
            ├── YES → Migrate from $with to explicit with()
            └── NO → Proceed with explicit with()
```

### Rationale
`$with` is a global default that applies to every query including relationship resolution, serialization, and count queries. A relation added to `$with` because it's "sometimes needed" forces every query to pay the join cost. Explicit `with()` scopes the loading to only the queries that need it.

### Recommended Default
Explicit `with()` in controllers. Reserve `$with` for universally-needed relations (e.g., `User` always needing `Profile`) and review individually. Use `withoutEagerLoads()` for query paths that don't need the defaults.

### Risks
- `$with` on heavy relation: every query pays the JOIN cost, even simple counts
- `$with` on relation only used sometimes: unnecessary queries on 80% of requests
- `withoutEagerLoads()` forgotten: query optimizations fail because of global `$with`
- Team convention drift: `$with` accumulates relations over time without review

### Related Rules/Skills
- Prefer Explicit with() Over $with Model Property (05-rules.md)
- Always Eager-Load in Controllers (05-rules.md)
- Use Constrained Loading for Nested Relations (05-rules.md)

---

## Decision 3: Constrained Loading for Nested Relations

### Context
Unconstrained eager loading of nested relations can load millions of child rows. `Post::with('comments.replies.likes')` without limits loads the entire comment tree for every post, often vastly exceeding what's displayed.

### Criteria
- Are nested relations deeply chained (depth > 2)?
- Do the child relations have unbounded cardinality?
- Does the view only display a subset of related records?
- Can a limit or constraint be applied to the eager load?

### Decision Tree
```
Are nested relations deeply chained (depth > 2)?
├── YES
│   └── Apply constraints at each level
│       └── Can children be bounded (show oldest 5, latest 10)?
│           ├── YES → with(['comments' => fn($q) => $q->limit(5)])
│           └── NO → Use lazy loading or paginate relations separately
└── NO (shallow relations, 1-2 levels)
    └── Does the child relation have unbounded cardinality (> 1000 per parent)?
        ├── YES → Constrain with limit, date range, or where clause
        └── NO → Unconstrained loading is acceptable
            └── Verify data volume with EXPLAIN
```

### Rationale
`Post::with('comments')` loads ALL comments for ALL posts. For 50 posts with an average of 100 comments each, that's 5000 child rows. For deeply nested relations like `with('comments.replies.likes')`, the product scales multiplicatively and can easily reach millions of rows. Constrained loading limits each level to a manageable subset.

### Recommended Default
Always constrain nested loading beyond depth 2. Use `limit()`, `latest()`, or `where()` in closure-based eager loading. For unbounded relations at depth 1, consider `withCount()` instead of full loading.

### Risks
- Missing constraint on high-cardinality relation: millions of rows loaded per page
- Constraint too aggressive: not enough data for the display
- Constraining the wrong level: deepest levels still unbounded
- Inconsistent constraint patterns: some code paths constrained, others not

### Related Rules/Skills
- Use Constrained Loading for Nested Relations (05-rules.md)
- Implement Select Constraints for Efficient Data Retrieval (06-skills.md)
- Optimize Eloquent Subquery Performance (06-skills.md)
