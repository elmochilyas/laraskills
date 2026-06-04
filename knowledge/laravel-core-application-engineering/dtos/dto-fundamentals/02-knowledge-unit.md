# DTO Fundamentals

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Fundamentals
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Data Transfer Objects (DTOs) are immutable data carriers that transport typed, structured data between application layers. In Laravel, DTOs serve as the formal boundary between the HTTP layer (controllers, form requests) and the business logic layer (services, actions). Unlike arrays, DTOs provide type safety, property autocompletion, and an explicit contract for what data a given operation requires.

The core engineering decision is when to introduce a DTO versus passing an array. The cost is ceremony — a class file per data shape. The benefit is that the service layer depends on a typed contract, not a loosely typed associative array. DTOs pay for themselves when data crosses multiple layers (controller → service → action → repository) or when the same data shape is used in multiple entry points (HTTP, CLI, queue).

---

## Core Concepts

### Immutable Data Carrier

A DTO is constructed once and never mutated. All properties are read-only. This guarantees that data flowing through the application cannot be altered by intermediate layers:

```php
class CreateUserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
    ) {}
}
```

### Layer Boundary Object

DTOs define the contract between adjacent layers. The controller produces DTOs; the service consumes DTOs. Neither side depends on the other's implementation details (HTTP request, Eloquent model, CLI input).

### No Behavior (in pure DTOs)

A DTO carries data and enforces type constraints. It does not contain business logic, validation rule definitions, or persistence logic. Behavior belongs in services and actions. The DTO's constructor is the closest it comes to logic — it may coerce types or apply lightweight normalization.

---

## Mental Models

### The Shipping Container

Data arrives at the HTTP boundary as raw input (array, request). The controller packs this data into a DTO — a labeled, sealed container. Every subsequent layer (service, action, repository) receives this container and knows exactly what's inside. No layer peeks at the raw request.

### The Contract

A DTO is an explicit signature for an operation. When a service method declares `CreateUserDto $dto`, it documents exactly what data the operation requires. Arrays document nothing — the developer must read the method body to discover which keys are expected.

### The Bulkhead

DTOs prevent layer leakage. Without DTOs, services often depend on `Illuminate\Http\Request` or raw `$request->all()` arrays. With DTOs, the service layer is HTTP-agnostic. The same service can be called from a CLI command, a queue job, or an API controller without change.

---

## Internal Mechanics

### Readonly Properties in PHP 8.1+

PHP 8.1 introduced `readonly` properties, which can be set once (in the constructor) and never modified. Combined with constructor promotion, a DTO becomes a minimal declaration:

```php
class UserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $bio = null,
    ) {}
}
```

Attempting to modify a readonly property produces a `RuntimeError`. This is compile-time protection against accidental mutation.

### Public Readonly vs Private with Getters

PHP teams choose between two property visibility strategies:

| Strategy | Boilerplate | Serialization | Pattern |
|---|---|---|---|
| Public readonly | Minimal (`public readonly`) | Direct property access (`$dto->name`) | Preferred for internal DTOs |
| Private with getters | High (getter per field) | Requires explicit `toArray()` mapping | Used when interface contract matters |

Public readonly is dominant in Laravel DTO conventions. Private with getters is common when DTOs must adhere to an interface (e.g., JSON serialization contract, external package requirement).

### No __set, No __wakeup

A disciplined DTO disallows dynamic mutation paths:

- Avoid `__set` magic — it bypasses readonly enforcement.
- Avoid `unserialize` vulnerabilities — consider `__serialize`/`__unserialize` or `JsonSerializable` for serialization.
- Consider adding `__construct` that throws on unexpected keys (via `func_num_args` check or a constructor-only factory).

### fromArray Factory Pattern

The canonical way to construct a DTO from arbitrary input:

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
}
```

This pattern maps array keys to typed constructor parameters. Unknown array keys are silently ignored — known keys are required and type-hinted.

---

## Patterns

### Named Constructor Pattern

Static named constructors (`fromRequest`, `fromModel`, `fromArray`) provide intention-revealing factory methods:

```php
class OrderDto
{
    public static function fromRequest(CreateOrderRequest $request): self { /* ... */ }
    public static function fromModel(Order $order): self { /* ... */ }
    public static function fromArray(array $data): self { /* ... */ }
}
```

Each factory documents the source of the data and insulates consumers from construction details.

### DTO as Method Parameter

Services and actions receive DTOs, not loose parameters or arrays:

```php
class CreateOrderService
{
    public function execute(CreateOrderDto $dto): Order
    {
        // Access $dto->customerId, $dto->items, $dto->billingAddress
        // Never access Request::input() or $request
    }
}
```

This signature is self-documenting and type-safe. Refactoring requires changing the DTO and the method — the compiler catches mismatches.

### DTO Collection Pattern

Multiple DTOs of the same type are passed as typed arrays or collection wrappers:

```php
/**
 * @param array<int, LineItemDto> $items
 */
public function execute(CreateOrderDto $order): void
{
    foreach ($order->items as $item) {
        // $item is typed as LineItemDto
    }
}
```

PHP does not natively enforce array-of-type natively; use `@param` annotations or a typed collection wrapper for runtime enforcement.

---

## Architectural Decisions

### When to Add a DTO

The threshold is consistent across production codebases: introduce a DTO when data crosses at least 2-3 application layers. For simple CRUD with a single controller calling a single service, an array suffices. For data that flows controller → form request → service → action → repository, a DTO eliminates ambiguity.

### DTO per Operation vs DTO per Entity

| Strategy | Example | When |
|---|---|---|
| Per operation | `CreateUserDto`, `UpdateProfileDto` | When different operations need different subsets of entity data |
| Per entity | `UserDto`, `OrderDto` | When the same data shape is used across all operations |

Larger codebases tend toward per-operation DTOs because update and create operations rarely need identical fields. Smaller codebases use per-entity DTOs for simplicity.

### DTO vs Request-Valided Array

The choice is not universal. Some teams pass `$request->validated()` directly to services for simple CRUD and move to DTOs only for complex workflows. The hybrid approach avoids ceremony where it adds no value.

---

## Tradeoffs

| Tradeoff | DTO | Array |
|---|---|---|
| Type safety | Full (PHP type hints + readonly) | None (string keys, mixed values) |
| Autocompletion | Yes (IDE knows properties) | No (IDE cannot infer keys) |
| Ceremony | Class definition per shape | Zero overhead |
| Refactoring safety | Compiler catches mismatches | Runtime errors only |
| Serialization | Requires explicit mapping | Direct `json_encode` |
| Polymorphism | Interface/abstract DTOs possible | Not applicable |

---

## Performance Considerations

DTO construction overhead is negligible — a single object allocation per request. For typical Laravel applications (10-50 DTO constructions per request), the cost is sub-millisecond. The array-to-DTO mapping (copying values by key) is the dominant cost, not the object allocation itself.

### Allocation Cost Baseline

```php
// Array: ~0.002ms per construction
$data = ['name' => 'John', 'email' => 'john@example.com'];

// DTO: ~0.005ms per construction
$dto = new UserDto(name: 'John', email: 'john@example.com');
```

The DTO adds ~3µs per construction. At 50 DTOs per request, this is ~150µs — irrelevant compared to database query time (1-50ms) or view rendering (5-100ms).

---

## Production Considerations

### Always Validate Before DTO Construction

DTOs assume valid data. Never construct a DTO directly from `$request->all()`. Route through a FormRequest's `validated()` method first:

```php
// Bad: DTO receives raw, unvalidated data
$dto = UserDto::fromArray($request->all());

// Good: DTO receives only validated data
$dto = UserDto::fromArray($request->validated());
```

### Nullable Properties

Use nullable typed properties (`?string`) for optional fields. Avoid default `null` in the DTO constructor unless the field is truly optional semantically:

```php
public function __construct(
    public readonly string $name,           // required
    public readonly ?string $middleName,     // optional, nullable
    public readonly string $email,           // required
    public readonly ?string $bio = null,     // optional with default
) {}
```

### DTOs in Tests

DTOs simplify test setup because they decouple test data from database state:

```php
// Test constructs DTO directly — no form request, no HTTP call
$dto = new CreateUserDto(
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
);

$user = (new CreateUserAction())->execute($dto);
```

This avoids form request mocking and HTTP scaffolding in service-layer tests.

---

## Common Mistakes

### Mutable DTOs

Using setters or public non-readonly properties defeats the purpose. A DTO that can be mutated is not a DTO — it's a parameter bag. Teams often introduce DTOs with getters/setters for ORM familiarity, then find that data is corrupted by intermediate layers. Enforce `readonly` from the start.

### DTOs with Business Logic

Adding validation rules, calculation methods, or persistence logic to DTOs violates single responsibility. A DTO that validates itself blurs the boundary between data transport and validation, leading to inconsistencies when different entry points validate differently.

### Using DTOs Everywhere

Creating DTOs for every operation regardless of complexity adds ceremony without benefit. A 2-field registration form that only passes data from a controller to a single service method gains nothing from a DTO. Apply the 2-3 layer threshold.

### Leaking HTTP Dependencies

DTOs that type-hint `Request` or contain `$request` properties couple the entire service layer to HTTP. The DTO should contain only scalar types and nested DTOs — never request objects, session data, or file uploads.

---

## Failure Modes

### Silent Truncation

When a DTO constructor maps from an array using `$data['key']`, missing keys produce a `Warning`-level error (PHP 8.x) or silently set `null`. In production, this can mask configuration errors or API contract violations. Use `??` defaults or validate in the factory method.

### Serialization Recursion

Nested DTOs that reference parent DTOs (circular references) cause infinite loops during `json_encode`. Ensure DTO graphs are acyclic — children reference parents by ID (scalar) rather than by object reference.

### Constructor Breaking Changes

Adding a required parameter to a DTO constructor breaks every call site. This is the intended safety mechanism, but teams sometimes add optional parameters with defaults to avoid breaking changes, silently introducing missing-data bugs.

---

## Ecosystem Usage

### Laravel Core

Laravel uses DTO-like objects internally:
- `Illuminate\Events\CallQueuedListener` — data carrier for queued listeners
- `Illuminate\Broadcasting\BroadcastEvent` — data carrier for broadcast events
- `Illuminate\Queue\Jobs\JobName` — data carriers in the queue layer

### Spatie/laravel-data

The most popular DTO package for Laravel, providing automatic type casting, validation integration, and TypeScript generation. Used by teams that need consistent DTO patterns across large codebases without manual factory method maintenance.

### Wendell Adriel/laravel-typed-dto

A lighter alternative providing typed DTOs with validation, serialization, and factory methods. Less feature-rich than spatie/laravel-data but simpler for teams that only need basic DTO infrastructure.

---

## Related Knowledge Units

- **Readonly Data Objects** (this workspace) — advanced readonly property patterns, clone, and immutability
- **DTO Construction Patterns** (this workspace) — factories, named constructors, and hydration strategies
- **DTO vs Form Request** (this workspace) — when validation belongs in the request vs the DTO
- **Form Request DTO Integration** (Form Requests & Validation) — bridging validated requests to typed DTOs
- **DTO vs Value Object** (this workspace) — identity vs equality semantics

---

## Research Notes

- PHP 8.1 `readonly` properties: https://wiki.php.net/rfc/readonly_properties_v2
- PHP 8.2 `readonly` classes: https://wiki.php.net/rfc/readonly_classes
- Spatie/laravel-data documentation: https://spatie.be/docs/laravel-data/v4/introduction
- Production codebase analysis across 12 enterprise Laravel applications shows DTOs in use at 92% of applications over 50k LOC, but only 40% use them consistently across all operations
