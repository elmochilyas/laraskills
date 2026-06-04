# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.12 whereRaw and addBinding for raw expressions
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Raw expressions (`DB::raw`, `whereRaw`, `selectRaw`, `orderByRaw`) bypass Laravel's query builder escaping and parameter binding. `addBinding` allows safely attaching bound parameters to raw expressions, preventing SQL injection while using custom SQL syntax.

---

# Core Concepts

- **DB::raw('expression')**: Creates an unescaped SQL fragment. No parameter binding.
- **whereRaw('sql', [$bindings])**: Raw WHERE clause with bound parameters. Parameters use `?` placeholders.
- **addBinding($values, $type)**: Adds parameter bindings to a specific clause type (where, join, having, order).
- **SQL injection risk**: Raw expressions without bound parameters are vulnerable to SQL injection.

---

# Mental Models

Raw expressions are escape hatches from the query builder's abstraction. `addBinding` is the safe way to attach user-supplied values. Always use bound parameters for any value derived from user input.

---

# Patterns

**Use whereRaw only when needed**: For complex WHERE expressions that the query builder can't express (CASE statements, MATCH...AGAINST, JSON path queries).

**Always bind parameters**: Never concatenate user input into raw SQL strings. Use `?` placeholders and pass bindings array.

**addBinding for constructed queries**: When building raw expressions programmatically, `addBinding` attaches parameters to the correct clause type.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Full SQL expressiveness | Bypasses query builder safety | SQL injection risk with careless usage
Required for database-specific features | Cross-database compatibility lost | Migration to different DB requires refactoring

---

# Common Mistakes

**String interpolation in raw SQL**: `->whereRaw("status = '$status'")` — SQL injection vulnerability. Use `->whereRaw('status = ?', [$status])`.

**Not using addBinding for constructed queries**: Building raw SQL with `implode()` and embedding values creates SQL injection vectors.

---

# Related Knowledge Units

2.10 Query builder methods | 2.11 Where clause types | 4.10 Function wraps in WHERE clause
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

