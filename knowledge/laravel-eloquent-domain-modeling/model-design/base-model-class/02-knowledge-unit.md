# Base Model Class

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Design
- **Knowledge Unit:** Base Model Class
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
Every Eloquent model extends `Illuminate\Database\Eloquent\Model`. This base class provides the Active Record implementation — column property access, relationship resolution, event dispatching, serialization, and mass assignment protection. Understanding what the base class does (and does not enforce) is the starting point for all model design decisions.

---

## Core Concepts

1. **Active Record Foundation** — Each model instance wraps a database row; properties map to columns, methods map to query builders or relationships.
2. **Mass Assignment Protection** — `$fillable` and `$guarded` control which attributes may be set in bulk via `create()` or `update()`. Laravel defaults to guarding all attributes (`$guarded = ['*']`).
3. **Default Attribute Values** — The `$attributes` property can declare defaults that are applied on instantiation before any data is hydrated.
4. **Connection Routing** — `$connection` lets a model target a non-default database connection (read/write replicas, shards, external databases).
5. **Timestamp Customization** — `CREATED_AT` and `UPDATED_AT` constants (or `$createdAt`/`$updatedAt` properties) override the default `created_at` / `updated_at` column names.
6. **Force Create** — `forceCreate()` bypasses mass assignment protection entirely; used internally by relationships and factory methods.
7. **Dynamic Property Access** — `__get` and `__set` intercept undefined property reads/writes, routing them to attribute accessors/mutators, relationship resolvers, or raw column data (via `getAttribute` / `setAttribute`).

---

## Mental Models

### Model as a Record Envelope
Think of a model instance as an envelope around a row of data. The envelope provides methods for saving, deleting, and relating data, but the contents (attributes) are just the column values.

### The Scaffold Metaphor
The base `Model` class is a scaffold — it provides structure (timestamps, guarded attributes, connection info) but imposes very few constraints on how you organise your domain logic. You build the walls (custom methods, scopes, accessors) onto this scaffold.

---

## Internal Mechanics

### Attribute Resolution Chain
When you access `$model->foo`:
1. `__get('foo')` calls `getAttribute('foo')`
2. Checks for an accessor (`getFooAttribute`)
3. Checks for a relationship with that name
4. Falls back to `$this->attributes['foo']` from the `$attributes` array

### Mass Assignment Guard Logic
`fill()` iterates over the input array, checks each key against `$fillable` or `$guarded`, and only sets attributes that pass the guard. Non-fillable attributes are silently discarded (unless `preventSilentlyDiscardingAttributes` is enabled).

### Timestamps Auto-Hydration
On `creating` / `saving` events, if `$timestamps` is `true`, the model sets `created_at` / `updated_at` to `now`. On `updating`, only `updated_at` is refreshed. The column values are Carbon instances once hydrated.

---

## Patterns

### Custom Base Model Pattern
For projects with consistent cross-cutting behaviour, create an `App\Models\BaseModel` that extends `Illuminate\Database\Eloquent\Model` and then have all domain models extend that custom base.

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

abstract class BaseModel extends Model
{
    protected $connection = 'mysql';
    public $incrementing = true;
    protected $keyType = 'int';
}
```

### Force Create for Bulk Operations
When you need to bypass fillable guards in controlled internal code:
```php
$model->forceCreate(['email' => '...']); // bypasses fillable
```

---

## Architectural Decisions

### Decision: Extend `Model` Directly vs. Custom Base Class
- **Direct:** Simpler, less indirection, ideal for small projects or prototyping.
- **Custom Base:** Centralises connection config, UUID/ULID key defaults, strict mode, or global scopes. Recommended for teams >3 or apps with >15 models.
- **Tradeoff:** A custom base adds abstraction cost; deep inheritance chains make it harder to trace behaviour.

### Decision: `$fillable` vs `$guarded`
- `$fillable` (whitelist) is explicit and auditable; prefer for security-sensitive apps.
- `$guarded` (blacklist) with `$guarded = ['*']` is the default and safest — nothing is fillable until you explicitly add `$fillable` entries.
- `$guarded = []` opens all attributes — never use in production.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Active Record is intuitive for CRUD | Couples domain logic to persistence schema | Schema changes ripple through business logic |
| Mass assignment is convenient for forms | Silent attribute discarding can hide bugs | Enable `preventSilentlyDiscardingAttributes` in development |
| Custom base class centralises config | Adds inheritance depth, harder to trace | Keep base class thin — only shared infrastructure |
| `forceCreate()` is useful internally | Violates fillable contract intended for public paths | Never expose in API/controller code |

---

## Performance Considerations

- Each model instance allocates a `Collection` for relations, a `Builder` instance on query, and lazy-load overhead. For bulk reads, use `->cursor()` or raw queries when throughput matters.
- Timestamp auto-setting adds two `Carbon` instantiations per create/update. On bulk inserts/updates via `insert()` / `update()`, timestamps are not auto-handled — you must set them manually.
- The attribute accessor chain (`__get` → `getAttribute`) adds ~dozen method calls per property access. Accessor-heavy models benefit from caching resolved attributes in a local array.

---

## Production Considerations

- **Always** verify the guard on models exposed to user input. A forgotten `$fillable` can expose `is_admin` style columns.
- Set `$connection` explicitly on models that talk to replicas or external databases — do not rely on the default connection for critical data routing.
- Pin the `laravel/framework` version in `composer.json` to avoid unexpected changes in base `Model` behaviour (e.g., timestamp format changes, new method signatures).
- Use a custom base `Model` class to enforce company-wide conventions (strict mode, connection defaults, serialisation format).

---

## Common Mistakes

**Mistake: Relying on `$guarded = ['*']` without ever adding `$fillable`.**
Why it happens: The default guard feels safe and many developers postpone fillable configuration.
Why it's harmful: No attributes can be mass-assigned, so `Model::create($request->all())` silently does nothing. Hours are wasted debugging "insertion failures."
Better approach: Start with `$fillable` on every model as soon as the schema is stable, or accept that you must call `->fill()` with explicit keys (which many teams prefer anyway).

**Mistake: Overriding `newQuery()` without calling parent.**
Why it happens: Developers want to add global scopes or custom builders and forget the parent chain.
Why it's harmful: Breaks relationship resolution, soft-deletes, and many internal Eloquent features.
Better approach: Always `return parent::newQuery()->withUnpresentedScopes(...)` or use traits/boots methods.

**Mistake: Using `forceCreate` in controllers.**
Why it happens: A fast way to bypass mass-assignment errors during development.
Why it's harmful: Exposes the application to mass-assignment vulnerabilities in production paths.
Better approach: Reserve `forceCreate` for internal use (factories, relationship creation, jobs) and always validate input in controllers.

**Mistake: Forgetting timestamp constants on legacy databases.**
Why it happens: Existing schemas use non-standard column names like `added_on`, `last_modified`.
Why it's harmful: Timestamps silently won't update; no error is raised.
Better approach: Override `CREATED_AT` and `UPDATED_AT` constants on the model to match legacy column names.

---

## Failure Modes

1. **Silent Data Loss** — Non-fillable attributes in mass assignment are silently discarded. If `preventSilentlyDiscardingAttributes` is off, data is lost without warning. Mitigation: enable strict mode in development.
2. **Connection Misrouting** — A model without `$connection` defaults to the default database connection. In multi-database setups, data ends up in the wrong database silently. Mitigation: enforce `$connection` via a custom base model or a linting rule.
3. **Timestamp Drift** — When `$dateFormat` does not match the actual column type, timestamps may be serialised incorrectly (string vs. datetime vs. integer). Mitigation: match `$dateFormat` to the underlying column type.
4. **Attribute Shadowing** — Declaring a public property on a model (e.g., `public $name`) shadows the database column and breaks Eloquent's attribute resolution. Mitigation: never declare public properties on model classes.

---

## Ecosystem Usage

- **Laravel Jetstream / Fortify** — Uses `forceCreate` internally for team membership creation, bypassing mass-assignment guards in controlled paths.
- **Spatie Laravel Media Library** — Its `HasMedia` trait expects models to extend `Model` and uses `$fillable` on its intermediate `Media` model for attaching metadata.
- **Laravel Nova** — Relies on the base Model's serialisation (`toArray`, `jsonSerialize`) to render resource fields; customising these methods on the base model affects Nova output.

---

## Related Knowledge Units
### Prerequisites
- **PHP OOP** — Class inheritance, traits, magic methods (`__get`, `__set`)

### Related Topics
- **Model Configuration Properties** — `$table`, `$primaryKey`, `$keyType`, `$incrementing`
- **Strict Mode Configuration** — `preventLazyLoading`, `preventSilentlyDiscardingAttributes`
- **Attribute Registration** — PHP 8 attributes for observers, scopes, collections

### Advanced Follow-up Topics
- **Custom Base Model Patterns** — Multi-tenancy base models, soft-delete base models
- **Eloquent Performance Optimisation** — Attribute caching, model memoisation

---

## Research Notes
### Source Analysis
The `Illuminate\Database\Eloquent\Model` class (~4,000 lines in Laravel 11) is the single largest class in the framework. Its `fill()` method (line ~560) implements the mass-assignment guard loop. The `getAttribute` / `setAttribute` methods (line ~850, ~920) form the core of Eloquent's property magic.

### Key Insight
The base Model class is designed to be a thin Active Record wrapper — it provides *mechanism* (save, delete, query) but not *policy* (which attributes are safe, which connections to use, how to serialise). Policy decisions are deliberately left to the developer, which is why so many configuration properties exist and why strict mode was added later.

### Version-Specific Notes
- Laravel 9+: `$model->wasChanged()` without arguments now returns whether any attribute changed (previously required an attribute name).
- Laravel 10+: Strict mode methods (`Model::preventLazyLoading()`, `Model::preventSilentlyDiscardingAttributes()`, `Model::preventAccessingMissingAttributes()`) introduced as fluent API.
- Laravel 11+: `shouldBeStrict()` convenience method that enables all three protection modes at once.
