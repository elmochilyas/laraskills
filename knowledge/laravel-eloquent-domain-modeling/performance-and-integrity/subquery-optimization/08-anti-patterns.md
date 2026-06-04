# Subquery Optimization — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Subquery Optimization |
| Focus | Anti-patterns in whereHas, scalar subqueries, correlated vs uncorrelated subqueries, and indexing |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Unindexed `whereHas()` (Full Table Scan per Outer Row) | Performance | Critical |
| 2 | Scalar Subquery in `addSelect()` Without `->limit(1)` | Reliability | Critical |
| 3 | Subquery-Everywhere Instead of Considering JOIN + GROUP BY | Performance | Medium |
| 4 | Too Many Subqueries in a Single SELECT | Performance | Medium |
| 5 | Not Testing Subqueries with Production-Scale Data | Testing | Critical |

---

## 1. Unindexed `whereHas()` (Full Table Scan per Outer Row)

### Category
Performance

### Description
Using `whereHas()` without indexing the subquery's WHERE columns (especially the foreign key), causing each outer row to trigger a full table scan.

### Preferred Alternative
```php
// Migration: $table->foreignIdFor(User::class)->constrained()->index();
$users = User::whereHas('comments', fn($q) =>
    $q->where('created_at', '>', now()->subMonth())
)->get();
```

### Detection Checklist
- [ ] Search for `whereHas(` and check FK index on subquery table
- [ ] Add indexes on subquery WHERE columns
- [ ] Verify with `EXPLAIN` that index is used

### Related
| Rule | `05-rules.md` — Always Index Subquery WHERE Columns |

---

## 2. Scalar Subquery in `addSelect()` Without `->limit(1)`

### Category
Reliability

### Description
Adding a subquery to `addSelect()` without `->limit(1)`, causing a runtime error when a parent has multiple related records.

### Preferred Alternative
```php
Post::addSelect([
    'recent_comment' => Comment::select('body')
        ->whereColumn('post_id', 'posts.id')
        ->latest()
        ->limit(1),
])->get();
```

### Detection Checklist
- [ ] Search for `addSelect(` with subqueries
- [ ] Add `->limit(1)` with explicit ordering to each
- [ ] Verify no "Subquery returns more than 1 row" errors

### Related
| Rule | `05-rules.md` — Add limit(1) for Every Scalar Subquery |

---

## 3. Subquery-Everywhere Instead of Considering JOIN + GROUP BY

### Category
Performance

### Description
Using subqueries for every aggregation instead of also considering JOIN + GROUP BY, missing cases where JOINs would be more efficient.

### Preferred Alternative
Profile both approaches — subqueries are not always faster. JOIN + GROUP BY can outperform subqueries for large aggregation queries.

### Detection Checklist
- [ ] Profile subquery performance against JOIN alternatives
- [ ] Use JOIN + GROUP BY for large aggregations requiring related columns
- [ ] Monitor query execution plans for both approaches

### Related
| Rule | `04-standardized-knowledge.md` — Subquery vs JOIN tradeoff |

---

## 4. Too Many Subqueries in a Single SELECT

### Category
Performance

### Description
Adding 4+ `addSelect()` subqueries to a single query, where each correlated subquery executes once per returned row — for 10k rows × 5 subqueries = 50k executions.

### Preferred Alternative
```php
Post::withCount(['comments', 'likes', 'views'])->get();
// withCount uses efficient correlated subqueries
```

### Detection Checklist
- [ ] Count `addSelect(` subqueries per query
- [ ] Limit to 2-3 per query
- [ ] Use `withCount()` or aggregation tables for more

### Related
| Rule | `05-rules.md` — Limit Subqueries in SELECT to 2-3 Per Query |

---

## 5. Not Testing Subqueries with Production-Scale Data

### Category
Testing

### Description
Testing subqueries only with small datasets (1000 rows), discovering at production scale (1M rows) that the subquery is catastrophically slow.

### Preferred Alternative
```php
// Test with 100k+ records matching production volume
// EXPLAIN shows type: ref or range (not ALL)
$users = User::whereHas('comments', fn($q) => ...)->get();
```

### Detection Checklist
- [ ] Review subquery tests for production-scale seed data
- [ ] Add EXPLAIN assertions in CI
- [ ] Benchmark with realistic row counts before deployment

### Related
| Rule | `05-rules.md` — Test with Production-Scale Data |
