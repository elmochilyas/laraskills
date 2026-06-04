# Decision Trees — N+1 Query Detection

## Decision Tree 1: `preventLazyLoading()` vs `expectsDatabaseQueryCount()`

```
Which N+1 prevention method should be used?
│
├── During development (immediate feedback)
│   └── Use `Model::preventLazyLoading(!$this->app->isProduction())`
│       Catches N+1 at the moment it occurs — throws exception
│       Best for: real-time feedback while coding
│       Effect: lazy loading triggers LazyLoadingViolationException
│
├── In CI/feature tests (enforce budgets)
│   └── Use `$this->expectsDatabaseQueryCount($count)`
│       Catches query inflation from all sources, not just lazy loading
│       Best for: preventing regressions across PRs
│       Effect: test fails if query count deviates from budget
│
└── Use BOTH for maximum protection
    `preventLazyLoading()` during dev → immediate fix
    `expectsDatabaseQueryCount()` in CI → regression gate
    Together they cover different failure modes
```

## Decision Tree 2: Test Data Volume for N+1 Detection

```
How much test data is needed to surface N+1?
│
├── Is this a list/index endpoint (multiple records)?
│   └── Create 10+ parent records, each with 3-5 children
│       With 10 parents: eager = 2 queries, lazy = 11 queries
│       Difference is clearly measurable
│       `Post::factory()->count(10)->has(Comment::factory()->count(3))->create()`
│
├── Is this a show/detail endpoint (single record)?
│   └── Create 1 parent with 3-5 children
│       N+1 difference: 2 queries vs 4 queries
│       Still measurable, but smaller gap
│
└── Is this a nested resource (parent + children)?
    └── Create at least 5 parents, 3 children each, and test the endpoint
        Verify count stays constant regardless of data volume
```

## Decision Tree 3: Eager Loading Strategy for Serialization

```
Will the response serialize relationships?
│
├── YES — API Resource, `toArray()`, `toJson()` used
│   └── Must eager-load before serialization
│       `User::with('posts')->get()` not `User::all()`
│       Test: assert query count stays flat with increasing data
│       Common mistake: forgetting to load relationships used in resources
│
├── NO — response only returns model attributes
│   └── Eager loading not strictly required
│       Still test query count to verify no unnecessary queries
│
└── Not sure? Enable `preventLazyLoading()`
    If serialization triggers lazy loading → exception
    Fix by adding `with()` before serialization
```
