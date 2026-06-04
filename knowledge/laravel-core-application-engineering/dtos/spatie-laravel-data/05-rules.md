## Rule 1: Use `Data::fromRequest()` Over `Data::from($request->all())`

---

## Category

Security

---

## Rule

Always use `Data::fromRequest($request)` when constructing a Data object from an HTTP request. Do not use `Data::from($request->all())` or `Data::from($request->input())`.

---

## Reason

`Data::fromRequest()` automatically uses the FormRequest's `validated()` data, ensuring only validated fields enter the Data object. `Data::from($request->all())` passes raw, unvalidated request input directly to the Data object's pipeline, which runs validation inside the pipeline but has weaker authorization (no route parameters, no headers) than a FormRequest.

---

## Bad Example

```php
public function store(Request $request): JsonResponse
{
    $data = UserData::from($request->all());
    // Raw input passes through. No FormRequest authorization. Mass-assignment risk.
}
```

---

## Good Example

```php
public function store(CreateUserRequest $request): JsonResponse
{
    $data = UserData::fromRequest($request);
    // Uses FormRequest's validated() data. Full authorization and input validation.
}
```

---

## Exceptions

When a Data object is constructed outside HTTP context (CLI command, queue job, test), use `Data::from()` with a validated array. Never pass unvalidated input.

---

## Consequences Of Violation

Security: unvalidated, unauthorized input enters the data pipeline. Mass-assignment vulnerabilities. Bypass of FormRequest authorization logic.

---

## Rule 2: Define Validation Rules in Exactly One Layer — Either FormRequest or Data Object, Never Both

---

## Category

Maintainability

---

## Rule

For each application, pick exactly one layer (FormRequest or Data object) to define validation rules. Do not define the same rule in both. Document which layer is authoritative.

---

## Reason

Duplicate validation rules always diverge over time. A developer adds a rule to the FormRequest but forgets the Data object, or vice versa. Six months later, data from different entry points is validated differently. Maintaining two sources of truth for the same constraint is a maintenance burden that provides no benefit.

---

## Bad Example

```php
// FormRequest
class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return ['email' => ['required', 'email', 'max:255']];
    }
}

// Data object — same rules duplicated
class CreateUserData extends Data
{
    public static function rules(): array
    {
        return ['email' => ['required', 'email', 'max:255']];
    }
}
// Six months later: FormRequest adds 'unique:users', Data object stays unchanged.
// CLI entry point (which bypasses FormRequest) now accepts duplicate emails.
```

---

## Good Example

```php
// Team decision: FormRequest is authoritative for HTTP
class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return ['name' => ['required', 'string'], 'email' => ['required', 'email', 'unique:users']];
    }
}

// Data object has zero rules — trusts FormRequest for HTTP
// CLI/queue entry points have their own validation before Data::from()
class CreateUserData extends Data
{
    public function __construct(public string $name, public string $email) {}
}
```

---

## Exceptions

When Data objects validate domain-level rules and FormRequests validate HTTP-specific rules, there is no overlap. This is valid separation, not duplication.

---

## Consequences Of Violation

Maintenance: updating one layer without the other creates inconsistent validation. Reliability: different entry points accept different data. Doubled validation processing time.

---

## Rule 3: Never Add Business Logic or Persistence Code to Data Objects

---

## Category

Architecture

---

## Rule

Do not add methods to Data objects that perform business calculations, database queries, API calls, or persistence. Data objects must remain pure data carriers with validation and casting concerns only.

---

## Reason

A Data object that contains business logic or persistence code violates the separation between data transport and domain logic. The Data object becomes harder to test (requires infrastructure setup), harder to reuse (logic may not apply to all consumers), and creates coupling between the data layer and infrastructure.

---

## Bad Example

```php
class OrderData extends Data
{
    public function __construct(
        public int $subtotal,
        public int $tax,
        public int $shipping,
        public int $discount,
    ) {}

    public function calculateTotal(): int // Business logic in Data object
    {
        return $this->subtotal + $this->tax + $this->shipping - $this->discount;
    }

    public function save(): Order // Persistence in Data object
    {
        return Order::create($this->toArray());
    }
}
// Data object now has business logic and persistence. Next sprint: add sendConfirmation() to the Data object.
```

---

## Good Example

```php
class OrderData extends Data
{
    public function __construct(
        public int $subtotal,
        public int $tax,
        public int $shipping,
        public int $discount,
        public int $total, // Pre-computed by service
    ) {}
    // No behavior — pure data transport
}

// Business logic in the service layer
class OrderService
{
    public function createOrder(OrderData $data): Order
    {
        return Order::create($data->toArray());
    }
}
```

---

## Exceptions

Custom casters that normalize data types are not business logic — they are data transformation. Casters are acceptable in `#[CastWith]` attributes.

---

## Consequences Of Violation

Architecture: domain logic leaks into data transport layer. Testing: Data object tests require infrastructure setup (database, mocks). Reusability: Data objects with logic cannot be used in contexts where the logic doesn't apply.

---

## Rule 4: Respect the Pipeline Order — Never Add Custom Pipes That Violate Authorization → Validation → Casting

---

## Category

Architecture

---

## Rule

Do not add custom `DataPipe` implementations that run before authorization, before validation, or that reorder the pipeline stages. If custom pipes are needed, add them after casting. Document the pipe's position relative to the standard pipeline.

---

## Reason

The DataPipeline executes in a fixed order that is critical for security and type safety: authorization first (reject unauthorized access before any processing), validation second (reject invalid input before casting), casting last (convert validated primitives to typed properties). Custom pipes inserted in the wrong position can bypass authorization, accept invalid data, or receive uncast values they cannot handle.

---

## Bad Example

```php
// Custom pipe added in wrong position
class NormalizePhonePipe implements DataPipe
{
    public function handle(mixed $payload, Closure $next, DataPipeline $pipeline): mixed
    {
        // Runs during pipeline — position depends on registration
        if (isset($payload['phone'])) {
            $payload['phone'] = preg_replace('/[^0-9]/', '', $payload['phone']);
        }
        return $next($payload);
    }
}

// Registered before validation — normalization runs before validation
// A phone with letters is normalized to digits, then validation passes
// But the user's intent (malicious input) was obscured by early normalization
```

---

## Good Example

```php
class NormalizePhoneCaster implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $context): string
    {
        // Casting happens AFTER validation — validated value is already known to be a string
        return preg_replace('/[^0-9]/', '', $value);
    }
}
// Use casters for data normalization. Casting is the correct pipeline stage.
```

---

## Exceptions

Custom pipes that add metadata (timestamps, user IDs) after casting are acceptable. Document that they run at the end of the pipeline.

---

## Consequences Of Violation

Security: authorization or validation bypass due to pipe ordering. Reliability: casters receive unvalidated or uncast values, causing type errors.

---

## Rule 5: Never Use `Data::fromRaw()` or `new Data(...)` in Production Code

---

## Category

Security

---

## Rule

Do not use `Data::fromRaw()` or direct `new Data(...)` constructor calls in production code paths. These bypass the entire DataPipeline — authorization, validation, and casting are skipped.

---

## Reason

`Data::fromRaw()` and direct constructor calls circumvent all pipeline protections. Data enters the system without authorization checks, without validation rules being applied, and without type casting. This is the equivalent of bypassing a FormRequest and passing raw `$_POST` data to a service.

---

## Bad Example

```php
// Performance optimization — but dangerous
$data = UserData::fromRaw($request->all());
// No pipeline: no authorize(), no rules(), no casting. Invalid data passes through.
```

---

## Good Example

```php
// Always go through the pipeline
$data = UserData::fromRequest($request);
// Pipeline runs: authorize → validate → cast
```

---

## Exceptions

Test code may use `new Data(...)` or `Data::fromRaw()` to construct Data objects directly without pipeline overhead. Never use these methods in controllers, services, commands, or queue jobs.

---

## Consequences Of Violation

Security: unvalidated, uncast data enters the service layer. Validation bypass, mass-assignment vulnerabilities. Runtime errors from uncast types (enum values that don't exist, malformed dates).

---

## Rule 6: Configure TypeScript Generation in CI to Prevent PHP/TypeScript Type Drift

---

## Category

Maintainability

---

## Rule

When using spatie/laravel-data's TypeScript generation feature, run `php artisan data:typescript` in CI and fail the pipeline if the generated types differ from the committed version.

---

## Reason

PHP Data objects and TypeScript type definitions must stay in sync. A developer who renames a Data property, changes a type, or adds a field must also regenerate TypeScript types. Without CI enforcement, TypeScript types drift from PHP types, causing frontend type errors that are difficult to trace back to the PHP change.

---

## Bad Example

```php
// Developer renames 'email' to 'emailAddress' in UserData
class UserData extends Data
{
    public function __construct(
        public string $name,
        public string $emailAddress, // Renamed from 'email'
    ) {}
}

// TypeScript types are not regenerated — frontend still uses 'email'
// No CI check catches this. Frontend builds pass with wrong types.
```

---

## Good Example

```bash
# CI pipeline step
php artisan data:typescript
if ! git diff --exit-code resources/js/types/generated/; then
    echo "TypeScript types are out of date. Run 'php artisan data:typescript' and commit the changes."
    exit 1
fi
# CI fails if generated types differ from committed version.
```

---

## Exceptions

If the frontend is not TypeScript or does not consume generated types, this rule does not apply. In TypeScript frontends, always enforce.

---

## Consequences Of Violation

Maintenance: frontend TypeScript types silently drift from PHP Data objects. Reliability: frontend build-time type errors are caught late or not at all. Developer experience: frontend developers waste time debugging type mismatches.

---

## Rule 7: Handle Nullable Nested Data Properties Explicitly with `?` Type Hints

---

## Category

Design

---

## Rule

When a Data object contains an optional nested Data object relationship, declare the property with a nullable type hint (`?ProfileData`). Do not use default empty Data objects or omit the type hint.

---

## Reason

A nullable type hint communicates the optionality clearly to both the developer and the spatie/laravel-data pipeline. The pipeline correctly handles null values for nullable types — it does not attempt to cast null to a non-nullable nested Data object. Default empty objects hide the absence of data and may cause unexpected behavior in consumers.

---

## Bad Example

```php
class UserData extends Data
{
    public function __construct(
        public ProfileData $profile, // Non-nullable — what if user has no profile?
    ) {}
}
// Data::from(['name' => 'John', 'email' => 'j@t.com']) fails because 'profile' is required.
// Cannot represent a user without a profile.
```

---

## Good Example

```php
class UserData extends Data
{
    public function __construct(
        public ?ProfileData $profile, // Nullable — explicitly optional
    ) {}
}
// Data::from(['name' => 'John', 'email' => 'j@t.com']) works — profile is null.
// Data::from(['name' => 'John', 'email' => 'j@t.com', 'profile' => [...]]) also works.
```

---

## Exceptions

When a relationship is mandatory for the operation's context (e.g., an order always has line items), a non-nullable nested Data object is correct.

---

## Consequences Of Violation

Reliability: Data construction fails when optional relationships are missing. Maintenance: developers add workarounds (default empty objects) instead of nullable types, hiding data absence.
