# DTO Construction Patterns

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** DTO Construction Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

DTO construction patterns define how DTOs are built from various data sources — HTTP requests, Eloquent models, external API responses, and user input. The core patterns are static named constructors (`fromRequest`, `fromArray`, `fromModel`), collection construction for arrays of DTOs, and hydration strategies for populating DTOs from different source shapes.

The engineering significance lies in centralizing the mapping logic between data sources and typed DTOs. A `fromRequest` factory method encapsulates the logic of extracting validated request fields into typed properties. A `fromModel` factory handles the model-to-DTO mapping. Without these patterns, every caller performs its own mapping, leading to duplication and inconsistency.

---

## Core Concepts

### Named Constructor Pattern

Static methods on the DTO class that serve as intention-revealing factories:

```php
class UserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
        );
    }

    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            email: $request->validated('email'),
        );
    }

    public static function fromModel(User $user): self
    {
        return new self(
            name: $user->name,
            email: $user->email,
        );
    }
}
```

### Collection Construction

Building arrays of DTOs from nested data:

```php
class LineItemDto
{
    public static function collection(array $items): array
    {
        return array_map(
            fn(array $item) => self::fromArray($item),
            $items,
        );
    }
}
```

Or using a DTO collection class:

```php
class LineItemCollection
{
    /** @param LineItemDto[] $items */
    public function __construct(
        public readonly array $items,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            items: array_map(
                fn(array $item) => LineItemDto::fromArray($item),
                $data,
            ),
        );
    }
}
```

---

## Mental Models

### The Translator

A named constructor is a translator. It speaks the source language (HTTP request, Eloquent model, JSON API) and translates to the DTO's language (typed properties). Each source has its own translator — they share no logic because the sources have different shapes.

### The Parser

The DTO constructor is a parser — it takes raw, untyped data and produces typed, structured output. If data is missing or the wrong type, the parser rejects it at construction time.

---

## Internal Mechanics

### Error Handling in Factories

Named constructors that map from array keys must handle missing keys:

```php
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'] ?? throw new InvalidArgumentException('name is required'),
        email: $data['email'] ?? throw new InvalidArgumentException('email is required'),
    );
}
```

Without explicit handling, missing keys produce a `Warning`-level error for `$data['key']` (PHP 8.x) and the value becomes `null` — which may violate a non-nullable type hint and produce a `TypeError`.

### Type Coercion in Constructors

The constructor can coerce types that are not inherently type-safe:

```php
class DateRangeDto
{
    public function __construct(
        public readonly Carbon $startDate,
        public readonly Carbon $endDate,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            startDate: Carbon::parse($data['start_date']),
            endDate: Carbon::parse($data['end_date']),
        );
    }
}
```

The DTO guarantees that consumers receive a `Carbon` instance, not a string.

---

## Patterns

### Method Injection Factory

For complex construction logic, extract factory to a separate class:

```php
class OrderDtoFactory
{
    public function fromRequest(CreateOrderRequest $request): OrderDto
    {
        return new OrderDto(
            customerId: $request->validated('customer_id'),
            items: $this->buildLineItems($request->validated('items')),
            billingAddress: AddressDto::fromArray(
                $request->validated('billing_address')
            ),
        );
    }

    private function buildLineItems(array $items): array
    {
        return array_map(
            fn(array $item) => LineItemDto::fromArray($item),
            $items,
        );
    }
}
```

Useful when construction requires injected dependencies (repository lookups, external service calls).

### Variadic Collection Factory

For DTOs constructed from multiple sources:

```php
class NotificationDto
{
    public static function fromUserAndOrder(User $user, Order $order): self
    {
        return new self(
            email: $user->email,
            name: $user->name,
            orderId: $order->id,
            total: $order->total,
        );
    }
}
```

---

## Architectural Decisions

### Static Method vs Instance Factory

Static named constructors are simpler and sufficient for most DTOs. Instance factories (separate factory class with injected dependencies) are needed when construction requires:
- Database lookups (resolving IDs to entities)
- External API calls
- Complex conditional construction logic
- Testing with mocked dependencies

### Array Key Naming Convention

Choose a convention for array keys in `fromArray`:
- **Snake case** (`user_id`): Matches database columns and form request keys
- **Camel case** (`userId`): Matches DTO property names

Use snake case for `fromArray` (input is from database or request) and camel case for DTO properties (PHP convention).

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized mapping logic per data source | Factory methods duplicate parameter lists | Use IDE generation or DTO packages |
| Intention-revealing — callers know how to construct | More code per DTO class | Factory methods are boilerplate but explicit |
| Collection construction ensures type consistency | Collection wrapper adds another class | Only create collection wrappers for complex types |

---

## Performance Considerations

Static factory method overhead is identical to direct construction — the static method is inlined by OpCache. Collection construction using `array_map` is efficient for typical sizes (10-100 items). For very large collections (1000+ items), consider generator-based construction.

---

## Production Considerations

### Factory Method Testing

Test each named constructor independently:

```php
public function test_from_array_constructs_dto(): void
{
    $dto = UserDto::fromArray([
        'name' => 'John',
        'email' => 'john@test.com',
    ]);
    $this->assertEquals('John', $dto->name);
}

public function test_from_array_throws_on_missing_required(): void
{
    $this->expectException(\InvalidArgumentException::class);
    UserDto::fromArray(['name' => 'John']);
}
```

### Consistency Enforcement

Use a consistent pattern across all DTOs in the codebase:
- Every DTO has `fromArray()` if constructed from arrays
- Every DTO constructed from requests has `fromRequest()`
- Every DTO constructed from models has `fromModel()`

Consistency makes the codebase predictable — developers know which methods to call without checking each DTO.

---

## Common Mistakes

### Mixing Source-Specific Logic in fromArray
Why it happens: Adding request-specific field mapping in `fromArray` because the request and array sources are similar. Why it's harmful: `fromArray` becomes coupled to a specific source format. Better approach: Keep `fromArray` a pure key-to-property mapping. Use `fromRequest` for request-specific transformations.

### Skipping Type Coercion
Why it happens: Passing raw strings as dates or raw integers as enum values. Why it's harmful: Downstream consumers must parse the values themselves — the DTO fails its primary job of providing typed data. Better approach: Coerce types in the constructor or factory method.

### Factory Methods Without Error Handling
Why it happens: Assuming input data is always complete and valid. Why it's harmful: Production errors from missing keys are `Warning`-level and go unnoticed until data corruption occurs. Better approach: Validate key presence with explicit checks or use packages like spatie/laravel-data.

---

## Failure Modes

### Factory Method Explosion
A DTO with 6+ named constructors (`fromRequest`, `fromApi`, `fromModel`, `fromImport`, `fromLegacy`, `fromForm`) indicates the DTO is used in too many contexts. Either the DTO is too generic (split into operation-specific DTOs) or the factories should be extracted to dedicated factory classes.

### Silent Null Assignment
`$data['missing_key']` in PHP 8.x emits a `Warning` and returns `null`. If the DTO property is non-nullable (`public readonly string $name`), a `TypeError` is thrown — good. But if the property is nullable (`?string`), `null` is silently accepted, masking the missing data.

---

## Ecosystem Usage

### Laravel Spark
Spark uses named constructor patterns for its DTOs — `fromRequest` factories in subscription and billing flows.

### Spatie/laravel-data
The package provides automatic named constructor generation, type casting, and validation. For teams using Spatie, manual factory methods are largely replaced by the package's `Data` class infrastructure.

---

## Related Knowledge Units

### Prerequisites
- Data Transfer Object Design — Core DTO principles

### Related Topics
- DTO Nesting Composition — Nested DTO construction
- Spatie Laravel Data Integration — Package-based construction

### Advanced Follow-up Topics
- Factory Pattern for Complex DTOs — Separate factory classes with DI
- DTO Validation Integration — Validation in DTO construction

---

## Research Notes

### Source Analysis
- PHP 8.1+ named arguments: Named constructor call syntax (`new self(name: ...)`)
- Common pattern across Monica CRM, Laravel Spark, and Spatie packages
- Community preference for static factory methods over separate factory classes

### Key Insight
Named constructors are the most important DTO construction pattern because they document the data source and encapsulate source-specific mapping logic. Without them, mapping logic bleeds into controllers and services — the exact problem DTOs are meant to solve.

### Version-Specific Notes
- PHP 8.1: Named arguments make named constructor calls self-documenting
- PHP 8.2: Readonly classes reduce boilerplate in DTO definitions
