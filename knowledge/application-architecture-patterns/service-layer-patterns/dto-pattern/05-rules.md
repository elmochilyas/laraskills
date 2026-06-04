## DTOs Must Be Immutable
---
## Architecture
---
## Rule
DTOs must be immutable. Use PHP 8.1+ `readonly` promoted constructor properties. Do not provide setters or mutable methods.
---
## Reason
Immutability guarantees that a DTO's data cannot change after construction, preventing accidental mutation bugs and making DTOs safe to pass across architectural boundaries.
---
## Bad Example
```php
class UserData
{
    public string $name;
    public string $email;
    public ?string $phone;
}

// Any consumer can mutate the DTO
$dto = new UserData();
$dto->name = 'John';
$dto->email = 'john@example.com';
// Later, elsewhere:
$dto->name = 'Jane'; // Mutation — unpredictable
```
---
## Good Example
```php
class UserData
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $phone = null,
    ) {}
}

// Immutable — cannot change after construction
$dto = new UserData(name: 'John', email: 'john@example.com');
```
---
## Exceptions
DTOs that represent mutable state in long-lived processes (rare). Prefer value objects for such cases.
---
## Consequences Of Violation
Accidental mutation bugs, unpredictable data flow, thread-safety issues under Octane, violates data transfer contract.

## Never Add Behavior To DTOs
---
## Architecture
---
## Rule
Never add business logic or behavior methods to DTOs. DTOs are pure data containers with no behavior.
---
## Reason
Behavior belongs in domain entities or domain services. Adding methods to DTOs violates their purpose as data transfer objects and blurs the line between DTOs and value objects or entities.
---
## Bad Example
```php
class OrderData
{
    public function __construct(
        public readonly array $items,
        public readonly string $couponCode,
    ) {}

    public function calculateTotal(): Money // Business logic in DTO
    {
        $total = Money::zero();
        foreach ($this->items as $item) {
            $total = $total->add($item->price->multiply($item->quantity));
        }
        if ($this->couponCode) {
            $total = $this->applyDiscount($total);
        }
        return $total;
    }

    public function isValidCoupon(): bool // Validation logic in DTO
    {
        return in_array($this->couponCode, ['SAVE10', 'SAVE20']);
    }
}
```
---
## Good Example
```php
// DTO is pure data
class OrderData
{
    public function __construct(
        public readonly array $items,
        public readonly ?string $couponCode = null,
    ) {}
}

// Business logic in domain service
class OrderCalculator
{
    public function calculateTotal(OrderData $data): Money
    {
        // Calculate total with business rules
    }
}
```
---
## Exceptions
Static factory methods (`fromRequest()`, `fromArray()`) — these are construction logic, not business behavior.
---
## Consequences Of Violation
DTO becomes a hybrid data-behavior object, violates Single Responsibility Principle, couples data contracts to business rules.

## Keep DTOs Use-Case-Specific, Not Entity-Wide
---
## Architecture
---
## Rule
Create specific DTOs for each use case, not one entity-wide DTO containing all possible fields.
---
## Reason
An entity-wide DTO becomes a god object that is hard to construct, hard to read, and couples all use cases to a single data contract. Per-use-case DTOs are explicit about what each operation needs.
---
## Bad Example
```php
// One UserDto for ALL use cases
class UserDto
{
    public function __construct(
        public readonly ?int $id,
        public readonly ?string $name,
        public readonly ?string $email,
        public readonly ?string $password,
        public readonly ?string $phone,
        public readonly ?string $address,
        public readonly ?string $avatar,
        public readonly ?string $role,
        public readonly ?string $status,
        public readonly ?string $timezone,
        public readonly ?string $locale,
        public readonly ?string $language,
        public readonly ?array $permissions,
        public readonly ?array $settings,
        public readonly ?Carbon $birthDate,
        public readonly ?Carbon $emailVerifiedAt,
        // ... 20+ more nullable fields
    ) {}
}
// Most fields are null — unclear what the use case needs
```
---
## Good Example
```php
// Per-use-case DTOs
class RegisterUserInput
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
    ) {}
}

class UpdateProfileInput
{
    public function __construct(
        public readonly ?string $name,
        public readonly ?string $phone,
        public readonly ?string $avatar,
    ) {}
}
```
---
## Exceptions
Simple read-only projections where the same shape is truly reused across multiple use cases without bloat.
---
## Consequences Of Violation
God DTO objects, hard-to-construct DTOs, unclear data requirements, coupling between unrelated use cases.

## Avoid HTTP Coupling In DTOs
---
## Architecture
---
## Rule
DTOs must not import or reference HTTP framework classes (`Illuminate\Http\Request`, `UploadedFile`, `JsonResponse`). Use only plain PHP types.
---
## Reason
HTTP coupling prevents DTOs from being constructed outside HTTP context (CLI commands, queue jobs, tests). DTOs should be framework-agnostic data containers.
---
## Bad Example
```php
class RegisterUserInput
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly UploadedFile $avatar, // HTTP-coupled type
    ) {}

    public static function fromRequest(RegisterUserRequest $request): self // Framework-coupled factory
    {
        return new self(
            name: $request->input('name'), // Coupled to Request
            email: $request->input('email'),
            avatar: $request->file('avatar'),
        );
    }
}
```
---
## Good Example
```php
class RegisterUserInput
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $avatarPath = null,
    ) {}

    public static function fromRequest(RegisterUserRequest $request): self
    {
        return new self(
            name: $request->validated()['name'],
            email: $request->validated()['email'],
            avatarPath: $request->hasFile('avatar') ? $request->file('avatar')->path() : null,
        );
    }
}
// Plain PHP types only — can be constructed anywhere
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
DTOs cannot be constructed from CLI/queue, violates framework independence, couples data layer to HTTP.

## Use PHP 8.1+ Promoted Constructor Properties
---
## Code Organization
---
## Rule
Use PHP 8.1+ promoted constructor properties with `readonly` for DTO definitions. Avoid manual property declarations and setters.
---
## Reason
Promoted constructors provide concise DTO definitions with minimal boilerplate. Combined with `readonly`, they ensure immutability without extra code.
---
## Bad Example
```php
class UserData
{
    private string $name;
    private string $email;

    public function __construct(string $name, string $email)
    {
        $this->name = $name;
        $this->email = $email;
    }

    public function getName(): string { return $this->name; }
    public function getEmail(): string { return $this->email; }
}
```
---
## Good Example
```php
class UserData
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
    ) {}
}
```
---
## Exceptions
DTOs that require computed properties or transformation in the constructor (use a factory method instead).
---
## Consequences Of Violation
Boilerplate code, verbose DTO definitions, lower developer productivity, inconsistent style.

## Implement JsonSerializable For Complex DTOs
---
## Reliability
---
## Rule
Implement `JsonSerializable` for DTOs containing nested objects, `DateTimeImmutable`, or other non-serializable types.
---
## Reason
DTOs containing complex types will silently fail or produce incorrect output when serialized with `json_encode`. Explicit serialization ensures correct JSON output.
---
## Bad Example
```php
class OrderOutput
{
    public function __construct(
        public readonly int $id,
        public readonly DateTimeImmutable $createdAt, // Non-serializable
        public readonly Money $total, // Non-serializable
    ) {}
}

json_encode($orderOutput); // {"id":1,"createdAt":{},"total":{}}
```
---
## Good Example
```php
class OrderOutput implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly DateTimeImmutable $createdAt,
        public readonly Money $total,
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'total' => $this->total->format(),
        ];
    }
}
```
---
## Exceptions
DTOs containing only primitive types that serialize correctly by default.
---
## Consequences Of Violation
Silent serialization errors, incorrect API responses, hard-to-debug data corruption in logs and queues.

## Use FromRequest Factory Methods
---
## Maintainability
---
## Rule
Provide a static `fromRequest()` factory method on DTOs for construction from validated request data. Keep the factory method focused on mapping only.
---
## Reason
Factory methods centralize construction logic, ensuring DTOs are consistently built from request data throughout the codebase.
---
## Bad Example
```php
// DTO constructed ad-hoc in every controller
class UserController extends Controller
{
    public function register(RegisterUserRequest $request): JsonResponse
    {
        $data = new RegisterUserInput(
            name: $request->input('name'),
            email: $request->input('email'),
        );
        // ...
    }
}

class RegisterUserCliCommand extends Command
{
    public function handle(): void
    {
        $data = new RegisterUserInput(
            name: $this->argument('name'),
            email: $this->argument('email'),
        );
        // Duplicated construction logic
    }
}
```
---
## Good Example
```php
class RegisterUserInput
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
    ) {}

    public static function fromRequest(RegisterUserRequest $request): self
    {
        return new self(
            name: $request->validated()['name'],
            email: $request->validated()['email'],
        );
    }
}

// Consistent construction everywhere
$data = RegisterUserInput::fromRequest($request);
```
---
## Exceptions
DTOs constructed only from non-HTTP sources (queue, CLI). Use `fromArray()` or `fromCommand()` instead.
---
## Consequences Of Violation
Duplicated construction logic, inconsistent DTO population, missing fields in some callers.

## Consider Performance For Read-Heavy Lists
---
## Performance
---
## Rule
Avoid DTO allocation overhead for high-throughput read endpoints returning large collections. Consider using plain arrays or dedicated read models for read-heavy list responses.
---
## Reason
DTO creation allocates objects. For endpoints returning thousands of rows, DTO allocation per row can be significant. Arrays are faster for read-heavy projections.
---
## Bad Example
```php
// DTO per row for a list endpoint returning 10,000 rows
class ProductListOutput
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $price,
    ) {}
}

class ProductController extends Controller
{
    public function index(): array
    {
        return Product::all()->map(fn($p) => new ProductListOutput(
            id: $p->id,
            name: $p->name,
            price: $p->price,
        ))->toArray();
    }
}
// 10,000 DTO allocations per request
```
---
## Good Example
```php
// Use arrays for read-heavy list endpoints
class ProductController extends Controller
{
    public function index(): array
    {
        return Product::all()->toArray(); // Array output, no DTO overhead
    }
}

// Still use DTOs for write operations and individual item responses
class CreateProductInput
{
    public function __construct(
        public readonly string $name,
        public readonly string $price,
    ) {}
}
```
---
## Exceptions
List endpoints returning fewer than 100 items, where DTO overhead is negligible and type safety is valued over performance.
---
## Consequences Of Violation
Unnecessary memory allocation, reduced throughput on high-traffic endpoints, increased GC pressure.
