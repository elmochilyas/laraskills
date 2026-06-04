# Decision Trees for 4-19 Chunk Method Tradeoffs

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-19 |
| Title | Chunk Method Tradeoffs |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: chunk vs chunkById for iterating large tables
- D2: cursor/lazy vs chunk for memory-sensitive processing
- D3: Connection duration constraints

## Architecture-Level Decision Trees

### D1: chunk vs chunkById for iterating large tables

**Decision Context**: Iterate over all rows of a large table for backfill or batch processing.

**Criteria**:
- Concurrent write activity on table
- Row insertion/deletion during iteration
- Need for stable ordering

**Tree**:
```
Is the table being modified during iteration?
├── Yes (concurrent INSERT/UPDATE/DELETE)
│   └── Use chunkById (WHERE id > ? ORDER BY id)
│       Stable — no skipped or duplicated rows
└── No (read-only during iteration)
    └── Use chunk (OFFSET-based)
        Simpler, but unstable if table changes
```

**Rationale**: chunk uses OFFSET which shifts when rows are inserted/deleted before the current position. chunkById uses key-based seek which is stable regardless of modifications.

**Default**: Always use chunkById in production contexts where data may change.

**Risks**: chunkById requires ascending PK. For UUID PKs, use custom chunkById with ordering.

**Related Rules/Skills**: 2-23 (chunk/chunkById/cursor/lazy)

---

### D2: cursor/lazy vs chunk for memory-sensitive processing

**Decision Context**: Process millions of rows without exhausting PHP memory.

**Criteria**:
- Memory limit
- Processing time per row
- Connection duration tolerance

**Tree**:
```
Can the connection be held for the full iteration?
├── Yes (CLI command, dedicated worker)
│   └── Use cursor() or lazy()
│       Memory: ~1 row at a time
│       Connection: held for full duration
└── No (web request, connection pool pressure)
    └── Use chunkById()
        Memory: ~chunk_size rows at a time
        Connection: released between chunks
```

**Rationale**: cursor and lazy hold the connection for the entire iteration (single query, streamed). chunkById releases the connection between chunks, making it suitable for web requests or connection-constrained environments.

**Default**: chunkById for queue jobs and web requests; cursor/lazy for CLI commands with dedicated connections.

**Risks**: cursor in long-running queue job holds connection for entire job, potentially exhausting pool under concurrency.

**Related Rules/Skills**: 4-20 (memory optimization)

---

### D3: Connection duration constraints

**Decision Context**: Choose iteration method based on connection pool availability.

**Criteria**:
- Connection pool size
- Concurrent job count
- Average iteration duration

**Tree**:
```
Is the iteration expected to take more than 30 seconds?
├── Yes
│   └── Use chunkById (releases connection between chunks)
└── No
    └── cursor/lazy acceptable (short connection hold)
```

**Rationale**: Long-running connections reduce pool capacity. chunkById's connection release pattern prevents pool exhaustion.

**Default**: chunkById for any iteration that may exceed 30 seconds.

**Risks**: Even chunkById can cause problems if the number of concurrent jobs × chunk duration exceeds connection pool.

**Related Rules/Skills**: 4-20 (memory optimization)

---
