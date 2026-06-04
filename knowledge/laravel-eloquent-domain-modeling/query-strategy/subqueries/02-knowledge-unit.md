# Subqueries

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Subqueries in Laravel Eloquent enable embedding SELECT statements within other query clauses — as column expressions in `SELECT`, as filtering conditions in `WHERE`, or as data sources in `FROM`. Eloquent provides first-class support for subqueries through closure-based builders, `whereExists`, `whereIn` with subquery closures, `selectSub`, and the `addSelect` with subquery pattern. Combined with Eloquent's relationship model, subqueries unlock powerful single-query optimizations like "latest post per user" or "count of related records as a column" that would otherwise require N+1 queries or complex joins.

## Core Concepts
- **Subquery Select** — embedding a `SELECT` as a column expression using `addSelect($query->select(...))` or `selectSub(closure, alias)`
- **Subquery Where** — using a subquery in `WHERE` clauses via `where(closure)`, `whereExists`, `whereIn`, `whereNotIn`
- **Correlated Subquery** — a subquery that references the outer query's columns (e.g., `where('users.id', $subQuery->select('user_id')->from('logs')...)`)
- **`whereExists` / `whereNotExists`** — subquery that checks for existence of related rows
- **Subquery as `FROM`** — wrapping a subquery as a table source using `from(closure, alias)`
- **Raw Subqueries** — `DB::raw('(SELECT ...)')` for database-specific syntax

## Mental Models
- **Inline Relationship** — a subquery is a relationship expressed inline without a join; like a join that returns a single aggregated value
- **Query Composition** — subqueries are builders that generate SQL; composing them inside other builders is like composing functions
- **Correlation as Closure Binding** — a correlated subquery closure captures the outer query's table alias; the closure receives the outer builder and uses it to reference columns

## Internal Mechanics
When a closure is passed to `where()`, `whereExists()`, `whereIn()`, or `addSelect()`, Laravel creates a new `Query\Builder` instance, passes it to the closure, then extracts the SQL and bindings from that sub-builder. The subquery's SQL is concatenated into the parent query. Bindings from the subquery are merged into the parent's binding arrays at the correct position.

Key internal flow for `addSelect(function ($query) { ... })`:
1. Laravel creates a new `Query\Builder` and passes it to the closure
2. The closure builds constraints on the sub-builder
3. Laravel calls `$subQuery->toSql()` and wraps it in parentheses
4. Laravel calls `$parentQuery->addBinding($subQuery->getBindings(), 'select')`
5. The subquery SQL fragment is appended to the SELECT clause

For correlated subqueries, the closure receives the parent query as well, so the sub-builder can reference parent columns: `function ($query) { $query->selectRaw('count(*)')->from('orders')->whereColumn('orders.user_id', 'users.id'); }`.

## Patterns
- **Latest Related Record** — `User::addSelect(['last_login_at' => Login::select('created_at')->whereColumn('user_id', 'users.id')->latest()->take(1)])`
- **Count as Column** — `User::addSelect(['post_count' => Post::selectRaw('count(*)')->whereColumn('user_id', 'users.id')])`
- **Exists Filter** — `User::whereExists(fn($q) => $q->select(DB::raw(1))->from('orders')->whereColumn('user_id', 'users.id'))`
- **Where In Subquery** — `User::whereIn('id', fn($q) => $q->select('user_id')->from('orders')->where('total', '>', 100))`
- **Subquery Order By** — `User::orderByDesc(Post::select('created_at')->whereColumn('user_id', 'users.id')->latest()->take(1))`
- **Subquery From** — `DB::table(fn($q) => $q->select('avgs.*')->from('scores')->groupBy('team_id'), 'avgs')->where('avg', '>', 80)`

## Architectural Decisions
- **Why Not Always Use Joins?** — subqueries avoid row multiplication from joins and can express relationships that are hard with joins (e.g., "latest row per group").
- **Why Closure Over Raw Strings?** — closures allow the builder to manage bindings automatically, preventing SQL injection and binding-order errors.
- **Why Separate Binding Arrays?** — subquery bindings are merged into the correct parent binding array (select, where) to maintain proper SQL parameter order.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Single query replaces N+1 | Subqueries can be slower than joins on large datasets | Profile both subquery and join approaches |
| Clean relationship-in-column syntax | Correlated subqueries run per-row; can be expensive | Use joins for multi-value relationships |
| Automatic binding management | Closure complexity can obscure generated SQL | Call `->toSql()` to verify subquery output |
|  |  |  |

## Performance Considerations
- **Correlated subqueries execute per outer row** — on large tables, a join may be faster despite row multiplication
- **`whereExists` with `SELECT 1`** — the most efficient exists check; the database ignores the select list
- **Subquery in ORDER BY** — can prevent index usage; test with `EXPLAIN`
- **Binding overhead** — each subquery adds bindings; extreme nesting may hit database binding limits (e.g., SQLite limit of 999)

## Production Considerations
- **Always verify with `toSql()`** — complex subqueries can generate unexpected SQL; inspect before deploying
- **Use `EXPLAIN`** — run `$query->explain()` to verify index usage on subquery-heavy queries
- **Beware N+1 in subqueries** — a correlated subquery inside a loop is effectively N+1 at the database level
- **Cache subquery results** — for subqueries that return static aggregates (e.g., total count), cache the result rather than recomputing

## Common Mistakes
- **Missing `whereColumn` correlation** — forgetting to correlate the subquery to the outer query produces a scalar subquery that returns the same value for all rows
- **Subquery in select without alias** — all subquery selects must have an alias: `addSelect(['alias' => $subQuery])`
- **Binding order mismatch** — mixing `whereRaw` with subqueries can misorder bindings; use closure syntax instead
- **Over-nesting** — deeply nested subqueries are hard to read and the database optimizer may struggle

## Failure Modes
- **Scalar subquery returns multiple rows** — if a subquery used as a column returns more than one row, the database throws a runtime error
- **N+1 disguised as single query** — a correlated subquery that filters by `whereColumn` but the outer query returns 10k rows executes the subquery 10k times (optimizer may cache, but not guaranteed)
- **Database-specific SQL errors** — `JSON_EXTRACT` subqueries that work in MySQL fail in SQLite or PostgreSQL

## Ecosystem Usage
- **Laravel Scout** — uses subqueries internally for search result ordering
- **Laravel Nova** — uses subqueries for relationship counts and "latest related" columns in resource tables
- **Laravel Filament** — advanced table filters use subqueries for "has" and "whereHas" relationship conditions
- **staudenmeir/eloquent-has-many-deep** — uses deep joins and subqueries for nested relationship queries

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Relationship Basics

### Related Topics
Conditional Clauses, Performance Tradeoffs, Hybrid Strategies

### Advanced Follow-up Topics
To Base Pattern, Custom Builder Pattern, Domain-Specific Query Methods

## Research Notes
- **Source Analysis:** Subquery support is in `Illuminate\Database\Query\Builder` methods: `where` closure handler in `where()`, `selectSub()` in `select()`, `fromSub()` in `from()`.
- **Key Insight:** The most powerful subquery pattern is the "subquery select with correlation" — it enables value extraction from related tables without joins, avoiding row duplication.
- **Version-Specific Notes:** Laravel 9+ improved subquery binding merging. Laravel 11 introduced `selectSub` as an explicit method. `whereExists` closures receive the relationship query (with applied scopes) when called on a relation builder.
