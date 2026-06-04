# Immutable Casting — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | immutable-casting |

## Anti-Patterns

### Returning a Cached Mutable Reference from get()
- **Severity:** High
- **Problem:** The `get()` method stores a mutable object (e.g., Collection) on the first read and returns the same reference on subsequent reads. Any consumer that modifies the returned value silently corrupts the model's internal state.
- **Solution:** Always return a fresh instance or clone from `get()`. Cache only immutable objects.

### Assuming Arrays Are Automatically Immutable
- **Severity:** Medium
- **Problem:** While PHP arrays are copy-on-write, nested objects within arrays (e.g., `Collection` of models) are shared by reference. Modifying nested objects mutates the shared reference.
- **Solution:** Use `readonly` value objects or defensive clones for nested mutable objects within arrays.

### Using Mutable Value Objects in Casts
- **Severity:** High
- **Problem:** A value object with public setters or mutable properties allows consumers to change the attribute without the model knowing, bypassing dirty detection.
- **Solution:** Make all value object properties `readonly` and require construction via the constructor for state changes.

### Not Testing Immutability Behavior
- **Severity:** Medium
- **Problem:** The cast returns what appears to be an independent copy, but no test verifies that mutating the returned value does not affect the model.
- **Solution:** Write explicit tests that modify the returned attribute and assert the model state is unchanged on the next read.
