# Custom Pivot Models

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Custom Pivot Models
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Custom pivot models extend the base `Illuminate\Database\Eloquent\Relations\Pivot` class to attach behavior, accessors, mutators, casts, and business logic to many-to-many intermediary rows. When a pivot table carries more than just foreign keys — timestamps, flags, quantities, or status fields — a custom pivot model transforms the join row from a passive data carrier into an active domain object. Understanding how to define, register, and use custom pivot models is essential for modeling rich many-to-many relationships like memberships, subscriptions, or order line items.

---

## Core Concepts

A custom pivot model extends `Illuminate\Database\Eloquent\Relations\Pivot` (or `Illuminate\Database\Eloquent\Relations\MorphPivot` for polymorphic pivots). To use it, define the model class and reference it via the `->using()` method on the `belongsToMany` definition. The pivot model receives the pivot attributes automatically when the relationship is hydrated. You can add accessors, mutators, `$casts`, `$appends`, events, and any methods to the pivot class just like a regular model. The `Pivot` base class is itself a subclass of `Model`, but with `$incrementing = false` and `$timestamps = false` by default. Custom pivot models can re-enable these features as needed. Accessing the pivot from a related model yields the custom pivot instance rather than the generic `Pivot`, enabling method calls directly: `$user->roles->first()->pivot->expires_at`.

---

## Mental Models

Think of a custom pivot model as **promoting a join table row to a first-class citizen**. In a standard `belongsToMany`, the pivot row is an anonymous edge — it has no behavior. A custom pivot model is like adding a named class to that edge: it can validate itself, compute derived values, dispatch events, and encapsulate the logic of the relationship. This is analogous to how a relational database foreign key relationship can be "promoted" to an entity when it accumulates enough attributes. The pattern is also known as the **Association Object** pattern from domain-driven design — the relationship itself becomes a domain concept.

---

## Internal Mechanics

When `->using(CustomPivot::class)` is called on a `BelongsToMany` instance, Eloquent stores the class name in `$pivotClass`. During hydration (`hydratePivotRelation()`), Eloquent calls `$pivotClass::fromRawAttributes($parent, $attributes, $table, $connection)` instead of the default `Pivot::fromAttributes()`. The `fromRawAttributes()` factory method creates a new instance of the custom pivot class, sets its `$table` and connection, and fills the attributes. The custom pivot model's `$pivot` property (on the related model's relation) is then an instance of the custom class. When serializing to JSON, the pivot attributes are included via `Model::toArray()`, and any `$appends` on the custom pivot class will appear in the output. The relationship query still works identically — the only difference is the runtime type of each pivot row.

---

## Patterns

- **Using `->using()`**: Always call `->using(CustomPivot::class)` on the `belongsToMany` to register the pivot model.
- **Pivot accessors**: Define `getExpirationDateAttribute()` on the pivot to computed values from raw columns.
- **Pivot casts**: Use `protected $casts = ['expires_at' => 'datetime']` on the pivot to automatically type-cast pivot columns.
- **Domain logic on pivot**: Place methods like `isActive()`, `markAsExpired()`, or `renew()` directly on the pivot model.
- **Pivot collections**: Override `newCollection()` on the pivot model to return a custom collection with aggregate methods.
- **Composite key identification**: Override `getIncrementing()` to return `false` (default) for pure relation pivots, or `true` if the pivot has its own identity.

---

## Architectural Decisions

The `->using()` method was introduced (Laravel 5.8+) to solve the problem of "anemic pivot rows." Before custom pivot models, developers had to either access raw pivot data via `$model->pivot->attribute` with no type safety, or create dedicated models with their own table (losing the automatic many-to-many relationship management). The `->using()` approach keeps the `belongsToMany` syntax while giving each pivot row a typed object. Laravel chose not to make this configurable via model properties (like `$pivotModel`) to keep the relationship definition explicit at the call site.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Rich behavior on pivot rows | Additional class to maintain per pivot table | Every many-to-many with extra attributes needs a dedicated file |
| Type safety and auto-casting | Pivot model constructor can't be customized easily | Use `fromRawAttributes()` override for custom construction logic |
| Accessors/mutators work naturally | Serialization complexity increases with `$appends` | JSON output includes pivot data; be mindful of API response size |
| Relationship methods remain unchanged | IDE support for custom pivot methods on `->pivot` requires PHPDoc annotations | Use `@property` and `@method` annotations on the relationship model |

---

## Performance Considerations

Custom pivot models add no query overhead — the SQL is identical to a standard `BelongsToMany`. The only additional cost is object instantiation for each pivot row, which is negligible (<1µs per pivot). However, eager loading large collections (thousands of pivots) will instantiate thousands of pivot model objects. If the pivot model has expensive accessors or `$appends`, the serialization cost can be significant. Use lazy property loading or cached accessors for expensive pivot computations.

---

## Production Considerations

Custom pivot models participate in the model lifecycle: events, observers, and serialization all apply. If a pivot model has `$casts`, ensure the cast types are available in production (e.g., `Carbon` for datetime casts). The pivot model's `$table` property must match the actual pivot table name, or be left unset (it's set dynamically). When using `sync()` or `attach()`, the pivot model's events are not fired — only `attach`/`detach` relationship events are dispatched. See pivot-events KU for details.

---

## Common Mistakes

- **Not calling `->using()` on both sides of the relationship**: Why it happens: the pivot class is defined on one model's `belongsToMany` but forgotten on the inverse. Why it's harmful: one direction returns generic `Pivot` instances, the other returns custom pivot instances — inconsistent behavior. Better approach: define the `->using()` in a trait or base class shared by both models.
- **Assuming pivot model events fire on `attach()`/`detach()`**: Why it happens: developers expect saving/created events on the pivot model. Why it's harmful: observer logic on the pivot class silently never executes during `sync()`. Better approach: use the `attached`/`detached` relationship events or listen on the pivot table directly.
- **Not calling `parent::boot()` in the pivot's `boot()` method**: Why it happens: overriding `boot()` without the parent call. Why it's harmful: `Pivot` boot traits (like `HasTimestamps`) don't initialize. Better approach: always call `parent::boot()` in custom pivot `boot()`.
- **Forgetting `$incrementing` configuration**: Why it happens: assuming the pivot has an auto-incrementing ID. Why it's harmful: save operations may fail or behave unexpectedly. Better approach: explicitly set `public $incrementing = false` on the pivot (or `true` if it has its own auto-ID column).

---

## Failure Modes

- **Class not found**: If `->using()` references a class that doesn't exist or isn't autoloaded, hydration throws a `Class "App\Models\CustomPivot" not found` error.
- **Table mismatch**: If the pivot model overrides `$table` with a value different from the actual pivot table, queries fail with table not found.
- **Serialization overflow**: If `$appends` on the pivot model triggers lazy-loaded relationships on serialization, it can cause N+1 queries in API responses.
- **Incremental ID conflicts**: If a custom pivot uses auto-increment but the relationship expects composite key behavior, `attach()` with existing pairs fails on duplicate entry rather than updating.

---

## Ecosystem Usage

Spatie's `laravel-permission` package uses custom pivot models (`PermissionPivot`, `RolePivot`) to add team context and guard name tracking to the `model_has_roles` pivot. Laravel Nova's relationship fields respect custom pivot models and display `$appends` attributes. The `laravel-auditable` pattern often uses custom pivots to store metadata about who created a relationship and when.

---

## Related Knowledge Units

### Prerequisites
- pivot-table-conventions (table naming, composite keys, migration structure)
- Eloquent Model Fundamentals (accessors, mutators, casts, serialization)

### Related Topics
- pivot-attributes (accessing pivot data with `withPivot`)
- pivot-events (lifecycle of attach/detach/update on pivot rows)
- morph-pivot (custom pivot models for polymorphic relationships)

### Advanced Follow-up Topics
- Pivot model observers and event patterns
- Composite key usage in custom pivot models
- Pivot model inheritance hierarchies for multi-tenant pivots

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Relations\Pivot` at `src/Illuminate/Database/Eloquent/Relations/Pivot.php`. The `fromRawAttributes()` static factory (line ~55) creates pivot instances. `BelongsToMany::using()` at `src/Illuminate/Database/Eloquent/Relations/BelongsToMany.php` stores the class name and `hydratePivotRelation()` on the relation uses it.

### Key Insight
Custom pivot models are the bridge between "relational join table" and "domain association object." They allow you to treat a database row that has no independent identity as if it has behavior — without creating a full model with its own table.

### Version-Specific Notes
`->using()` is available since Laravel 5.8. In Laravel 9+, pivot models can use `HasUlids` and `HasUuids` traits if they have their own primary key. Laravel 11 did not change pivot model mechanics.
