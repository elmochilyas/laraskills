## Rule 1: Never Pass FormRequest Instances to Services

---

## Category

Architecture

---

## Rule

Never type-hint `Illuminate\Http\FormRequest` (or any request class) in a service method parameter. Services must receive DTOs or validated arrays, never FormRequest objects.

---

## Reason

A service that receives a FormRequest is permanently coupled to the HTTP layer. Testing requires simulating an HTTP request, booting the kernel, and constructing request objects. The service cannot be called from CLI commands or queue jobs without creating fake request objects. Decoupling the service from HTTP enables testing in pure PHP and reuse across all entry points.

---

## Bad Example

```php
class RegisterUserService
{
    public function execute(RegisterUserRequest $request): User // HTTP dependency in service
    {
        $user = User::create($request->validated());
        // Service is coupled to HTTP. Cannot call from CLI or queue.
    }
}
```

---

## Good Example

```php
class RegisterUserService
{
    public function execute(RegisterUserDto $dto): User // DTO — no HTTP dependency
    {
        $user = User::create($dto->toArray());
        // Service is pure. Can be called from HTTP, CLI, or queue.
    }
}
```

---

## Exceptions

No common exceptions. A service that receives a FormRequest is architecturally wrong. Always convert the FormRequest to a DTO or validated array before passing to the service.

---

## Consequences Of Violation

Architecture: the service layer becomes permanently coupled to HTTP. Testing: every service test must bootstrap the HTTP kernel. Reusability: CLI and queue entry points cannot use the service without simulating HTTP.

---

## Rule 2: Use the Sequential Flow — FormRequest → DTO → Service

---

## Category

Architecture

---

## Rule

Always follow the sequential data flow: HTTP Request → FormRequest (authorize + validate) → DTO (type + carry) → Service (business logic). The FormRequest produces a DTO; the service consumes a DTO. Neither class replaces the other.

---

## Reason

The sequential flow assigns each class a single responsibility. The FormRequest owns HTTP concerns (authorization, input format, input preparation). The DTO owns cross-layer data transport (typed properties, domain-level validation, type transformation). The service owns business logic. Breaking this chain conflates responsibilities.

---

## Bad Example

```php
// Skip FormRequest: DTO does everything
public function store(Request $request, StoreUserService $service)
{
    $dto = CreateUserDto::fromRequest($request); // DTO handles both HTTP and transport
}
// The DTO must now handle authorization and input validation — responsibilities it should not have.
```

---

## Good Example

```php
public function store(CreateUserRequest $request, StoreUserService $service)
{
    $dto = $request->payload(); // FormRequest → DTO bridge
    $service->execute($dto);    // Service receives typed DTO
}
// Each class has one job. The flow is explicit and testable at each stage.
```

---

## Exceptions

For CLI commands and queue jobs, FormRequests do not apply. The flow is: CLI/Queue Input → DTO (validates itself) → Service.

---

## Consequences Of Violation

Architecture: responsibilities are conflated — DTOs handle HTTP concerns or services handle validation. Maintenance: changing the HTTP layer requires changing the DTO, or vice versa.

---

## Rule 3: DTOs Must Transform Data, Not Mirror HTTP Structure

---

## Category

Design

---

## Rule

A DTO must represent the domain concept, not the HTTP form structure. Transform field names, flatten nesting, normalize types, and compute derived values during the DTO construction. If a DTO's properties are identical to the FormRequest's validated keys, the DTO adds ceremony without value.

---

## Reason

The DTO's primary value is decoupling the service layer from the HTTP layer. If the DTO mirrors the HTTP structure exactly, any HTTP field rename cascades to the service layer — exactly the coupling the DTO was supposed to prevent. Transformation at the DTO boundary allows the HTTP layer and service layer to evolve independently.

---

## Bad Example

```php
// FormRequest validates: first_name, last_name, email_address
// DTO mirrors exactly:
readonly class UserDto
{
    public function __construct(
        public string $first_name,    // mirrors HTTP field
        public string $last_name,     // mirrors HTTP field
        public string $email_address, // mirrors HTTP field
    ) {}
}
// No transformation. HTTP field rename requires DTO rename. No value added.
```

---

## Good Example

```php
// DTO transforms HTTP structure to domain concept:
readonly class UserDto
{
    public function __construct(
        public string $firstName,   // domain name
        public string $lastName,    // domain name
        public string $email,       // domain name
    ) {}

    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(
            firstName: $request->validated('first_name'),
            lastName: $request->validated('last_name'),
            email: $request->validated('email_address'),
        );
    }
}
// HTTP can rename fields without affecting the service layer. DTO adds value.
```

---

## Exceptions

When the HTTP form structure already matches the domain concept exactly, minimal transformation is acceptable. But the DTO should still normalize types (e.g., string dates to Carbon).

---

## Consequences Of Violation

Maintenance: HTTP field renames cascade to DTOs and services. Architecture: the DTO provides no decoupling benefit — the service layer remains coupled to HTTP key naming.

---

## Rule 4: Define Validation Rules in Exactly One Layer

---

## Category

Maintainability

---

## Rule

For each application, pick exactly one layer (FormRequest or DTO) as the authoritative source for validation rules. Do not define the same validation rule in both layers. Document which layer is authoritative.

---

## Reason

Duplicate validation rules always diverge. A developer adds a new validation requirement to the FormRequest but forgets the DTO, or vice versa. Six months later, one layer accepts data that the other rejects. Single-source-of-truth prevents divergence and eliminates the confusion of "which validation is actually enforced."

---

## Bad Example

```php
// FormRequest
'email' => ['required', 'email', 'max:255']

// DTO
'email' => ['required', 'email', 'max:255']
// Six months later: FormRequest adds 'unique:users', DTO stays unchanged.
// CLI entry point receives un-unique emails because DTO doesn't have the rule.
```

---

## Good Example

```php
// Team decision: FormRequest is authoritative for HTTP entry points
// DTO has zero rules — it trusts the FormRequest
readonly class UserDto
{
    public function __construct(public string $name, public string $email) {}
}

// CLI/queue entry points have their own validation before DTO construction
$validator = validator($input, ['name' => ['required'], 'email' => ['required', 'email']]);
if ($validator->fails()) { /* handle */ }
$dto = UserDto::fromArray($validator->validated());
// Single source of truth per entry point type. No duplication. No divergence.
```

---

## Exceptions

When DTOs validate domain-level rules and FormRequests validate HTTP-specific rules, there is no overlap. This is the correct two-layer pattern. The prohibition is against defining the same rule in both layers.

---

## Consequences Of Violation

Maintenance: updating one layer without the other creates inconsistent validation. Reliability: different entry points accept different data quality levels. Testing: confusion about which validation layer to test.

---

## Rule 5: Use the Bridging Pattern — `payload()` on FormRequest or `fromRequest()` on DTO

---

## Category

Code Organization

---

## Rule

Always define an explicit bridge between FormRequest and DTO. Either add a `payload()` method to the FormRequest that returns the DTO, or add a `fromRequest()` static method on the DTO. Do not inline DTO construction from request data in the controller.

---

## Reason

An explicit bridge documents the mapping between HTTP input and the DTO. Inlining the construction in the controller duplicates mapping logic across controllers and makes the mapping invisible to code reviews. The bridge is the single place where HTTP-to-DTO mapping is defined.

---

## Bad Example

```php
public function store(CreateUserRequest $request, StoreUserService $service)
{
    // Inline DTO construction — mapping logic is hidden in the controller
    $dto = new CreateUserDto(
        name: $request->validated('full_name'),
        email: $request->validated('email_address'),
    );
    $service->execute($dto);
}
// Every controller duplicates or varies the mapping. No single source of truth.
```

---

## Good Example

```php
// Bridge on FormRequest
class CreateUserRequest extends FormRequest
{
    public function payload(): CreateUserDto
    {
        return new CreateUserDto(
            name: $this->validated('full_name'),
            email: $this->validated('email_address'),
        );
    }
}

// Controller uses the bridge
public function store(CreateUserRequest $request, StoreUserService $service)
{
    $service->execute($request->payload());
}
// Mapping is explicit, centralized, and testable.
```

---

## Exceptions

When using spatie/laravel-data, `Data::fromRequest($request)` serves as the bridge automatically. Use it instead of a manual `payload()` method.

---

## Consequences Of Violation

Maintenance: mapping logic is duplicated across controllers. Code review: reviewers must check every controller to verify correct mapping. Testing: each controller's mapping must be tested independently.

---

## Rule 6: Use DTO Validation as the Sole Validation Layer for CLI and Queue Entry Points

---

## Category

Architecture

---

## Rule

For CLI commands and queue jobs that have no FormRequest, use DTO-level validation as the sole validation layer. The DTO must validate its own input for non-HTTP entry points.

---

## Reason

CLI commands and queue jobs bypass FormRequests entirely. Without DTO-level validation, input from these entry points enters the service layer unvalidated. The DTO must enforce its own data contract when there is no preceding FormRequest layer.

---

## Bad Example

```php
class ImportUsersCommand extends Command
{
    public function handle(): void
    {
        $dto = CreateUserDto::fromArray([
            'name' => $this->argument('name'),
            'email' => $this->argument('email'),
        ]);
        // If CreateUserDto has no validation, invalid CLI input passes through unchecked.
    }
}
```

---

## Good Example

```php
class ImportUsersCommand extends Command
{
    public function handle(): void
    {
        $dto = CreateUserDto::fromArray([
            'name' => $this->argument('name'),
            'email' => $this->argument('email'),
        ]);
        // DTO validates itself — rejects invalid input regardless of entry point.
    }
}

// DTO validates at construction
readonly class CreateUserDto
{
    public function __construct(public string $name, public string $email) {}

    public static function fromArray(array $data): self
    {
        $validator = validator($data, ['name' => 'required|string', 'email' => 'required|email']);
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
        return new self(name: $data['name'], email: $data['email']);
    }
}
```

---

## Exceptions

No common exceptions. Non-HTTP entry points must always have validation. The DTO is the natural place for it.

---

## Consequences Of Violation

Security: invalid data enters the service layer from CLI/queue entry points. Reliability: input format errors from CLI commands cause cryptic downstream failures instead of clear validation errors.
