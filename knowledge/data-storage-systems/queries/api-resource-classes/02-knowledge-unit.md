# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.27 API resource classes and data shaping
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

API Resource classes provide a dedicated transformation layer between Eloquent models and JSON responses. They enable per-endpoint data shaping, conditional attribute inclusion, relationship loading, and pagination wrapping. Resources prevent the "one model serialization fits all endpoints" anti-pattern.

---

# Core Concepts

- **Resource class**: Extends `JsonResource`. Defines `toArray($request)` returning the data structure for the endpoint.
- **Resource collection**: `ResourceCollection` for paginated/sparse collections.
- **Conditional attributes**: `when($condition, $value)`, `whenLoaded('relation')`, `whenHas('column')`.
- **Pagination wrapping**: `PostResource::collection($posts)` wraps paginated results with meta information.

---

# Mental Models

Resources are view-models for API responses. They transform internal model state to external representation. The controller decides which resource to use; the resource decides the shape.

---

# Patterns

**Narrow attribute selection**: Only include attributes the endpoint consumer needs. Don't expose internal columns.

**Conditional relationship loading**: `'comments' => $this->whenLoaded('comments')` — only include if eager loaded.

**Resource per endpoint**: Different resources for list vs detail views. List resources are sparse; detail resources are full.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Explicit per-endpoint data shapes | More classes to maintain | Separates data transformation from model
Conditional attributes prevent over-fetching | Conditional logic adds complexity | Cleaner API contracts

---

# Common Mistakes

**Accessor causing N+1**: A resource accesses `$this->someRelation->count()` which lazy loads the relation. Use `whenLoaded` or preload the relationship.

**Including too many fields by default**: The resource includes all model attributes, exposing sensitive columns. Be explicit about included fields.

---

# Related Knowledge Units

2.18 Model serialization | 2.3 Eager loading
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

