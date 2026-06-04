## Rule 1: Use DTO Validation for Domain-Level Rules Only

---

## Category

Architecture

---

## Rule

Define validation rules on DTOs only for domain-level constraints (business rules, cross-field validation for non-HTTP entry points). Use FormRequest validation for HTTP-specific rules (authorization, input format, input preparation). Never duplicate the same rule in both layers.

---

## Reason

Domain-level constraints (min age, SKU format) apply regardless of how data enters the system — HTTP, CLI, or queue. Placing them on the DTO guarantees consistency across all entry points. HTTP-specific concerns (authorization, input format) belong in the FormRequest, which has access to route parameters and headers that the DTO lacks.

---

## Bad Example

```php
// FormRequest
class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'min:18'], // age validation is domain, not HTTP
        ];
    }
}

// DTO also validates the same rules
class CreateUserData extends Data
{
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'], // duplicated
            'email' => ['required', 'email', 'min:18'],   // duplicated
        ];
    }
}
// Duplicated rules always diverge. If age changes to 21, which layer gets updated?
```

---

## Good Example

```php
// FormRequest handles HTTP-specific rules only
class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
        ];
    }
}

// DTO handles domain-level rules only (applies to HTTP, CLI, queue)
class CreateUserData extends Data
{
    public static function rules(): array
    {
        return ['email' => [new MinimumAgeRule(18)]];
    }
}
// Each layer owns its rules. No duplication. Domain rule applies everywhere automatically.
```

---

## Exceptions

For CLI/queue-only entry points where no FormRequest exists, the DTO serves as the sole validation layer and may define both format and domain rules.

---

## Consequences Of Violation

Maintenance: duplicated rules diverge over time. Reliability: one entry point accepts invalid data because the other validation layer was updated but the duplicate was not.

---

## Rule 2: Never Use Database Queries in DTO Validation Rules

---

## Category

Performance

---

## Rule

Do not use database-dependent validation rules such as `unique:users,email` inside DTO `rules()` methods. Cache uniqueness checks, defer them to the service layer, or validate database constraints at the persistence boundary.

---

## Reason

DTOs are constructed at multiple points in the application, including batch processing and queue workers where database access may be expensive or unavailable. Database queries in DTO validation couple data transport to infrastructure, make DTO construction dependent on database connectivity, and prevent unit testing without database setup.

---

## Bad Example

```php
class CreateUserData extends Data
{
    public static function rules(): array
    {
        return [
            'email' => ['required', 'email', 'unique:users,email'], // database query in DTO
        ];
    }
}
// Every DTO construction triggers a database query. Batch construction of 1000 DTOs runs 1000 queries.
```

---

## Good Example

```php
class CreateUserData extends Data
{
    public static function rules(): array
    {
        return [
            'email' => ['required', 'email'],
        ];
    }
}

// Database uniqueness check in the service layer
class CreateUserAction
{
    public function execute(CreateUserData $data): User
    {
        if (User::whereEmail($data->email)->exists()) {
            throw new DuplicateEmailException($data->email);
        }
        return User::create($data->toArray());
    }
}
// DTO validates format. Service validates database constraints.
```

---

## Exceptions

When using spatie/laravel-data's `Context` parameter with a pre-resolved value that caches the database state. Even then, prefer the service layer for uniqueness checks.

---

## Consequences Of Violation

Performance: each DTO construction triggers unnecessary database round-trips. Reliability: DTO construction fails when database is unavailable. Scalability: batch operations degrade due to N+1 database queries in validation.

---

## Rule 3: Choose One Validation Layer — Never Validate the Same Rules in Both FormRequest and DTO

---

## Category

Maintainability

---

## Rule

For each application, pick exactly one validation layer (FormRequest or DTO) as the primary source of truth for input rules. Do not define the same validation rules in both layers. Document which layer is authoritative.

---

## Reason

Duplicate validation rules always diverge over time. A developer updates the FormRequest to add a new requirement but forgets to update the DTO rules. The DTO then accepts data that the FormRequest rejects, or vice versa. Single-source-of-truth prevents this.

---

## Bad Example

```php
// FormRequest defines 'email' => ['required', 'email', 'unique:users']
// DTO defines 'email' => ['required', 'email', 'unique:users']
// Six months later, FormRequest adds 'max:255' but DTO stays unchanged.
// Data from CLI bypasses the FormRequest but passes DTO validation with 500-character emails.
```

---

## Good Example

```php
// Team decision: FormRequest is the primary validation layer for HTTP
class CreateUserRequest extends FormRequest
{
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email']];
    }
}

// DTO has NO rules — it trusts the FormRequest for HTTP, and CLI has its own validation
readonly class CreateUserDto
{
    public function __construct(public string $name, public string $email) {}
}
// Single validation layer. No divergence possible.
```

---

## Exceptions

When the DTO validates domain-level rules and the FormRequest validates HTTP-specific rules, there is no overlap. This is the correct two-layer pattern. It is duplication only when the same rule appears in both.

---

## Consequences Of Violation

Maintenance: updating one layer without the other creates inconsistent acceptance criteria. Reliability: different entry points accept different data quality. Testing: confused developers write tests for both layers, doubling test surface.

---

## Rule 4: Keep Validation Pure — No Side Effects in Validation Rules

---

## Category

Design

---

## Rule

Do not call external services, mutate state, log events, send notifications, or perform any observable side effects inside DTO validation rules. Validation must be a pure check that returns a boolean decision.

---

## Reason

Side effects in validation rules create untraceable behavior. A rule that sends an email on failure or increments a counter on success couples data validation to infrastructure. Validation runs unpredictably (multiple times, in different contexts), causing duplicate side effects.

---

## Bad Example

```php
class CreateUserData extends Data
{
    public static function rules(): array
    {
        Log::info('Validating user data');  // Side effect in rules()
        $this->rateLimiter->hit('signup');  // Side effect in rules()
        return [
            'email' => ['required', 'email'],
            'name' => [function ($attr, $value, $fail) {
                if ($this->blacklistService->isBlacklisted($value)) { // External service call
                    $fail('Name is blacklisted.');
                }
            }],
        ];
    }
}
// Validation produces log entries, increments rate limits, calls external services — unpredictable when validation runs multiple times.
```

---

## Good Example

```php
class CreateUserData extends Data
{
    public static function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}

// Side effects and external checks happen in the service layer, not validation
class CreateUserAction
{
    public function execute(CreateUserData $data): User
    {
        Log::info('Creating user', ['email' => $data->email]);
        $this->rateLimiter->hit('signup');
        // External checks in service, not in DTO validation
        return User::create($data->toArray());
    }
}
```

---

## Exceptions

No common exceptions. Validation rules must be pure functions that check input and return a decision.

---

## Consequences Of Violation

Reliability: duplicate side effects when validation runs multiple times (pipeline retries, queued validation). Maintenance: side effects hidden in validation rules are invisible during debugging. Testing: validation tests trigger unintended infrastructure interactions.

---

## Rule 5: Validate Context Passed to `rules(Context $context)` from Untrusted Sources

---

## Category

Security

---

## Rule

When using spatie/laravel-data's `Context` parameter in `rules()`, validate the context itself when it originates from untrusted sources. Do not use context values directly in rules without checking they are safe.

---

## Reason

The `Context` object is populated by the caller. If an untrusted source constructs DTOs with manipulated context values, validation behavior can be subverted. A context value of `['existingUser' => ['id' => 999]]` could bypass uniqueness checks or alter rule behavior.

---

## Bad Example

```php
public static function rules(Context $context): array
{
    $userId = $context->existingUser; // Untrusted — could be manipulated by caller
    return [
        'email' => ['required', 'email', Rule::unique('users')->ignore($userId)],
    ];
}
// Malicious caller passes arbitrary existingUser value, potentially bypassing uniqueness check.
```

---

## Good Example

```php
public static function rules(Context $context): array
{
    $userId = $context->has('existingUser') && $context->existingUser instanceof User
        ? $context->existingUser->id
        : null;

    $rules = ['email' => ['required', 'email']];

    if ($userId !== null) {
        $rules['email'][] = Rule::unique('users')->ignore($userId);
    }

    return $rules;
}
// Context value is validated before use. Type-check ensures only valid User objects are passed.
```

---

## Exceptions

When context is populated exclusively by trusted internal code (service layer, dedicated factory) that controls what values are passed, explicit validation of context may be redundant but is still recommended as defense-in-depth.

---

## Consequences Of Violation

Security: validation rules can be bypassed by manipulating context values. Reliability: unexpected context values cause validation behavior changes that are hard to debug.

---

## Rule 6: Audit All DTO Construction Points for Validation Bypass

---

## Category

Security

---

## Rule

Never use `Data::fromRaw()`, `new Data(...)`, or direct constructor calls for spatie/laravel-data objects in production code paths. Audit every DTO construction site to ensure it passes through the validation pipeline.

---

## Reason

`Data::fromRaw()` and `new Data(...)` bypass the entire `DataPipeline` — authorization, validation, and casting are skipped. Data constructed this way enters the service layer without any guarantee of validity. The pipeline is the only mechanism that ensures DTO properties contain validated, typed data.

---

## Bad Example

```php
// Performance optimization that bypasses validation
$data = UserData::fromRaw($request->all());
// Invalid data, malicious input, uncast types all pass through silently.
```

---

## Good Example

```php
// Always go through the pipeline
$data = UserData::fromRequest($request);  // Uses FormRequest validated data
// or
$data = UserData::from($request->validated());  // Uses validated array, triggers pipeline
// Pipeline runs: authorize → validate → cast. Invalid data is rejected.
```

---

## Exceptions

Test code may use `new Data(...)` or `fromRaw()` to construct Data objects directly without pipeline overhead. Never use these methods in production application code.

---

## Consequences Of Violation

Security: unvalidated, uncast data enters the service layer. Malicious input (mass-assignment fields, type-confused values) propagates unchecked. Reliability: invalid enum values, malformed dates, and missing required fields cause downstream errors.

---

## Rule 7: Do Not Define DTO Validation in the Constructor — Prefer Declarative `rules()` Methods

---

## Category

Design

---

## Rule

Define validation rules in the DTO's `rules()` static method (spatie/laravel-data) or in a dedicated static `rules()` method called from `fromArray()`. Do not place validation logic directly in the constructor body.

---

## Reason

Constructor validation couples validation execution to construction. The constructor cannot be called without running validation, even when the caller already has validated data. Declarative `rules()` methods allow the validation to be inspected, reused, and tested independently of construction.

---

## Bad Example

```php
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {
        $validator = validator(['name' => $name, 'email' => $email], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
        ]);
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }
}
// Every construction triggers validation. Tests cannot construct a DTO without validation overhead.
```

---

## Good Example

```php
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
        ];
    }

    public static function fromArray(array $data): self
    {
        $validator = validator($data, static::rules());
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
        return new self(name: $data['name'], email: $data['email']);
    }
}
// Validation is in a reusable method. Tests can construct DTO directly without validation if needed.
```

---

## Exceptions

Value Objects that enforce invariants (e.g., `Email`, `Money`) validate in the constructor because the invariant is intrinsic to the value. DTOs transport data; VOs enforce invariants.

---

## Consequences Of Violation

Testing: every DTO construction in tests requires valid input, making it impossible to test with intentionally invalid data. Flexibility: callers with pre-validated data pay the validation cost again.
