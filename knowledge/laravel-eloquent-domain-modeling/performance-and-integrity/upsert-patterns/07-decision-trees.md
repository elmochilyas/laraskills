# Decision Trees: Upsert Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Upsert Patterns |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | upsert() vs updateOrCreate() loop selection | Primary |
| 2 | Chunk size for large upsert operations | Architecture |
| 3 | Model event handling for upsert bypass | Architecture |

---

## Decision 1: upsert() vs updateOrCreate() Loop Selection

### Context
`upsert()` executes a single query for bulk insert-or-update operations, while `updateOrCreate()` executes one query per record. The choice depends on dataset size, need for model events, and requirement for returned model instances.

### Criteria
- How many records are being upserted?
- Are model lifecycle events (creating, created, updating, updated) critical?
- Are resulting model instances needed after the operation?
- Does a unique constraint exist on the match columns?

### Decision Tree
```
Are model lifecycle events critical for this operation?
├── YES (cache invalidation, logging, webhooks per record)
│   └── How many records?
│       ├── < 10 → Use updateOrCreate() loop (events fire, models returned)
│       └── 10+ → Consider upsert() + post-upsert event handling
│           └── Can events be handled in bulk after upsert?
│               ├── YES → upsert() then query changed records for event dispatch
│               └── NO → Individual updateOrCreate() (slower but event-complete)
└── NO (bulk sync, ETL, data import)
    └── How many records?
        ├── < 5 → updateOrCreate() loop is acceptable (complexity not justified)
        └── 5+ → Use upsert()
            └── Does a unique constraint exist on $uniqueBy columns?
                ├── YES → Proceed with upsert()
                └── NO → Add unique constraint migration first
```

### Rationale
`upsert()` bypasses ALL model lifecycle events — `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `retrieved`, and trait events (like `SoftDeletes`). For bulk sync where events are not needed, `upsert()` is 20-100x faster. For operations requiring per-record events, either use `updateOrCreate()` or process events separately after the upsert.

### Recommended Default
`upsert()` for bulk sync (10+ records, events not critical). Chunk to 500-1000 records. Handle events via post-upsert change tracking when needed.

### Risks
- Missing unique constraint: upsert silently inserts duplicates
- Assuming model events fire: logging, cache, webhooks never execute
- Needing model instances: `upsert()` returns affected row count, not models
- Including auto-increment PK in `$update`: unexpected behavior

### Related Rules/Skills
- Always Create a Unique Constraint Before Using upsert (05-rules.md)
- Chunk Large Datasets to 500-1000 Records per Call (05-rules.md)
- Always Include updated_at in $update (05-rules.md)

---

## Decision 2: Chunk Size for Large Upsert Operations

### Context
A single `upsert()` with 100k records generates an enormous SQL statement that may exceed database packet limits or cause timeouts. Chunking keeps each statement manageable and limits the blast radius of failures.

### Criteria
- How many records are being upserted?
- How wide are the rows (how many columns)?
- What is the database's `max_allowed_packet` (MySQL)?
- Is there a timeout for the operation?

### Decision Tree
```
How many records are being upserted?
├── < 1000 → Single unsert() call, no chunking needed
├── 1000-10000 → Chunk to 500-1000
│   └── Are rows wide (> 20 columns)?
│       ├── YES → Chunk to 500 (smaller SQL statements)
│       └── NO → Chunk to 1000 (faster overall)
└── 10000+ → Chunk to 500
    └── Is there a transaction wrapping all chunks?
        ├── YES → Each chunk is individually committed
        │   └── Does partial success need to be rolled back?
        │       ├── YES → Wrap all chunks in a single transaction
        │       └── NO → Each chunk is its own transaction
        └── NO → Proceed with individual chunk transactions
```

### Rationale
A 500-record upsert with 10 columns generates a SQL statement of ~10-20 KB. A 50k-record upsert generates ~1-2 MB. MySQL's default `max_allowed_packet` is 64 MB, but other factors (query timeout, binlog size, replication lag) make large statements risky. Chunking also provides partial completion — if one chunk fails, previous chunks' work is preserved.

### Recommended Default
Chunk to 500-1000 records per call. Use `collect($data)->chunk(500)->each(fn($chunk) => Model::upsert(...))`. Tune based on row width and database limits.

### Risks
- Not chunking: SQL statement exceeds `max_allowed_packet` — query fails
- Too small (50 per chunk): 200 queries for 10k records — slower than necessary
- Transaction wrapping all chunks: all-or-nothing, no partial progress on failure
- Inconsistent chunk boundaries across concurrent jobs: race conditions

### Related Rules/Skills
- Chunk Large Datasets to 500-1000 Records per Call (05-rules.md)
- Always Create a Unique Constraint Before Using upsert (05-rules.md)
- Always Include updated_at in $update (05-rules.md)

---

## Decision 3: Model Event Handling for Upsert Bypass

### Context
`upsert()` bypasses all model lifecycle events. If the application relies on events for cache invalidation, logging, or webhook dispatch, they must be handled separately. The approach depends on whether individual or bulk event handling is acceptable.

### Criteria
- Are model events critical for this operation?
- Can events be handled in bulk after the upsert?
- Is there a way to identify which records changed?
- Is the cost of additional queries for change detection acceptable?

### Decision Tree
```
Are model events critical (cache, logs, webhooks, search indexing)?
├── YES
│   └── Can events be handled in bulk after upsert?
│       ├── YES → Use upsert() then query for changed records
│       │   └── How to identify changed records?
│           ├── Track IDs before/after → diff to find changed
│           ├── Use updated_at timestamp → query by timeframe
│           └── Maintain change log column → mark records for post-processing
│       └── NO (per-record event order matters)
│           └── Use updateOrCreate() loop instead of upsert()
│               └── Is performance acceptable?
│                   ├── YES → updateOrCreate() loop for event fidelity
│                   └── NO → Use upsert() + queue per-record event handling
└── NO → No event handling needed
    └── Use upsert() directly (simplest, fastest)
```

### Rationale
Since `upsert()` doesn't fire events, any logic in model event handlers (cache invalidation, search indexing, logging) is silently skipped. The most efficient approach is to query the records before and after the upsert, diff them to find changed records, and dispatch events for the changed subset. This adds 1-2 queries but avoids N individual event dispatches.

### Recommended Default
For operations requiring events: track IDs before upsert, query updated IDs after, dispatch bulk events for changed records. For operations not requiring events: use `upsert()` directly.

### Risks
- Assuming events fire: critical business logic silently skipped
- Change detection too broad: events dispatched for unchanged records
- Change detection too narrow: events missed for modified records
- Pre/post query on large dataset: additional I/O that may be significant

### Related Rules/Skills
- Handle Model Events Separately (05-rules.md)
- Always Include updated_at in $update (05-rules.md)
- Validate All Incoming Data Before upsert (05-rules.md)
