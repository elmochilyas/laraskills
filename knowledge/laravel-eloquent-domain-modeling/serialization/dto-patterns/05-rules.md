# DTO Patterns — Rules

## Rule 1: Use DTOs at Every Application Boundary
---
## Category
Architecture
---
## Rule
Create and return DTOs at every application boundary where data enters or leaves: controllers, queue listeners, event subscribers, CLI commands, and broadcast channels.
---
## Reason
DTOs decouple internal domain models from external contracts, preventing Eloquent model serialization internals (hidden attributes, lazy loading, accessor output) from leaking across boundaries.
---
## Bad Example
```php
class UserController
{
    public function show(int $id): array
    {
        return User::findOrFail($id)->toArray();
    }
}
```
---
## Good Example
```php
class UserController
{
    public function show(int $id): array
    {
        $user = User::with('posts')->findOrFail($id);
        return UserDTO::fromModel($user)->toArray();
    }
}
```
---
## Exceptions
Simple CRUD APIs with a single serialization channel where API Resources handle the entire boundary.
---
## Consequences Of Violation
Domain model internals leak into serialized output; hidden attributes exposed when `$hidden` is forgotten; lazy loading triggered at serialization time.

---

## Rule 2: Make All DTO Properties `readonly`
---
## Category
Design
---
## Rule
Declare every DTO constructor property with `public readonly` to enforce immutability after construction.
---
## Reason
DTOs represent a snapshot contract at a point in time. Mutation defeats this contract, allowing callers to change values after creation and introducing temporal coupling.
---
## Bad Example
```php
class UserDTO
{
    public function __construct(
        public int $id,
        public string $name,
    ) {}
}

$dto = new UserDTO(1, 'John');
$dto->name = 'Jane'; // Mutation allowed
```
---
## Good Example
```php
class UserDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
    ) {}
}

$dto = new UserDTO(1, 'John');
// $dto->name = 'Jane'; // Compile error
```
---
## Exceptions
DTOs used for building/aggregating data incrementally before finalization (use a builder pattern instead).
---
## Consequences Of Violation
Unexpected mutation in shared contexts; bugs where a DTO passed to multiple consumers is modified by one; loss of contract trust.

---

## Rule 3: Never Add Business Logic to DTOs
---
## Category
Architecture
---
## Rule
Keep DTOs strictly anemic — contain only constructor, named constructors, and serialization methods. Never add business logic, validation rules, or database queries.
---
## Reason
Business logic in DTOs violates Single Responsibility, turns them into anemic domain models, and creates hidden dependencies that break the data-transfer contract.
---
## Bad Example
```php
class OrderDTO
{
    public function __construct(
        public readonly int $id,
        public readonly float $subtotal,
        public readonly float $tax,
    ) {}

    public function calculateTotal(): float
    {
        return $this->subtotal + $this->tax;
    }

    public function isEligibleForDiscount(): bool
    {
        return $this->subtotal > 100;
    }
}
```
---
## Good Example
```php
class OrderDTO
{
    public function __construct(
        public readonly int $id,
        public readonly float $subtotal,
        public readonly float $tax,
        public readonly float $total,
    ) {}

    public static function fromModel(Order $order): self
    {
        return new self(
            id: $order->id,
            subtotal: $order->subtotal,
            tax: $order->tax,
            total: $order->subtotal + $order->tax,
        );
    }
}
```
---
## Exceptions
Simple formatting helpers (e.g., `toArray()` with date formatting) that transform data without external dependencies.
---
## Consequences Of Violation
Logic duplication when the same computation is needed elsewhere; untestable logic buried in data objects; DTOs with hidden dependencies on services or repositories.

---

## Rule 4: Always Define `fromModel()` to Centralize Eloquent Mapping
---
## Category
Maintainability
---
## Rule
Define a static `fromModel()` named constructor on every DTO that maps from an Eloquent model, centralizing all attribute extraction in one place.
---
## Reason
Scattered model-to-DTO mapping across controllers leads to duplication, inconsistency, and missed fields when model columns change.
---
## Bad Example
```php
// Controller A
$dto = new UserDTO(
    id: $user->id,
    name: $user->name,
);

// Controller B
$dto = new UserDTO(
    id: $user->id,
    name: $user->first_name . ' ' . $user->last_name,
);
```
---
## Good Example
```php
class UserDTO
{
    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
        );
    }
}
```
---
## Exceptions
DTOs that are always constructed from non-model sources (request data, external API responses).
---
## Consequences Of Violation
Inconsistent DTO content across controllers; mapping bugs hidden in multiple locations; higher maintenance cost when model columns change.

---

## Rule 5: Never Extend Eloquent Model or Use Eloquent Traits in DTOs
---
## Category
Architecture
---
## Rule
DTOs must be plain PHP classes — never extend `Model` or use Eloquent traits like `SoftDeletes`, `HasFactory`, or `Notifiable`.
---
## Reason
Extending Eloquent brings the entire ORM overhead (event dispatcher, attribute casting, lazy loading) into a pure data object, defeating the purpose of the boundary.
---
## Bad Example
```php
class UserDTO extends Model
{
    use SoftDeletes;
    // Now has timestamps, events, database connection, etc.
}
```
---
## Good Example
```php
class UserDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
    ) {}
}
```
---
## Exceptions
No common exceptions. DTOs must be framework-agnostic plain objects.
---
## Consequences Of Violation
Performance overhead from unnecessary ORM features; accidental database queries from lazy-loaded relations; coupling to Laravel's serialization pipeline.

---

## Rule 6: Test `fromModel()` to Catch Serialization Drift
---
## Category
Testing
---
## Rule
Write unit tests for every DTO's `fromModel()` method that verify all mapped properties are correctly extracted from the Eloquent model.
---
## Reason
When model columns are renamed, removed, or have their types changed, `fromModel()` breaks silently at runtime. Tests catch this drift immediately.
---
## Bad Example
```php
// No test for UserDTO::fromModel()
// Model column 'name' renamed to 'full_name'
// DTO still references $user->name — now null
```
---
## Good Example
```php
class UserDTOTest extends TestCase
{
    public function test_from_model_maps_all_properties(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $dto = UserDTO::fromModel($user);

        $this->assertSame(1, $dto->id);
        $this->assertSame('John Doe', $dto->name);
        $this->assertSame('john@example.com', $dto->email);
    }
}
```
---
## Exceptions
No common exceptions. Every DTO mapping path must be tested.
---
## Consequences Of Violation
Silent null values in serialized output when model columns change; undetected contract drift between internal models and external APIs.

---

## Rule 7: Use Promoted Constructor Properties for All DTO Fields
---
## Category
Code Organization
---
## Rule
Define every DTO field as a PHP 8.1+ promoted constructor property with type declarations. Do not declare properties outside the constructor signature.
---
## Reason
Promoted properties eliminate boilerplate, ensure every field is documented in a single place, and cannot be accidentally declared without initialization.
---
## Bad Example
```php
class UserDTO
{
    private int $id;
    private string $name;

    public function __construct(int $id, string $name)
    {
        $this->id = $id;
        $this->name = $name;
    }
}
```
---
## Good Example
```php
class UserDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
    ) {}
}
```
---
## Exceptions
Legacy codebases on PHP 8.0 or earlier (uncommon; target PHP 8.1+ for all new projects).
---
## Consequences Of Violation
Unnecessary boilerplate; easier to forget initialization; harder to read and maintain DTO definitions.

---

## Rule 8: Keep DTO Serialization Format Independent of Eloquent's Format
---
## Category
Design
---
## Rule
Define `toArray()` on DTOs with explicit key names and date formats rather than delegating to Eloquent's `toArray()` conventions.
---
## Reason
Coupling DTO serialization to Eloquent's format ties the external contract to internal ORM decisions (key casing, date formats, null handling), making it fragile when the model changes.
---
## Bad Example
```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'created_at' => $this->createdAt, // Eloquent format applied
    ];
}
```
---
## Good Example
```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'created_at' => $this->createdAt->toIso8601String(),
    ];
}
```
---
## Exceptions
Internal-only DTOs that never cross an external boundary (unusual; most DTOs serve boundaries).
---
## Consequences Of Violation
Breaking API changes when Eloquent date format is updated; unexpected key naming; hidden coupling to Eloquent internals.

---

## Rule 9: Do Not Create DTOs for Internal Method Calls
---
## Category
Architecture
---
## Rule
Only create DTOs at true application boundaries (where data enters or leaves the system). Do not create DTOs for every internal method call between domain services.
---
## Reason
DTOs across every internal call creates accidental complexity, indirection, and maintenance overhead without providing boundary benefits.
---
## Bad Example
```php
class ReportGenerator
{
    public function generate(ReportRequestDTO $dto): ReportResultDTO
    {
        $data = $this->fetcher->fetch(FetchCriteriaDTO::from($dto));
        return ReportResultDTO::fromData($data);
    }
}

class DataFetcher
{
    public function fetch(FetchCriteriaDTO $criteria): array
    {
        return $this->repository->query(QueryDTO::from($criteria));
    }
}
```
---
## Good Example
```php
class ReportGenerator
{
    public function generate(array $criteria): ReportResultDTO
    {
        $data = $this->fetcher->fetch($criteria);
        return ReportResultDTO::fromData($data);
    }
}
```
---
## Exceptions
Complex internal subsystems with their own clear bounded context that justifies a dedicated contract.
---
## Consequences Of Violation
Inflated codebase with dozens of single-use DTOs; reduced developer velocity due to excessive mapping overhead; increased cognitive load.

---

## Rule 10: Use DTO Collections for List Endpoints Crossing Boundaries
---
## Category
Code Organization
---
## Rule
Wrap lists of DTOs in a typed collection class (e.g., `UserDTOCollection`) when passing them across application boundaries, rather than returning raw arrays.
---
## Reason
Raw arrays of DTOs lose type information at runtime. A typed collection provides type safety, enables aggregate methods, and documents the expected content.
---
## Bad Example
```php
class UserService
{
    /** @return UserDTO[] */
    public function list(): array
    {
        return User::all()->map(fn ($u) => UserDTO::fromModel($u))->toArray();
    }
}
// Controller receives a plain array with no type guarantee
```
---
## Good Example
```php
class UserDTOCollection
{
    /** @param UserDTO[] $items */
    public function __construct(
        public readonly array $items,
    ) {}

    public function toArray(): array
    {
        return array_map(fn (UserDTO $dto) => $dto->toArray(), $this->items);
    }
}

class UserService
{
    public function list(): UserDTOCollection
    {
        $items = User::all()->map(fn ($u) => UserDTO::fromModel($u))->toArray();
        return new UserDTOCollection($items);
    }
}
```
---
## Exceptions
Simple one-off list returns in internal code where the array type is trivially obvious.
---
## Consequences Of Violation
Runtime type errors when non-DTO elements are inserted; no clear documentation of list content; untestable aggregate operations.
