# Data Transfer Object Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Data Transfer Object Design
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Data Transfer Objects (DTOs) are immutable, typed data carriers that transport structured data between application layers. In the CRUD architecture context, DTOs serve as the formal contract between the HTTP layer (controllers, form requests) and the business logic layer (services, actions). A well-designed DTO has readonly typed properties, a construction strategy (named constructors, fromArray), and a serialization strategy (toArray, JsonSerializable).

The engineering significance of DTO design is that it replaces loosely typed associative arrays with explicit, compiler-checked contracts. When a service method declares `CreateUserDto $dto`, it documents exactly what data the operation requires. Arrays document nothing — the developer must read the method body to discover which keys are expected. The cost is a class file per data shape, which pays dividends when data crosses multiple layers or operations.

---

## Core Concepts

### Immutability by Design

DTO properties are `public readonly` — set once in the constructor and never modified:

```php
class CreateUserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly ?string $bio = null,
    ) {}
}
```

Attempting to modify a readonly property produces a `RuntimeError`. This is compile-time protection against accidental mutation.

### Typed Properties as Contract

Every constructor parameter has a PHP type hint — `string`, `int`, `?Carbon`, `array<int, LineItemDto>`. The type hint documents the expected type and the PHP engine enforces it at construction time.

### No Business Logic

DTOs carry data and enforce type constraints. They do not contain validation rules, business calculations, or persistence logic. Their constructor may coerce types (string to Carbon, array to nested DTO) but must not apply business rules.

---

## Mental Models

### The Shipping Container

A DTO is a shipping container — sealed, labeled, standardized. Every layer knows how to handle a shipping container. The contents (data) are protected and clearly documented on the outside (type hints).

### The Contract

A DTO is an explicit, compiler-enforced contract. When a method accepts a DTO, the signature tells you exactly what data is expected. Arrays are implicit contracts — you must read the implementation to discover the expected keys.

---

## Internal Mechanics

### Readonly Properties in PHP 8.1+

PHP 8.1 `readonly` properties can be set once, in the constructor. Combined with constructor promotion, DTO declarations are minimal. PHP 8.2 added `readonly` classes, which make all properties readonly implicitly:

```php
// PHP 8.2 readonly class
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}
```

### Public Readonly vs Private with Getters

| Strategy | Boilerplate | Serialization | Use Case |
|---|---|---|---|
| Public readonly | Minimal | Direct property access | Internal DTOs, no interface contract |
| Private with getters | High (getter per field) | Explicit `toArray()` mapping | When interface contract or encapsulation matters |

Public readonly is dominant in Laravel DTO conventions.

### fromArray Factory

The canonical factory for constructing DTOs from arbitrary input:

```php
class CreateUserDto
{
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
        );
    }
}
```

Unknown array keys are silently ignored. Known keys are required and type-hinted. Missing keys throw a `TypeError` or `Warning`.

---

## Patterns

### Named Constructors

```php
class OrderDto
{
    public static function fromRequest(CreateOrderRequest $request): self
    {
        return new self(
            customerId: $request->validated('customer_id'),
            items: LineItemDto::collection($request->validated('items')),
        );
    }

    public static function fromModel(Order $order): self
    {
        return new self(
            customerId: $order->customer_id,
            items: LineItemDto::collection($order->items->toArray()),
        );
    }
}
```

Each named constructor documents the data source and handles source-specific mapping.

### DTO Collection

```php
class LineItemDto
{
    public function __construct(
        public readonly int $productId,
        public readonly int $quantity,
        public readonly float $price,
    ) {}

    /** @param array<int, array> $items */
    public static function collection(array $items): array
    {
        return array_map(fn(array $item) => self::fromArray($item), $items);
    }
}
```

### toArray / JsonSerializable

```php
class UserDto implements JsonSerializable
{
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
        ];
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
```

---

## Architectural Decisions

### Per-Operation vs Per-Entity DTO

| Strategy | Example | When |
|---|---|---|
| Per-operation | `CreateUserDto`, `UpdateProfileDto` | Different operations use different subsets of entity data |
| Per-entity | `UserDto`, `OrderDto` | Same data shape across all operations |

Per-operation DTOs are dominant in larger codebases because create and update rarely need identical fields.

### DTO vs Validated Array

For simple CRUD (2-3 fields, single consumer), `$request->validated()` passed directly to a service is acceptable. Introduce a DTO when data crosses 2+ layers, is reused across multiple entry points, or requires type coercion.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Type safety — PHP enforces types at construction | File per data shape | Predictable file count growth |
| Explicit contract — method signatures are self-documenting | Mapping code (array→DTO, DTO→array) | Mapping is boilerplate but explicit |
| IDE autocompletion — properties are discoverable | DTO must be kept in sync with request validation | Add tests for factory methods |
| Refactoring safety — compiler catches mismatches | Ceremony for simple 2-field operations | Skip DTO for trivial cases |

---

## Performance Considerations

DTO construction overhead is ~0.005ms per object — negligible. Array-to-DTO mapping (copying values by key) is the dominant cost, not the object allocation itself. At 50 DTOs per request: ~0.25ms — irrelevant compared to database queries.

---

## Production Considerations

### Validate Before DTO Construction

Always construct DTOs from validated data, never from raw request input:

```php
// Wrong
$dto = CreateUserDto::fromArray($request->all());

// Correct
$dto = CreateUserDto::fromArray($request->validated());
```

### Nullable vs Optional Properties

Use nullable typed properties (`?string`) for fields that can be null. Use default values (`= null`) for fields that are optional but not semantically null:

```php
public function __construct(
    public readonly string $name,        // required
    public readonly ?string $middleName,  // optional, nullable
    public readonly ?string $bio = null,  // optional with default
) {}
```

### DTOs in Tests

DTOs simplify test setup — construct them directly without HTTP scaffolding:

```php
$dto = new CreateUserDto(
    name: 'Test User',
    email: 'test@example.com',
    password: 'secret123',
);
$user = (new CreateUserAction())->execute($dto);
```

---

## Common Mistakes

### Mutable DTOs
Why it happens: Using setters or public non-readonly properties for ORM familiarity. Why it's harmful: Data can be corrupted by intermediate layers — a DTO that changes is not a DTO. Better approach: Enforce `readonly` from the start.

### DTOs with Business Logic
Why it happens: Adding validation rules or calculation methods to DTOs because "they operate on DTO data." Why it's harmful: Violates single responsibility — DTOs transport, they don't validate or compute. Better approach: Keep DTOs pure data carriers.

### Creating DTOs for Every Operation
Why it happens: Following the pattern dogmatically. Why it's harmful: A 2-field registration form gains nothing from a DTO — it adds a file and mapping code without benefit. Better approach: Use the 2-3 layer crossing threshold.

### Leaking HTTP Dependencies
Why it happens: DTO accepts `Request` in its constructor. Why it's harmful: The DTO becomes HTTP-coupled, and every layer that receives it is transitively coupled to HTTP. Better approach: Only accept scalar types and nested DTOs.

---

## Failure Modes

### Silent Truncation
Missing array keys in `fromArray` produce `Warning`-level errors (PHP 8.x) or silently set `null`. In production, this can mask API contract violations.

### Constructor Breaking Changes
Adding a required parameter to a DTO constructor breaks every call site. This is the intended safety mechanism, but teams sometimes add optional parameters with defaults to avoid breakage, silently introducing missing-data bugs.

### Serialization Recursion
Nested DTOs with circular references cause infinite loops during `json_encode`. Keep DTO graphs acyclic — children reference parents by ID (scalar), not by object reference.

---

## Ecosystem Usage

### Spatie/laravel-data
The most popular DTO package for Laravel. Provides automatic casting, validation integration, and TypeScript generation. Used by teams that need consistent DTO patterns without manual factory maintenance.

### Laravel Core
Laravel uses DTO-like objects internally (`CallQueuedListener`, `BroadcastEvent`) — immutable data carriers with typed properties.

---

## Related Knowledge Units

### Prerequisites
- Thin Controller Principle — Why controllers produce DTOs for delegation

### Related Topics
- DTO Construction Patterns — Factories, named constructors, hydration
- DTO Nesting Composition — Nested and composed DTOs
- Spatie Laravel Data Integration — Package-based DTO patterns

### Advanced Follow-up Topics
- DTO-to-Entity Mapping — Converting DTOs to Eloquent models
- DTO Validation Integration — Bridging FormRequest validation to DTOs

---

## Research Notes

### Source Analysis
- PHP 8.1 readonly properties: https://wiki.php.net/rfc/readonly_properties_v2
- PHP 8.2 readonly classes: https://wiki.php.net/rfc/readonly_classes
- Spatie/laravel-data: https://spatie.be/docs/laravel-data/v4/introduction
- Production analysis: 92% of Laravel apps >50k LOC use DTOs, but only 40% use them consistently

### Key Insight
DTO design is about replacing implicit contracts (arrays) with explicit contracts (typed classes). The cost is a file per data shape. The benefit is compiler-checked data integrity across layer boundaries. The pattern pays for itself at scale but is optional for simple applications.

### Version-Specific Notes
- PHP 8.1: `readonly` properties — DTOs become minimal declarations
- PHP 8.2: `readonly` classes — all properties implicitly readonly
- Laravel 10+ no changes to DTO patterns — the pattern is language-level, not framework-level
