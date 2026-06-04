# Decision Trees: Index-Aware Queries

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Index-Aware Queries |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Index design timing (proactive vs reactive) | Primary |
| 2 | Composite index column ordering | Architecture |
| 3 | Covering index vs standard index | Architecture |

---

## Decision 1: Index Design Timing (Proactive vs Reactive)

### Context
Index design can happen proactively (during feature development, before the migration) or reactively (after a production incident). Proactive design prevents slow queries; reactive means users already experienced degraded performance.

### Criteria
- Is the table expected to grow beyond 10k rows?
- Are the query patterns well understood?
- Is this an exploratory feature with unknown query patterns?
- Is there CI validation for index usage (`EXPLAIN` assertions)?

### Decision Tree
```
Are the query patterns well understood?
├── YES (standard CRUD, reporting endpoint, API list)
│   └── Proactive: Design indexes in parallel with query patterns
│       └── Is the table expected > 10k rows?
│           ├── YES → Design indexes in the same migration as the table
│           └── NO → Add index later if performance requires it
└── NO (exploratory feature, query patterns unknown)
    └── Reactive: Deploy without indexes, monitor usage data
        └── Add indexes in follow-up migration after analyzing actual queries
            └── Is CI configured to detect slow queries?
                ├── YES → Monitor CI alerts and add indexes proactively
                └── NO → Configure query monitoring first
```

### Rationale
Proactive index design is a standard step in feature development, not an afterthought. Before writing a migration, identify the top query patterns (WHERE, ORDER BY, JOIN columns) and design indexes for them. This prevents the production incident entirely. For exploratory features where query patterns are unknown, reactive indexing with monitoring is acceptable.

### Recommended Default
Always design indexes proactively for features with known query patterns. Include indexes in the same migration as the table creation.

### Risks
- Proactive indexes on wrong columns: wasted disk and write overhead without query benefit
- Reactive indexes too late: users experienced slow queries, emergency migration required
- No `EXPLAIN` verification: assumed index is used but query planner chose FTS
- Over-indexing write-heavy tables: significant write throughput degradation

### Related Rules/Skills
- Design Indexes in Parallel with Query Patterns (05-rules.md)
- Order Composite Index Columns by Selectivity (05-rules.md)
- Use Covering Indexes for Frequent Queries (05-rules.md)
- Implement Select Constraints for Efficient Data Retrieval (06-skills.md)

---

## Decision 2: Composite Index Column Ordering

### Context
The leftmost prefix rule means a composite index `INDEX(a, b)` efficiently filters by `a` alone, `a AND b`, but NOT by `b` alone. The column order determines which query patterns the index supports.

### Criteria
- Which columns are used in WHERE clauses?
- How selective is each column (unique values / total rows)?
- Are there queries that filter by only one of the columns?
- Is there an ORDER BY on any of the columns?

### Decision Tree
```
Do queries filter by multiple columns together?
├── YES
│   └── Order columns by selectivity (most selective first)
│       └── Is there also an ORDER BY on one column?
│           ├── YES → Place ORDER BY column after equality WHERE columns
│           └── NO → Selectivity order only
│               └── Are there queries filtering by only the second column?
│                   ├── YES → Consider a second index or rethink order
│                   └── NO → Proceed with selectivity order
└── NO (queries filter by a single column)
    └── Single-column index is sufficient
        └── Is a covering index needed for the query?
            ├── YES → Add extra columns after the filter column
            └── NO → Single-column index only
```

### Rationale
Putting the most selective column first maximizes the index's usefulness. `INDEX(status, email)` — where `status` has 3 values and `email` is unique — is useless for queries filtering by email alone because `email` is second. `INDEX(email, status)` supports both `WHERE email = ?` (highly selective) and `WHERE email = ? AND status = ?`.

### Recommended Default
Most selective column first. If there's an ORDER BY, include that column after equality WHERE columns.

### Risks
- Low-selectivity column first: index cardinality is low, index rarely used
- ORDER BY column in wrong position: filesort on large datasets
- Two single-column indexes instead of composite: database uses only one
- Data type mismatch: index not used if query uses string for integer column

### Related Rules/Skills
- Order Composite Index Columns by Selectivity (05-rules.md)
- Use Covering Indexes for Frequent Queries (05-rules.md)
- Optimize Eloquent Subquery Performance (06-skills.md)

---

## Decision 3: Covering Index vs Standard Index

### Context
A covering index contains ALL columns the query needs (SELECT, WHERE, ORDER BY, JOIN). The database reads only the index without touching table rows — 10-100x faster. A standard index still requires table lookups for columns not in the index.

### Criteria
- Does the query select only a few columns?
- How frequently is the query executed?
- Are the selected columns fixed or variable?
- How wide are the table rows (how many columns total)?

### Decision Tree
```
Is the query executed frequently (> 1000 times/day)?
├── YES
│   └── Are the SELECT columns fixed and few (< 5)?
│       ├── YES → Design a covering index
│       │   └── Do the SELECT columns add significant width to the index?
│           ├── NO (small columns: int, short string) → Proceed
│           └── YES (BLOB, TEXT, large JSON) → Do NOT cover; use standard index
│       └── NO (SELECT * or many columns) → Standard index (covering too wide)
└── NO (infrequent queries, reports, admin panels)
    └── Standard index is sufficient
        └── Is the table very wide (> 50 columns)?
            ├── YES → Prefer covering indexes for any frequent query
            └── NO → Standard index on WHERE/ORDER BY columns
```

### Rationale
Covering indexes eliminate table access, making queries extremely fast. However, adding large columns (TEXT, BLOB) to an index makes it wide and less efficient. The covering index benefit is proportional to query frequency — a query running 100k times/day benefits enormously; a monthly report does not.

### Recommended Default
Covering indexes for high-frequency queries with fixed, narrow SELECT lists. Standard indexes for infrequent queries or queries with variable/large SELECT columns.

### Risks
- Covering index with wide columns: index becomes large, slower to maintain
- Index-only scan not verified: `EXPLAIN` may still show table access
- Adding SELECT columns to index that change frequently: increased write overhead without benefit
- Too many covering indexes: write amplification from index maintenance

### Related Rules/Skills
- Use Covering Indexes for Frequent Queries (05-rules.md)
- Design Indexes in Parallel with Query Patterns (05-rules.md)
- Implement Select Constraints for Efficient Data Retrieval (06-skills.md)
