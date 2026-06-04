# Anti-Patterns: Hidden / Visible

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Hidden / Visible

## Anti-Patterns

### Using Both $hidden and $visible
Setting both `$hidden` and `$visible` on the same model. When `$visible` is set, `$hidden` is silently ignored — this creates a false sense of security.

**Problem:** `$hidden` is silently ignored; attributes thought to be hidden are exposed.

**Solution:** Use either `$hidden` (blacklist) or `$visible` (whitelist), never both on the same model.

### $visible Without Testing
Using `$visible` as a security measure without testing that newly added columns are added to it. A new column added to the database is automatically excluded from serialization — but may be silently missing from API responses.

**Problem:** Silent omission of expected attributes in API responses; missing data that consumers depend on.

**Solution:** Test serialization output structure and add CI checks that flag new columns not in `$visible`.

### Instance Mutation via makeHidden
Calling `makeHidden` or `makeVisible` on a model instance that is passed through a pipeline, affecting downstream consumers. The mutation changes the instance permanently.

**Problem:** Downstream code receives a mutated instance with unexpected hidden/visible state; race conditions in shared contexts.

**Solution:** Clone the instance or use `->fresh()` before applying runtime visibility changes: `$model->replicate()->makeHidden('field')`.

### No $pivotHidden on Many-to-Many
Configuring `$hidden` on a model but forgetting `$pivotHidden` for its BelongsToMany pivot columns. Pivot data like `created_at` or `assigned_by` leaks into serialized output.

**Problem:** Pivot columns unexpectedly exposed in API responses; data leakage of relationship metadata.

**Solution:** Define `$pivotHidden` on every model with a BelongsToMany that has extra pivot columns.

### Using $hidden as a Substitute for $guarded
Relying on `$hidden` to protect attributes from mass assignment. `$hidden` only controls serialization visibility — it does not prevent mass assignment.

**Problem:** Attributes thought to be protected from mass assignment are actually assignable.

**Solution:** Use `$guarded` or `$fillable` for mass assignment protection; `$hidden` is for serialization only.

### Expecting $hidden to Filter Relationships
Adding an attribute to `$hidden` and expecting it to filter loaded relationships. `$hidden`/`$visible` only apply to model attributes, not relationships.

**Problem:** Relationships continue to appear in serialization despite being "hidden."

**Solution:** Control relationship visibility by loaded state (don't load unwanted relations) or use API Resources for fine-grained control.

### Typo in $hidden Attribute Name
A typo in a `$hidden` entry means the attribute is not actually hidden and is silently exposed. No error is thrown for invalid attribute names in `$hidden`.

**Problem:** Silent exposure of sensitive attributes that were thought to be hidden.

**Solution:** Test that hidden fields are absent from serialization output in feature tests.
