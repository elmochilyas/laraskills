# withDefault — Null Object Pattern for Relationships

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** default-models
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
`withDefault()` on a `BelongsTo` (or `HasOne`, `MorphOne`) relationship configures Eloquent to return a default model instance instead of `null` when no related record exists. This implements the Null Object pattern at the ORM layer — eliminating conditional `null` checks throughout the codebase. Defaults can be an empty model instance, an instance with pre-set attributes, or a callable that returns a custom instance.

---

## Core Concepts
Calling `return $this->belongsTo(Author::class)->withDefault()` on a `Post` model ensures `$post->author` never returns `null`. Without arguments, it returns a new `Author` instance with default attribute values. With an array: `->withDefault(['name' => 'Guest Author'])` — sets default attributes. With a callable: `->withDefault(fn($post) => new Author(...))` — dynamic default generation. The default model behaves identically to a real related model for attribute access, method calls, and serialization.

---

## Mental Models
Think of `withDefault()` as a **fallback value** — like `??` in PHP or `.getOrDefault()` in collections. Instead of writing `$post->author?->name ?? 'Guest'`, you define the default at the relationship level and simply write `$post->author->name`. The default model is transparent — it uses the same class, supports the same methods, but has `$exists = false` and `$relationLoaded = true`.

---

## Internal Mechanics
When `withDefault()` is called on the relationship definition, it sets a `$default` property on the `BelongsTo` (or `HasOne`/`MorphOne`) instance. During relation hydration, if the eager-loading query finds no matching row, the relationship resolver checks for `$default`. If set, it instantiates a new model: if a callable, it calls it passing the parent model; if an array, it fills a new instance with those attributes; if `true`, a bare instance. The default model has `$exists = false`, so `$model->exists` and `$model->wasRecentlyCreated` are both `false`. The `getRelationValue()` method returns this default instead of `null`.

---

## Patterns
- **Guest author fallback**: `Post ->belongsTo(Author::class)->withDefault(['name' => 'Guest'])`
- **Empty settings object**: `User ->hasOne(Settings::class)->withDefault()` — always has settings
- **Dynamic defaults**: `->withDefault(fn($post) => new Author(['name' => "Author of {$post->title}"]))`
- **Chain-safe access**: Eliminates `$post->author?->name` — just `$post->author->name`
- **Default with relationship**: Default model can have its own relationships accessed safely

---

## Architectural Decisions
The Null Object pattern is applied at the relationship layer rather than in application code or accessors. This decision centralizes the fallback logic in the model definition, making it visible and consistent across all consumers. The tradeoff is that a developer unfamiliar with the default may be surprised that a relationship never returns `null`, masking missing data bugs. The `$exists = false` flag preserves the ability to detect defaults when needed.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eliminates null checks everywhere | Hides the distinction between "no relation" and "null" | Debugging may require checking `$model->exists` |
| Centralized default logic | Default model may behave differently than real model | Defaults miss accessors, casts, and events of persisted models |
| Supports dynamic, context-aware defaults | Callable defaults create coupling between models | The parent model is passed to the callable, creating bidirectional knowledge |
| Reduces template conditionals | Serialization includes default attributes | JSON/API responses always include the relation key |

---

## Performance Considerations
`withDefault()` has zero query cost — the default model is constructed in PHP without a database call. The instantiation of a default model is negligible (microseconds). However, accessing the default model's relationships will trigger lazy loading unless they are also eager-loaded or have defaults. Be cautious with callable defaults that perform database lookups.

---

## Production Considerations
Defaults are safe for API responses — they guarantee the relation key is always present in JSON output. However, this can mask incomplete data: if a `Profile` model should always exist but a bug deletes it, `withDefault()` silently papers over the gap. Add monitoring or health checks for expected relations. When migrating existing code, introducing `withDefault()` may change serialization output (null becomes an object) — this can break API clients expecting `null`.

---

## Common Mistakes
- Applying `withDefault()` on a `hasMany` relation (only works on singular relations: BelongsTo, HasOne, MorphOne).
- Expecting the default model to persist when saved — `save()` on a default model creates a new record but does not link it back.
- Using attributes on the default model that trigger `null` errors in accessors or casts.
- Forgetting that `withDefault()` applies to lazy loading as well — even `$post->author` (lazy) returns the default.

---

## Failure Modes
- **Default model accessor crash**: If the default model lacks a database value, an accessor that expects a non-null column may crash.
- **Serialization leak**: Default models with `$appends` attributes may expose computed values based on null database columns.
- **False positive existence**: Code that checks `$post->author->exists` will correctly get `false`, but code that checks `$post->relationLoaded('author')` will get `true`.
- **Callable default exception**: A callable that throws will break the relationship access for all parent models without a related record.

---

## Ecosystem Usage
Laravel Jetstream uses `withDefault()` for team settings. Spatie's `laravel-permission` uses it for default role assignments. Most SaaS models that have a "settings" or "profile" sub-model use `withDefault()` to guarantee the nested object always exists.

---

## Related Knowledge Units
### Prerequisites
- BelongsTo / HasOne / MorphOne relationship definitions
- Null Object design pattern
- Eloquent model `$exists` property

### Related Topics
- Model accessors and casts (interaction with default values)
- Relationship lazy loading vs eager loading
- Serialization of model relationships

### Advanced Follow-up Topics
- Null Object vs nullable relationship design tradeoffs
- Default model factories for testing
- Observer pattern with default models (events not fired for defaults)

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Relations\BelongsTo::withDefault()`. Also implemented on `HasOne` and `MorphOne`. The `getDefaultValue()` method in the Relation base class handles the callable/array/bool resolution.
### Key Insight
The default model's `$exists = false` is the critical distinction. All serialization, relationship access, and persistence behavior flows from this single property. The model looks real but the ORM knows it was never fetched from the database.
### Version-Specific Notes
- Laravel 5.x+: `withDefault()` existed but only supported boolean/array.
- Laravel 8+: Callable defaults introduced.
- Laravel 9+: Default models participate in serialization with proper `$exists` flag.
- Laravel 11+: Performance improvement — default model instantiation no longer fires model events.
