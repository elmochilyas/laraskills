# Accessor Patterns — Skills

---

## Skill 1: Define a Cached Accessor

### Purpose
Create an accessor using `Attribute::make()` with `shouldCache` for computed attribute values that are read multiple times per request.

### When To Use
- You need to transform a stored value for display (formatting, concatenation)
- The accessor is accessed multiple times in Blade views, serialization, or API resources
- The computation is expensive enough to benefit from per-instance caching

### When NOT To Use
- The accessor has side effects (write to DB, call APIs)
- The transformation is pure presentation formatting that belongs in a view layer
- The value should differ on each read (random values, current time)

### Prerequisites
- Eloquent model class exists
- Understanding of `Attribute::make()` syntax

### Inputs
- Attribute to transform
- Transformation logic (formatting, concatenation, type conversion)
- Whether caching is needed

### Workflow

1. **Define a protected method** returning `Attribute` named after the attribute (camelCase)

2. **Use `Attribute::make(get: fn ($value) => ...)`** with a get closure

3. **Return the transformed value** — keep the closure a pure function (no side effects)

4. **Add `shouldCache: true`** when the accessor does expensive computation or is accessed multiple times

5. **Register in `$appends`** only if the computed value must appear in JSON/array serialization

6. **Do not call `app()`, `resolve()`, or external services** inside the closure

### Validation Checklist

- [ ] Uses `Attribute::make(get: ...)` syntax (not legacy `getAttribute` method)
- [ ] Accessor has no side effects
- [ ] Expensive accessors use `shouldCache: true`
- [ ] No authorization checks inside the accessor
- [ ] No business logic — presentation transformations only
- [ ] Return type is consistent for all inputs
- [ ] `$appends` is deliberate — only includes necessary computed values

### Related Rules

| Rule | Reference |
|---|---|
| Use `Attribute::make` over legacy accessor methods | `05-rules.md` Rule 1 |
| Keep accessors pure with no side effects | `05-rules.md` Rule 2 |
| Cache expensive accessor computations | `05-rules.md` Rule 3 |
| Never perform authorization in accessors | `05-rules.md` Rule 4 |
| Do not place business logic in accessors | `05-rules.md` Rule 5 |
| Ensure accessor return type consistency | `05-rules.md` Rule 7 |
| Be deliberate with `$appends` | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Add `shouldCache` to an Accessor | Specific caching optimization |
| Define a Mutator | Write-side counterpart to accessors |

### Success Criteria
- Accessor returns the transformed value on read
- No side effects execute during attribute access
- Cached accessor returns the same value on repeated reads per instance
- No business logic or authorization runs inside the accessor
