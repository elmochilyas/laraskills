# ECC Standardized Knowledge — Data Transfer Object Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Data Transfer Object Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Data Transfer Objects (DTOs) are immutable, typed data carriers that transport structured data between application layers. In the CRUD architecture context, DTOs serve as the formal contract between the HTTP layer (controllers, form requests) and the business logic layer (services, actions). A well-designed DTO has readonly typed properties, a construction strategy (named constructors, fromArray), and a serialization strategy (toArray, JsonSerializable). DTOs replace loosely typed associative arrays with explicit, compiler-checked contracts — when a service method declares `CreateUserDto $dto`, it documents exactly what data the operation requires.

## Core Concepts

- **Immutability by Design**: DTO properties are `public readonly` — set once in the constructor and never modified. PHP 8.2 introduced `readonly` classes, making all properties implicitly readonly.
- **Typed Properties as Contract**: Every constructor parameter has a PHP type hint — `string`, `int`, `?Carbon`, `array<int, LineItemDto>`. The type hint documents the expected type and PHP enforces it at construction time.
- **No Business Logic**: DTOs carry data and enforce type constraints. They do not contain validation rules, business calculations, or persistence logic. The constructor may coerce types (string to Carbon) but must not apply business rules.
- **Per-Operation vs Per-Entity DTO**: Per-operation DTOs (`CreateUserDto`, `UpdateProfileDto`) dominate in larger codebases because create and update rarely need identical fields. Per-entity DTOs (`UserDto`) work when same data shape is used across all operations.

## When To Use

- Data crosses 2+ layers (controller → service, service → repository)
- Data shape is reused across multiple entry points (HTTP, CLI, queue)
- Data requires type coercion (string dates to Carbon, integer IDs)
- Explicit contract is needed between layers — method signatures should self-document
- Refactoring safety is required — compiler catches mismatches when fields change

## When NOT To Use

- Simple 2-3 field operations with single consumer — `$request->validated()` passed directly is acceptable
- Trivial data crossing only one layer boundary
- When the DTO would be a near-exact copy of the FormRequest with no additional value
- Internal method calls within the same class where arrays are sufficient

## Best Practices

- Use `public readonly` properties (PHP 8.1+) or `readonly` classes (PHP 8.2+) for immutability
- Provide `fromArray()` factory method for array-to-DTO mapping
- Always construct DTOs from validated data (`$request->validated()`), never from raw input
- Use named constructors (`fromRequest()`, `fromModel()`) to document data sources
- Use nullable types (`?string`) for fields that can be null and default values for optional fields
- Implement `toArray()` and `JsonSerializable` for consistent serialization

## Architecture Guidelines

- DTOs bridge the HTTP layer and business logic — they must not import HTTP-related classes
- Per-operation DTOs are preferred over per-entity DTOs in larger codebases
- DTOs simplify test setup — construct them directly without HTTP scaffolding
- Validate data before DTO construction, not after — DTOs assume valid input

## Performance Considerations

- DTO construction overhead is ~0.005ms per object — negligible
- Array-to-DTO mapping (copying values by key) is the dominant cost, not object allocation
- At 50 DTOs per request: ~0.25ms total — irrelevant compared to database queries
- OpCache eliminates repeated autoloading cost

## Security Considerations

- DTOs must never receive raw `$request->all()` — only validated data
- DTOs should not carry sensitive data beyond what the consuming layer needs (principle of least data)
- Type coercion in constructors protects against type confusion attacks
- Serialization must not expose internal properties unintentionally

## Common Mistakes

- **Mutable DTOs**: Using setters or public non-readonly properties. Solution: Enforce `readonly` from the start.
- **DTOs with Business Logic**: Adding validation rules or calculation methods. Solution: Keep DTOs pure data carriers.
- **Creating DTOs for Every Operation**: A 2-field registration form gains nothing from a DTO. Solution: Use the 2-3 layer crossing threshold.
- **Leaking HTTP Dependencies**: DTO accepts `Request` in its constructor. Solution: Only accept scalar types and nested DTOs.

## Anti-Patterns

- **Anemic DTO Array Alternative**: Passing `$request->validated()` as an array through all layers. Loses all type safety and self-documenting signatures.
- **God DTO**: A single DTO serving create, update, and response purposes with all fields optional. Creates confusion about which fields are valid for which operation.
- **DTO as Entity**: DTO that mirrors the Eloquent model exactly, including relationships and computed properties — blurs the line between transport and persistence.

## Examples

### Immutable DTO with Readonly Properties
```php
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public ?string $bio = null,
    ) {}
}
```

### Named Constructors for Different Sources
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

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Thin Controller Principle | Why controllers produce DTOs for delegation | Prerequisite |
| DTO Construction Patterns | Factories, named constructors, hydration | Follow-up |
| DTO Nesting Composition | Nested and composed DTOs | Follow-up |
| Spatie Laravel Data Integration | Package-based DTO patterns | Follow-up |
| Controller-DTO-Action Flow | The flow pattern using DTOs | Related |
| Controller-DTO-Service Flow | Service layer using DTOs | Related |

## AI Agent Notes

- DTO design is about replacing implicit contracts (arrays) with explicit contracts (typed classes)
- The cost is a file per data shape — the benefit is compiler-checked data integrity across layer boundaries
- Always construct DTOs from validated, not raw, data
- DTOs must be immutable — enforce with `readonly` from the start
- When generating code, create the DTO first, then the action/service, then wire the controller

## Verification

- [ ] DTO properties are readonly (public readonly or readonly class)
- [ ] DTO has no business logic or validation rules
- [ ] DTO does not import HTTP-related classes
- [ ] DTO has at least one factory method (fromArray, fromRequest, fromModel)
- [ ] DTO has toArray() or JsonSerializable for serialization
- [ ] DTO constructor uses typed parameters
- [ ] DTO is immutable — no setters, no mutable properties
- [ ] DTO is constructed from validated data only
