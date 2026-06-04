# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.18 Model serialization (toArray, toJson, hidden, visible, append)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Model serialization converts models and collections to arrays or JSON for API responses. The `hidden` and `visible` properties control which attributes are included. `append` adds computed attributes (accessors) to the serialized output.

---

# Core Concepts

- **toArray()**: Converts model + loaded relationships to a nested array.
- **toJson()**: JSON-encodes the result of `toArray()`.
- **$hidden**: Array of attribute names to exclude from serialization (passwords, tokens).
- **$visible**: Whitelist of attributes to include (alternative to hidden).
- **$appends**: List of accessor attributes to include in serialization (not stored in DB).
- **API Resources**: Dedicated transformation layer (`App\Http\Resources\PostResource`) for fine-grained control.

---

# Patterns

**Hide sensitive attributes**: `protected $hidden = ['password', 'remember_token', 'api_key']`.

**Append computed fields**: `protected $appends = ['full_name', 'is_active']` — adds accessor results to JSON output.

**Use API Resources for endpoint-specific serialization**: Different endpoints need different attribute sets. Resources provide per-endpoint control.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Convenient serialization | Implicit in model | Hidden/appended attributes affect ALL serializations
API Resources provide fine-grained control | More classes to maintain | Better separation of concerns

---

# Common Mistakes

**$appends triggering N+1**: An accessor in `$appends` that lazy loads a relationship causes N+1 on every serialization.

**Not hiding sensitive attributes**: `toJson()` on a user model exposes `password` if not in `$hidden`.

---

# Related Knowledge Units

2.16 Accessors and mutators | 2.17 Casts | 2.27 API resource classes
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

## Mental Models

Eloquent models are active record representations of database rows. Each model instance maps to one row. Relationships are query builders that can be chained and constrained.

