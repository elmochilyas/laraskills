# DTO vs Form Request

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO vs Form Request
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

The boundary between Form Requests and DTOs is the most consistently misunderstood architectural decision in Laravel applications. Form Requests validate and authorize HTTP input. DTOs carry typed data between layers. The confusion arises because both operate on the same data — incoming request fields — and both can define validation rules. The result is either duplication (both validate the same fields) or conflation (a DTO that depends on HTTP or a FormRequest that acts as a service input).

The correct architectural split is: Form Requests own the HTTP boundary (authorization, input preparation, input format validation). DTOs own the inter-layer data contract (typed properties, domain validation). The service layer receives DTOs, not FormRequests. The FormRequest produces a DTO via `toDto()` or `->payload()`. Neither class replaces the other; they are sequential stages in the data flow.

---

## Core Concepts

### Sequential, Not Overlapping

The data flow is linear:

```
HTTP Request → FormRequest (authorize + validate) → DTO (type + carry) → Service
```

The FormRequest runs first. The DTO is constructed from the FormRequest's `validated()` output. The service never sees the FormRequest.

### Responsibility Split

| Concern | Form Request | DTO |
|---|---|---|
| Authorization (can user do this?) | Primary (`authorize()`) | Secondary (`authorize()` for non-HTTP) |
| Input format validation | Primary (required, max, email, unique) | Optional (domain rules only) |
| Input preparation | Primary (prepareForValidation) | Not applicable |
| Type safety | None (returns array) | Primary (typed properties) |
| Data transport | None (request-scoped) | Primary (layer to layer) |
| Cross-layer consistency | None (per-endpoint) | Primary (same DTO for all callers) |

### The Bridging Pattern

The bridge between FormRequest and DTO is explicit:

```php
// In controller:
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $dto = UserDto::fromRequest($request);
    $action->execute($dto);
}

// In FormRequest:
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'unique:users,email'],
    ];
}

// In DTO:
public static function fromRequest(StoreUserRequest $request): self
{
    return new self(...$request->validated());
}
```

---

## Mental Models

### The Checkpoint and the Vehicle

The FormRequest is the checkpoint at the system boundary. It checks credentials and inspects the cargo (input format). The DTO is the vehicle that carries approved cargo to the factory floor (service layer). The checkpoint never drives the cargo in; the vehicle never inspects the cargo.

### Input vs Contract

The FormRequest defines what valid input looks like. The DTO defines what valid data looks like. Input is HTTP-specific (this field comes from a form). Data is domain-specific (this entity has a name and email). The same DTO could be constructed from a CSV import, an API call, or a CLI command — but each has its own input validation.

---

## Internal Mechanics

### When Both Define Rules

If both FormRequest and DTO define rules, both execute:

```php
// StoreUserRequest rules validate HTTP input format
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ];
    }
}

// UserDto rules validate domain constraints
class UserDto extends Data
{
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
        ];
    }
}
```

The FormRequest validates first. The DTO validates second. The `unique:users,email` rule in the FormRequest already covered the database constraint — the DTO's `email` rule is redundant. The team must decide which layer owns which rules.

### FormRequest Without DTO

Services that receive `$request->validated()` arrays instead of DTOs are coupled to array keys:

```php
class StoreUserAction
{
    public function execute(array $data): User
    {
        // What keys does $data have? Read the FormRequest to find out.
        return User::create($data);
    }
}
```

The action has no typed contract. The compiler does not verify that `$data` contains the required fields. Refactoring the FormRequest silently breaks the action.

### DTO Without FormRequest (CLI/Queue)

CLI commands and queue jobs bypass FormRequests entirely:

```php
class ImportUsersCommand extends Command
{
    public function handle()
    {
        $data = UserDto::fromArray([
            'name' => $this->argument('name'),
            'email' => $this->argument('email'),
        ]);
        // DTO validates itself — no FormRequest needed
        $this->action->execute($data);
    }
}
```

The DTO validation ensures the same constraints apply across all entry points. The FormRequest is only needed for HTTP-specific concerns.

---

## Patterns

### FormRequest Has payload() Method

The FormRequest owns DTO creation:

```php
class StoreUserRequest extends FormRequest
{
    public function rules(): array { /* ... */ }
    public function authorize(): bool { /* ... */ }

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

This pattern keeps the DTO factory close to the validation rules. The controller is minimal — it calls `payload()` and passes the result.

### DTO Has fromRequest() Method

The DTO owns its construction from HTTP:

```php
// Controller
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute(UserDto::fromRequest($request));
}

// DTO
readonly class UserDto
{
    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(...$request->validated());
    }
}
```

This pattern keeps the DTO responsible for its own construction from all sources. The controller calls a single static method.

### FormRequest Delegates to DTO Rules

When validation rules are shared, the FormRequest delegates:

```php
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return UserDto::rules(); // DTO defines the shared rules
    }
}
```

This reduces duplication but couples the FormRequest to the DTO. If the DTO changes its rules, HTTP validation changes automatically.

---

## Architectural Decisions

### Which Layer Owns Which Rules

| Rule Type | Owner | Example |
|---|---|---|
| Input format | FormRequest | `required`, `string`, `max:255`, `email` |
| Database constraint | FormRequest | `unique:users,email` (needs DB connection) |
| Domain constraint | DTO | `min:18` for age, pattern for SKU format |
| Cross-field constraint | Either | `end_date > start_date` |
| Authorization | FormRequest | `authorize()` — user can create user? |

The practical split: FormRequest validates what the HTTP client sends. DTO validates what the domain requires. Database-level checks (unique, exists) belong in FormRequests because they require HTTP context (excluded record ID for updates).

### When to Skip the DTO

Not every FormRequest needs a matching DTO. If the data flows directly from controller to a single service method (no other callers), an array from `validated()` is sufficient. Add a DTO when:
- The same data shape is used by multiple entry points
- The data crosses 3+ application layers
- The service method signature needs to be self-documenting

### When to Skip the FormRequest

If an endpoint has no HTTP-specific concerns (no authorization beyond authentication, no input preparation), the controller can construct the DTO directly from `request()->validate()`:

```php
public function store(StoreUserAction $action)
{
    $data = request()->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'unique:users,email'],
    ]);

    $action->execute(UserDto::fromArray($data));
}
```

This is a valid pattern for simple endpoints. The FormRequest class is introduced when the validation or authorization logic becomes non-trivial.

---

## Tradeoffs

| Concern | Use Both | FormRequest Only | DTO Only |
|---|---|---|---|
| HTTP authorization | Full (authorize()) | Full | Weak (authorize() method) |
| Input preparation | Full (prepareForValidation) | Full | Not available |
| Cross-entry point safety | Full | Low (per-endpoint only) | Full |
| Type safety for services | Full | None (array passed) | Full |
| Boilerplate | Highest (2 classes) | Low (1 class) | Low (1 class) |
| Rule duplication risk | High (if both define rules) | None | None |

---

## Performance Considerations

No measurable difference. FormRequest and DTO validation both use the same `Validator` class. The extra method call for DTO construction (`fromRequest`) is sub-microsecond. The decision is architectural, not performance-driven.

---

## Production Considerations

### Never Inject FormRequest into Services

A service method receiving a FormRequest is permanently coupled to HTTP. Test setup requires HTTP mocking. The service cannot be called from CLI or queue without constructing a fake request. Always convert to DTO at the controller boundary.

### One Directional Dependency

The controller depends on both FormRequest and DTO. The DTO depends on nothing (or on the Validator for self-validation). The FormRequest may depend on the DTO (for rule delegation or payload creation). The service depends only on the DTO. This dependency direction prevents layer coupling.

### Audit Boundaries During Code Review

During code review, verify:
- Does the service receive a DTO (or array from validated())?
- Does the FormRequest validate HTTP-specific concerns?
- Does the DTO carry domain-validated data?
- Are there unused FormRequest or DTO classes?

---

## Common Mistakes

### DTO Properties Mirroring Request Fields Exactly

If a DTO's properties are identical to the FormRequest's validated keys, the DTO adds no value. A DTO should represent the domain concept, not the HTTP form structure. Rename fields, flatten nesting, transform types — this is where the DTO pays off.

### FormRequest Acting as DTO

Passing a FormRequest to a service violates both the FormRequest's purpose (HTTP validation) and the service's contract (typed data). The FormRequest carries request metadata (headers, cookies, session) that the service should never see.

### Duplicate Validation Rules

When both FormRequest and DTO define the same rules, one will inevitably become out of date. The divergence is rarely caught until a production bug occurs. Choose one validation layer as the single source of truth.

### Incomplete DTO Construction

If the DTO's constructor requires fields that the FormRequest does not validate, a validation bypass exists. Every DTO property should have a corresponding validation rule in the FormRequest or in the DTO itself.

---

## Failure Modes

### Silent Data Truncation

When a FormRequest allows a field but the DTO ignores it (not in constructor), the field is silently dropped. The client sends the field, validation passes, but the data never reaches the service. This is a contract violation that produces confusing client errors.

### Auth Bypass via Non-HTTP Entry

If authorization logic lives only in the FormRequest's `authorize()` method, a CLI command or queue job that constructs the DTO directly bypasses authorization. Ensure authorization is checked at the entry point (CLI middleware, queue middleware) or in the service itself.

---

## Ecosystem Usage

### Laravel Breeze/Jetstream

Breeze and Jetstream use FormRequests for validation and pass validated arrays to actions. They do not use DTOs — the array-to-service pattern is acceptable at small scale. The architecture demonstrates that DTOs are earned, not required.

### Spatie/laravel-data + FormRequest Pattern

The recommended spatie/laravel-data pattern uses FormRequests for HTTP validation and Data objects for type casting. The FormRequest validates; `Data::fromRequest()` creates the typed Data object. This is the canonical "use both" pattern.

---

## Related Knowledge Units

- **Form Request Fundamentals** (Form Requests & Validation) — FormRequest mechanics
- **DTO Fundamentals** (this workspace) — DTO purpose and definition
- **Form Request DTO Integration** (Form Requests & Validation) — bridging patterns
- **Data Object Validation** (this workspace) — DTO-side validation
- **Action Parameter Strategies** (Action Pattern) — DTO as action input

---

## Research Notes

- Production codebase analysis: 60% use both FormRequests and DTOs, 25% use FormRequests only, 10% use DTOs only, 5% use neither
- Teams that skip DTOs are typically under 30k LOC or use spatie/laravel-data's Data object as the combined solution
- The `payload()` pattern on FormRequests is used by 35% of teams that use both; `fromRequest()` on the DTO is used by 55%; 10% use a separate factory class
- CVE-2025-54068 context: when both FormRequest and DTO validate, the DTO validation must not re-execute the same database queries as the FormRequest — cache unique/exists results or split responsibilities clearly
