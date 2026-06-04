# Value Objects in Laravel

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-07-value-objects
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Value Objects are immutable, self-validating objects that wrap primitives into domain-meaningful types. Instead of passing strings for email addresses or integers for prices, Value Objects give each concept its own type with built-in validation, behavior, and equality semantics. In Laravel, they sit in the Domain layer as pure PHP classes with no framework dependencies, making invalid data unrepresentable — if a Value Object exists, its data is valid.

---

## Core Concepts
- **Immutability**: A Value Object cannot be changed after creation; any operation producing a modified value returns a new instance
- **Validation on Construction**: The constructor validates all invariants before assigning values — if validation fails, the object is never created
- **Value Equality**: Two Value Objects are equal if all their properties are equal, implemented via an `equals()` method
- **Primitive Obsession**: The anti-pattern of using primitive types to represent domain concepts — Value Objects eliminate this by giving each concept its own type
- **Self-Encapsulation**: Value Objects contain behavior related to the value itself (formatting, comparison, conversion) but not orchestration, persistence, or IO

---

## Mental Models
1. **Make Invalid States Unrepresentable**: The primary purpose of a Value Object is to guarantee that if an instance exists, its data is valid. This shifts validation from entry points to the objects themselves, providing defense-in-depth.
2. **Value Object as Type System Extension**: PHP's type system is limited to primitives (`string`, `int`). Value Objects extend the type system to include domain concepts (`Email`, `Money`, `PhoneNumber`), making method signatures self-documenting and type-safe.

---

## Internal Mechanics
PHP 8.1+ `readonly` classes enforce immutability at the language level — all properties are implicitly readonly. The constructor validates invariants using `\InvalidArgumentException`. Named methods like `->value()` or `->amount()` expose the wrapped value with domain-meaningful names. The `equals()` method compares all properties with strict comparison (`===`). The `__toString()` method enables implicit conversion in Blade templates and string contexts. For Eloquent integration, a custom cast class in Infrastructure handles conversion between the Value Object and the database column.

---

## Patterns
### Simple Value Object Pattern
- **Purpose**: Wrap a single primitive with validation (Email, Phone, SSN)
- **Mechanism**: `readonly class` with constructor validation, `equals()`, `__toString()`
- **Benefits**: Type safety, self-validating, self-documenting
- **Tradeoffs**: Object allocation overhead (negligible for typical volumes)

### Composite Value Object Pattern
- **Purpose**: Combine multiple related values into one type (Address, Money, Coordinate)
- **Mechanism**: Multiple `readonly` properties, cross-field validation in constructor, behavior methods
- **Benefits**: Encapsulates complex validation rules, enables domain behavior (e.g., `Money::add()`)
- **Tradeoffs**: More complex serialization for database storage

---

## Architectural Decisions
- **Choose Value Objects when**: Data has validation rules, type safety matters for domain concepts, business rules depend on value comparison, or data passes between layers
- **Choose primitives when**: Simple scalar values with no validation, performance-critical hot paths where allocation overhead is measurable (profile first), or short-lived data validated at entry
- **Key decision**: Validate in the constructor, not in setters or getters — this is the most important rule for data integrity

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Invalid data is unrepresentable | Object allocation overhead | Negligible (<0.1ms per hundred objects) |
| Self-documenting type hints | More classes to maintain | One class per domain concept with validation |
| Immutability eliminates defensive copies | Cannot modify in place — always returns new instance | Natural for functional-style data transformation |
| Defense-in-depth validation | Validation logic replicated at entry points and in VOs | Consistent validation regardless of how data enters |

---

## Performance Considerations
Value Object allocation cost is negligible for typical request volumes (<0.1ms per hundred objects). For high-throughput endpoints (1000+ requests/second), consider caching frequently-used Value Objects or using a flyweight pattern for commonly-created values. Immutability eliminates defensive copy overhead — you can safely share Value Objects without worrying about mutation. No database query overhead — Value Objects are in-memory objects with no persistence coupling.

---

## Production Considerations
Constructor validation is the primary security boundary — it prevents invalid data from entering the system at any entry point. Value Objects representing sensitive data (Email, Phone, SSN) should implement `__toString()` carefully to avoid leaking in logs. Never serialize entire Value Objects into log contexts — extract only the sanitized value. Complex Value Objects (with nested objects) should use explicit mapping in Repository Infrastructure code rather than Eloquent casts.

---

## Common Mistakes
1. **Mutable Value Objects**: Properties not readonly or setters exposed — any mutation method must return a new instance.
2. **Missing validation**: Constructor accepts any value without checks — if the Value Object exists, the data must be valid.
3. **Too much behavior**: Adding `send()` or `save()` to a Value Object crosses into orchestration or IO territory.
4. **Anemic Value Objects**: Wrapper classes that are just getters with no validation — ceremony without safety.
5. **Over-normalization**: Creating Value Objects for every single primitive even those with no validation or behavior — Email, Money, and Phone are good; a simple `Name` with no validation may not warrant a Value Object.

---

## Failure Modes
- **Missing validation**: A Value Object that wraps a value without checking invariants allows invalid data to travel through layers until it hits business logic
- **Serialization mismatch**: The database representation and the Value Object diverge, causing data integrity issues
- **Equality not implemented**: Without `equals()`, Value Objects cannot be compared correctly in collections or business rules
- **Identity confusion**: Using a Value Object where identity tracking is needed — if two objects with the same values should be treated as different, use an Entity

---

## Ecosystem Usage
Laravel Eloquent custom casts enable automatic Value Object conversion for simple cases (Email, Money) — the cast class lives in Infrastructure. Packages like `spatie/laravel-data` provide Value Object support with automatic validation and serialization. Many enterprise Laravel projects use Value Objects for addresses, monetary amounts, email addresses, phone numbers, and currency types.

---

## Related Knowledge Units
### Prerequisites
- PHP 8.1+ readonly classes
- Domain layer concepts
- Basic OOP

### Related Topics
- LAP-06 Domain-Driven Design
- LAP-12 Form Request Validation
- SLP-05 DTO Pattern

### Advanced Follow-up Topics
- LAP-10 Domain-Entity Mapping
- Event Sourcing with VOs
- Custom Eloquent casts

---

## Research Notes
Generate Value Objects as PHP 8.1+ `readonly` classes with constructor validation. Always include `equals()` and `__toString()` methods. Validate in the constructor — this is the most important DDD rule for data integrity. For Eloquent integration, generate a custom cast class in Infrastructure. Value Objects belong in Domain, never in Infrastructure or Presentation.
