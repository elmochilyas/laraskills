# Decision Trees: chunk vs chunkById

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | chunk-chunk-by-id |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | chunk() vs chunkById() selection | Primary |
| 2 | Batch size selection | Architecture |
| 3 | Checkpoint strategy | Architecture |

---

## Decision 1: chunk() vs chunkById() Selection

### Context
Both methods process large datasets in batches, but they differ fundamentally in mutation safety. `chunk()` uses offset pagination; `chunkById()` uses key-based pagination. The wrong choice causes data corruption under concurrent mutations.

### Criteria
- Is the dataset actively being written to during iteration?
- Is the callback performing mutations (updates, deletes, inserts)?
- Is the table static and read-only?
- Does the table have a monotonically incrementing primary key?

### Decision Tree
```
Is the dataset mutated during iteration?
├── YES (deletions, insertions, or updates)
│   └── Use chunkById()
│       └── Is the primary key an auto-increment integer?
│           ├── YES → Use chunkById($count, $callback)
│           └── NO (UUID, ULID, composite) → Pass explicit $column and $alias
└── NO (read-only export, static data)
    └── Is the dataset guaranteed free of concurrent writes?
        ├── YES → Use chunk() (simpler, no key requirement)
        └── NO → Use chunkById() (defensive default)
```

### Rationale
`chunk()` paginates via `LIMIT $count OFFSET $n`. When rows are deleted, the offset shifts — rows that were in position 11+ move into the now-skipped position, causing them to be missed entirely. `chunkById()` uses `WHERE id > $lastId LIMIT $count`, which is unaffected by deletions before the cursor. Since production datasets are rarely truly static, `chunkById()` should be the default.

### Recommended Default
`chunkById()` — prefer it for all batch processing unless the dataset is proven read-only with no concurrent access. This eliminates the most common chunking bug.

### Risks
- `chunkById()` on a non-unique or non-monotonic key causes infinite loops or skipped rows
- `chunkById()` with a custom `orderBy()` breaks the key-based pagination assumption
- Forgetting to index the key column causes full table scans per chunk

### Related Rules/Skills
- Default to chunkById for Mutable Datasets (05-rules.md)
- Wrap Chunk Callbacks in Transactions (05-rules.md)
- Prevent N+1 with Proactive Eager Loading Strategies (06-skills.md)

---

## Decision 2: Batch Size Selection

### Context
The chunk size determines the memory-per-query tradeoff. Too small increases query count and round trips; too large causes memory pressure and potential timeouts.

### Criteria
- How many columns/relations does each model carry?
- What is the memory limit of the PHP process?
- How many total rows are being processed?
- Is eager loading used within the callback?

### Decision Tree
```
Are models simple (few columns, no eager loading)?
├── YES
│   └── Is the total dataset < 1M rows?
│       ├── YES → Batch size 1000
│       └── NO → Batch size 2000-5000
└── NO (heavy models, eager-loaded relations)
    └── Batch size 100-500
        └── Are relations deeply nested?
            ├── YES → Batch size 100
            └── NO → Batch size 500
```

### Rationale
Each chunk holds one chunk's worth of hydrated Eloquent models in memory. A chunk of 1000 simple models with 3 columns uses ~1-2 MB. A chunk of 1000 models with 5 eager-loaded relations each having 10 columns can use 50+ MB. Tune based on actual model weight rather than using a one-size-fits-all value.

### Recommended Default
500 — balanced between memory safety and query efficiency for most applications.

### Risks
- Too large: memory limit exceeded, process killed mid-batch
- Too small: thousands of queries, slow processing, connection pool pressure
- Chunk size on cursor-based methods affects query count but not memory of individual rows

### Related Rules/Skills
- Wrap Chunk Callbacks in Transactions (05-rules.md)
- Store Checkpoints for Resumability (05-rules.md)
- Implement Select Constraints for Efficient Data Retrieval (06-skills.md)

---

## Decision 3: Checkpoint Strategy

### Context
Without checkpoints, a failed batch job must reprocess the entire dataset. With checkpoints, the job resumes from the last successfully processed row.

### Criteria
- Is job idempotency guaranteed (reprocessing rows is safe)?
- What is the cost of full reprocessing vs. checkpoint complexity?
- What failure modes exist (process crash, timeout, exception)?

### Decision Tree
```
Is the operation idempotent (reprocessing the same row is safe)?
├── YES
│   └── Is the batch job short (< 5 minutes)?
│       ├── YES → No checkpoint needed (restart is cheap)
│       └── NO → Implement cache-based checkpoint
└── NO (non-idempotent updates, financial operations)
    └── Implement database-based checkpoint
        └── Can the job tolerate partial re-processing?
            ├── YES → Save last ID to Cache
            └── NO → Save last ID to database (persistent)
```

### Rationale
For idempotent jobs under 5 minutes, the complexity of checkpointing outweighs the benefit. For non-idempotent operations or long-running jobs, checkpoints save significant time and prevent data inconsistencies. Cache-based checkpoints (Redis) are fast but volatile; database-backed checkpoints survive Redis restarts.

### Recommended Default
Cache-based checkpoint with `Cache::put('job_last_id', $lastId)` for any batch job processing > 10k rows or running > 5 minutes.

### Risks
- Cache expiry causes full reprocess — set TTL appropriately
- Stale checkpoint on job redesign — clear checkpoints on deployment
- Race condition on concurrent job instances — use unique job keys

### Related Rules/Skills
- Store Checkpoints for Resumability (05-rules.md)
- Optimize Eloquent Subquery Performance (06-skills.md)
- Implement Atomic Bulk Upsert Operations (06-skills.md)
