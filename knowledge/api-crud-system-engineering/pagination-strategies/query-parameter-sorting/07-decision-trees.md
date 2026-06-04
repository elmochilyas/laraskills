# Decision Trees: Query Parameter Sorting

## Tree 1: Sort Field Allowlist

```
Which columns should be sortable?
├── User-facing columns (name, email, created_at) → Add to allowlist.
├── Internal columns (password, remember_token, deleted_at) → Never add to allowlist.
├── Relationship columns (posts_count, comments_avg_rating) → Add if aggregated and indexable.
└── Computed columns (full_name, age calculated from DOB) → Computed in DB or via select expression.
```

## Tree 2: Default Sort Selection

```
What is the primary use case for this endpoint?
├── Activity feed / timeline → -created_at or -updated_at
├── Admin panel list → -id (most recent first)
├── Alphabetical listing → name (ascending)
├── Search results → relevance_score or -created_at
└── Financial/transactional → -transaction_date
```

## Tree 3: Combined Filter + Sort Performance

```
Are filters applied before sorting?
├── YES → Filter reduces result set, then sort is fast. Optimal.
├── NO → Sort on full table, then filter. Slow. Restructure.
├── Index supports both → Single composite index covers filter + sort.
└── No suitable index → Add composite index on (filter_column, sort_column).
```
