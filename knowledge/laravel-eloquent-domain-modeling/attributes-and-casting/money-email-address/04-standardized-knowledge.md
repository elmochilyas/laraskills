# Money, Email, Address Value Objects

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Money/Email/Address Patterns |
| Classification | Expert |
| Last Updated | 2026-06-02 |

## Overview

Common domain primitives — Money, Email, Address — are ideal candidates for value object + custom cast patterns in Eloquent. These types appear across almost every business domain and have well-defined validation, formatting, and equality semantics. Standardized value objects for these primitives reduce duplication, enforce consistency, and prevent primitive obsession throughout the application.

## Core Concepts

- **Money**: Amount + currency, with arithmetic operations, formatting, and allocation
- **Email**: Validated email address with normalization, display formatting, and domain extraction
- **Address**: Structured geographic location with components (street, city, state, zip, country)
- **Primitive obsession anti-pattern**: Using strings/ints for domain concepts instead of dedicated types
- **Consistent casting**: Each value object type has a corresponding custom cast for Eloquent integration

## When To Use

- Monetary values appear throughout the application (invoices, payments, subscriptions)
- Email addresses need consistent validation and normalization
- Geographic addresses are used across multiple entities
- You want to eliminate stringly-typed code for domain primitives

## When NOT To Use

- The value is used in only one place (simpler to keep as primitive)
- The validation/formatting logic is trivial (e.g., no arithmetic on Money)
- Third-party packages already provide the needed value objects (e.g., `brick/money`)

## Best Practices

- **Use `brick/money` for robust Money handling**: The `brick/money` library provides battle-tested Money, Currency, and arithmetic with proper rounding and precision. Create a cast wrapper for Eloquent integration.
- **Normalize email on construction**: Lowercase the domain part and trim whitespace. Store the normalized form while preserving the original display form if needed.
- **Use JSON or multiple columns for Address**: An address value object can map to a single JSON column (with `AsArrayObject` cast) or multiple columns with a custom cast. JSON is simpler for dynamic address formats.

## Architecture Guidelines

- Place in `App\ValueObjects\Money`, `App\ValueObjects\Email`, `App\ValueObjects\Address`
- Implement `Castable` interface for self-casting
- Use `brick/money` for Monetary types (not homemade float arithmetic)
- Normalize emails to lowercase before storage

## Performance Considerations

- Money arithmetic with `brick/money` adds minimal overhead vs float operations
- Email validation (`filter_var`) is fast (~0.01ms per call)
- Address value objects with multiple fields add construction overhead per read — acceptable for typical usage

## Security Considerations

- Validate email format before storage — prevents injection of malformed addresses
- Sanitize address components for XSS when rendering
- Money amounts should use integer cents internally, never floats

## Examples

```php
use Brick\Money\Money as BrickMoney;

class MoneyValueObject
{
    public function __construct(
        public readonly BrickMoney $money
    ) {}

    public static function fromCents(int $cents, string $currency = 'USD'): self
    {
        return new self(BrickMoney::of($cents, $currency));
    }

    public function toCents(): int
    {
        return $this->money->getAmount()->toInt();
    }

    public function add(self $other): self
    {
        return new self($this->money->plus($other->money));
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Value Object Fundamentals |
| Prerequisite | Value Object Casting |
| Closely Related | Immutability Patterns |
| Closely Related | Castable Interface |
| Closely Related | Primitive Obsession |

## AI Agent Notes

- Use `brick/money` for monetary value objects
- Normalize emails to lowercase in constructor
- Address can map to JSON column or multiple columns
- All value objects should implement `Castable` for Eloquent integration

## Verification

- [ ] Money uses integer cents internally (no floats)
- [ ] Email normalizes and validates on construction
- [ ] Address has structured, validated components
- [ ] Value objects implement `Castable` for Eloquent casting
- [ ] Arithmetic operations return new instances (immutability)
