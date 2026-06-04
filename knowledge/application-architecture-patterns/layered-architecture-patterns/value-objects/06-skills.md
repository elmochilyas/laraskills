# Skill: Implement Value Objects in Laravel

## Purpose
Create immutable, self-validating Value Objects using PHP 8.1+ readonly classes to encapsulate primitive data with domain-meaningful types, ensuring values are always valid when instantiated.

## When To Use
- Any data with validation rules (email, address, money, phone, currency, dates with business meaning)
- Data that should never exist without validation
- Primitive obsession is causing scattered validation logic
- Need type safety for domain concepts (e.g., `Email` vs `string`)

## When NOT To Use
- Simple scalar values with no validation (IDs, names without constraints)
- Performance-critical hot paths where object allocation overhead matters
- When primitive types are sufficient and domain complexity doesn't justify abstraction

## Prerequisites
- PHP 8.1+ for readonly classes and property promotion
- PHPUnit or Pest for value equality testing

## Inputs
- Primitive data that needs validation (emails, URLs, slugs, money amounts)
- Business rules for valid values
- Identified primitive obsession patterns in existing code

## Workflow
1. **Identify Value Object candidates.** Look for primitives validated in multiple places — email, slug, price, currency, phone. Use grep for repeated validation patterns (regex for email, amount > 0 checks).

2. **Create a readonly class in Domain.** Use `readonly class` with `public function __construct(private string $value)`. Mark class as `readonly` to ensure immutability.

3. **Validate on construction.** Check all invariants in the constructor before assignment. Throw `\InvalidArgumentException` with descriptive message on invalid input. Check for empty values, format, range, and business rules.

4. **Expose value via named method.** Use `->value()` or domain-meaningful getter (`->email()`, `->amount()`). Named methods are more expressive than generic `__toString()`.

5. **Implement equality comparison.** Override `equals(MyValueObject $other): bool` comparing all properties. Reuse this in tests and collection operations.

6. **Implement `__toString()` for simple display.** Return the underlying value for string representation. Useful for implicit conversion in blade templates and string contexts.

7. **Use Value Objects as type hints.** Replace `string $email` with `Email $email` in constructor and method signatures. The type hint alone validates and documents the requirement.

## Validation Checklist
- [ ] Class is declared `readonly`
- [ ] Constructor validates all invariants before assignment
- [ ] Invalid inputs throw `\InvalidArgumentException`
- [ ] Equality method exists and compares correctly
- [ ] Immutability is enforced (no setters, readonly properties)
- [ ] Value Object is used in type hints throughout codebase
- [ ] Tests cover valid creation, invalid creation, and equality
- [ ] No side effects or IO in Value Object methods

## Common Failures
- **Mutable Value Objects.** Properties not readonly, or setters exposed. Value Objects must be immutable.
- **Missing validation.** Constructor accepts any value without checks. Always validate on construction.
- **Too much behavior.** Value Objects should encapsulate behavior related to the value itself (comparison, formatting) but not orchestration or IO.
- **Anemic Value Objects.** Getter-only classes without validation are just wrappers. Always validate.
- **Value Objects as Entities.** If identity matters, use Entity, not Value Object.

## Decision Points
- **readonly class vs final class with readonly props?** Use `readonly class` (PHP 8.2+) for simplicity; use `final class` with `private readonly` properties for pre-8.2 compatibility.
- **Named constructor vs plain constructor?** Use named constructors (`public static function fromString(string $value): self`) for complex construction logic; use plain constructor for simple validation.
- **Laravel Casts vs custom casts?** Implement `Castable` interface or use custom `CastsAttributes` for automatic casting with Eloquent.

## Performance Considerations
- Value Object allocation cost: negligible for typical request volumes (<100ms per request).
- For high-throughput endpoints, consider using a pool or caching frequently-created Value Objects.
- immutability eliminates defensive copy overhead.

## Security Considerations
- Validation on construction prevents invalid data from entering the system — important security boundary.
- Value Objects that represent sensitive data (Email, Phone) should implement `__toString()` carefully to avoid leaking in logs.
- Never serialize sensitive Value Objects into logs.

## Related Rules
- Rule: Value Objects Are Readonly and Immutable (LAP-07/05-rules.md)
- Rule: Validate on Construction (LAP-07/05-rules.md)
- Rule: Expose Value Named Method (LAP-07/05-rules.md)
- Rule: Implement Equality Comparison (LAP-07/05-rules.md)
- Rule: Use Value Objects as Type Hints (LAP-07/05-rules.md)
- Rule: No IO in Value Object Methods (LAP-07/05-rules.md)
- Rule: Don't Confuse Value Objects with Entities (LAP-07/05-rules.md)
- Rule: Sensitive Values Avoid Log Leakage (LAP-07/05-rules.md)

## Related Skills
- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)
- Implement Entities with Identity (LAP-06/06-skills.md)
- Build Form Request Validation (LAP-12/06-skills.md)

## Success Criteria
- Every Value Object is readonly and validates on construction.
- Invalid data cannot exist in Value Object form — constructor guarantees validity.
- Codebase uses Value Object type hints instead of primitives where business meaning exists.
- Equality comparison works correctly for all Value Object instances.
