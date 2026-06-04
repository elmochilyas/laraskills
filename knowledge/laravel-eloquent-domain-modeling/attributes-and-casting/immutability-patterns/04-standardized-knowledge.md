# Immutability Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Coding |
| Knowledge Unit | Immutability Patterns |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Immutability patterns ensure that value objects cannot be modified after creation. In Eloquent's casting system, immutable value objects prevent accidental mutation of model attributes through returned references. When a value object is immutable, calling a modification method returns a new instance rather than mutating the existing one, preventing subtle bugs where shared references are modified in place.

## Core Concepts

- **Readonly properties**: PHP 8.1's `readonly` modifier prevents property mutation after construction
- **No setters**: Value objects expose no methods that modify internal state
- **Functional modification**: Operations return new instances: `$money->add($other)` returns a new Money, doesn't modify `$this`
- **CarbonImmutable parallel**: Eloquent's `immutable_datetime` cast applies the same principle to date attributes

## When To Use

- Your value objects are shared across multiple contexts
- You want to prevent accidental mutation through property references
- You follow functional programming practices in your domain logic

## When NOT To Use

- The value object is short-lived and never shared (overhead not justified)
- Performance considerations make object reuse necessary (rare in practice)
- The object is a DTO that gets serialized once (immutability adds ceremony)

## Best Practices

- **Use `readonly` properties (PHP 8.1+)**: The language enforces immutability at the property level. Combined with typed properties, this provides compile-time guarantees against mutation.
- **Return new instances from operations**: `withAmount(int $cents): self` returns a new instance with the modified value. This makes the modification explicit at the call site.
- **Combine with `CarbonImmutable`**: Use `immutable_datetime` cast for all date/time model attributes to prevent Carbon objects from being mutated through the model reference.

## Architecture Guidelines

- Mark all value object properties as `readonly`
- No public or protected setters
- Operations return new instances (named constructors with `with*()` or `add()`/`subtract()`)
- The model's custom cast returns immutable objects

## Performance Considerations

- Immutability creates more objects (new instances on modification) — negligible for typical use
- PHP 8.1 readonly properties are optimized; no overhead compared to regular properties
- GC handles short-lived immutable objects efficiently

## Examples

```php
class Money
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = 'USD',
    ) {}

    public function add(Money $other): Money
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Currency mismatch');
        }
        return new self($this->cents + $other->cents, $this->currency);
    }

    public function withAmount(int $cents): Money
    {
        return new self($cents, $this->currency);
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Value Object Fundamentals |
| Closely Related | Value Object Casting |
| Closely Related | Money/Email/Address Patterns |
| Closely Related | Readonly Models |

## AI Agent Notes

- Use `readonly` properties on all value objects
- Operations return new instances, don't modify `$this`
- Combine with `CarbonImmutable` for date attributes

## Verification

- [ ] All value object properties are `readonly`
- [ ] No setters exist on value objects
- [ ] Modification operations return new instances
- [ ] Date attributes use `immutable_datetime` cast
