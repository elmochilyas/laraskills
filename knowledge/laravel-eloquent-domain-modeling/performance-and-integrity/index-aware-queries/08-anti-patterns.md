# Index-Aware Queries — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Index-Aware Queries |
| Focus | Anti-patterns in index design, composite index ordering, covering indexes, and EXPLAIN verification |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Reactive-Indexing-Only (No Upfront Index Design) | Performance | Critical |
| 2 | Index-Every-Column (Standalone Indexes Instead of Composite) | Performance | High |
| 3 | Wrong Composite Index Column Order | Performance | High |
| 4 | Not Using Covering Indexes for Frequent Queries | Performance | Medium |
| 5 | Not Verifying Index Usage with `EXPLAIN` | Performance | Critical |
| 6 | Ignoring ORDER BY in Index Design | Performance | Medium |

---

## 1. Reactive-Indexing-Only (No Upfront Index Design)

### Category
Performance

### Description
Never designing indexes proactively, only adding them after production incidents when users already experienced slow queries.

### Preferred Alternative
Design index in parallel with migration:
```php
Schema::table('posts', function ($table) {
    $table->string('status');
    $table->timestamp('published_at');
    $table->index(['status', 'published_at']); // Proactive design
});
```

### Detection Checklist
- [ ] Review migration patterns — are indexes designed before incidents?
- [ ] Add index design step to feature development workflow
- [ ] Document query patterns and corresponding indexes

### Related
| Rule | `05-rules.md` — Design Indexes in Parallel with Query Patterns |

---

## 2. Index-Every-Column (Standalone Indexes Instead of Composite)

### Category
Performance

### Description
Adding a standalone index on every column instead of designing composite indexes for combined filter patterns, causing index bloat without efficient query support.

### Preferred Alternative
```php
$table->index(['status', 'created_at']); // Composite supports both filters
```

### Detection Checklist
- [ ] Review single-column indexes for combined-query candidates
- [ ] Replace with composite indexes where appropriate
- [ ] Verify no index bloat from unused standalone indexes

### Related
| Rule | `05-rules.md` — Prefer Composite Indexes Over Many Single-Column Indexes |

---

## 3. Wrong Composite Index Column Order

### Category
Performance

### Description
Ordering composite index columns with the least selective column first, preventing the index from being useful for queries filtering by the second column alone.

### Preferred Alternative
```php
$table->index(['email', 'status']); // email (highly selective) first
```

### Detection Checklist
- [ ] Review composite index column order for selectivity
- [ ] Place most selective column first
- [ ] Verify with `EXPLAIN` that common queries use the index

### Related
| Rule | `05-rules.md` — Order Composite Index Columns by Selectivity |

---

## 4. Not Using Covering Indexes for Frequent Queries

### Category
Performance

### Description
Designing indexes that don't cover all columns in frequent queries, requiring table lookups for every row even when the index is used.

### Preferred Alternative
```php
// Index: INDEX(status, created_at, id) — covers all selected columns
Post::select('id', 'status', 'created_at')
    ->where('status', 'published')
    ->orderBy('created_at')
    ->get();
```

### Detection Checklist
- [ ] Review frequent queries for covering index opportunities
- [ ] Add columns to index to enable index-only scans
- [ ] Verify with `EXPLAIN` `Extra: Using index`

### Related
| Rule | `05-rules.md` — Use Covering Indexes for Frequent Queries |

---

## 5. Not Verifying Index Usage with `EXPLAIN`

### Category
Performance

### Description
Deploying queries assuming indexes are used, without running `EXPLAIN` to verify — discovering full table scans in production.

### Preferred Alternative
```php
// EXPLAIN SELECT * FROM posts WHERE status != 'archived'
// type: ALL — redesign needed
Post::whereIn('status', ['draft', 'published'])->get();
// EXPLAIN shows type: range — index used
```

### Detection Checklist
- [ ] Run `EXPLAIN` on every new query pattern
- [ ] Assert `type` is not `ALL`
- [ ] Add CI validation for critical queries

### Related
| Rule | `05-rules.md` — Verify Index Usage with EXPLAIN |

---

## 6. Ignoring ORDER BY in Index Design

### Category
Performance

### Description
Indexing only the `WHERE` columns without including the `ORDER BY` column, causing MySQL filesorts on large result sets.

### Preferred Alternative
```php
// Index: INDEX(status, created_at) — covers both WHERE and ORDER BY
Post::where('status', 'published')
    ->orderBy('created_at')
    ->get();
```

### Detection Checklist
- [ ] Review query patterns — does the index include ORDER BY columns?
- [ ] Add ORDER BY columns to composite indexes
- [ ] Verify `EXPLAIN` shows `Using filesort` is avoided

### Related
| Rule | `04-standardized-knowledge.md` — Composite index must include ORDER BY column |
