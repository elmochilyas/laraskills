# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.15 Scopes (global scopes, local scopes, dynamic scopes)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Scopes encapsulate common query constraints into reusable methods. Global scopes apply to every query on a model (used for multi-tenancy). Local scopes are chainable methods called explicitly. Dynamic scopes accept parameters. Scopes centralize query logic and prevent scattered `where` clauses.

---

# Core Concepts

- **Global scopes**: Applied automatically to all queries on the model. Registered via `boot()` trait method or `addGlobalScope()`. Used for tenant isolation, soft delete filtering.
- **Local scopes**: `scopePopular($query)` called as `Model::popular()->get()`. Reusable query fragments.
- **Dynamic scopes**: Accept parameters: `scopeOfType($query, $type)` called as `Model::ofType('admin')->get()`.
- **Without global scopes**: `Model::withoutGlobalScope('scope_name')` or `Model::withoutGlobalScopes()` to bypass.

---

# Mental Models

Scopes are named query fragments. Global scopes are always-on filters. Local scopes are opt-in helpers. Dynamic scopes are parameterized helpers.

---

# Patterns

**Tenant isolation via global scope**: `addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id))` — applied to every query automatically.

**Soft delete filtering**: Laravel's `SoftDeletes` trait registers a global scope `WHERE deleted_at IS NULL`.

**Common filters as local scopes**: `scopeActive($q)`, `scopeRecent($q)`, `scopePublished($q)`.

---

# Architectural Decisions

| Scope Type | When | When Not |
|-----------|------|----------|
| Global | Always-on filters (tenancy, soft deletes) | Optional filters |
| Local | Reusable query fragments | One-off query conditions |
| Dynamic | Parameterized filters | Filters with many optional params |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Encapsulates query logic | Global scopes are implicit | New devs may not know about them
Reusable across the codebase | Can't easily see full query in one place | Debugging requires scope awareness

---

# Common Mistakes

**Bypassing global scopes accidentally**: Using `DB::table('posts')` instead of `Post::query()` bypasses the global scope. In multi-tenant apps, this leaks data.

**withoutGlobalScope in production code**: Used as a shortcut instead of designing the query correctly. Should be reviewed carefully.

---

# Related Knowledge Units

5.5 Eloquent global scopes for tenant isolation | 2.10 Query builder methods
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

