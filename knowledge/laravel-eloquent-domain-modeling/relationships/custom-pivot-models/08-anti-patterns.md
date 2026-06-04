# Anti-Patterns: Custom Pivot Models

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Custom Pivot Models

## Anti-Patterns

### Custom Pivot for Every Relation
Creating custom pivot model classes for every `BelongsToMany` relationship, even for FK-only pivot tables with no extra columns. The default `Pivot` class is sufficient for simple key-only pivots.

**Problem:** Unnecessary file count, maintenance overhead, no benefit from the custom class.

**Solution:** Only create custom pivot models when the pivot has behavior beyond raw data access — casts, accessors, methods, or events.

### Inconsistent using() Registration
Registering `->using(CustomPivot::class)` on only one side of the relationship. The other side hydrates pivot rows using the default `Pivot` class, losing all custom behavior.

**Problem:** Inconsistent pivot hydration — custom methods, casts, and behavior work from one direction but not the other.

**Solution:** Always register `->using()` on both sides of the relationship with the same custom pivot class.

### Extending Pivot Instead of MorphPivot
Creating a custom pivot class that extends `Pivot` for polymorphic many-to-many relationships. Write operations like `delete()` and `save()` ignore the morph type, potentially corrupting data.

**Problem:** Data corruption on write operations — type constraint bypassed.

**Solution:** Extend `MorphPivot` (not `Pivot`) for polymorphic many-to-many relationships.

### Heavy Logic on Pivot Models
Placing complex business logic on pivot models that should remain lightweight relationship objects. Pivots represent associations, not aggregate roots.

**Problem:** Overloaded pivot classes; domain logic in the wrong layer; testing complexity.

**Solution:** Keep pivot models lightweight. Move complex logic to dedicated service classes or the parent models.

### Expecting Model Events from attach/detach
Relying on custom pivot model observers or events to fire during `attach()`/`detach()`. These operations work at the query builder level and do not call `save()` on pivot models.

**Problem:** Missing side effects, audit log gaps, broken expectations — observers silently never fire.

**Solution:** Use relationship pivot events (`Pivot\Attached`, `Pivot\Detached`) for attach/detach side effects. Model events only fire on explicit `$pivot->save()`.

### Skipping $incrementing Configuration
Not configuring `$incrementing` on the custom pivot model. The default `Pivot` class has `$incrementing = false` — if the pivot has an auto-increment ID, save operations fail.

**Problem:** Save operation failures, unexpected database errors.

**Solution:** Set `public $incrementing = true` if the pivot has an auto-increment primary key.

### Skipping parent::boot()
Overriding the `boot()` method in a custom pivot model without calling `parent::boot()`. Traits like `HasTimestamps` and `SoftDeletes` initialize in `boot()`.

**Problem:** Silent trait failures, missing timestamps, unexpected behavior.

**Solution:** Always call `parent::boot()` when overriding `boot()` in a custom pivot model.

### Expensive $appends on Pivot
Adding expensive computed accessors to `$appends` on pivot models. Each appended accessor runs on every serialization, multiplying cost by the number of pivot rows.

**Problem:** Slow API responses, increased CPU usage, serialization bottlenecks.

**Solution:** Keep `$appends` minimal or use lazy accessor calls instead of automatic appending.
