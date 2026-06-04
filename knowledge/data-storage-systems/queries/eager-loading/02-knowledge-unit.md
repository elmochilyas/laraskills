# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.3 Eager loading (with, load, loadMissing, nested dot notation)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Eager loading solves the N+1 query problem by loading related models in a single query. Laravel provides `with()` (query-time), `load()` (collection-time), and `loadMissing()` (conditional) with dot notation for nested relationships. Eager loading is the most impactful optimization for Eloquent performance.

---

# Core Concepts

- **`with('relation')`**: Eager loads the relationship as part of the parent query. Single query for the relationship, not N queries.
- **`load('relation')`**: Eager loads on an already-hydrated collection. Useful when you need to conditionally load after the initial query.
- **`loadMissing('relation')`**: Load only if not already loaded. Prevents redundant relationship loading in deep call stacks.
- **Dot notation**: `with('author.profile')` eager loads `author` and then `author.profile` through nested relationships.

---

# Mental Models

Eager loading is batching for database queries. Instead of one query per parent row, you batch all parent IDs into a single `WHERE IN (...)` query. The cost is transferring more data (all related rows at once) in exchange for fewer round trips.

---

# Internal Mechanics

Eloquent collects the primary keys from the hydrated parent models, then executes a single query: `SELECT * FROM related WHERE parent_id IN (1, 2, 3, ...)`. The related models are then matched to their parents in memory via a collection operation. Nested dot notation performs this sequentially — load authors, collect author IDs, load profiles.

---

# Patterns

**Always eager load for list endpoints**: Any endpoint that returns a collection of parent models with relationship access must eager load.

**Narrow eager loading**: Specify columns: `with('author:id,name')` to avoid transferring unnecessary columns from the related table.

**Conditional loading with loadMissing**: In reusable components (resources, accessors), use `loadMissing` so the relationship is loaded only once regardless of how many times it's accessed.

---

# Architectural Decisions

| Method | When | When Not |
|--------|------|----------|
| with() | Initial query | Already have collection |
| load() | After query, conditional | Before query (use with()) |
| loadMissing() | Shared components, reusable views | Always need fresh load |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Eliminates N+1 | Loads ALL related rows | May over-fetch if related set is large
Dot notation loads nested | Multiple JOINs or WHERE IN queries | Can generate complex SQL

---

# Common Mistakes

**Blind eager loading**: `Post::with(['comments', 'tags', 'author', 'author.profile'])` on a list endpoint where only the author name is displayed. Over-hydration: loading data that's never used.

**Not narrowing columns**: `with('comments')` selects all columns from comments table. Use `with('comments:id,post_id,body')` to reduce data transfer.

---

# Related Knowledge Units

2.4 Lazy loading prevention | 2.5 Constrained eager loading | 2.14 N+1 detection
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

