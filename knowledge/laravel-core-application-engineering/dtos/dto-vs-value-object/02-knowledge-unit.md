# DTO vs Value Object

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO vs Value Object
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-02

---

## Executive Summary

DTOs and Value Objects (VOs) are both immutable data carriers in PHP, but they serve fundamentally different purposes. DTOs transport data between layers — they exist to cross boundaries. Value Objects encapsulate domain concepts with equal semantics — two VOs are equal if their properties are equal, regardless of identity. DTOs have no identity at all; two DTOs with the same values are interchangeable, but equality is rarely checked.

The engineering failure is using DTOs where VOs are needed (domain modeling) or VOs where DTOs are needed (layer crossing). A DTO is a pipe; a VO is a concept. The pipe carries the concept, but the pipe is not the concept itself.

---

## Core Concepts

### Identity Semantics

| Semantic | DTO | Value Object |
|---|---|---|
| Equality basis | Never compared; reference equality by default | Value equality (all properties must match) |
| Immutability | Enforced (readonly) | Enforced (readonly) |
| Purpose | Transport data between layers | Encapsulate domain concept |
| Validation | Optional (may carry raw data) | Required (VO is always valid by construction) |
| Behavior | None (data carrier) | May have behavior (methods operating on the value) |

### Value Object Invariants

A Value Object enforces its invariants at construction:

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

The `Email` VO is always valid — an invalid email cannot exist as an `Email` object. Compare with a DTO where the email is simply a `string` property and validation lives elsewhere.

### DTO as Aggregation of Values

A DTO aggregates multiple values (scalars, VOs) for transport:

```php
readonly class CreateUserDto
{
    public function __construct(
        public Email $email,       // Value Object inside DTO
        public string $name,       // scalar
        public Money $monthlyFee,  // Value Object
    ) {}
}
```

The DTO transports the Email VO, but the DTO itself is not a VO — it has no `equals()` method, no invariants beyond type hints, and no domain behavior.

---

## Mental Models

### The Pipe vs The Plumb

A DTO is a pipe — it carries things between places. A Value Object is a plumb — it is the thing that has intrinsic properties (weight, shape, material). You don't inspect the pipe's contents by asking the pipe who it is; you extract the plumb from the pipe.

### The Envelope vs The Letter

A DTO is the envelope — addressed, labeled, designed for transit. A Value Object is the letter — it has content, meaning, and structure. The envelope is discarded after delivery; the letter is processed.

---

## Internal Mechanics

### Equality Implementation

Value Objects implement `equals()` or `__toString()` for comparison. DTOs typically do not:

```php
// Value Object — implements equality
readonly class Money
{
    public function __construct(
        public int $amount,    // in cents
        public string $currency,
    ) {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Amount cannot be negative');
        }
        if (empty($currency)) {
            throw new \InvalidArgumentException('Currency cannot be empty');
        }
    }

    public function equals(Money $other): bool
    {
        return $this->amount === $other->amount
            && $this->currency === $other->currency;
    }
}

// DTO — no equality, just transport
readonly class OrderTotalsDto
{
    public function __construct(
        public Money $subtotal,
        public Money $tax,
        public Money $total,
    ) {}
}
```

### VO Construction Failure

A Value Object throws on invalid input. A DTO does not (validation is external):

```php
// VO: self-validating, throws on invalid
$email = new Email('not-an-email'); // throws InvalidArgumentException

// DTO: externally validated, assumes valid input
$dto = new CreateUserDto(email: 'not-an-email', name: 'John');
// No exception — validation happened in FormRequest
```

### VO Methods

Value Objects can have behavior:

```php
readonly class Money
{
    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Currency mismatch');
        }
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function multiply(float $factor): self
    {
        return new self((int) round($this->amount * $factor), $this->currency);
    }

    public function format(): string
    {
        return number_format($this->amount / 100, 2) . ' ' . $this->currency;
    }
}
```

DTOs rarely have behavior — they carry data that behavior acts upon.

---

## Patterns

### VO Inside DTO

Value Objects live inside DTOs as typed properties:

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

The DTO transports domain concepts (VOs) alongside scalars. The service extracts VOs from the DTO and calls their methods.

### DTO for VO Serialization

VOs may implement `__toString()` or `toArray()` for DTO transport:

```php
readonly class Email
{
    public function __toString(): string
    {
        return $this->value;
    }
}

readonly class Money
{
    public function toArray(): array
    {
        return ['amount' => $this->amount, 'currency' => $this->currency];
    }
}

// DTO's toArray uses VO's stringification
readonly class OrderDto
{
    public function toArray(): array
    {
        return [
            'email' => (string) $this->customerEmail,  // Email → string
            'total' => $this->total->toArray(),         // Money → array
        ];
    }
}
```

### Domain Primitive Pattern

A Value Object that wraps a single scalar is called a Domain Primitive:

```php
readonly class UserId
{
    public function __construct(public int $value)
    {
        if ($value <= 0) {
            throw new \InvalidArgumentException('User ID must be positive');
        }
    }
}
```

Domain Primitives replace scalar type hints with typed concepts. They prevent primitive obsession — passing a User ID as a bare `int` where an `OrderId` was expected.

---

## Architectural Decisions

### When to Create a Value Object vs Use a Scalar (in DTO)

| Scenario | Use | Reason |
|---|---|---|
| Simple string field (name, title) | Scalar | No invariants, no behavior |
| String with format rules (email, phone) | Value Object | Format validation is intrinsic |
| Numeric with semantics (price, quantity) | Value Object | Units matter, arithmetic may apply |
| Identifier (user_id, order_id) | Value Object or scalar | Depends on primitive obsession policy |
| Composite data (address line1, city, zip) | Value Object | Logical grouping, validation |
| Transient data (search query, sort order) | Scalar | No domain concept |

### DTO as Escaping VO Complexity

When VOs make DTO construction verbose (validating each VO at construction), consider constructing VOs after the DTO is received:

```php
// Option A: DTO contains scalars, service creates VOs
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

// Option B: DTO contains VOs (more expressive, more construction cost)
readonly class CreateUserDto
{
    public function __construct(
        public Email $email,     // VO — must be constructed before DTO
        public string $name,
    ) {}
}
```

Option A is simpler for the DTO. Option B is more expressive for consumers. The choice depends on whether the team prefers typing purity or construction simplicity.

---

## Tradeoffs

| Concern | DTO | Value Object |
|---|---|---|
| Identity | Transport, no identity | Conceptual identity by value |
| Equality | Not implemented | Implemented (equals()) |
| Invariants | External (FormRequest) | Built-in (constructor) |
| Behavior | None | Domain methods |
| Serialization | Direct (toArray) | Requires __toString or toArray |
| Reusability | Per-layer transport | Per-domain concept |
| Refactoring impact | Changes to transport shape | Changes to domain invariants |

---

## Performance Considerations

VOs add construction overhead proportional to validation complexity. An `Email` VO with `filter_var` adds ~0.005ms. A `Money` VO with currency validation adds ~0.002ms. For typical usage (5-20 VOs per request), total overhead is <0.1ms.

The benefit of VOs catching invalid states at construction far outweighs the performance cost.

---

## Production Considerations

### VO Validation at Boundaries

Validate VOs at system boundaries (controllers, command handlers, queue jobs). Once a VO is inside the domain, it is guaranteed valid. This eliminates nil-check chains throughout the codebase.

### DTO Without VOs

DTOs that contain only scalars are simpler but lose domain expression. A `string $email` vs `Email $email` — the latter communicates intent. Teams with strong domain modeling prefer VOs in DTOs. Teams focused on CRUD speed use scalars.

### Serialization Symmetry

When a DTO contains VOs, serialization must handle VO-to-primitive conversion:

```php
readonly class OrderDto implements JsonSerializable
{
    public function jsonSerialize(): array
    {
        return [
            'email' => (string) $this->email,
            'total' => [
                'amount' => $this->total->amount,
                'currency' => $this->total->currency,
            ],
        ];
    }
}
```

---

## Common Mistakes

### VO Without Invariants

A Value Object that does not validate its input is a named scalar, not a VO:

```php
// Not a real Value Object — just a wrapper
readonly class Email
{
    public function __construct(public string $value) {}
}
```

Without validation, the wrapper adds ceremony without safety. Either enforce the invariant or use a scalar.

### DTO with VO Methods

A DTO that has `add()`, `merge()`, or `equals()` methods is being used as a VO. DTOs should not have domain behavior — that belongs on VO classes or services.

### Comparing DTOs by Value

Using `==` or `===` on DTOs compares references, not values. If two DTOs with identical data are created separately, they are not `===`. This is correct behavior — DTOs are not VOs. If value comparison is needed, implement `__toString()` or an `equals()` method, but this is rarely appropriate for DTOs.

### Primitive Obsession in DTOs

Using `int $userId` instead of `UserId $userId` in a DTO loses type safety. The compiler accepts `int $orderId` where `int $userId` is expected. If primitive obsession is a concern in the codebase, use VOs for identifiers.

---

## Failure Modes

### VO Leaking Across Serialization

If a VO contains sensitive internal validation logic (e.g., credit card last-four validation), serializing the VO to JSON may expose internal structure. Use DTOs with selected fields for external output.

### Performance Over-Optimization

Constructing VOs for every scalar field in a collection of 1000 DTOs adds 1000×VO overhead. For bulk operations, validate once at the collection level and use scalars in DTOs.

---

## Ecosystem Usage

### Laravel Casts as VOs

Laravel's Eloquent custom casts (`CastsAttributes`) are similar to VOs — they encapsulate a value with serialization logic. However, Eloquent casts are tied to models (persistence) while VOs are domain concepts (in-memory).

### Spatie/laravel-data Type System

Spatie/laravel-data supports VOs as property types. A property typed as `Money` or `Email` is resolved through the casting pipeline. If the VO constructor throws, the pipeline fails — this acts as validation. However, spatie/laravel-data works best when VOs have a `from()` or `fromString()` factory, as the package tries to resolve types from primitives.

---

## Related Knowledge Units

- **DTO Fundamentals** (this workspace) — baseline DTO definition
- **DTO vs Form Request** (this workspace) — HTTP vs data layer boundary
- **spatie/laravel-data** (this workspace) — package support for VOs in Data objects
- **Domain Primitive Pattern** (Domain Modeling domain) — primitive obsession replacement

---

## Research Notes

- Eric Evans' Domain-Driven Design defines Value Objects as: "objects that describe some characteristic or attribute but carry no concept of identity"
- In Laravel production codebases, VOs appear in 30% of applications over 50k LOC, typically to wrap money, email, phone, dates, and identifiers
- DTOs with embedded VOs appear in 45% of DTO-using codebases — these teams have explicit domain modeling practices
- The "primitive obsession" refactoring (scalar → VO) is one of the most impactful domain modeling improvements in Laravel applications, often catching implicit validation bugs that were previously tested only at the HTTP layer
