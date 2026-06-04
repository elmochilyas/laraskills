# Immutable Casting — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | immutable-casting |

## Rules

### Rule 1: Return new instances from get() for mutable types
The `get()` method of a custom cast must return a fresh instance on every call when the return type is mutable (array, Collection, mutable object). Do not cache and return the same mutable reference.

### Rule 2: Use readonly value objects where possible
When a custom cast returns a value object, implement it with `readonly` properties so that immutability is enforced by the language, not by convention.

### Rule 3: Clone mutable objects before returning
If the cast internally holds a mutable object, return a clone from `get()` to prevent consumers from modifying the internal state.

### Rule 4: Document the immutability contract
Add a docblock to the cast class explaining whether the returned value is immutable and how consumers should handle modifications.

### Rule 5: Test that mutations don't persist
Write a test that modifies the returned value from a cast and asserts that the model's internal state remains unchanged.
