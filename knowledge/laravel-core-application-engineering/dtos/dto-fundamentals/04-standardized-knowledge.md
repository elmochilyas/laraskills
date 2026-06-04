# DTO Fundamentals

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Fundamentals
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

## Overview

Data Transfer Objects (DTOs) are immutable data carriers that transport typed, structured data between application layers. In Laravel, DTOs serve as the formal boundary between the HTTP layer (controllers, form requests) and the business logic layer (services, actions). Unlike arrays, DTOs provide type safety, property autocompletion, and an explicit contract for what data a given operation requires.

The core engineering decision is when to introduce a DTO versus passing an array. DTOs pay for themselves when data crosses multiple layers (controller → service → action → repository) or when the same data shape is used across multiple entry points (HTTP, CLI, queue).

## Core Concepts

- **Immutable Data Carrier:** A DTO is constructed once and never mutated. All properties are read-only, guaranteeing data flowing through the application cannot be altered by intermediate layers.
- **Layer Boundary Object:** DTOs define the contract between adjacent layers. The controller produces DTOs; the service consumes DTOs. Neither side depends on the other's implementation details (HTTP request, Eloquent model, CLI input).
- **No Behavior (in pure DTOs):** A DTO carries data and enforces type constraints. It does not contain business logic, validation rule definitions, or persistence logic. Behavior belongs in services and actions.
- **Public Readonly Properties:** `public readonly` in PHP 8.1+ provides minimal boilerplate and direct property access. Private with getters is an alternative when interface contracts matter.
- **fromArray Factory Pattern:** The canonical way to construct a DTO from arbitrary input — a static method that maps array keys to typed constructor parameters.

## When To Use

- Data crosses 2-3+ application layers (controller → service → action → repository)
- Same data shape is used across multiple entry points (HTTP, CLI, queue)
- Service method signatures need to be self-documenting with typed parameters
- Multiple consumers need the same data contract with type safety
- The data shape has complex nested structure with typed relationships

## When NOT To Use

- Simple CRUD with a single controller calling a single service method
- Fewer than 3 fields with no transformation (pass-through to model)
- Single entry point with no expected additional callers
- Prototype/MVP where data shapes change rapidly
- Laravel Breeze/Jetstream style actions where arrays suffice

## Best Practices (WHY)

- **Why immutable:** Prevents accidental mutation by intermediate layers; a DTO that can be mutated is a parameter bag, not a DTO. Enforce `readonly` from the first commit.
- **Why validate before construction:** DTOs assume valid data. Never construct from `$request->all()` — always route through FormRequest's `validated()` first.
- **Why no business logic:** A DTO that validates itself blurs the boundary between data transport and validation, leading to inconsistencies when different entry points validate differently.
- **Why per-operation DTOs for larger codebases:** Different operations (create vs update) need different subsets of entity data; per-operation DTOs avoid nullable fields and optional parameters.

## Architecture Guidelines

- Apply the 2-3 layer threshold: introduce a DTO when data crosses at least 2-3 application layers
- Use per-operation DTOs (`CreateUserDto`, `UpdateProfileDto`) for larger codebases; per-entity DTOs (`UserDto`) for simpler apps
- Never type-hint `Request` or contain `$request` properties in DTOs — this couples the service layer to HTTP
- Use nullable typed properties (`?string`) for optional fields, not default values that mask missing data
- Use named constructors (`fromRequest`, `fromModel`, `fromArray`) to document the source of data
- Always validate input before DTO construction — DTOs assume valid data

## Performance

DTO construction overhead is negligible (~3µs per DTO). For typical Laravel applications (10-50 DTO constructions per request), the cost is sub-millisecond. The array-to-DTO mapping is the dominant cost, not the object allocation. PHP readonly properties add zero runtime overhead in PHP 8.1+.

## Security

- Never construct DTOs from raw `$request->all()` — unvalidated input propagates bad data through the entire service layer
- DTOs should contain only scalar types and nested DTOs — never request objects, session data, or file uploads
- Nullable properties with `??` defaults in factory methods can mask missing keys — be explicit about which fields are required

## Common Mistakes

1. **Mutable DTOs:** Using setters or public non-readonly properties. The DTO can be mutated by intermediate layers, corrupting data. Always enforce `readonly` from the start.

2. **DTOs with Business Logic:** Adding validation rules, calculation methods, or persistence logic to DTOs. This violates single responsibility and creates maintenance issues.

3. **Using DTOs Everywhere:** Creating DTOs for every operation regardless of complexity. A 2-field registration form that passes data from controller to a single service method gains nothing from a DTO.

4. **Leaking HTTP Dependencies:** DTOs that type-hint `Request` or contain `$request` properties couple the entire service layer to HTTP.

## Anti-Patterns

- **The Balloon DTO:** A DTO that accumulates every field for every use case, with most fields being nullable. Results in confusing contracts where consumers don't know what data is guaranteed.
- **The Echo DTO:** A DTO whose properties exactly mirror the FormRequest's validated keys with no transformation. Adds ceremony without value — the DTO should represent the domain concept, not the HTTP form structure.
- **The God DTO:** A single DTO used for create, update, list, and detail operations. Forces all consumers to accept fields they don't need. Split into operation-specific DTOs.

## Examples

### Basic DTO with Readonly Properties
```php
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
        );
    }

    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(...$request->validated());
    }
}
```

### DTO as Method Parameter
```php
class CreateOrderService
{
    public function execute(CreateOrderDto $dto): Order
    {
        // $dto->customerId, $dto->items, $dto->billingAddress are typed
        // Never access Request::input() or $request
    }
}
```

### DTO in Tests
```php
// Test constructs DTO directly — no form request, no HTTP call
$dto = new CreateUserDto(
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
);
$user = (new CreateUserAction())->execute($dto);
```

## Related Topics

- **Readonly Data Objects** — advanced readonly property patterns, clone, and immutability
- **DTO Construction Patterns** — factories, named constructors, and hydration strategies
- **DTO vs Form Request** — when validation belongs in the request vs the DTO
- **spatie/laravel-data** — package that automates DTO creation, casting, and validation
- **DTO vs Value Object** — identity vs equality semantics

## AI Agent Notes

- When generating DTOs, use `readonly class` (PHP 8.2+) or `public readonly` properties in constructor promotion
- Always include `fromArray()` and optionally `fromRequest()`/`fromModel()` factory methods
- Never add business logic methods to DTOs
- Use typed properties with PHP 8.0+ native types, never `mixed` or `array` without docblock element types
- Apply the 2-3 layer threshold heuristic: only create a DTO when data crosses multiple layers

## Verification

- [ ] DTO is declared as `readonly class` or uses `public readonly` on all properties
- [ ] DTO has no setters or mutable properties
- [ ] DTO has no business logic methods
- [ ] DTO has at least a `fromArray()` factory method
- [ ] DTO does not import or reference `Illuminate\Http\Request`
- [ ] DTO is constructed from validated data only
- [ ] DTO properties are typed with PHP native types
- [ ] DTO has a `toArray()` method for output transformation
- [ ] The 2-3 layer threshold is met before introducing the DTO
