# Decision Trees: cursor

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | cursor |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | cursor() vs lazy() vs chunk() selection | Primary |
| 2 | cursor() usage context (CLI vs web) | Architecture |

---

## Decision 1: cursor() vs lazy() vs chunk() Selection

### Context
All three methods process large datasets without loading everything into memory, but they differ in memory profile, eager loading support, and mutation safety. `cursor()` uses a single query and yields one row at a time but cannot eager load. `lazy()` batches queries and supports eager loading. `chunk()`/`chunkById()` provides callback-based processing with mutation safety.

### Criteria
- Is the dataset read-only or mutable?
- Are eager-loaded relationships needed in the loop?
- Is absolute minimum memory usage required?
- Does the loop need to run in a web request or CLI?

### Decision Tree
```
Is the dataset read-only and relationship-free?
├── YES
│   └── Is absolute minimum memory usage critical?
│       ├── YES → Use cursor() (single query, one model at a time)
│       └── NO → Use lazy() (chunked queries, simpler API)
└── NO
    └── Are relationships accessed in the loop?
        ├── YES → Use lazy() with with() or chunkById()
        │   └── Is the dataset mutable during iteration?
        │       ├── YES → Use lazyById() with with()
        │       └── NO → Use lazy() with with()
        └── NO
            └── Is the dataset mutable during iteration?
                ├── YES → Use chunkById()
                └── NO → Use lazy() or chunk()
```

### Rationale
`cursor()` is the most memory-efficient (one model at a time) but cannot eager load and holds the connection open. It's ideal for read-only, relationship-free processing like CSV exports. `lazy()` balances memory and feature support — it chunks queries so memory scales with chunk size, supports eager loading, and provides a fluent collection API. `chunkById()` is best when mutation safety is required and a simple callback API is preferred.

### Recommended Default
`lazy()` with `with()` — it supports eager loading, provides a fluent API, and avoids cursor's connection-holding penalty. Reserve `cursor()` for truly massive (millions of rows) relationship-free exports.

### Risks
- `cursor()` with `with()`: eager loading is silently ignored — N+1 disaster
- `cursor()` in web request: connection pool starvation, timeout
- `lazy()` materialized via `->toArray()`: memory exhaustion
- `cursor()` without READ UNCOMMITTED: deadlocks with concurrent writes

### Related Rules/Skills
- Never Access Relationships Inside a Cursor Loop (05-rules.md)
- Only Use Cursor in CLI or Queue Contexts (05-rules.md)
- Do Not Materialize the LazyCollection (05-rules.md)
- Use lazyById for Concurrent Scenarios by Default (05-rules.md)

---

## Decision 2: Cursor Usage Context (CLI vs Web)

### Context
`cursor()` holds a database connection for the entire iteration. In a web request, this blocks the connection from the pool for the full HTTP response time. In CLI/queue contexts, this is acceptable and expected.

### Criteria
- Is the code path a web controller, middleware, or CLI command?
- What is the expected iteration duration?
- Is the connection pool sized for concurrent cursor operations?
- Can the operation tolerate connection timeout/disconnect?

### Decision Tree
```
Is the code in a web controller or middleware?
├── YES → Do NOT use cursor()
│   └── What is the use case?
│       ├── Small dataset (< 1000 rows) → Use get()
│       ├── Paginated display → Use paginate()
│       └── Large export → Use chunked streaming response
└── NO (CLI command, queue job, background process)
    └── Proceed with cursor()
        └── Is the iteration expected to be long-running (> 5 min)?
            ├── YES → Configure connection timeout/keepalive
            │   └── Set READ UNCOMMITTED to prevent deadlocks
            └── NO → Use cursor() directly
```

### Rationale
Web requests have strict timeouts (typically 30-60s). A cursor-held connection during a slow export blocks that connection for the entire duration, potentially starving the pool. CLI commands and queue jobs run in dedicated processes with no request timeout, making cursor suitable. Connection timeouts are less likely with short cursor iterations but become a risk for long-running jobs.

### Recommended Default
Restrict `cursor()` to artisan commands and queue jobs. Use `lazy()`, `chunk()`, or `paginate()` for web requests.

### Risks
- Connection timeout mid-iteration: partial processing, incomplete work
- READ COMMITTED isolation with concurrent writes: deadlocks on long cursor iterations
- Multiple concurrent cursor processes: connection pool exhaustion (even in CLI)
- Not setting READ UNCOMMITTED: blocking concurrent writes to the same table

### Related Rules/Skills
- Only Use Cursor in CLI or Queue Contexts (05-rules.md)
- Do Not Materialize the LazyCollection (05-rules.md)
- Prevent N+1 with Proactive Eager Loading Strategies (06-skills.md)
