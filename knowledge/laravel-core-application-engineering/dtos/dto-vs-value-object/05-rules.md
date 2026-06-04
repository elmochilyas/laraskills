## Rule 1: Use Value Objects for Domain Concepts with Invariants; Use DTOs for Layer Crossing

---

## Category

Architecture

---

## Rule

Choose a Value Object when encapsulating a domain concept that has invariants (email format, money precision, date range validity) and equality semantics. Choose a DTO when transporting data between application layers. Never use one in place of the other.

---

## Reason

DTOs and VOs serve fundamentally different purposes. A DTO is a pipe — it carries data across boundaries. A VO is a concept — it encapsulates domain rules and behavior. Using a DTO where a VO is needed loses domain safety (no invariant enforcement). Using a VO where a DTO is needed adds domain coupling to a transport object that should be simple.

---

## Bad Example

```php
// DTO used as a Value Object — tries to enforce invariants and provide behavior
readonly class EmailDto
{
    public function __construct(public string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid email');
        }
    }

    public function equals(EmailDto $other): bool { return $this->value === $other->value; }
    public function domain(): string { return explode('@', $this->value)[1] ?? ''; }
}
// This is a VO named "Dto". Confuses purpose. Used in a DTO role, the invariant enforcement may be unwanted.
```

---

## Good Example

```php
// Value Object with invariants
readonly class Email
{
    public function __construct(public string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$value}");
        }
    }

    public function equals(Email $other): bool { return $this->value === $other->value; }
    public function domain(): string { return explode('@', $this->value)[1] ?? ''; }
}

// DTO that uses the VO
readonly class UserDto
{
    public function __construct(
        public string $name,
        public Email $email,  // VO as a typed property
    ) {}
}
// Clear distinction: VO enforces email invariants. DTO transports the user data across layers.
```

---

## Exceptions

A class can be both a VO and a DTO in rare cases (e.g., a `Money` object used as a DTO property and also having `add()`/`subtract()` behavior). Document the dual role explicitly.

---

## Consequences Of Violation

Architecture: domain logic leaks into transport objects or transport concerns leak into domain objects. Maintenance: incorrect abstraction choice causes refactoring pain as the application grows.

---

## Rule 2: Value Objects Must Enforce Invariants in the Constructor

---

## Category

Design

---

## Rule

Every Value Object must validate its input in the constructor and throw an exception if the value is invalid. A Value Object without constructor validation is a named scalar — it adds ceremony without safety.

---

## Reason

The defining characteristic of a Value Object is that it guarantees its own validity. A `new Email('not-an-email')` should be impossible — the constructor prevents it. Without constructor validation, any consumer of the VO must still check validity, defeating the purpose of the abstraction. The VO is the invariant enforcement boundary.

---

## Bad Example

```php
readonly class Email
{
    public function __construct(public string $value) {}
    // No validation — any string becomes an Email. This is a named scalar, not a VO.
}
```

---

## Good Example

```php
readonly class Email
{
    public function __construct(public string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$value}");
        }
    }

    public function equals(Email $other): bool
    {
        return $this->value === $other->value;
    }
}
// Invalid email cannot exist as an Email object. The VO guarantees its own validity.
```

---

## Exceptions

When performance-critical paths (10,000+ constructions per request) require bypassing constructor validation, validate at the boundary and use a factory that constructs the VO without re-validation. Document this carefully.

---

## Consequences Of Violation

Reliability: invalid domain values propagate through the system because the VO did not enforce its invariant. Security: malformed input is treated as valid because no constructor validation exists.

---

## Rule 3: DTOs Must Not Have Domain Behavior Methods

---

## Category

Architecture

---

## Rule

Do not add `equals()`, `add()`, `merge()`, `compareTo()`, or any domain behavior methods to DTOs. Domain behavior belongs on Value Objects or service classes.

---

## Reason

A DTO with domain behavior blurs the line between data transport and domain logic. The DTO becomes harder to test (behavior requires setup), harder to reuse (behavior may not apply to all consumers), and harder to maintain (behavior is scattered across DTOs). Domain behavior on VOs is concentrated in the domain layer where it belongs.

---

## Bad Example

```php
readonly class OrderDto
{
    // DTO with domain behavior
    public function equals(OrderDto $other): bool { return $this->id === $other->id; }
    public function addItem(LineItemDto $item): self { /* returns new DTO with item */ }
    public function total(): int { return array_sum(array_map(fn($i) => $i->price, $this->items)); }
}
// DTO behaves like a Value Object. Domain behavior is scattered in the transport layer.
```

---

## Good Example

```php
readonly class OrderDto
{
    public function __construct(
        public int $id,
        /** @var LineItemDto[] */
        public array $items,
    ) {}
    // No behavior — pure data transport
}

// Value Object for behavior
readonly class Money
{
    public function __construct(public int $amount) {}
    public function add(Money $other): self { return new self($this->amount + $other->amount); }
}

// Service for behavior that involves multiple objects
class OrderCalculator
{
    public function total(OrderDto $order): Money
    {
        $total = new Money(0);
        foreach ($order->items as $item) {
            $total = $total->add(new Money($item->price));
        }
        return $total;
    }
}
```

---

## Exceptions

Formatting behavior that is purely for serialization (`toArray()`, `jsonSerialize()`) is acceptable on DTOs. This is presentation, not domain behavior.

---

## Consequences Of Violation

Maintenance: domain behavior scattered across DTOs instead of concentrated in services and VOs. Testing: DTO tests must now cover behavior scenarios. Reusability: DTOs with behavior cannot be used in contexts where that behavior is irrelevant.

---

## Rule 4: Use VOs Inside DTOs for Domain-Rich Properties

---

## Category

Design

---

## Rule

When a DTO property represents a domain concept with format rules or invariants (email, money, phone, order ID), use a Value Object as the property type instead of a scalar. Reserve scalars for properties with no domain rules (names, descriptions, flags).

---

## Reason

Value Objects as DTO properties communicate domain intent at the type system level. `Email $email` is more expressive than `string $email` — it documents that the value must be a valid email. PHPStan and IDE autocomplete enforce the type. The VO guarantees validity: once the DTO is constructed, the email is guaranteed valid.

---

## Bad Example

```php
readonly class OrderDto
{
    public function __construct(
        public int $orderId,       // Scalar — could be confused with any int
        public string $email,      // Scalar — could be any string
        public int $total,         // Scalar — cents? dollars? unknown unit
    ) {}
}
// Primitive obsession: domain concepts are hidden behind scalar types.
```

---

## Good Example

```php
readonly class OrderDto
{
    public function __construct(
        public OrderId $orderId,    // VO — wraps int, type-safe
        public Email $email,        // VO — wraps string, validates format
        public Money $total,        // VO — wraps int+currency, enforces precision
    ) {}
}
// Domain concepts are explicit. Type system enforces correctness.
```

---

## Exceptions

For performance-sensitive bulk operations (1000+ DTOs), consider using scalars in DTOs and constructing VOs at the service boundary to avoid VO construction overhead in the hot path.

---

## Consequences Of Violation

Reliability: primitive obsession causes type confusion bugs (passing `$orderId` where `$userId` is expected). Domain knowledge: new developers must guess which strings are emails, which ints are IDs, which ints are currency amounts.

---

## Rule 5: Never Compare DTOs by Value

---

## Category

Design

---

## Rule

Do not implement `equals()`, `__toString()` for comparison, or value-based `__hash()` on DTOs. DTOs are not compared by value — reference comparison is the correct behavior. If value comparison is needed, the data should be a Value Object, not a DTO.

---

## Reason

DTOs transport data across boundaries. Two DTOs with the same values but constructed from different sources represent different transport events — they are not "equal." Value comparison on DTOs is a sign that the class is being used as a Value Object. The comparison logic should move to a VO, or the DTO role should be reconsidered.

---

## Bad Example

```php
readonly class UserDto
{
    public function equals(UserDto $other): bool
    {
        return $this->name === $other->name && $this->email === $other->email;
    }
}
// DTO with value equality. Two DTOs from different sources are "equal" even though they represent different transport events.
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(public string $name, public string $email) {}
    // No equals() method. Reference comparison is correct.
    // If value comparison is needed, the data should be a Value Object.
}

readonly class UserInfo // Value Object
{
    public function __construct(public string $name, public string $email) {}
    public function equals(UserInfo $other): bool
    {
        return $this->name === $other->name && $this->email === $other->email;
    }
}
```

---

## Exceptions

No common exceptions. Adding value comparison to a DTO is a design smell that indicates VO should be used instead.

---

## Consequences Of Violation

Architecture: the distinction between DTO and VO is blurred. Maintenance: developers misuse DTO equality, causing subtle bugs in collection operations and caching logic.

---

## Rule 6: Serialize VOs Explicitly in DTO Output Methods

---

## Category

Design

---

## Rule

When DTOs contain Value Objects, handle VO-to-primitive conversion explicitly in `toArray()` or `jsonSerialize()`. Use the VO's `__toString()` or a dedicated `toPrimitive()` method. Do not rely on automatic serialization of VO objects.

---

## Reason

Value Objects are domain objects with internal state that may not map directly to primitives. Automatic serialization (e.g., `json_encode` on a VO with a single property) may expose internal structure or fail entirely. Explicit conversion gives full control over the output shape and ensures VOs are serialized as the correct primitive type.

---

## Bad Example

```php
readonly class OrderDto
{
    public function __construct(public Email $email, public Money $total) {}

    public function toArray(): array
    {
        return [
            'email' => $this->email,      // VO object — json_encode will fail or expose internals
            'total' => $this->total,       // VO object — same problem
        ];
    }
}
```

---

## Good Example

```php
readonly class OrderDto
{
    public function __construct(public Email $email, public Money $total) {}

    public function toArray(): array
    {
        return [
            'email' => $this->email->value,       // Explicit primitive conversion
            'total' => $this->total->amount,       // Explicit primitive conversion
            'currency' => $this->total->currency,  // Additional VO property exposed
        ];
    }
}

// Alternative: VO provides __toString
readonly class Email
{
    public function __toString(): string { return $this->value; }
}
```

---

## Exceptions

When using spatie/laravel-data with custom casters that handle VO serialization automatically, the package manages the conversion. Custom casters must define both input casting and output serialization.

---

## Consequences Of Violation

Reliability: `json_encode()` on a DTO with VOs may fail or produce unexpected output shapes. Maintenance: frontend consumers receive VO objects instead of primitives, requiring extra parsing.
