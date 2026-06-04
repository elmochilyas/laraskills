# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.5 Constrained eager loading (with + where constraints on relationship)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Constrained eager loading filters, limits, or orders the related models loaded via `with()` using closure-based constraints. This prevents loading all related records when only a subset is needed. Since Laravel 12, `limit()` is supported natively in constrained eager loads.

---

# Core Concepts

- **Closure constraints**: `with(['comments' => fn($q) => $q->where('approved', true)->limit(5)])` loads only approved comments, max 5 per post.
- **Aggregate constraints**: `withCount(['comments' => fn($q) => $q->where('spam', false)])` counts only non-spam comments.
- **Native limit()**: Laravel 12+ supports `limit()` on eager loaded relationships without external packages.

---

# Mental Models

Constrained eager loading is a filtered pre-load. Instead of "load all comments", it's "load the 3 most recent approved comments per post". It reduces data transfer and hydration overhead.

---

# Internal Mechanics

For `hasMany` relationships, the constraint is applied as a WHERE clause in the eager load query. For `belongsToMany`, the constraint is applied as a WHERE on the JOIN or as a separate WHERE clause.

---

# Patterns

**Top N per parent**: `with(['comments' => fn($q) => $q->latest()->limit(3)])` — load the 3 most recent comments per post.

**Filtered counts**: `withCount(['likes' => fn($q) => $q->where('type', 'upvote')])` — count only upvotes.

**Conditional constraints**: `with(['comments' => fn($q) => $q->when($onlyApproved, fn($q) => $q->where('approved', true))])` — conditionally filter by request parameter.

---

# Architectural Decisions

| Pattern | When | When Not |
|---------|------|----------|
| limit() on eager load | List views needing top N per parent | When all related records are displayed |
| Filtered withCount | Dashboard stats, summary endpoints | When full count is needed |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Reduces data transfer | Added complexity in query definition | Slightly more verbose code
Laravel 12 native limit() | No external package needed | — |

---

# Common Mistakes

**Forgetting to constrain list endpoints**: Loading 500 comments per post when only 3 are displayed. Massively over-fetches data.

**Complex constraints causing slow queries**: Constraint uses `orWhere` or function wrapping that breaks index usage. The eager load query becomes slow.

---

# Related Knowledge Units

2.3 Eager loading | 2.6 Relationship existence filtering | 2.7 Relationship counting
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

