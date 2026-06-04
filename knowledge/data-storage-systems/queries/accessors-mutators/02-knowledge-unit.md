# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.16 Accessors and mutators (get{Attribute}Attribute, set{Attribute}Attribute)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Accessors transform attribute values when read from the database. Mutators transform values before saving to the database. They centralize data transformation logic in the model rather than scattering it across controllers and views.

---

# Core Concepts

- **Accessor**: `getNameAttribute($value)` — called when `$model->name` is accessed. Transforms the raw database value.
- **Mutator**: `setNameAttribute($value)` — called when `$model->name = $value` is set. Transforms before database write.
- **Attribute casting**: `protected $casts = ['is_admin' => 'boolean']` — simpler alternative for type conversions.
- **Return type**: Accessors must return the transformed value. Mutators set `$this->attributes['name'] = $transformed`.

---

# Mental Models

Accessors decorate attribute reads. Mutators clean attribute writes. They're middleware for individual columns.

---

# Patterns

**Value normalization in mutators**: Strip whitespace, format phone numbers, hash passwords, trim strings.

**Computed read-only attributes**: Full name from first + last name. These should be in accessors, not stored in DB.

**Use casts over mutators for type conversion**: Casts are simpler and less error-prone for type transformations (JSON, boolean, datetime).

---

# Common Mistakes

**Accessors that query the database**: An accessor that calls `$this->relation()->first()` triggers a lazy load. Eager load the relationship instead.

**Mutators that don't set the attribute**: `$this->name = $value` in a mutator causes infinite recursion. Use `$this->attributes['name']`.

---

# Related Knowledge Units

2.17 Casts | 2.18 Model serialization
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

