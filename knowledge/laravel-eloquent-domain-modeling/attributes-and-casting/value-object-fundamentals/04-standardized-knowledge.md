# Value Object Fundamentals with Eloquent

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Value Object Fundamentals |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Value objects are immutable, self-validating objects that represent domain primitives (Money, Email, Address) by their attributes rather than identity. In Eloquent, value objects are integrated via custom casts — the cast transforms between database storage format and the value object's PHP representation. This brings type safety, validation, and domain semantics to model attributes.

## Core Concepts

- **Value Object**: An immutable object defined by its properties, not by identity — two value objects with the same properties are equal
- **Self-validation**: Value objects validate themselves on construction — invalid state cannot exist
- **Immutability**: Value objects are read-only; operations return new instances
- **Cast integration**: Custom Eloquent casts (`CastsAttributes`) transform between DB values and value objects
- **Equality**: Value objects implement `equals()` or use property comparison

## When To Use

- An attribute has validation rules that should be enforced at the PHP level, not just the database
- An attribute requires multiple fields (currency + amount, street + city + zip)
- The same primitive type appears across multiple models and needs consistent behavior

## When NOT To Use

- The attribute is a simple scalar with no validation or behavior (keep as primitive)
- The attribute is only used in one place (a cast class is simpler)
- The overhead of a value object class isn't justified by the encapsulation benefits

## Best Practices

- **Make value objects immutable**: All properties should be `readonly`. Methods that "modify" the value object return a new instance. Immutability prevents accidental state sharing.
- **Implement equality comparison**: Override `equals()` or use property comparison. Two value objects with the same values should be interchangeable.
- **Self-validate in the constructor**: Throw `\InvalidArgumentException` or a domain exception when invalid parameters are provided. This catches invalid state at creation time, not at persistence time.

## Architecture Guidelines

- Place value objects in `App\ValueObjects\*`
- Use `readonly` properties (PHP 8.1+)
- Implement `__toString()` for convenient display
- Use custom casts (`CastsAttributes` or `Castable`) for Eloquent integration

## Performance Considerations

- Value object construction adds minimal overhead — typically <0.1ms per instance
- Immutability means modifications create new instances — acceptable for typical attribute access patterns
- For bulk operations, consider batch processing to avoid repeated value object construction

## Examples

```php
class Email
{
    public function __construct(
        public readonly string $address
    ) {
        if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$address}");
        }
    }

    public function equals(Email $other): bool
    {
        return $this->address === $other->address;
    }

    public function __toString(): string
    {
        return $this->address;
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Custom Casts |
| Prerequisite | CastsAttributes Interface |
| Closely Related | Value Object Casting |
| Closely Related | Immutability Patterns |
| Closely Related | Money/Email/Address Patterns |

## AI Agent Notes

- Value objects are immutable — use `readonly` properties
- Self-validate in constructor
- Implement equality comparison
- Integrate with Eloquent via custom casts

## Verification

- [ ] Value object has `readonly` properties
- [ ] Constructor validates all parameters
- [ ] Equality comparison is implemented
- [ ] Custom cast integrates the value object with Eloquent
- [ ] Value object is immutable (no setters, no side effects)
