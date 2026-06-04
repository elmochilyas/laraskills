# Entity vs Value Object — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | entity-vs-value-object |

## Rules

### Rule 1: Entities have independent identity and lifecycle
If a concept has a primary key, UUID, or natural key that persists through state changes, it is an entity. Implement as Eloquent model with domain methods.

### Rule 2: Value objects are defined by their attributes
If a concept is interchangeable with another instance having the same properties, it is a value object. Implement as plain PHP class with readonly properties.

### Rule 3: Value objects are immutable
Value object properties must be `readonly`. The only way to "change" a value object is to create a new instance with the new values.

### Rule 4: Embed VOs in entities via casting
Value objects should be embedded in entities using custom casts or accessors, not stored as separate database tables with foreign keys.

### Rule 5: Compare VOs by value, entities by identity
Implement `equals()` or use property comparison for value objects. Use identity comparison (ID) for entities.
