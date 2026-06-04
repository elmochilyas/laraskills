# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.28 N+1 detection via Laravel Telescope, Debugbar, or manual logging
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

N+1 detection tools identify repeated queries with identical structure but different parameter values. Laravel Telescope groups queries by request and highlights repeated patterns. Debugbar shows query count per request. Manual logging via `DB::listen` can alert on high query counts. Detection is the first step in eliminating N+1 problems.

---

# Core Concepts

- **Telescope**: Per-request query log with timing, duplicates detection, and relationship loading analysis.
- **Debugbar**: In-browser debug toolbar showing query count, time, and duplicates.
- **DB::listen**: Low-level query event listener. Can log, count, or alert on query patterns.
- **Pattern signature**: N+1 appears as N identical queries with different WHERE values: `SELECT * FROM comments WHERE post_id = 1`, `... WHERE post_id = 2`, etc.

---

# Mental Models

N+1 detection is pattern recognition. The database profile shows a query repeated N times with only the parameter varying. This is the signature of a lazy-loaded relationship accessed inside a loop.

---

# Patterns

**Telescope for development**: Enable Telescope locally and in staging. Check the "Queries" tab for repeated query patterns.

**Debugbar for quick inspection**: During development, Debugbar's query count shows immediately if an endpoint is over-fetching.

**Custom middleware for production monitoring**: Count queries per request and log warnings when the count exceeds a threshold (e.g., 30 queries per request).

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Telescope provides comprehensive query analysis | Performance overhead in development | Disable Telescope in production
Debugbar shows immediate feedback | Only works in browser | Not suitable for API-only apps

---

# Common Mistakes

**Relying only on one tool**: Telescope catches what Debugbar misses and vice versa. Use multiple tools in different environments.

**Ignoring production patterns**: N+1 that only appears at production data volumes won't show in development. Monitor query counts in production.

---

# Related Knowledge Units

2.4 Lazy loading prevention | 4.13 N+1 detection and elimination | 4.27 Profiling tools
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

## Internal Mechanics

Eloquent models extend Illuminate\Database\Eloquent\Model. The query builder compiles Eloquent expressions into SQL. Relationships are resolved through lazy loading or eager loading. Model hydration converts database rows into PHP objects with type casting.

## Architectural Decisions

Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

