# Anti-Patterns: Conditional Attributes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Conditional Attributes

## Anti-Patterns

### Guessing Relation Load State
Not using `whenLoaded()` for relationship fields and relying on null coalescing or manual checks. Accessing an unloaded relationship triggers lazy loading, causing N+1 in the serialization layer.

**Problem:** N+1 queries triggered inside API Resources during serialization; slow responses.

**Solution:** Always wrap relationship fields in `whenLoaded()` to guard against unloaded relations.

### Non-Boolean Condition Pitfall
Using `when($model->relation, ...)` where `$model->relation` returns a Collection (always truthy) instead of checking existence with `$model->relation()->exists()`. The field is always included even when there are no related records.

**Problem:** Fields included when they should be absent; incorrect API responses.

**Solution:** Use explicit boolean conditions: `when($model->relation->isNotEmpty(), ...)` or `whenNotNull()` for nullable values.

### Over-Conditionalizing
Wrapping every field in `when()` even when the field is always present. Adds noise to the resource without benefit.

**Problem:** Unnecessary noise in resource code; reduced readability.

**Solution:** Include non-optional fields directly. Reserve `when()` for fields that are truly conditional.

### Silent Omission as Debugging Trap
Using `whenLoaded('relaton_name')` (typo in relation name). The field never appears, and no error is thrown — it silently disappears from all responses.

**Problem:** Fields silently missing from API responses; difficult debugging.

**Solution:** Test resource output with both loaded and unloaded states. Use constants for relation names to prevent typos.

### Passing Non-Closure Expensive Value to when()
Passing a non-Closure expensive value to `when()` — the value is evaluated before `when()` receives it, negating the lazy evaluation benefit.

**Problem:** Expensive computation runs even when the condition is false.

**Solution:** Always pass a Closure for expensive values: `when($condition, fn() => $this->expensive())`.

### Nested Conditionals Without Extraction
Nesting conditionals inside conditionals in `toArray()`, making the method long and unreadable.

**Problem:** Unreadable resource code; difficult to test and maintain.

**Solution:** Extract complex conditional logic into private methods on the resource class.

### whenLoaded Without Eager Loading
Using `whenLoaded('comments')` in a resource but not eager-loading `comments` in the parent query. The field silently disappears from output.

**Problem:** Relationship data silently missing from API responses because the relation was never loaded.

**Solution:** Ensure all relationships wrapped in `whenLoaded()` are eagerly loaded in the controller query.
