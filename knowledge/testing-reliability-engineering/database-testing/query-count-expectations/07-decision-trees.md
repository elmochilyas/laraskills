# Decision Trees — Database Query Count Expectations

## Decision Tree 1: Exact Count vs Range

```
Should the query count expectation be exact or a range?
│
├── Is the endpoint's query pattern deterministic?
│   └── YES → Use exact `expectsDatabaseQueryCount($count)`
│       Most endpoints are deterministic
│       Example: show endpoint always = 3 queries (auth + model + count)
│
├── Does the endpoint have conditional queries?
│   └── Use range or document variability
│       `expectsDatabaseQueryCount(5); // baseline, may vary by ±1`
│       Example: conditional eager loading, feature flags
│
└── Is it a cached endpoint (warm cache)?
    └── Use exact `expectsDatabaseQueryCount(0)`
        Zero queries = cache is working
        Pre-populate cache before assertion
```

## Decision Tree 2: Budget Calculation

```
What contributes to the expected query count?
│
├── Middleware baseline (every authenticated request)
│   ├── Auth query (load user from session/guard)
│   ├── Session query (CSRF token, session data)
│   └── Total: ~2-3 queries baseline
│       Establish by running empty authenticated request
│
├── Endpoint-specific queries
│   ├── Resource queries (SELECT, JOIN)
│   ├── Relationship eager loads (with())
│   ├── Count queries (paginate total)
│   └── Write operations (INSERT, UPDATE, DELETE)
│
└── Documentation format
    `// 2 auth + 1 post list + 1 eager author + 1 pagination count = 5`
    Each query identified by source
    Makes failures easy to debug
```

## Decision Tree 3: Cold Cache vs Warm Cache Testing

```
Which cache path needs testing?
│
├── Cold cache (first request, no cached data)
│   └── Test: assert exact query count includes all queries
│       `expectsDatabaseQueryCount(5)` — no cache hit
│       Verifies the endpoint works correctly from DB
│
├── Warm cache (subsequent request, cached response)
│   └── Test: assert `expectsDatabaseQueryCount(0)`
│       Pre-populate: make first request to fill cache
│       Verify: second request hits zero queries
│       Proves cache is actually serving responses
│
└── Both tests are needed
    Cold: data correctness + baseline performance
    Warm: cache effectiveness verification
```
