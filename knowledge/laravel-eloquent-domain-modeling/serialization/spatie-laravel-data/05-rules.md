# Spatie Laravel Data — Rules

## Rule 1: Define `rules()` on All Data Classes Used for Input
---
## Category
Security
---
## Rule
Always define a `rules()` method on every `Data` class that is constructed from user input (request data, API payloads) to validate incoming data.
---
## Reason
`Data::from()` without `rules()` passes all input through without validation, allowing malformed, missing, or malicious data to enter the system silently.
---
## Bad Example
```php
class CreateUserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
    // No rules() — any data passes through
}
```
---
## Good Example
```php
class CreateUserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ];
    }
}
```
---
## Exceptions
Output-only Data classes that are never constructed from external input (e.g., classes used exclusively for serialization responses).
---
## Consequences Of Violation
Invalid data reaching domain logic; SQL injection vectors through unvalidated string fields; type errors from unexpected input shapes.

---

## Rule 2: Use `Optional` for Partial Updates, Not Nullable Types
---
## Category
Framework Usage
---
## Rule
Use the `Optional` type (from `Spatie\LaravelData\Optional`) for PATCH/update endpoint Data fields to distinguish "not provided" from "explicitly set to null."
---
## Reason
Nullable types (`string|null`) cannot distinguish between "field was not sent" and "field was sent as null." `Optional` preserves this semantic, enabling partial updates without overwriting existing values with null.
---
## Bad Example
```php
class UpdateUserData extends Data
{
    public function __construct(
        public ?string $name,    // Cannot distinguish null from not-provided
        public ?string $email,   // Setting either to null overwrites DB
    ) {}
}
```
---
## Good Example
```php
use Spatie\LaravelData\Optional;

class UpdateUserData extends Data
{
    public function __construct(
        public string|Optional $name,
        public string|Optional $email,
    ) {}
}

// In service:
if (! $data->name instanceof Optional) {
    $user->name = $data->name;
}
```
---
## Exceptions
Endpoints where explicitly setting a field to null is a valid operation and should be allowed (document intentionally).
---
## Consequences Of Violation
Accidental null overwrites on partial updates; unexpected data loss; fragile merge logic that can't distinguish absent from null.

---

## Rule 3: Keep Data Classes Free of Business Logic
---
## Category
Architecture
---
## Rule
Data classes must contain only property declarations, type casting configuration, validation rules, and serialization customization. Never add business logic methods.
---
## Reason
Business logic in Data classes violates Single Responsibility and creates hidden dependencies. Data classes should be swappable without affecting domain behavior.
---
## Bad Example
```php
class OrderData extends Data
{
    public function __construct(
        public float $subtotal,
        public float $tax,
    ) {}

    public function calculateTotal(): float // Business logic
    {
        return $this->subtotal + $this->tax;
    }

    public function isEligibleForDiscount(): bool // Business rule
    {
        return $this->subtotal > 100;
    }
}
```
---
## Good Example
```php
class OrderData extends Data
{
    public function __construct(
        public float $subtotal,
        public float $tax,
        public float $total,
    ) {}
}

// Business logic lives in a service or action class
class OrderCalculator
{
    public function calculateTotal(OrderData $order): float
    {
        return $order->subtotal + $order->tax;
    }
}
```
---
## Exceptions
Simple derived properties computed in a named constructor (e.g., `total` computed in `fromModel()` and stored as a property).
---
## Consequences Of Violation
Logic scattered in data layer; untestable business rules; difficulty reusing behavior across contexts; Data classes with hidden dependencies.

---

## Rule 4: Register Custom Casters and Transformers in a Service Provider
---
## Category
Code Organization
---
## Rule
Register all custom casters and output transformers for `spatie/laravel-data` in a dedicated service provider's `boot()` method, not inline in Data classes.
---
## Reason
Inline registration duplicates configuration across Data classes, scatters type-mapping logic, and makes it difficult to locate or change casting behavior.
---
## Bad Example
```php
class MoneyData extends Data
{
    // Casting configured implicitly through PHP types
    // Custom casting logic spread across classes
}
```
---
## Good Example
```php
// AppServiceProvider or DataServiceProvider
public function boot(): void
{
    Data::defineCaster(Money::class, MoneyCaster::class);
    Data::defineTransformer(DateTimeInterface::class, Iso8601Transformer::class);
}

// MoneyData just declares the type
class MoneyData extends Data
{
    public function __construct(
        public Money $amount, // Automatically cast via registered caster
    ) {}
}
```
---
## Exceptions
One-off casters used by a single Data class (rare; prefer registering globally for consistency).
---
## Consequences Of Violation
Duplicate caster configuration; inconsistent casting behavior; hard-to-find casting logic during debugging.

---

## Rule 5: Do Not Create Data Classes for Models That Never Cross Application Boundaries
---
## Category
Architecture
---
## Rule
Only create Data classes for models that are serialized across application boundaries (API, queue, events, CLI). Internal-only models do not need Data classes.
---
## Reason
Data classes for every model creates unnecessary boilerplate and maintenance overhead. Internal models used exclusively within a single bounded context gain no benefit from an additional typed layer.
---
## Bad Example
```php
// App\Models\AuditLog — internal model, never serialized across boundaries
// App\Data\AuditLogData — created "just in case" — never actually used
```
---
## Good Example
```php
// App\Models\AuditLog — internal model, used only within the logging service
// No Data class needed — model stays within its bounded context

// App\Models\User — crosses boundaries (API, queue, events)
// App\Data\UserData — Data class for boundary serialization
```
---
## Exceptions
Models where a Data class is needed for internal type safety within a complex bounded context (document the decision).
---
## Consequences Of Violation
Unnecessary files and maintenance burden; mapping drift between internal model and unused Data class; reduced development velocity.

---

## Rule 6: Test `fromModel()` to Catch Drift When Eloquent Models Change
---
## Category
Testing
---
## Rule
Write unit tests for every Data class's `fromModel()` method that verify all mapped properties are correctly extracted and cast.
---
## Reason
When Eloquent model columns are renamed, removed, or change type, `fromModel()` silently produces null values or casting errors. Tests catch this drift at build time.
---
## Bad Example
```php
// No test
// Model column 'name' renamed to 'full_name'
// UserData::fromModel() still references $model->name — now null
```
---
## Good Example
```php
class UserDataTest extends TestCase
{
    public function test_from_model_maps_all_properties(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $data = UserData::fromModel($user);

        $this->assertInstanceOf(UserData::class, $data);
        $this->assertSame(1, $data->id);
        $this->assertSame('John Doe', $data->name);
        $this->assertSame('john@example.com', $data->email);
    }
}
```
---
## Exceptions
No common exceptions. Every mapping path must be tested.
---
## Consequences Of Violation
Silent null values in production; undetected contract drift; emergency hotfixes when model changes break data boundaries.

---

## Rule 7: Cache Data Configuration in Production
---
## Category
Performance
---
## Rule
Ensure Data class configuration is cached in production environments by running `php artisan data:cache` as part of the deployment process.
---
## Reason
Without caching, every Data class construction uses reflection to resolve type metadata on first call. Caching eliminates this overhead and improves response times.
---
## Bad Example
```php
// Deployment script does not cache Data configuration
// Every first request to each Data class pays reflection cost
```
---
## Good Example
```php
// deployment.php or deploy script
$commands = [
    'php artisan data:cache',
    'php artisan optimize',
];

// Data metadata is now cached — instant construction
```
---
## Exceptions
Development environments where caching would require cache clearing after every code change.
---
## Consequences Of Violation
Increased latency on first request per Data class; reflection overhead in high-traffic endpoints; inconsistent performance between cached and uncached environments.

---

## Rule 8: Avoid Circular Nested Data References
---
## Category
Reliability
---
## Rule
Do not create circular references between Data classes (Data A contains Data B contains Data A). This causes infinite recursion during `from()` or serialization.
---
## Reason
Data classes resolve nested types recursively. A circular reference produces infinite recursion, stack overflow, or `Uncastable` exceptions depending on the resolution depth.
---
## Bad Example
```php
class CategoryData extends Data
{
    public function __construct(
        public int $id,
        /** @var PostData[] */
        public DataCollection $posts,
    ) {}
}

class PostData extends Data
{
    public function __construct(
        public int $id,
        public CategoryData $category, // Circular: Post → Category → Posts
    ) {}
}
```
---
## Good Example
```php
class CategoryData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
    ) {}
}

class PostData extends Data
{
    public function __construct(
        public int $id,
        public string $title,
        public int $category_id, // Reference by ID, not nested object
    ) {}
}

// Or use lazy-loading pattern with separate query
class PostData extends Data
{
    public function __construct(
        public int $id,
        public string $title,
        public ?CategoryData $category,
    ) {}
}
```
---
## Exceptions
No common exceptions. Circular data references are always a design smell.
---
## Consequences Of Violation
Stack overflow on serialization; infinite recursion in Data construction; runtime crashes that are hard to debug.

---

## Rule 9: Use `DataCollection` Consistently for List Returns
---
## Category
Code Organization
---
## Rule
Return `DataCollection` (via `Data::collection()`) from list endpoints and service methods instead of plain arrays of Data objects.
---
## Reason
`DataCollection` provides typed iteration, correct serialization, and works with Laravel's paginator. Plain arrays lose type information and require manual serialization.
---
## Bad Example
```php
class UserService
{
    /** @return UserData[] */
    public function list(): array
    {
        return User::all()
            ->map(fn (User $user) => UserData::fromModel($user))
            ->toArray();
    }
}
```
---
## Good Example
```php
class UserService
{
    public function list(): DataCollection
    {
        return UserData::collection(User::all());
    }
}
```
---
## Exceptions
Methods returning very small, fixed-size sets where the DataCollection overhead is not justified.
---
## Consequences Of Violation
Manual serialization; type safety loss; inconsistent list handling across services; missed paginator integration.

---

## Rule 10: Choose One Casing Convention (snake_case or camelCase) and Enforce It Consistently
---
## Category
Maintainability
---
## Rule
Decide on a property casing convention (snake_case or camelCase) across all Data classes and enforce it consistently. Document the convention and use a linter rule to check it.
---
## Reason
Mixed casing creates confusion for API consumers, breaks frontend integration expectations, and leads to inconsistent serialization output across the application.
---
## Bad Example
```php
class UserData extends Data
{
    public function __construct(
        public string $firstName,      // camelCase
        public string $last_name,      // snake_case — inconsistent
    ) {}
}
```
---
## Good Example
```php
// Convention: snake_case throughout
class UserData extends Data
{
    public function __construct(
        public string $first_name,
        public string $last_name,
    ) {}
}

// Transformer to output snake_case
class UserData extends Data
{
    public static function fromModel(User $user): self
    {
        return new self(
            first_name: $user->first_name,
            last_name: $user->last_name,
        );
    }
}
```
---
## Exceptions
APIs that must conform to an external specification with a conflicting casing requirement (document the divergence).
---
## Consequences Of Violation
Inconsistent API response keys; frontend integration bugs; ongoing debate in code reviews about casing conventions.
