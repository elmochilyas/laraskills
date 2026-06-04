# DTO vs Value Object

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO vs Value Object
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-02

## Overview

DTOs and Value Objects (VOs) are both immutable data carriers in PHP, but they serve fundamentally different purposes. DTOs transport data between layers — they exist to cross boundaries. Value Objects encapsulate domain concepts with equality semantics — two VOs are equal if their properties are equal, regardless of identity. DTOs have no identity at all; two DTOs with the same values are interchangeable, but equality is rarely checked.

The engineering failure is using DTOs where VOs are needed (domain modeling) or VOs where DTOs are needed (layer crossing). A DTO is a pipe; a VO is a concept. The pipe carries the concept, but the pipe is not the concept itself.

## Core Concepts

- **Identity Semantics:** DTO: never compared, reference equality by default. VO: value equality (all properties must match), implemented via `equals()` method.
- **Immutability:** Both enforce readonly, but for different reasons. DTO: prevent accidental mutation during transport. VO: guarantee the value never changes (a `new Email('x')` is always `'x'`).
- **VO Invariants:** A Value Object enforces its invariants at construction. An `Email` VO validates the email format in the constructor — an invalid email cannot exist as an `Email` object. DTO validation is external.
- **VO Methods:** Value Objects can have behavior (`add()`, `multiply()`, `format()`). DTOs rarely have behavior — they carry data that behavior acts upon.
- **Domain Primitives:** A VO that wraps a single scalar (e.g., `UserId`, `Email`) is called a Domain Primitive. Replaces scalar type hints with typed domain concepts.

## When To Use

- VO: When a value has invariants, format rules, or behavior (email, money, phone number, date range)
- VO: When equality semantics matter — two values are the same if their properties match
- VO: When primitive obsession is causing bugs (passing `int $userId` where `OrderId` expected)
- DTO: When data needs to cross application layers with type safety
- DTO Inside DTO: VOs live inside DTOs as typed properties — the DTO transports domain concepts alongside scalars

## When NOT To Use

- Do NOT create a VO without invariants — a wrapper without validation is just a named scalar with ceremony
- Do NOT add domain behavior to a DTO — a DTO with `add()`, `merge()`, or `equals()` is being used as a VO
- Do NOT compare DTOs by value — they are not VOs; reference comparison is correct behavior
- Do NOT use VOs for every scalar field in bulk operations — construction overhead multiplies

## Best Practices (WHY)

- **Why VOs need invariants:** Without constructor validation, a Value Object is a named scalar — it adds ceremony without safety. Enforce invariants or use a scalar.
- **Why DTOs don't have equality:** DTOs transport data across boundaries; comparing DTOs by value is rarely meaningful. The identity of a DTO is its role in the data flow, not its value.
- **Why VOs inside DTOs for domain-rich applications:** A DTO with `Email $email` communicates intent better than `string $email`. The type system documents the domain concept.
- **Why construct VOs at the service boundary (option A):** Keeping VOs out of DTOs simplifies DTO construction. The service layer creates VOs from DTO scalars when needed.

## Architecture Guidelines

- VOs at system boundaries: validate at controllers, command handlers, queue jobs. Once inside the domain, VOs are guaranteed valid.
- Scalar in DTO → VO in Service: Option A (simpler DTOs) vs Option B (more expressive DTOs). Choose based on team preference for typing purity vs construction simplicity.
- Serialization symmetry: When DTOs contain VOs, handle VO-to-primitive conversion in `toArray()` via `__toString()` or explicit mapping.
- Primitive obsession policy: Decide at team level which identifiers (user_id, order_id) require VOs and which accept scalars.

## Performance

VO construction overhead: ~0.005ms per simple VO (email with filter_var), ~0.002ms for a money VO. For 5-20 VOs per request, total overhead is <0.1ms. In bulk operations (1000+ items), consider validating at collection level and using scalars in DTOs.

## Security

- VOs prevent invalid data from entering the domain by throwing at construction — nil-check chains throughout the codebase are eliminated
- VO serialization may expose internal validation logic (e.g., credit card last-four format) — use DTOs with selected fields for external output
- Domain Primitives prevent type confusion: passing `UserId` where `OrderId` is expected is a compiler error, not a runtime bug

## Common Mistakes

1. **VO Without Invariants:** A Value Object that does not validate its input is a named scalar, not a VO. Without validation, the wrapper adds ceremony without safety.

2. **DTO with VO Methods:** A DTO that has `add()`, `merge()`, or `equals()` methods is being used as a VO. DTOs should not have domain behavior — that belongs on VO classes or services.

3. **Comparing DTOs by Value:** Using `==` or `===` on DTOs compares references. If value comparison is needed, implement `__toString()` or an `equals()` method, but this is rarely appropriate for DTOs.

4. **Primitive Obsession in DTOs:** Using `int $userId` instead of `UserId $userId` loses type safety. The compiler accepts `int $orderId` where `int $userId` is expected.

## Anti-Patterns

- **The Ceremony Wrapper:** A VO class that merely wraps a scalar with no validation or behavior. Adds ceremony without safety. Either add invariants or use a scalar.
- **The DTO-VO Hybrid:** A class used as both a DTO (transporting across layers) and a VO (with domain behavior and equality). Blurs the line between transport and domain modeling.
- **The God VO:** A VO with 15 methods covering every possible operation on the value. VOs should have focused behavior related to the value they represent.

## Examples

### Value Object with Invariants
```php
readonly class Email
{
    public function __construct(
        public string $value
    ) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$value}");
        }
    }

    public function equals(Email $other): bool
    {
        return $this->value === $other->value;
    }

    public function domain(): string
    {
        return explode('@', $this->value)[1] ?? '';
    }
}
```

### VO Inside DTO
```php
readonly class OrderDto
{
    public function __construct(
        public OrderId $orderId,        // VO: wraps int with validation
        public Email $customerEmail,    // VO: wraps string with validation
        public Money $total,            // VO: wraps int+string with invariants
        public string $status,          // scalar: no domain concept
    ) {}
}
```

### DTOs with Scalars → VOs in Service
```php
readonly class CreateUserDto
{
    public function __construct(
        public string $email,   // scalar, not VO — DTO stays simple
        public string $name,
    ) {}
}

class CreateUserService
{
    public function execute(CreateUserDto $dto): void
    {
        $email = new Email($dto->email); // VO created at service boundary
        // Use $email throughout service
    }
}
```

## Related Topics

- **DTO Fundamentals** — baseline DTO definition
- **DTO vs Form Request** — HTTP vs data layer boundary
- **spatie/laravel-data** — package support for VOs in Data objects
- **Domain Primitive Pattern** — primitive obsession replacement

## AI Agent Notes

- DTOs transport data; VOs encapsulate domain concepts with equality
- VOs must validate invariants at construction — no validation = no VO
- DTOs should not have `equals()`, `add()`, or domain behavior methods
- Use VOs for identifiers, money, email, phone — anything with format rules
- Use scalars for simple strings, numbers, booleans with no domain rules
- When DTOs contain VOs, serialize via `__toString()` or explicit mapping

## Verification

- [ ] VOs validate invariants in the constructor
- [ ] VOs implement `equals()` or value-based comparison
- [ ] VOs have no setter methods (readonly enforced)
- [ ] DTOs do not have domain behavior methods
- [ ] DTOs are not compared by value
- [ ] Type safety is maintained — no primitive obsession for identifiers
- [ ] VO ↔ DTO boundary is clear: DTO transports, VO encapsulates
