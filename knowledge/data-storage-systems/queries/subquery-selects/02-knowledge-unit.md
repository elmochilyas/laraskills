# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.8 Subquery selects (addSelect with subquery)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Subquery selects allow adding computed values from related tables as attributes on the parent model without eager loading the relationship. Using `addSelect` with a raw subquery or Eloquent's relationship-based subquery syntax, you can include data like "last login date" or "most recent order total" as a column on each parent row.

---

# Core Concepts

- **addSelect with closure**: `User::addSelect(['last_login_at' => LoginLog::select('created_at')->whereColumn('user_id', 'users.id')->latest()->limit(1)])`.
- **Relationship subquery**: `User::withLastLoginAt()` using a dedicated relationship method.
- **Subquery ordering**: `Order::orderByDesc(OrderItem::selectRaw('SUM(quantity)')->whereColumn('order_id', 'orders.id'))`.

---

# Mental Models

Subquery selects are "virtual columns" computed by the database. They add one value per parent row without loading related models. They replace the pattern of loading all related data and computing in PHP.

---

# Patterns

**Last related record**: Add the latest related record value without loading all records.

**Computed flags**: `addSelect(['has_recent_orders' => Order::selectRaw('COUNT(*) > 0')->whereColumn(...)->where('created_at', '>', now()->subMonth())])`.

**Aggregate per parent**: Total revenue per customer without loading all invoices.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Single query, no hydration overhead | Subquery executes per parent row in the result | Complex subqueries impact total query time
Very memory-efficient | Must write raw-ish relationship queries | More verbose than eager loading

---

# Common Mistakes

**Subquery returns multiple rows**: The subquery must return a scalar (one row, one column). If multiple rows match, the database errors.

**Not limiting the subquery**: `LoginLog::select('created_at')->whereColumn(...)->orderByDesc('created_at')` without `->limit(1)` may return multiple rows.

---

# Related Knowledge Units

2.9 Subquery ordering | 2.7 Relationship counting | 4.25 Subquery optimization
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

