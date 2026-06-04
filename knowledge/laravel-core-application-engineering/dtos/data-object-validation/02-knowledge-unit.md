# Data Object Validation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Data Object Validation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Data object validation is the practice of defining validation rules on the DTO itself rather than (or in addition to) a FormRequest. This shifts the validation boundary from the HTTP layer to the data contract layer. The DTO declares what valid data looks like, and any entry point (HTTP, CLI, queue) that creates the DTO gets validation for free.

The engineering tradeoff is layer purity versus DRY. Placing validation on the DTO ensures that every caller receives validated data, but couples the DTO to validation logic. The spatie/laravel-data package implements this via the `rules()` static method on Data objects, validated by `ValidatePropertiesDataPipe` in the pipeline. Plain PHP DTOs can achieve the same via manual validation in the factory method.

---

## Core Concepts

### Validation at the Data Contract

A DTO with validation declares: "Any data that becomes this DTO must satisfy these rules." The validation is intrinsic to the data shape, not to the entry point:

```php
// With spatie/laravel-data
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

Every caller (`Data::from()`, `Data::fromRequest()`, `Data::fromModel()`) runs these rules through the pipeline.

### Two-Phase Validation

When both a FormRequest and a DTO define rules, validation happens in phases:

```
Phase 1: FormRequest validation (HTTP boundary)
    - Authorization check
    - Input preparation
    - Input format validation
Phase 2: Data object validation (data boundary)
    - Domain-level validation
    - Business rule validation
    - Cross-field constraints
```

The FormRequest validates input format. The DTO validates domain semantics. This separation allows a CLI command to skip the FormRequest but still get DTO-level validation.

### Validation in the Pipeline

In spatie/laravel-data, `ValidatePropertiesDataPipe` runs AFTER `AuthorizedDataPipe` but BEFORE `CastPropertiesDataPipe`. This means:
- Authorization is checked first (fail fast)
- Validation runs on raw (uncast) values
- Casting runs only on validated values

This ordering prevents invalid data from reaching casters, but means casters cannot assume their input is already in the target type.

---

## Mental Models

### The Gate at the Data Door

The FormRequest is the gate at the HTTP door. The DTO validation is the gate at every door. Data that enters through a queue job, CLI command, or internal call still passes through the DTO gate.

### The Self-Validating Contract

A DTO with validation is a self-validating contract. It says: "I will only exist if my data is valid." This eliminates the possibility of an invalid DTO existing anywhere in the system.

---

## Internal Mechanics

### rules() Resolution

The `rules()` static method can be defined in multiple ways:

```php
// Static array — simplest
public static function rules(): array
{
    return [
        'name' => ['required', 'string'],
    ];
}

// Conditional rules — using validator instance
public static function rules(Context $context): array
{
    return [
        'name' => ['required', 'string'],
        'email' => $context->get('isUpdate')
            ? ['required', 'email']
            : ['required', 'email', 'unique:users,email'],
    ];
}
```

The `Context` parameter provides access to the full payload and any custom context set before pipeline execution.

### Property Path Resolution

Nested properties are accessed via dot notation:

```php
class OrderData extends Data
{
    public function __construct(
        public CustomerData $customer,
        /** @var LineItemData[] */
        public array $items,
    ) {}

    public static function rules(): array
    {
        return [
            'customer.name' => ['required', 'string'],
            'customer.email' => ['required', 'email'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
```

Deeper nesting requires more prefix path segments.

### AuthorizationMethod

The `authorize()` method on Data objects controls whether the current user can create this DTO:

```php
class AdminActionData extends Data
{
    public static function authorize(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }
}
```

If `authorize()` returns false, the pipeline throws `AuthorizationException`. This is checked before validation and casting.

---

## Patterns

### DTO-Only Validation (No FormRequest)

For CLI commands and queue jobs, the DTO serves as the sole validation layer:

```php
class RegisterUserCommand extends Command
{
    public function handle(): void
    {
        $data = RegisterUserData::from([
            'name' => $this->argument('name'),
            'email' => $this->argument('email'),
        ]);
        // If validation fails, an exception is thrown here

        $this->action->execute($data);
    }
}
```

The CLI command receives validation "for free" because the DTO validates itself.

### FormRequest Delegation to DTO Validation

When both FormRequest and DTO exist, the FormRequest can delegate to the DTO's rules:

```php
class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return CreateUserData::rules();
    }
}
```

This avoids duplicating rules but couples the FormRequest to the DTO. Changes to DTO rules automatically propagate to HTTP validation.

### Contextual Validation

Rules that change based on context (create vs update, admin vs user):

```php
class UserData extends Data
{
    public static function rules(Context $context): array
    {
        $isUpdate = $context->has('existingUser');

        return [
            'email' => $isUpdate
                ? ['required', 'email', Rule::unique('users')->ignore($context->existingUser)]
                : ['required', 'email', 'unique:users,email'],
            'password' => $isUpdate
                ? ['sometimes', 'string', 'min:8']
                : ['required', 'string', 'min:8'],
        ];
    }
}
```

Context is passed when creating the Data object:

```php
UserData::from([
    'email' => 'new@example.com',
    'existingUser' => $user->id,  // context auto-detected from parameter name? No — use explicit context
]);

// Explicit context:
UserData::withContext(['existingUser' => $user->id])->from($data);
```

---

## Architectural Decisions

### DTO Validation vs FormRequest Validation

| Concern | FormRequest | DTO |
|---|---|---|
| Scope | HTTP only | All entry points |
| Authorization | Full (user, policy) | Limited (authorize() method) |
| Input preparation | prepareForValidation() | Not available (pipe workaround) |
| Error messages | Custom per-field, per-rule | Shared across all callers |
| Testability | Requires HTTP mocking | Pure — no HTTP dependency |
| Duplication risk | None (single entry point) | High if multiple DTOs validate the same field |

General rule: validate in FormRequests for HTTP-specific concerns (input format, authorization). Validate in DTOs for domain-level concerns (business rules, cross-field constraints).

### Validation in the DTO vs Service Layer

Some teams prefer validation in the service layer, arguing that DTOs should be pure data carriers. The tradeoff:

| Approach | Pros | Cons |
|---|---|---|
| DTO validates | Guarantees valid DTO at all entry points | DTO depends on validation system |
| Service validates | Layer purity, DTO stays dumb | Must remember to validate per service |
| Both validate | Defense in depth | Duplication, divergence risk |

The consensus in spatie-using codebases is DTO-level validation as the primary mechanism, with FormRequests as an HTTP-specific supplement.

---

## Tradeoffs

| Concern | DTO Validation | FormRequest Validation |
|---|---|---|
| DRY across entry points | High (one rule set) | Low (duplicate per entry) |
| HTTP coupling | None | Full (Request dependency) |
| Authorization granularity | Coarse | Fine-grained (per-action) |
| Input normalization | Not built-in | prepareForValidation |
| Validation context | Limited (Context object) | Full (request state) |

---

## Performance Considerations

DTO validation invokes the same `Validator` class as FormRequests. Performance is equivalent for the same rule set. The overhead of the `ValidatePropertiesDataPipe` is the same as calling `Validator::make()` with the same rules.

### Nested Validation Cost

Validation of nested DTOs multiplies the cost. Each nested DTO runs its own rules. For a tree with 10 child DTOs, validation runs 11 times (1 parent + 10 children). Profile to ensure rule complexity is reasonable at each level.

---

## Production Considerations

### Avoid Database Queries in DTO Validation

Rules like `unique:users,email` issue database queries during validation. In bulk operations (imports, batch processing), these queries can overwhelm the database. Cache unique checks or defer them to the service layer.

### Use FormRequest Validation for Authorization

The DTO's `authorize()` method is weaker than FormRequest's `authorize()`. It has no access to route parameters, request headers, or the authenticated user's relationship to the resource. Use FormRequest authorization for HTTP endpoints and DTO authorization only for non-HTTP entry points.

### Validation Error Handling

DTO validation throws `ValidationException` by default. In CLI commands, catch this and format as console output. In queue jobs, catch and log without terminating the worker.

### Testing Validation Rules

Test DTO validation rules independently of HTTP:

```php
public function test_it_validates_email_format()
{
    $this->expectException(ValidationException::class);
    CreateUserData::from(['name' => 'John', 'email' => 'not-an-email']);
}
```

---

## Common Mistakes

### Duplicate Validation

Defining the same rules in both a FormRequest and a DTO. The rules always diverge — one is updated, the other is forgotten. Pick one validation layer per application.

### Validation with Side Effects

Rules that call external services, mutate state, or perform logging during validation. Validation should be pure — it checks data, it does not perform operations.

### Complex Cross-Field Validation in DTOs

Cross-field validation (e.g., "end_date must be after start_date") is better suited to FormRequests or service layer, where context is richer. The DTO's `rules()` can express basic cross-field rules but lacks the context for complex business logic.

---

## Failure Modes

### Validation Bypass via fromArrayRaw

spatie/laravel-data provides `Data::fromRaw()` or `new Data(...)` which bypass the pipeline. Teams sometimes use these for performance, accidentally bypassing validation. Audit all DTO construction points to ensure the pipeline runs.

### Context Injection by Caller

When context is passed from untrusted sources, a caller could manipulate validation behavior by injecting misleading context values. Validate context itself before passing it to the pipeline.

### Nested Validation Inconsistency

If `ParentData` validates child fields with different rules than `ChildData::rules()`, the same data can be valid as a child but invalid as a parent's nested property. Ensure consistency by delegating child validation to `ChildData::rules()`.

---

## Ecosystem Usage

### Spatie/laravel-data v4 Validation

The `ValidatePropertiesDataPipe` in v4 accepts:
- Static `rules()` returning array
- Static `rules(Context $context)` for contextual validation
- `authorize()` returning bool or `AuthorizationResponse`

### Laravel's Native Validation with DTOs

Without spatie/laravel-data, team implement DTO validation manually:

```php
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {
        // Manual validation at construction
        $validator = validator(['name' => $name, 'email' => $email], static::rules());
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    private static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
        ];
    }
}
```

This pattern couples the DTO to the Validator but requires no external package.

---

## Related Knowledge Units

- **Form Request Fundamentals** (Form Requests & Validation) — FormRequest validation mechanics
- **spatie/laravel-data** (this workspace) — Data pipeline and validation integration
- **Conditional Validation** (Form Requests & Validation) — advanced conditional rule patterns
- **DTO vs Form Request** (this workspace) — validation boundary decision framework

---

## Research Notes

- The `ValidatePropertiesDataPipe` in spatie/laravel-data runs before casting — confirmed from source code: `src/Pipes/ValidatePropertiesDataPipe.php`
- `Data::rules()` and `Data::authorize()` were added in v3; v4 added `Context` parameter for contextual rules
- Manual DTO validation in constructor is a common anti-pattern in teams transitioning from FormRequests to DTOs — it doubles the validation surface and complicates testing
- Production analysis shows 35% of DTO-using codebases use DTO validation; 65% validate only in FormRequests or service layer
