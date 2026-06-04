# Form Request DTO Integration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Form Request DTO Integration
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Form Request DTO integration bridges the HTTP validation layer and the typed data transfer layer. The pattern converts a validated FormRequest into a typed DTO before passing it to services or actions. This ensures that services receive strongly-typed, validated data without depending on the HTTP request object. The bridge pattern is typically a `toDto()` method on the FormRequest or a static factory method on the DTO that accepts a FormRequest.

---

## Core Concepts

### The Bridge Pattern

The FormRequest validates HTTP input. The DTO carries validated, typed data to the service layer. The bridge connects them:

```
Client → FormRequest (validates) → toDto() → DTO (typed) → Service/Action
```

The service layer never touches the HTTP request. It receives a typed DTO whose data is guaranteed valid.

### validated() as DTO Source

`$request->validated()` returns only the data that passed validation rules. This is the safe input for DTO construction:

```php
// Controller
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute(UserDto::fromRequest($request));
}

// DTO
class UserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $bio,
    ) {}

    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(...$request->validated());
    }
}
```

### The payload() Convenience Method

Some teams add a `payload()` method to the FormRequest that returns the DTO directly:

```php
class StoreUserRequest extends FormRequest
{
    public function rules(): array { /* ... */ }

    public function payload(): UserDto
    {
        return new UserDto(...$this->validated());
    }
}

// Controller
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute($request->payload());
}
```

---

## Mental Models

### The Transformation Pipeline

Think of the FormRequest-to-DTO flow as a data transformation pipeline: raw HTTP input → validation rules → validated array → typed DTO. Each step narrows the contract. Raw input is untyped and potentially dangerous. The validated array is safe but untyped. The DTO is safe and typed. Each transformation is a one-way door — once data enters the DTO, it cannot be reverted to raw input without explicit intent.

### The Anti-Corruption Layer

The DTO acts as an anti-corruption layer between the HTTP layer and the domain layer. The FormRequest speaks HTTP (strings, nullable fields, flat arrays). The DTO speaks domain (typed values, value objects, collections). The bridge pattern ensures that domain code never depends on HTTP concepts, enabling the domain to be tested without HTTP scaffolding.

---

## Internal Mechanics

### validated() After Validation

The `validated()` method reads from the validator's internal state:

```php
public function validated($key = null, $default = null)
{
    return data_get($this->validator->validated(), $key, $default);
}
```

The Validator's `validated()` method returns data filtered through the rules, excluding fields that failed or were excluded:

```php
// Validator
public function validated()
{
    $results = [];
    $missingValue = new stdClass;
    // Iterate rules, extract matching data
    foreach ($this->rules as $key => $rules) {
        $value = data_get($this->data, $key, $missingValue);
        if ($value !== $missingValue) {
            Arr::set($results, $key, $value);
        }
    }
    return $this->replacePlaceholders($results);
}
```

Key detail: `validated()` excludes fields that have rules but no matching data AND fields that were excluded via `exclude_if`/`exclude_unless`. It includes ALL fields that have rules and matching data, even if they passed through `nullable`.

### safe() for Scoped Validation

`safe()` returns a `ValidatedInput` instance that supports `->only()` and `->except()`:

```php
public function safe(?array $keys = null)
{
    return is_array($keys)
        ? $this->validator->safe()->only($keys)
        : $this->validator->safe();
}
```

`safe()` is derived from the same validator data. Its value is type-narrowing — `safe()` returns a `ValidatedInput`, not an array.

---

## Patterns

### toDto() on FormRequest

```php
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function toDto(): CreateUserData
    {
        return new CreateUserData(
            name: $this->validated('name'),
            email: $this->validated('email'),
            bio: $this->validated('bio') ?? '',
        );
    }
}
```

### fromRequest() on DTO (Static Factory)

```php
class CreateUserData
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $bio = '',
    ) {}

    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(...$request->validated());
    }
}
```

### Constructor-Based Construction with Named Arguments

PHP 8.0+ named arguments enable direct DTO construction from validated arrays:

```php
$dto = new CreateUserData(...$request->validated());
```

This requires the DTO's constructor parameter names to match the validated field names exactly. Useful for thin DTOs with no transformation logic.

### Hybrid: FormRequest with DTO Property

```php
class StoreUserRequest extends FormRequest
{
    private ?CreateUserData $data = null;

    public function rules(): array { /* ... */ }

    public function toDto(): CreateUserData
    {
        return $this->data ??= new CreateUserData(...$this->validated());
    }
}
```

Caches the DTO on the request instance to prevent double construction.

---

## Architectural Decisions

### FormRequest::toDto() vs DTO::fromRequest()

| Aspect | toDto() on Request | fromRequest() on DTO |
|--------|-------------------|---------------------|
| Dependency direction | Request depends on DTO | DTO depends on Request |
| Testability | Request test needs DTO | DTO test needs request mock |
| DTO reuse | Tied to HTTP layer | Independent (also from CLI, queue) |
| Transformation | Access to request context | Only validated data |

Prefer `DTO::fromRequest()` when the DTO is used outside HTTP contexts (commands, queues). Prefer `FormRequest::toDto()` when the transformation needs request context (auth user, route params).

### DTO vs Direct validated() in Controller

```php
// Direct — works but no type safety
public function store(StoreUserRequest $request)
{
    User::create($request->validated());
}

// DTO — typed, testable, independent
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute(CreateUserData::fromRequest($request));
}
```

Threshold: Use a DTO when data crosses a service or action boundary. For simple CRUD (Controller → Model::create), `validated()` directly is sufficient.

---

## Tradeoffs

### toDto() vs Inline Construction in Controller

A `toDto()` method on the FormRequest centralizes DTO construction logic in one place. The tradeoff is coupling — the FormRequest must import the DTO class, creating a dependency from the HTTP layer to the data layer. Inline construction in the controller keeps the layers decoupled but duplicates the mapping logic if multiple controller actions transform the same request to a DTO.

### Static Factory vs Named Constructor

`DTO::fromRequest($request)` is a static factory that depends on the HTTP request type. `new DTO(...$request->validated())` is a direct constructor call that depends only on validated data. The static factory is more explicit about intent (this DTO is built from HTTP input) but creates a tighter coupling between the DTO and the HTTP layer. Direct construction is more portable across contexts (HTTP, CLI, queue) but requires the caller to know which validated fields map to which constructor parameters.

---

## Performance Considerations

### DTO Construction Overhead

DTO construction from validated data involves array access and object instantiation. For a single request this is negligible — microseconds. For batch operations processing hundreds of DTOs from a single request (e.g., API resource collections), the cumulative construction time can add up. Use lazy DTO construction or collection-based mapping when processing large datasets.

### validated() Already Computed

The performance advantage of DTO integration is that `validated()` is already computed by the time the controller receives the FormRequest. The validator's internal `validated()` method returns pre-filtered, pre-computed data. DTO construction reads this cache rather than re-validating or re-filtering input.

---

## Production Considerations

### Serialization for Queued Jobs

DTOs that are passed to queued jobs must be serializable. If the DTO contains non-serializable types (Closures, resources, live database connections), the job will fail at dispatch time. Ensure DTOs used across queue boundaries use plain PHP types or implement `Serializable` / use the `__serialize()` magic method.

### Validation Contract Documentation

In production APIs, the DTO structure serves as implicit documentation of the expected input shape. Teams using OpenAPI/Swagger should generate API specifications from the DTO's typed properties rather than from the FormRequest rules. This ensures the documented contract matches the actual validated structure.

---

## Common Mistakes

### Passing $request->all() to DTO

```php
// WRONG — bypasses validation entirely
$dto = new CreateUserData(...$request->all());
```

Always use `$request->validated()` or `$request->safe()` as the DTO source. `all()` includes unvalidated fields that could contain mass-assignable data.

### DTO Fields Out of Sync

When DTO constructor parameters change, FormRequest `toDto()` calls break silently. Use PHPStan or Psalm to enforce type compatibility between FormRequest output and DTO input.

### Null Handling Discrepancy

```php
// FormRequest rule: 'bio' => 'nullable|string'
$validated = $request->validated();
// 'bio' may be absent from validated() if not sent, OR null if sent as null
```

Validated data from nullable fields may contain the key (with null) or omit it entirely (if not submitted). Document the DTO's expectation and handle both cases.

---

## Failure Modes

### DTO Construction Before Validation

If `toDto()` is called before validation runs (e.g., in the constructor of the FormRequest), the request data is not yet validated. Always call `toDto()` from the controller after the FormRequest has been auto-validated.

### Missing Fields in validated()

Fields with `exclude_if` or `exclude_unless` rules will be absent from `validated()`. The DTO constructor will receive fewer arguments. Use default values or nullable DTO parameters for excluded fields.

---

## Ecosystem Usage

### Laravel Nova

Nova's resource management uses DTO-like data objects internally. When Nova processes resource creation or updates, it maps validated FormRequest data to Nova's internal `ResourceCreateData` and `ResourceUpdateData` DTOs, ensuring consistent data shape between Nova's resource tools and custom fields.

### Laravel Spark

Spark uses DTO integration for billing operations. The `SubscriptionRequest` validates payment input and constructs a `SubscriptionData` DTO that is passed to Spark's billing service. This decouples Spark's billing domain from the HTTP request format, allowing the same subscription logic to work from API routes and web controllers.

### Laravel Cashier

Cashier's billing portal constructs `CheckoutData` and `InvoiceData` DTOs from validated request data. These DTOs are passed to Stripe API calls without exposing the raw request data to the payment integration layer.

---

## Related Knowledge Units

- **DTO Construction Patterns** (DTOs subdomain) — static factories and named constructors
- **DTO vs Form Request** (DTOs subdomain) — architectural separation of concerns
- **Form Request Fundamentals** (this subdomain) — validated() and safe()
- **Service Class Design** (service-layer-pattern subdomain) — DTO as service input

---

## Research Notes

### Safe() vs validated() for DTO Construction

`safe()` returns a `ValidatedInput` instance with `->only()` and `->except()` methods. Using `safe()->only(['field_a', 'field_b'])` provides explicit field whitelisting that prevents accidentally including unexpected validated fields in the DTO. The tradeoff is that field names must be duplicated in the DTO construction call, creating a second source of truth alongside the DTO's constructor.

### Future Direction — Auto-DTO from FormRequest

Future Laravel versions could introduce automatic DTO generation from FormRequest rules. By defining the DTO type as a generic parameter on the FormRequest (`FormRequest<CreateUserData>`), the framework could auto-map validated fields to DTO properties using type reflection, eliminating the manual `toDto()` bridge.

### Framework Source Reference
- `Illuminate\Foundation\Http\FormRequest::validated()` — validated data source
- `Illuminate\Foundation\Http\FormRequest::safe()` — scoped validated data
- `Illuminate\Validation\ValidatedInput` — safe() return type
