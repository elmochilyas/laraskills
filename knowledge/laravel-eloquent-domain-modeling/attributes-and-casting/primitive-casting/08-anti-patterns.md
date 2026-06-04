# Primitive Casting — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | primitive-casting |

## Anti-Patterns

### Using float for Monetary Values
- **Severity:** High
- **Problem:** Float precision issues cause rounding errors in monetary calculations. `0.1 + 0.2` is not exactly `0.3` in floating-point arithmetic.
- **Solution:** Use `decimal:N` cast (returns a string with N decimal places) or cast to a Money value object for precise arithmetic.

### Assuming Null Returns 0 or false
- **Severity:** Medium
- **Problem:** Code checks `if ($model->nullable_int)` expecting null to evaluate as falsey, which works, but numeric operations like `$model->nullable_int + 1` fail on null.
- **Solution:** Handle nullable columns explicitly with null checks before arithmetic operations.

### Using Custom Casts When Primitive Casts Suffice
- **Severity:** Medium
- **Problem:** Writing a full custom cast class (with `CastsAttributes` interface, `get()` and `set()` methods) to simply coerce a type that a primitive cast already handles.
- **Solution:** Use primitive casts for standard type coercion. Only write custom casts for complex transformations or value objects.

### Incorrect Cast Type Strings
- **Severity:** Medium
- **Problem:** Using `'int'` instead of `'integer'`, `'bool'` instead of `'boolean'`. These unknown strings are silently ignored by Laravel, and no type coercion occurs.
- **Solution:** Always use the full type strings from the Laravel documentation (`integer`, `boolean`, `float`, `string`, `array`, `object`, `collection`).
