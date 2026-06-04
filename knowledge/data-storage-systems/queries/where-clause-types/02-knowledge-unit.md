# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.11 Where clause types (where, orWhere, whereIn, whereBetween, whereNull, whereDate, whereColumn, whereExists)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's `where` method family generates different SQL expression patterns. Each type affects sargability (index usage) differently. `whereDate` and related date functions break sargability by wrapping columns in functions. Understanding which `where` types use indexes is essential for query performance.

---

# Core Concepts

- **where('col', 'val')**: Plain equality. Uses index. SQL: `WHERE col = ?`.
- **whereIn('col', [1,2,3])**: Multiple equality. Uses index. SQL: `WHERE col IN (?, ?, ?)`.
- **whereBetween('col', [$a, $b])**: Range. Uses index. SQL: `WHERE col BETWEEN ? AND ?`.
- **whereNull('col')**: IS NULL check. Uses B-tree index. SQL: `WHERE col IS NULL`.
- **whereDate('col', $date)**: Function wrap. BREAKS index. SQL: `WHERE DATE(col) = ?`.
- **whereColumn('a', 'b')**: Column comparison. Uses indexes on both columns. SQL: `WHERE a = b`.
- **whereExists(fn)**: EXISTS subquery.

---

# Mental Models

Simple `where` = index-friendly. Function-wrapping `where` = index-breaking. If you wrap a column in a function, the database can't use the index on that column.

---

# Internal Mechanics

`whereDate('created_at', '2026-01-01')` generates `WHERE DATE(created_at) = '2026-01-01'`. The `DATE()` function prevents the B-tree index on `created_at` from being used because the index stores raw values, not function output.

---

# Patterns

**Replace whereDate with range**: Instead of `whereDate('created_at', $date)`, use `whereBetween('created_at', [$date->startOfDay(), $date->endOfDay()])`. This is sargable.

**Use whereIn for multiple values**: More efficient than multiple `orWhere` calls for the same column.

**Use whereNull for optional filters**: `->when($request->status, fn($q, $v) => $q->where('status', $v), fn($q) => $q->whereNull('status'))`.

---

# Sargability Reference

| Where Type | SQL | Index? |
|-----------|-----|--------|
| where('col', $val) | col = ? | YES |
| whereIn('col', $arr) | col IN (?,?) | YES |
| whereBetween('col', $a, $b) | col BETWEEN ? AND ? | YES |
| whereNull('col') | col IS NULL | YES (B-tree) |
| whereDate('col', $d) | DATE(col) = ? | NO |
| whereColumn('a', 'b') | a = b | YES |
| whereExists(fn) | EXISTS(...) | YES (if inner query indexed) |

---

# Common Mistakes

**whereDate on indexed column**: Creates a full table scan on a large table. Use range query instead.

**orWhere without grouping**: `where('a', 1)->orWhere('b', 2)` — the OR may not use the composite index on (a, b). Group with a closure.

---

# Related Knowledge Units

2.10 Query builder methods | 4.7 Sargable vs non-sargable query patterns | 4.8 whereDate sargability breakage
## Ecosystem Usage

Laravel's Eloquent ORM is the dominant PHP ORM in the ecosystem. Community patterns are shared through Laracasts, Laravel News, and open-source packages. Features like eager loading and model events are used in virtually every Laravel project.

## Failure Modes

N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Performance Considerations

Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Production Considerations

Enable preventLazyLoading in production to catch N+1 issues early. Use Telescope or Debugbar to monitor query counts. Set strict mode to catch missing attributes. Configure query logging carefully as enableQueryLog retains queries in memory.

## Research Notes

Laravel 11 introduced new strict mode features. The once() method prevents duplicate relationship loads. Model casting to enums reduces validation code. The community trend is toward lighter models with dedicated action classes.

## Architectural Decisions

Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

## Tradeoffs

Benefit: Productivity via magic methods. Cost: Performance overhead vs raw SQL. Benefit: Relationship abstraction. Cost: N+1 risk if not careful. Benefit: Model events for business logic. Cost: Hidden side effects.

