# Decision Trees for 4-18 Keyset Pagination

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-18 |
| Title | Keyset Pagination |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Keyset vs cursor vs offset pagination
- D2: Composite key design for non-unique sort columns
- D3: Multi-column sort with keyset

## Architecture-Level Decision Trees

### D1: Keyset vs cursor vs offset pagination

**Decision Context**: Choose pagination strategy based on sort column characteristics.

**Criteria**:
- Sort column uniqueness
- Required navigation (next/prev vs arbitrary page)
- Frontend pagination UX

**Tree**:
```
Is the sort column unique?
├── Yes
│   └── Use cursor pagination (Laravel built-in cursorPaginate)
└── No
    └── Is arbitrary page access required?
        ├── Yes → Use offset pagination (accept deep-page cost)
        └── No → Use keyset pagination with tiebreaker
```

**Rationale**: Cursor pagination is simpler when the sort column is unique (typically PK). Keyset pagination is needed for non-unique sort columns with a tiebreaker.

**Default**: Cursor pagination for unique columns; keyset for non-unique; offset only when arbitrary page access is required.

**Risks**: Offset pagination performance degrades with page depth. Keyset doesn't support "jump to page N".

**Related Rules/Skills**: 4-16 (offset pagination deep-page problems), 4-17 (cursor pagination)

---

### D2: Composite key design for non-unique sort columns

**Decision Context**: Design composite key for stable pagination through non-unique sort column.

**Criteria**:
- Sort column cardinality
- Tiebreaker column (typically PK)
- Sort direction stability

**Tree**:
```
What is the sort column?
├── created_at (timestamp)
│   └── Composite: (created_at, id)
│       WHERE (created_at, id) < ($lastCreatedAt, $lastId)
│       ORDER BY created_at DESC, id DESC
├── category_id (low cardinality FK)
│   └── Composite: (category_id, created_at, id)
│       WHERE (category_id, created_at, id) > ($cat, $createdAt, $id)
└── Custom column
    └── Composite: (sort_col, id)
```

**Rationale**: The tiebreaker (PK) ensures each row has a unique position even when sort values collide. The composite key must be indexed for efficient seek.

**Default**: Use `(created_at, id)` as the composite key for time-based sorting.

**Risks**: Without tiebreaker, pagination can miss or duplicate rows when sort values repeat.

**Related Rules/Skills**: 3-10 (index types)

---

### D3: Multi-column sort with keyset

**Decision Context**: Implement pagination with sort on multiple columns.

**Criteria**:
- Number of sort columns
- Sort direction per column (DESC/ASC mix)
- Index design

**Tree**:
```
Are all sort columns in the same direction?
├── Yes (e.g., ORDER BY category ASC, created_at ASC)
│   └── Single composite index (category, created_at, id)
└── No (mixed ASC/DESC)
    └── Requires index in matching sort order
        (DESC index if database supports it)
```

**Rationale**: Mixed sort directions complicate index design. MySQL 8.0+ supports DESC indexes; PostgreSQL supports them since 8.0.

**Default**: Align sort directions when possible. Use DESC indexes for mixed-direction sorts.

**Risks**: Mixed-direction queries without DESC indexes cause filesort.

**Related Rules/Skills**: 13-23 (descending indexes MySQL)

---
