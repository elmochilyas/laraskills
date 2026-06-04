# Builder Fundamentals — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Builder Fundamentals
- **ECC Version:** 1.0

## Overview
The Eloquent Builder (`Illuminate\Database\Eloquent\Builder`) and Query Builder (`Illuminate\Database\Query\Builder`) are the core API for all database interactions in Laravel. Understanding their proxy architecture, method chaining mechanics, constraint vs terminal methods, and binding system is prerequisite to every other query-strategy concept.

## Core Concepts
- Eloquent Builder proxies to Query Builder while adding model-aware features (hydration, relationships, scopes)
- Method chaining: each constraint returns `$this`, enabling fluent composition
- Constraint methods append SQL clauses (WHERE, JOIN, ORDER BY, LIMIT)
- Terminal methods execute the query (`get`, `first`, `paginate`, `count`, `cursor`)
- Query Builder manages bindings in separate arrays per clause type (`where`, `having`, `join`, `union`)
- `toSql()` compiles SQL without executing; `dd()`/`dump()` shows SQL with bindings

## When To Use
- Use Eloquent Builder as the default for all model queries
- Use Query Builder when you need raw SQL features (JSON operators, CTEs, full-text)
- Use `toBase()` when you want Eloquent's builder API but skip hydration overhead
- Use `chunk()`/`chunkById()` for memory-safe batch processing of large datasets
- Use `cursor()` for streaming iteration without loading all results into memory

## When NOT To Use
- Do NOT use Eloquent Builder when you must bypass all global scopes (use `DB::table()` or `withoutGlobalScopes()`)
- Do NOT use `get()` for result sets exceeding memory limits (use `cursor()` or `chunk()`)
- Do NOT reuse builder instances after terminal methods — builder state is mutable and undefined after execution
- Do NOT use `whereRaw` with unbound user input (SQL injection risk)

## Best Practices (WHY)
- Always terminate builder chains: a builder without a terminal method returns a Builder object, not results
- Prefer `where(fn $q => ...)` closures over raw boolean logic for readability and SQL grouping
- Use `toSql()` during development to verify generated SQL matches expectations
- Return `$this` from `when()` callbacks explicitly to avoid silent no-ops
- Use `select(['id', 'name'])` to limit hydration overhead and data transfer

## Architecture Guidelines
- Keep builder chains in controllers/services short; extract complex queries to scopes or query objects
- Encapsulate raw SQL inside `DB::raw()` calls; avoid spreading raw expressions across the codebase
- Use repository or query-object classes for complex multi-model query logic
- Prefer the Eloquent Builder API over dropping to raw SQL whenever possible for type safety

## Performance
- Builder instantiation is negligible; optimize at the query-execution level
- Hydration overhead: 2-5µs per model, 2-4KB memory per model
- N+1 is the dominant performance problem — always eager-load relationships in loops
- `cursor()` uses unbuffered queries; the connection stays busy until iteration completes
- `chunkById()` is stable against row insertion shifting (unlike offset pagination)

## Security
- Always use parameterized `where` clauses, never concatenate user input into SQL strings
- `whereRaw` with `?` placeholders is safe; avoid `whereRaw("col = '$input'")`
- `DB::raw()` bypasses binding — ensure raw expressions do not contain user input
- Validate and whitelist column names passed to `orderBy($userInput)` — unvalidated column names can leak data structure

## Common Mistakes
- Forgetting terminal methods — `User::where('active', true)` returns a Builder, not results
- Assuming builder immutability — storing a builder and reusing it includes previous constraints
- Wrong `where` signature — `where('age', 18)` is equality; `where('age', '>', 18)` needs three arguments
- Binding count mismatches in `whereRaw` — use `?` placeholders, not string interpolation
- Calling `get()` on the builder after `toBase()` returns a Query Builder, not an Eloquent Builder

## Anti-Patterns
- **Builder Reuse**: storing a builder instance and adding constraints incrementally for different queries
- **Implicit Get**: forgetting `->get()` and passing the builder to a view (which calls `toArray()` on it)
- **Raw Everywhere**: using `DB::raw()` for simple `WHERE` clauses that the builder supports natively
- **Giant Chains**: single builder chain exceeding 20+ methods — extract to scopes or query objects
- **N+1 in Builder**: iterating builder results and lazily loading relationships inside the loop

## Examples
```php
// Basic fluent chain
$users = User::where('active', true)
    ->whereHas('posts', fn($q) => $q->where('published', true))
    ->orderBy('name')
    ->take(10)
    ->get();

// Debugging
User::where('email', 'like', '%@example.com')->dd();

// Memory-safe batch processing
User::where('active', true)->chunkById(100, function ($users) {
    foreach ($users as $user) {
        // process
    }
});

// Query Builder for reporting
DB::table('orders')
    ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
    ->where('created_at', '>=', now()->subDays(30))
    ->groupBy(DB::raw('DATE(created_at)'))
    ->get();
```

## Related Topics
- Conditional Clauses — `when()` and `unless()` for runtime conditional constraints
- Subqueries — embedding SELECT statements within WHERE, FROM, or SELECT clauses
- Local Scopes — reusable named query constraints on models
- To Base Pattern — using `toBase()` to skip hydration while keeping Eloquent builder API

## AI Agent Notes
- When generating builder chains, always include a terminal method (`get`, `first`, `paginate`, etc.)
- Prefer `where(fn $q => ...)` syntax for nested OR/AND logic over multiple `where` calls
- Use `toSql()` or `dd()` to verify generated SQL when using complex chains
- Remember that Eloquent Builder and Query Builder share the same underlying Query\Builder instance

## Verification
- [ ] Builder chain produces correct SQL (verified via `toSql()`)
- [ ] All terminal methods return expected types
- [ ] No N+1 queries in loops (verified via `DB::listen()` or Telescope)
- [ ] `whereRaw` and `DB::raw` calls use parameterized bindings
- [ ] `chunk()` or `cursor()` used for result sets > 1000 rows
- [ ] Builder instances are not reused across separate queries
