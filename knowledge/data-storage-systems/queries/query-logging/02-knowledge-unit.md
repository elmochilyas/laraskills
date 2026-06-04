# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.29 Query logging (DB::listen, enableQueryLog)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

`DB::listen` captures every query executed, providing SQL, bindings, execution time, and connection name. `enableQueryLog` stores queries in memory for later retrieval. These are the foundational tools for Laravel query debugging and performance analysis.

---

# Core Concepts

- **DB::listen(closure)**: Event listener that fires for every query. Access SQL, bindings, time, connection name.
- **enableQueryLog() / getQueryLog()**: Stores queries in memory. Use `getQueryLog()` to retrieve array of all queries executed.
- **disableQueryLog()**: Turn off logging. Prevents memory growth in long-running processes.

---

# Patterns

**Slow query alert**: `DB::listen(fn($q) => $q->time > 100 && Log::warning(...))` — log queries exceeding 100ms.

**Test assertions**: `DB::enableQueryLog(); // execute; $this->assertCount(2, DB::getQueryLog())` — assert query count in tests.

**Long-running process cleanup**: `DB::disableQueryLog()` after collecting needed queries to prevent unbounded memory growth.

---

# Common Mistakes

**Leaving query logging enabled in production**: `getQueryLog()` stores all queries in memory per request. On high-traffic endpoints, this exhausts PHP memory.

**Using getQueryLog() without disableQueryLog()**: Queries accumulate. After retrieving, call `disableQueryLog()` to clear.

---

# Related Knowledge Units

4.27 Profiling tools | 2.28 N+1 detection via Telescope
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

## Tradeoffs

Benefit: Productivity via magic methods. Cost: Performance overhead vs raw SQL. Benefit: Relationship abstraction. Cost: N+1 risk if not careful. Benefit: Model events for business logic. Cost: Hidden side effects.

## Mental Models

Eloquent models are active record representations of database rows. Each model instance maps to one row. Relationships are query builders that can be chained and constrained.

