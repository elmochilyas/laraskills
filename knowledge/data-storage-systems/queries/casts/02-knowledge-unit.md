# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.17 Casts (native types, Enum, custom casts, JSON, encrypted)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Casts define how attribute values are converted between their database representation and PHP types. They handle type coercion, JSON serialization/deserialization, enum hydration, encryption, and custom transformations. Casts are the primary mechanism for type safety in Eloquent models.

---

# Core Concepts

- **Native casts**: `array`, `boolean`, `datetime`, `decimal:n`, `double`, `float`, `integer`, `object`, `string`, `timestamp`.
- **Enum casts**: Map database values to PHP enums. `protected $casts = ['status' => OrderStatus::class]`.
- **JSON casts**: Auto-serialize/deserialize arrays/objects to JSON columns.
- **Encrypted casts**: `encrypted` — auto-encrypt/decrypt attribute values using Laravel's encryption.
- **Custom casts**: Implement `CastsAttributes` interface for complex transformations.

---

# Mental Models

Casts are getter/setter middleware for model attributes. They run on every read/write, providing consistent type transformation without cluttering the model with accessors/mutators.

---

# Internal Mechanics

When a model is hydrated from the database, Eloquent applies casts to each attribute's raw value. When the model is saved, casted values are transformed back to database-compatible types. Custom casts run on both read and write via `get` and `set` methods.

---

# Patterns

**Use casts over accessors for type conversion**: `'is_admin' => 'boolean'` is simpler than `getIsAdminAttribute()`.

**Enum casts for status fields**: `'status' => PostStatus::class` ensures type safety and prevents invalid status values.

**Encrypted casts for PII**: `'ssn' => 'encrypted'` automatically encrypts on write, decrypts on read.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Consistent type transformation | Cast overhead on every attribute access | Negligible for most applications
Encrypted casts provide automatic PII protection | Encrypted columns cannot be queried with LIKE or WHERE = | Search requires application-level workarounds

---

# Common Mistakes

**Casting to integer for large numbers**: `bigInteger` columns may overflow PHP's integer type. Use `decimal` or string casts for large values.

**JSON cast without json column type**: Casting to `array` on a string column works but loses the database's JSON validation.

---

# Related Knowledge Units

2.16 Accessors and mutators | 2.18 Model serialization
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

## Architectural Decisions

Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

