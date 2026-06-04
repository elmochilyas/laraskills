# Form Request DTO Integration — Engineering Rules

---

## Rule 1: Build DTOs from validated() — Never from all()

---

## Category

Architecture

---

## Rule

Always use `$request->validated()` as the source for DTO construction. Never use `$request->all()` or `$request->input()`.

---

## Reason

`validated()` returns only data that passed all validation rules. Using `all()` bypasses the entire validation layer, allowing unvalidated, potentially malicious data to reach the domain layer through the DTO.

---

## Bad Example

```php
class UserDto
{
    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(...$request->all()); // Unvalidated data enters DTO
    }
}
```

---

## Good Example

```php
class UserDto
{
    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(...$request->validated()); // Only validated data
    }
}
```

---

## Exceptions

When combined with `safe()->only()` for scoped DTO construction, the data is still validated — only filtered to a subset.

---

## Consequences Of Violation

Security risks: unvalidated data enters domain code. Data integrity risks: mass-assignment vulnerabilities through DTO.

---

## Rule 2: Make DTOs Immutable with readonly Properties

---

## Category

Design

---

## Rule

Declare DTO properties as `public readonly` (PHP 8.1+). Do not provide setters. Construct the DTO with all data in the constructor.

---

## Reason

Immutable DTOs guarantee that validated input cannot be modified after construction. This prevents accidental mutation in service code and makes DTOs safe to pass across layers, cache, serialize, or queue.

---

## Bad Example

```php
class UserDto
{
    public ?string $name; // Mutable — can be changed after creation
    public ?string $email;
}
```

---

## Good Example

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

---

## Exceptions

When using Eloquet models instead of DTOs (not recommended for domain boundaries), immutability is not enforced.

---

## Consequences Of Violation

Reliability risks: DTO state may be inadvertently modified across service layers. Debugging difficulty: tracking where DTO state changed.

---

## Rule 3: Keep DTOs in the Domain Layer — Not the HTTP Layer

---

## Category

Architecture

---

## Rule

Place DTO classes in the domain or feature layer namespace (e.g., `App\Domain\User\UserDto`), not in the HTTP layer (`App\Http\Requests` or `App\Http\DTOs`).

---

## Reason

DTOs represent domain concepts and are consumed by services, actions, and repositories. If DTOs live in the HTTP namespace, domain code imports from the HTTP layer, creating an architectural dependency from domain to transport.

---

## Bad Example

```
// HTTP layer contains domain types
app/Http/DTOs/UserDto.php
app/Http/Requests/StoreUserRequest.php

// Service imports from HTTP layer
use App\Http\DTOs\UserDto;
```

---

## Good Example

```
// DTO in domain layer
app/Domain/User/Data/UserDto.php

// Service imports from domain
use App\Domain\User\Data\UserDto;
```

---

## Exceptions

In extremely simple CRUD applications with no domain layer, DTOs may live alongside requests temporarily, but this is a stepping stone to proper separation.

---

## Consequences Of Violation

Maintenance risks: domain code coupled to HTTP infrastructure. Testing risks: domain tests require HTTP bootstrap.

---

## Rule 4: Do Not Pass FormRequest to the Service Layer

---

## Category

Architecture

---

## Rule

Always convert FormRequest to a DTO in the controller before passing data to a service or action. Never pass the FormRequest object itself.

---

## Reason

The service layer depends on HTTP concepts when it accepts a FormRequest. This prevents the service from being used in non-HTTP contexts (commands, jobs, tests) and couples domain logic to the request lifecycle.

---

## Bad Example

```php
// Controller passes FormRequest to service
class UserService
{
    public function store(StoreUserRequest $request): User
    {
        return User::create($request->validated()); // Service coupled to HTTP
    }
}
```

---

## Good Example

```php
class UserService
{
    public function store(UserDto $dto): User // Service only knows DTO
    {
        return User::create($dto->toArray());
    }
}

// Controller
public function store(StoreUserRequest $request, UserService $service)
{
    return $service->store(UserDto::fromRequest($request));
}
```

---

## Exceptions

No common exceptions. The bridge pattern between HTTP and domain is the DTO — always convert in the controller.

---

## Consequences Of Violation

Maintenance risks: service cannot be used in CLI commands, queued jobs, or tests without HTTP setup. Architecture erosion: domain depends on transport layer.

---

## Rule 5: Use Static Factory Methods on DTOs for Consistent Construction

---

## Category

Design

---

## Rule

Provide a static factory method on the DTO (e.g., `fromRequest()`) for constructing from a FormRequest. Optionally add a `payload()` convenience method on the FormRequest.

---

## Reason

A consistent factory method provides a single, testable entry point for DTO construction. It encapsulates the mapping logic and makes the controller code explicit about what it's creating.

---

## Bad Example

```php
// Controller manually maps each field to DTO
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $dto = new UserDto(
        name: $request->input('name'),
        email: $request->input('email'),
    );
    $action->execute($dto);
}
```

---

## Good Example

```php
// Consistent factory on DTO
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute(UserDto::fromRequest($request));
}

// Or payload() on FormRequest
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute($request->payload());
}
```

---

## Exceptions

For DTOs with only 1-2 fields, inline construction in the controller is acceptable.

---

## Consequences Of Violation

Maintenance risks: scattered field-mapping logic across controllers. Testing gaps: mapping logic untested when hidden in controllers.

---

## Rule 6: Use safe()->only() for Scoped DTO Construction

---

## Category

Framework Usage

---

## Rule

Use `$request->safe()->only(['field1', 'field2'])` when constructing a DTO from a subset of validated fields. Do not rely on validation rules to exclude fields — be explicit about which fields are used.

---

## Reason

`validated()` returns all fields that passed validation. When a DTO only needs a subset, using `safe()->only()` makes the intent explicit and prevents future rule changes from accidentally adding fields to the DTO.

---

## Bad Example

```php
public function payload(): UserDto
{
    return new UserDto(...$this->validated());
    // DTO gets ALL validated fields — even ones it doesn't declare
}
```

---

## Good Example

```php
public function payload(): UserDto
{
    $data = $this->safe()->only(['name', 'email', 'bio']);
    return new UserDto(...$data);
}
```

---

## Exceptions

When the DTO constructor declares exactly the validated fields and uses named arguments or constructor promotion, `validated()` with spread is safe.

---

## Consequences Of Violation

Maintenance risks: extra fields silently pass through to DTO. Reliability risks: DTO receives unexpected data that may cause runtime errors.
