# Entity vs Value Object — Standardized Knowledge

## Overview

Domain-Driven Design distinguishes between entities (objects with identity and lifecycle) and value objects (objects defined by their attributes). Correct classification determines whether a concept becomes an Eloquent model with persistence or an immutable plain PHP class embedded via casting.

## Key Concepts

- **Entity** — has a unique identity (primary key, UUID), persists across state changes, mutable lifecycle
- **Value Object** — defined entirely by its attributes, immutable, interchangeable with equal values
- **Identity-based equality** — two entities with different IDs are different, even if all attributes match
- **Value-based equality** — two value objects with the same properties are the same thing
- **Embedded value objects** — value objects live inside entities via custom casts or accessors
- **Readonly properties** — value objects enforce immutability with `readonly`

## Implementation Details

```php
// Entity — Eloquent model
class User extends Model
{
    public function changeEmail(Email $email): void
    {
        $this->email = $email->value;
    }
}

// Value Object — plain PHP class
class Email
{
    public function __construct(
        public readonly string $value
    ) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid email');
        }
    }
}
```

## Best Practices

- Entities have a clear identity (primary key, UUID, or natural key)
- Value objects are immutable with `readonly` properties
- Compare entities by identity (`===` on ID), value objects by attributes
- Embed value objects in entities via custom casts or accessors
- Value objects have no independent lifecycle or persistence
