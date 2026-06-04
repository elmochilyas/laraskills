# Readonly Data Objects

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Readonly Data Objects
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

PHP 8.1's `readonly` properties and PHP 8.2's `readonly` classes provide language-level immutability enforcement for DTOs. A `readonly` property can be set once — in the constructor — and never modified thereafter. A `readonly` class makes every property readonly implicitly. This eliminates entire categories of bugs (accidental mutation, unintended side effects) and communicates intent at the type system level rather than through convention.

The engineering tradeoff is that readonly objects cannot use lazy initialization, cannot be modified after construction, and require all constructor parameters to be promoted or explicitly typed. For DTOs, these constraints are exactly correct — they enforce immutability by default and surface mutation attempts at compile time rather than runtime.

## Core Concepts

- **Readonly Property Semantics:** A `readonly` property can be assigned exactly once, in the constructor. After construction, any write attempt produces a `\Error`.
- **Readonly Class (PHP 8.2+):** Declares every property as implicitly readonly. Cannot have untyped properties, static properties, or `__set`/`__get` overloading.
- **Constructor Promotion with Readonly:** The most compact DTO form combines promoted constructor parameters with `readonly` — one line of signature declares four properties and a constructor.
- **Clone Semantics:** Cloning a readonly object creates a shallow copy, but the clone's properties remain readonly. Use the "with" pattern for modified copies.
- **Uninitialized Properties:** A readonly property never assigned during construction remains uninitialized. Accessing it produces `\Error`. This differs from `null`.

## When To Use

- All DTO definitions in PHP 8.1+ codebases — `readonly` is the default and expected convention
- Any immutable data carrier where accidental mutation would cause bugs
- When communicating that "this value matters" to other developers via the type system
- When combined with the "with" pattern for creating modified copies of immutable objects

## When NOT To Use

- When lazy initialization is required (computed on first access) — readonly prevents it
- When the class needs non-readonly properties (mutable state)
- When the class must extend a non-readonly class (PHP 8.2 restriction)
- When using spatie/laravel-data's `#[Lazy]` properties — lazy loading requires deferred assignment incompatible with readonly class

## Best Practices (WHY)

- **Why `readonly class` over individual `readonly`:** Enforces consistency — no readonly oversight. Every property in a DTO should be readonly; there is no legitimate reason for a DTO to have mutable properties.
- **Why constructor promotion:** Eliminates duplication between property declaration and constructor assignment. Every constructor parameter with `public readonly` is automatically a declared property.
- **Why the "with" pattern:** The only way to create a modified copy of a readonly DTO. Returns a new instance with one property changed, preserving immutability.
- **Why avoid `unserialize` bypass:** `unserialize()` creates objects without calling `__construct`, bypassing readonly assignment. Control serialization via `__serialize()`/`__unserialize()`.

## Architecture Guidelines

- Use `readonly class` (PHP 8.2+) as the default for all DTO definitions
- Use constructor promotion exclusively — never manually assign promoted parameters
- Avoid lazy initialization in DTOs; if needed, use a private non-readonly property with memoization
- Never use reflection or `array_combine` to construct readonly DTOs — this bypasses type checking
- Establish team convention: PHP 8.2 `readonly class` for new DTOs, individual `readonly` properties for PHP 8.1 compatibility

## Performance

Readonly properties add no runtime overhead in PHP 8.1+. The readonly check is a single opcode in the Zend engine — faster than a setter method call, effectively identical to direct property access.

```
// Public property set: ASSIGN_OBJ (1 opcode)
// Getter method call: INIT_METHOD_CALL + DO_FCALL (2 opcodes + call overhead)
// Direct readonly access: FETCH_OBJ (1 opcode)
```

Readonly is safer AND faster than abstraction layers that hide mutability behind methods.

## Security

- `unserialize()` bypasses the constructor and readonly assignment guarantee — control serialization explicitly
- Readonly classes cannot use `__set` magic, preventing dynamic property injection
- Uninitialized readonly properties accessed accidentally cause `\Error` at runtime, preventing silent null propagation

## Common Mistakes

1. **Trying to Modify After Construction:** Developers accustomed to mutable objects write `$dto->name = strtoupper($dto->name)` which errors at runtime. Use factories or the "with" pattern for transformations.

2. **Non-Readonly by Default:** Teams adopt DTOs but forget the `readonly` keyword. Months later, a bug is traced to an unexpected mutation. Apply `readonly` at the class level from the first commit.

3. **Uninitialized Properties in Factories:** A factory method that fails to assign all promoted readonly properties produces an uninitialized property. Static analysis (PHPStan level 6+) catches these.

4. **Dynamic Construction via Spread:** `$dto = new UserDto(...$data)` requires exact key-to-parameter-name matching. Missing or extra keys cause runtime errors. Use named factories with explicit mapping.

## Anti-Patterns

- **The Non-Readonly DTO:** A "DTO" with setters or public non-readonly properties. This is a parameter bag, not a DTO. Mutability defeats the purpose of a data carrier.
- **The Manual Assignment DTO:** Declaring properties then manually assigning them in the constructor body instead of using constructor promotion. Creates duplication and risk of mismatch.
- **The Clone-and-Mutate Pattern:** Cloning a readonly DTO then attempting to modify the clone. Cloned readonly objects are still readonly — use `with*()` methods instead.

## Examples

### Readonly Class with Constructor Promotion
```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $bio = null,
    ) {}
}
```

### The "with" Pattern for Modified Copies
```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public function withName(string $name): self
    {
        return new self($name, $this->email);
    }

    public function withEmail(string $email): self
    {
        return new self($this->name, $email);
    }
}
```

### Lazy Initialization Workaround (Rarely Needed)
```php
readonly class ExpensiveDto
{
    private ?int $cachedTotal = null;

    public function computeTotal(): int
    {
        return $this->cachedTotal ??= $this->calculate();
    }

    private function calculate(): int { /* ... */ }
}
```

## Related Topics

- **DTO Fundamentals** — baseline DTO definition and purpose
- **DTO Construction Patterns** — factory methods, hydration, named constructors
- **spatie/laravel-data** — package managing readonly DTO creation automatically

## AI Agent Notes

- Always use `readonly class` for DTOs when targeting PHP 8.2+
- Always use constructor promotion — never manually declare properties and then assign them in the constructor body
- Include `with*()` methods when immutability-modified copies are needed
- Never add `__set`, `__get`, or `__wakeup` magic methods to readonly DTOs
- For spatie/laravel-data, note that `#[Lazy]` properties are incompatible with `readonly class`

## Verification

- [ ] DTO is declared as `readonly class` (PHP 8.2+) or uses `public readonly` on all properties (PHP 8.1)
- [ ] All properties use constructor promotion
- [ ] No `__set` or `__get` magic methods are defined
- [ ] No setters exist
- [ ] Factory methods assign all promoted properties
- [ ] Clone-and-mutate patterns use `with*()` methods instead of direct modification
- [ ] Serialization is controlled via `__serialize()`/`__unserialize()` or `JsonSerializable`
- [ ] Static analysis (PHPStan/PHPStan level 6+) catches uninitialized properties
