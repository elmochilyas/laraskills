# Entity vs Value Object — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | entity-vs-value-object |

## Anti-Patterns

### Modelling Value Objects as Eloquent Models
- **Severity:** High
- **Problem:** Creating a full Eloquent model with a database table for a concept that has no independent identity or lifecycle (e.g., an Address that only exists as part of a User).
- **Solution:** Implement value objects as plain PHP classes with readonly properties and embed them in entities via custom casts or accessors.

### Mutable Value Objects
- **Severity:** High
- **Problem:** A value object with public setters allows its state to be changed after construction, breaking the value semantics and causing aliasing bugs.
- **Solution:** Use `readonly` properties on all value objects. Require construction via the constructor for state changes.

### Identity Comparison for Value Objects
- **Severity:** Medium
- **Problem:** Using `===` (object identity) to compare two value objects with the same properties. Two `Email` instances with the same address are considered different.
- **Solution:** Compare value objects by their properties or implement an `equals()` method.

### Entity with No Domain Methods (Anemic Model)
- **Severity:** Medium
- **Problem:** An Eloquent model that is classified as an entity but has no domain methods — only getters/setters and relationships. All business logic lives in services or controllers.
- **Solution:** Add domain methods to the entity that encapsulate behavior related to its state and identity.
