## Rule 1: Declare All DTOs as `readonly class`

---

## Category

Design

---

## Rule

Declare every DTO with the `readonly` keyword at the class level (PHP 8.2+) or use `public readonly` on every promoted constructor property (PHP 8.1). Never create DTOs with mutable properties or setters.

---

## Reason

Immutability guarantees that data flowing through the application cannot be altered by intermediate layers. A DTO that can be mutated is a parameter bag, not a DTO. The `readonly` keyword enforces this at the language level — mutation attempts produce compile-time errors rather than runtime bugs.

---

## Bad Example

```php
class UserDto
{
    public string $name;
    public string $email;
}
// No readonly — any layer can accidentally mutate: $dto->name = 'hacked';
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}
// Language-level immutability. Any mutation attempt produces a compile-time error.
```

---

## Exceptions

When extending a non-readonly class (PHP 8.2 restriction), use `public readonly` properties individually. This is rare — DTOs should not extend non-DTO classes.

---

## Consequences Of Violation

Reliability: accidental mutation by intermediate layers corrupts data silently. Maintenance: debugging "who changed this value" in a multi-layer flow is time-consuming.

---

## Rule 2: Apply the 2-3 Layer Threshold Before Introducing a DTO

---

## Category

Architecture

---

## Rule

Introduce a DTO only when data crosses at least 2-3 application layers (controller → service → action → repository). For simple controller-to-service flows with no additional entry points, use `$request->validated()` arrays instead.

---

## Reason

DTOs add ceremony (class file, factory methods, serialization logic, tests). The ceremony is justified when multiple layers or multiple entry points need a shared typed contract. For simple flows, the array from `validated()` provides sufficient type safety with zero ceremony overhead.

---

## Bad Example

```php
// Single controller → single service → single model operation
// DTO with 2 fields, no transformation, used in one place
readonly class UpdateProfileDto
{
    public function __construct(public string $name, public string $email) {}
}

class UpdateProfileController
{
    public function __invoke(Request $request, UpdateProfileService $service)
    {
        $dto = new UpdateProfileDto(name: $request->name, email: $request->email);
        $service->execute($dto);
    }
}
// DTO adds 8 lines of ceremony for a 2-field pass-through. No benefit over validated array.
```

---

## Good Example

```php
class UpdateProfileController
{
    public function __invoke(UpdateProfileRequest $request, UpdateProfileService $service)
    {
        $service->execute($request->validated());
    }
}
// No DTO. Simple flow uses validated array. DTO would be over-engineering here.
```

---

## Exceptions

When the service layer is a package or library consumed by other projects, a DTO is beneficial even for single-layer use because it provides a typed API contract.

---

## Consequences Of Violation

Maintenance: unnecessary DTOs increase file count and cognitive load. Performance: negligible but non-zero overhead for unused DTOs. Team efficiency: ceremony budget consumed on low-value abstractions.

---

## Rule 3: Never Include Business Logic Methods in DTOs

---

## Category

Architecture

---

## Rule

Do not add methods to DTOs that perform business calculations, validation, persistence, or any behavior beyond data formatting (`toArray`, `jsonSerialize`) and construction (`fromArray`, named factories). Business logic belongs in services and actions.

---

## Reason

A DTO that contains business logic blurs the boundary between data transport and domain behavior. The DTO becomes harder to test (logic requires setup), harder to reuse (logic may not apply to all consumers), and harder to maintain (logic is scattered across DTOs instead of concentrated in services).

---

## Bad Example

```php
readonly class OrderDto
{
    public function __construct(public int $subtotal, public int $tax, public int $shipping) {}

    public function calculateTotal(): int // Business logic in DTO
    {
        return $this->subtotal + $this->tax + $this->shipping;
    }

    public function applyDiscount(float $percent): int // Business logic in DTO
    {
        return (int) round($this->calculateTotal() * (1 - $percent));
    }
}
// DTO now has two business methods. Next sprint: add calculateLoyaltyPoints() to the DTO.
```

---

## Good Example

```php
readonly class OrderDto
{
    public function __construct(
        public int $subtotal,
        public int $tax,
        public int $shipping,
        public int $total, // Pre-computed by service
    ) {}

    public function toArray(): array
    {
        return [
            'subtotal' => $this->subtotal,
            'tax' => $this->tax,
            'shipping' => $this->shipping,
            'total' => $this->total,
        ];
    }
}
// Business logic computed in the service layer. DTO carries the result.
```

---

## Exceptions

Methods that format data for output (date formatting, number formatting in `toArray()`) are not business logic — they are presentation concerns that belong on the DTO.

---

## Consequences Of Violation

Maintenance: business logic scattered across DTOs instead of concentrated in services. Testing: DTO tests now require business scenario setup. Reusability: DTOs with logic cannot be used in contexts where the logic does not apply.

---

## Rule 4: Use Per-Operation DTOs for Larger Codebases

---

## Category

Code Organization

---

## Rule

For medium-to-large codebases (50k+ LOC, multiple development teams), create separate DTOs per operation (`CreateUserDto`, `UpdateProfileDto`, `UserListDto`) rather than a single per-entity DTO (`UserDto`) used across all operations.

---

## Reason

A single per-entity DTO shared across create, update, list, and detail operations accumulates nullable fields and conditional logic. Each operation needs a different subset of data. Per-operation DTOs have exactly the fields each operation requires, no nullables, and no unused properties.

---

## Bad Example

```php
readonly class UserDto // Single entity DTO for all operations
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $password,      // Only for create
        public ?CarbonImmutable $createdAt, // Only for output
        public ?array $roles,          // Only for detail output
        public ?int $postCount,        // Only for list output
    ) {}
}
// Five fields, four of which are nullable. Every consumer must handle null for every field.
```

---

## Good Example

```php
readonly class CreateUserDto
{
    public function __construct(public string $name, public string $email, public string $password) {}
}

readonly class UserListDto
{
    public function __construct(public int $id, public string $name, public string $email, public int $postCount) {}
}

readonly class UserDetailDto
{
    public function __construct(public int $id, public string $name, public string $email, public CarbonImmutable $createdAt, /** @var RoleDto[] */ public array $roles) {}
}
// Each DTO has exactly the fields needed. No nullable properties. Contracts are explicit.
```

---

## Exceptions

For small applications (< 30k LOC, single team), a shared per-entity DTO is acceptable. Switch to per-operation DTOs when nullable fields exceed 30% of total properties.

---

## Consequences Of Violation

Maintenance: adding a field for one operation creates nullable noise in all other operations. Reliability: consumers cannot distinguish between "null because field is optional" and "null because operation doesn't populate it."

---

## Rule 5: Include `fromArray()` as the Minimal Factory on Every DTO

---

## Category

Code Organization

---

## Rule

Every DTO must have at least a `fromArray()` static factory method that maps an associative array to constructor parameters with explicit key mapping and null handling for optional fields.

---

## Reason

A `fromArray()` factory provides the universal construction contract. Every source type (request, model, API response, queue payload, test fixture) can be reduced to an array and constructed via `fromArray()`. It also serves as the documentation of what keys are expected and which are optional.

---

## Bad Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $bio = null,
    ) {}
}
// No fromArray(). Every caller must manually map keys to constructor parameters, duplicating mapping logic.
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $bio = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            bio: $data['bio'] ?? null,
        );
    }
}
// Every caller uses fromArray(). Mapping logic is centralized. Null handling is explicit.
```

---

## Exceptions

When using spatie/laravel-data, the `Data::from()` method provides the universal factory. Manual `fromArray()` is not needed.

---

## Consequences Of Violation

Maintenance: each caller duplicates the array-to-constructor mapping. Reliability: one caller forgets to handle a nullable field, producing an uninitialized property.

---

## Rule 6: Never Type-Hint `Request` or Contain HTTP Dependencies in DTOs

---

## Category

Architecture

---

## Rule

Do not import, type-hint, or reference `Illuminate\Http\Request`, `Symfony\Component\HttpFoundation\Request`, or any HTTP-related classes in DTOs. DTOs must not depend on the HTTP layer.

---

## Reason

A DTO that depends on HTTP classes cannot be constructed from CLI commands, queue jobs, or tests without simulating an HTTP request. This couples every consumer of the DTO to the HTTP layer, defeating the purpose of a cross-layer data carrier.

---

## Bad Example

```php
use Illuminate\Http\Request;

readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public Request $request, // HTTP dependency in DTO
    ) {}
}
// CLI command cannot construct this DTO without simulating an HTTP request.
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}
// Zero dependencies. Constructable from any entry point — HTTP, CLI, queue, test.
```

---

## Exceptions

No common exceptions. DTOs must never depend on HTTP classes. If request metadata is needed (IP address, user agent), extract it in the controller and pass it as a scalar property.

---

## Consequences Of Violation

Maintenance: adding a CLI or queue entry point requires refactoring the DTO. Testing: every test must bootstrap the HTTP kernel. Architecture: service layer becomes permanently coupled to HTTP.
