# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Value Objects in Laravel
Knowledge Unit ID: LAP-07-value-objects
Difficulty Level: Intermediate
Category: Domain Modeling | Data Integrity
Last Updated: 2026-06-04

---

# Overview

Value Objects are immutable, self-validating objects that wrap primitives into domain-meaningful types. Instead of passing strings for email addresses, integers for prices, or arrays for addresses, Value Objects give each concept its own type with built-in validation, behavior, and equality semantics.

In Laravel, Value Objects sit in the Domain layer as pure PHP classes. They have no framework dependencies, no database coupling, and no identity. They exist to make invalid data unrepresentable — if a Value Object exists, its data is valid. This shifts validation from entry points (Form Requests) to the objects themselves, providing defense-in-depth against invalid data.

PHP 8.1+ `readonly` classes make Value Object implementation natural. Constructor promotion, typed properties, and readonly modifiers give PHP the immutability guarantees that Value Objects require.

---

# Core Concepts

**Immutability**: A Value Object cannot be changed after creation. Any operation that produces a modified value returns a new instance. PHP 8.1+ `readonly` classes enforce this at the language level — all properties are implicitly readonly.

**Validation on Construction**: The constructor validates all invariants before assigning values. If validation fails, an exception is thrown and the object is never created. This guarantees that every Value Object instance is valid.

**Value Equality**: Two Value Objects are equal if all their properties are equal. Implemented via an `equals()` method. Identity is irrelevant — two `Email` instances with the same address are interchangeable.

**Primitive Obsession**: The anti-pattern of using primitive types (`string`, `int`, `array`) to represent domain concepts. Value Objects eliminate primitive obsession by giving each concept its own type.

**Self-Encapsulation**: Value Objects contain behavior related to the value itself — formatting, comparison, conversion. They do not contain behavior related to orchestration, persistence, or IO.

---

# When To Use

- Any data with validation rules (email, address, money, phone, currency, dates with business meaning)
- Data that should never exist without validation — primitive obsession is causing scattered validation logic
- Need type safety for domain concepts (e.g., `Email` vs `string` in method signatures)
- Business rules that depend on value comparison (e.g., `Money::gte($threshold)`)
- Data passed between layers that must be validated before crossing boundaries

---

# When NOT To Use

- Simple scalar values with no validation (IDs, names without constraints)
- Performance-critical hot paths where object allocation overhead is measurable (profile first)
- When primitive types are sufficient and domain complexity does not justify abstraction
- Short-lived data that is validated at entry and never used in domain logic

---

# Best Practices

**Declare classes as `readonly`.** PHP 8.2+ supports `readonly class`. For PHP 8.1, declare all properties as `private readonly`. This enforces immutability at the language level — no setters, no property mutation.

**Validate everything in the constructor.** Check format, range, business rules, and empty values before assignment. Throw `\InvalidArgumentException` with a descriptive message. The goal is that no invalid Value Object can exist.

**Expose the value through a named method.** Use `->value()`, `->email()`, or `->amount()` rather than a generic getter. Named methods express the domain meaning of the value.

**Implement `equals()` for comparison.** Compare all properties. Use strict comparison (`===`). Return `bool`. This enables collection operations, testing, and value-based business rules.

**Implement `__toString()` for display.** Return the underlying value as a string. This enables implicit conversion in Blade templates, logging, and string contexts.

**Use Value Objects as type hints.** Replace `string $email` with `Email $email` in constructor and method signatures. The type hint alone validates and documents the requirement.

---

# Architecture Guidelines

- Value Objects belong in the Domain layer, alongside Entities and Aggregate Roots.
- Value Objects should have zero framework dependencies — no Eloquent, no facades, no Laravel helpers.
- Value Objects can implement interfaces defined in the Domain layer (e.g., `Stringable`).
- Laravel Eloquent casts can automate Value Object conversion for simple cases, but the cast class should live in Infrastructure.
- Complex Value Objects (with nested objects) should use explicit mapping in Repository Infrastructure code.

---

# Performance Considerations

- Value Object allocation cost is negligible for typical request volumes (<0.1ms per hundred objects).
- For high-throughput endpoints (1000+ requests/second), consider caching frequently-used Value Objects or using a flyweight pattern for commonly-created values.
- Immutability eliminates defensive copy overhead — you can safely share Value Objects without worrying about mutation.
- No database query overhead — Value Objects are in-memory objects with no persistence coupling.

---

# Security Considerations

- Constructor validation is the primary security boundary — it prevents invalid data from entering the system at any entry point.
- Value Objects representing sensitive data (Email, Phone, SSN) should implement `__toString()` carefully to avoid leaking in logs.
- Never serialize entire Value Objects into log contexts — extract only the sanitized value.
- Value Objects used in cache keys, tokens, or identifiers must implement `__toString()` and `equals()` correctly to prevent collisions.

---

# Common Mistakes

1. **Mutable Value Objects.** Properties not readonly, or setters exposed. Value Objects must be immutable — any mutation method must return a new instance.

2. **Missing validation.** Constructor accepts any value without checks. Always validate on construction. If the Value Object exists, the data must be valid.

3. **Too much behavior.** Value Objects should encapsulate behavior related to the value itself (comparison, formatting) but not orchestration or IO. Don't add `send()` or `save()` to a Value Object.

4. **Anemic Value Objects.** Creating wrapper classes that are just getters with no validation. A Value Object without validation is just a named type alias — valuable, but missing the primary benefit.

5. **Value Objects as Entities.** If identity matters (tracking changes over time, separate lifecycle), use Entity, not Value Object.

6. **Over-normalization.** Creating Value Objects for every single primitive, even those with no validation or behavior. Email, Money, and Phone are good candidates. A simple `Name` with no validation may not need to be a Value Object.

---

# Anti-Patterns

- **Value Object Without Validation**: A readonly class that wraps a primitive without checking invariants — ceremony without safety.
- **Value Object With Setters**: Mutable wrapper that breaks immutability guarantees.
- **Value Object With IO**: A Value Object that sends emails, writes to database, or calls external APIs.
- **Primitive Passion**: Wrapping every primitive in a Value Object regardless of business meaning, creating unnecessary complexity.

---

# Examples

**Email Value Object:**
```php
readonly class Email
{
    public function __construct(private string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: $value");
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

**Money Value Object with Behavior:**
```php
readonly class Money
{
    public function __construct(
        private int $cents,
        private Currency $currency,
    ) {
        if ($cents < 0) {
            throw new \InvalidArgumentException('Amount cannot be negative');
        }
    }

    public function add(self $other): self
    {
        if (!$this->currency->equals($other->currency)) {
            throw new \InvalidArgumentException('Cannot add different currencies');
        }
        return new self($this->cents + $other->cents, $this->currency);
    }

    public function gte(self $other): bool
    {
        return $this->currency->equals($other->currency)
            && $this->cents >= $other->cents;
    }

    public function amount(): float
    {
        return $this->cents / 100;
    }

    public function equals(self $other): bool
    {
        return $this->cents === $other->cents
            && $this->currency->equals($other->currency);
    }
}
```

**Laravel Eloquent Cast:**
```php
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class EmailCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): Email
    {
        return new Email($value);
    }

    public function set($model, string $key, $value, array $attributes): string
    {
        return $value instanceof Email ? $value->value() : $value;
    }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| PHP 8.1+ readonly classes | LAP-06 Domain-Driven Design | LAP-10 Domain-Entity Mapping |
| Domain layer concepts | LAP-12 Form Request Validation | Event Sourcing with VOs |
| Basic OOP | SLP-05 DTO Pattern | Custom Eloquent casts |

---

# AI Agent Notes

- Generate Value Objects as PHP 8.1+ `readonly` classes with constructor validation.
- Always include `equals()` and `__toString()` methods.
- Validate in the constructor, not in setters or getters.
- Value Objects belong in Domain, never in Infrastructure or Presentation.
- When generating code, prefer Value Object type hints over primitives for domain concepts.
- For Eloquent integration, generate a custom cast class in Infrastructure.
