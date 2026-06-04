# Decision Trees for 4-4 Extra Column Flags

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-4 |
| Title | Extra Column Flags |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Using index flag — covering index strategy
- D2: Using filesort — sort optimization decision
- D3: Using temporary — GROUP BY/DISTINCT optimization

## Architecture-Level Decision Trees

### D1: Using index flag — covering index strategy

**Decision Context**: EXPLAIN shows "Using index" (covering index) — all selected columns are in the index.

**Criteria**:
- Query frequency
- Read/write ratio
- Index width

**Tree**:
```
Is query frequent enough to optimize?
├── Yes
│   └── Is index width acceptable?
│       ├── Yes → Keep covering index
│       └── No → Add INCLUDE columns (Pg) or selective covering index
└── No → No action needed
```

**Rationale**: Covering indexes eliminate heap fetches, but wider indexes increase write overhead. Optimize only for hot queries.

**Default**: Maintain covering index for top-N queries by frequency.

**Risks**: Index bloat from too many covering columns.

**Related Rules/Skills**: Using index is best-case; avoid premature covering on low-frequency queries.

---

### D2: Using filesort — sort optimization decision

**Decision Context**: EXPLAIN shows "Using filesort" — ORDER BY cannot use index.

**Criteria**:
- Result set size
- Sort column indexability
- Query frequency

**Tree**:
```
Does filesort affect large result sets?
├── Yes (> 1000 rows sorted)
│   └── Can sort column be added to index?
│       ├── Yes → Add sort column as last index column
│       └── No → Consider pre-sorted materialized view
└── No (< 100 rows) → Acceptable filesort
```

**Rationale**: Filesort on small result sets (< 100 rows) is negligible. Large sorts benefit from index-based ordering.

**Default**: Add ORDER BY column as last column of relevant index for hot queries.

**Risks**: Extra index column increases write amplification.

**Related Rules/Skills**: 3-10 (covering indexes), index sort direction matters.

---

### D3: Using temporary — GROUP BY/DISTINCT optimization

**Decision Context**: EXPLAIN shows "Using temporary" — temp table for GROUP BY, DISTINCT, or UNION.

**Criteria**:
- Cardinality of grouping column
- Query concurrency
- Temp table size

**Tree**:
```
Is GROUP BY column high cardinality?
├── Yes (millions of groups)
│   └── Is grouping column leftmost in index?
│       ├── Yes → Acceptable
│       └── No → Add index with GROUP BY column as leftmost prefix
└── No (few distinct values) → Acceptable temp table
```

**Rationale**: Low-cardinality GROUP BY creates small temp tables. High-cardinality GROUP BY without proper index creates large on-disk temp tables.

**Default**: Ensure GROUP BY column is leftmost prefix of an index for high-cardinality queries.

**Risks**: On-disk temp tables degrade to disk I/O speeds.

**Related Rules/Skills**: DISTINCT optimization follows same pattern as GROUP BY.

---
