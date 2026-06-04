# Builder Fundamentals

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Eloquent Builder Fundamentals covers the core API of `Illuminate\Database\Eloquent\Builder` and its underlying `Illuminate\Database\Query\Builder`. These two classes form the backbone of all database interactions in Laravel. Mastery of the builder API — method chaining, constraint methods (`where`, `orWhere`, `whereIn`, `whereBetween`, `whereNull`), and terminal methods (`get`, `first`, `paginate`) — is prerequisite to every other query-strategy concept. The fundamental insight is that Eloquent Builder proxies to Query Builder while adding model-aware features (hydration, relationships, global scopes).

## Core Concepts
- **Eloquent Builder** — `Illuminate\Database\Eloquent\Builder` — a proxy layer over Query Builder that adds model-hydration, relation-loading, and scope logic
- **Query Builder** — `Illuminate\Database\Query\Builder` — the SQL-generation engine; all Eloquent queries eventually resolve through it
- **Method Chaining** — each constraint method returns `$this` (the builder instance), enabling fluent composition
- **Constraint Methods** — methods that append SQL clauses (WHERE, JOIN, ORDER BY, GROUP BY, HAVING, LIMIT, OFFSET)
- **Terminal Methods** — methods that execute the query and return a result (`get`, `first`, `value`, `pluck`, `exists`, `count`, `paginate`, `cursor`)
- **Lazy Collection** — `cursor()` returns a lazy collection that iterates one record at a time without loading all into memory
- **Binding System** — parameter bindings are stored sequentially; Eloquent manages distinct binding arrays for `where`, `having`, `join`, and `union` clauses

## Mental Models
- **Query as a Stack** — each chained method pushes a new instruction onto the query stack; terminal methods pop the stack and execute
- **Proxy Architecture** — Eloquent Builder is a decorator around Query Builder; every Eloquent call either handles locally or delegates to the underlying QB
- **Pipeline Model** — query construction is a pipeline: constraints → ordering → pagination → execution → hydration
- **Builder State Machine** — a builder starts clean, accumulates state through constraints, then terminates; reusing a builder after termination has undefined behavior

## Internal Mechanics
Eloquent Builder holds a reference to a Query Builder instance (`$this->query`). When you call `User::where('active', true)`, the static call resolves through Eloquent's model magic to create a fresh Eloquent Builder, which immediately calls `where` on the underlying Query Builder. The Query Builder appends to its `$wheres` array, increments the binding list, and returns itself — which the Eloquent Builder then returns from its own method.

Key internal methods on Query Builder:
- `$wheres[]` — array of clause definitions (`['type' => 'Basic', 'column' => 'active', 'operator' => '=', 'value' => true, 'boolean' => 'and']`)
- `$bindings` — associative array of binding arrays keyed by clause type: `['select' => [], 'from' => [], 'join' => [], 'where' => [], 'having' => [], 'order' => [], 'union' => []]`
- `$columns` — initially `['*']`, replaced by the first `select(...)` call
- `toSql()` — compiles the current query to SQL without running it; useful for debugging
- `get()` — calls `$this->processor->processSelect($this, $this->runSelect())` which runs the SQL, fetches rows, and returns them as `stdClass` objects (Query Builder) or hydrated models (Eloquent)

## Patterns
- **Fluent Constraint Composition** — chain `->where()->orWhere()->whereIn()` to build complex WHERE clauses
- **Parameter Grouping** — pass an array of closures to `where` for nested boolean logic: `where(fn($q) => $q->where('x', 1)->orWhere('y', 2))`
- **Dynamic Where Clauses** — `whereColumn('col1', 'col2')`, `whereDate('created_at', '2024-01-01')`, `whereYear('created_at', 2024)`
- **Exists / Not Exists** — `whereExists($subQuery)`, `whereNotExists($subQuery)` for correlated subquery patterns
- ** Raw Expressions** — `whereRaw('JSON_EXTRACT(data, "$.status") = ?', ['active'])` when SQL functions are needed
- **Order By Raw** — `orderByRaw('FIELD(status, "active", "pending", "archived")')` for custom sort orders

## Architectural Decisions
- **Why Two Builders?** — The split allows framework users to run raw SQL queries (Query Builder) without the overhead of model hydration, while still getting the full ORM experience when needed.
- **Why Immutable-like API?** — While builders are mutable in practice, the API design favors chaining clarity over defensive copying. This means a builder reference captured mid-chain may have unexpected state if the chain continues.
- **Why Bindings Arrays?** — Separating bindings by clause type prevents SQL injection from misordered parameters when complex queries append to different sections.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Fluent API reads naturally left-to-right | Mutable state can surprise on reference reuse | Always complete chains before passing builder references |
| Single method covers most SQL clauses | Magic `where` signatures can be confusing | Learn signature overloading order: (column, operator, value) |
| Query Builder is database-agnostic | Some advanced features require raw SQL | Keep a `->toSql()` debugging habit |
|  |  |  |

## Performance Considerations
- **Builder instantiation is cheap** — creating a builder has negligible overhead; optimize at the query-execution level, not the builder-construction level
- **Binding management** — large queries with hundreds of bindings can slow compilation; batch operations (chunked inserts, upserts) for bulk work
- **Method call overhead** — hundreds of chained calls on a single builder are fine; profile if building queries from user input with many conditions

## Production Considerations
- **Always terminate** — forgetting `->get()` yields an unfinished Builder object, not results; this is a common source of silent bugs
- **Use `toSql()` during debugging** — call `User::where(...)->toSql()` to see the generated SQL; add `->dd()` or `->dump()` for bindings-aware debugging
- **Avoid builder reuse** — never store a builder and call it twice; always create a fresh chain
- **Log slow queries** — configure `DB::listen()` in production to capture and log all executed queries for performance monitoring

## Common Mistakes
- **Forgetting terminal methods** — calling `$query = User::where('active', true)` and expecting it to be a result set (it's a Builder)
- **Assuming immutability** — storing `$baseQuery = User::query()` and reusing it after adding constraints; subsequent uses include previous constraints
- **Wrong `where` signature** — `where('age', 18)` defaults to equality; `where('age', '>', 18)` needs three arguments
- **Binding count mismatches** — using `whereRaw` with unbound user input (SQL injection) or mismatched `?` placeholders

## Failure Modes
- **N+1 via builder** — iterating over builder results and running queries per row is the classic N+1; always eager-load with `with()`
- **Memory exhaustion** — `get()` without limit on large tables loads all rows into memory; use `cursor()`, `chunk()`, or `paginate()`
- **Deadlock on long chains** — complex chains that hold row locks can deadlock; keep transactions short and targeted

## Ecosystem Usage
- **Laravel Debugbar** — displays all executed queries, bindings, and timing; essential for builder debugging
- **Laravel Telescope** — captures query details, slow queries, and model events in development
- **Laravel Query Builder (standalone)** — the `illuminate/database` package can be used outside Laravel
- **Spae/QueryBuilder** — popular package for building Eloquent queries from HTTP request query strings

## Related Knowledge Units

### Prerequisites
SQL basics (SELECT, WHERE, JOIN, subqueries), PHP method chaining

### Related Topics
Conditional Clauses, Subqueries, Local Scopes

### Advanced Follow-up Topics
Custom Builder Pattern, Hybrid Strategies, Decision Framework

## Research Notes
- **Source Analysis:** Laravel source at `Illuminate\Database\Eloquent\Builder` and `Illuminate\Database\Query\Builder`. The Eloquent Builder extends a base Builder and implements the `Builder` contract.
- **Key Insight:** Every Eloquent query passes through Query Builder. Understanding the QB layer unlocks the full power of Eloquent — you can always drop down with `->toBase()` or use `DB::raw()` inside Eloquent chains.
- **Version-Specific Notes:** Laravel 11+ introduced `$builder->dd()` and `$builder->dump()` methods directly on the builder for debug output without `toSql()`. The `chunkById` method now uses `orderBy($column)` by default for better cursor stability.
