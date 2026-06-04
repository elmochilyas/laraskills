# Decision Trees for 4-20 Memory Optimization

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-20 |
| Title | Memory Optimization |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Eloquent hydration vs query builder for reporting
- D2: Column selection narrowness
- D3: Memory streaming vs batch processing

## Architecture-Level Decision Trees

### D1: Eloquent hydration vs query builder for reporting

**Decision Context**: Choose between Eloquent model hydration and query builder arrays for data retrieval.

**Criteria**:
- Need for model methods (mutators, accessors, events)
- Dataset size
- Performance budget

**Tree**:
```
Do you need model methods or relationships?
├── Yes (mutators, events, serialization)
│   └── Use Eloquent (accept memory overhead)
└── No (just data display or export)
    └── Is the dataset > 1000 rows?
        ├── Yes → Use query builder (10x less memory)
        └── No → Eloquent acceptable
```

**Rationale**: Eloquent models consume ~1-2KB each vs ~100-200 bytes for stdClass. Over 10,000 rows, the difference is 10-20MB vs 1-2MB.

**Default**: Query builder for reporting and exports; Eloquent for interactive UI where model methods are needed.

**Risks**: Mixed approaches cause confusion. Standardize on query builder for all reporting endpoints.

**Related Rules/Skills**: 2-10 (query builder methods), 4-23 (when to drop to query builder)

---

### D2: Column selection narrowness

**Decision Context**: Decide which columns to load in each query context.

**Criteria**:
- Display context (list vs detail)
- Column width (text/blob fields)
- Number of rows

**Tree**:
```
Is this a list view (many rows, few columns)?
├── Yes
│   └── Select only displayed columns
│       ->select('id', 'title', 'created_at')
│       Avoid large text fields
└── Detail view (one row, all columns)
    └── Full model load acceptable
```

**Rationale**: Loading large text/blob columns for every row in a list view wastes memory proportional to both row count and column size.

**Default**: Always explicitly select columns for list views. Never use `SELECT *` in list endpoints.

**Risks**: Sparse selects break lazy-loaded relationships if the FK isn't included.

**Related Rules/Skills**: 4-21 (query shape discipline)

---

### D3: Memory streaming vs batch processing

**Decision Context**: Process large datasets without exceeding PHP memory limit.

**Criteria**:
- Total dataset size
- Memory limit
- Processing complexity per row

**Tree**:
```
Can processing be done row-by-row?
├── Yes (simple transform/export)
│   └── Use cursor() for streaming
│       Memory: ~1 row at a time
└── No (requires multiple rows for computation)
    └── Use chunkById() for batched processing
        Memory: ~chunk_size rows at a time
```

**Rationale**: Streaming with cursor processes one row at a time, using minimal memory. Batch processing with chunkById balances memory use with processing flexibility.

**Default**: cursor for memory-sensitive streaming; chunkById when batch processing is required.

**Risks**: cursor holds connection for entire iteration.

**Related Rules/Skills**: 4-19 (chunk method tradeoffs), 2-23 (chunk/cursor/lazy)

---
