## Rule 1: Apply the 2-3 Layer Threshold Before Introducing a DTO

---

## Category

Architecture

---

## Rule

Introduce a DTO only when data crosses at least 2-3 application layers (controller to service to action to repository) or when the same data shape is used by multiple entry points (HTTP + CLI + queue). For simple flows, use validated arrays instead.

---

## Reason

Every DTO adds a class file, factory methods, serialization logic, tests, and a dependency in every consumer. This ceremony is justified only when multiple layers or entry points benefit from a shared typed contract. For simple data flows (controller to one service to model), the validated array provides sufficient type safety with zero overhead.

---

## Bad Example

```php
readonly class UpdateProfileDto
{
    public function __construct(public string $name, public string $email) {}
}

class UpdateProfileController
{
    public function __invoke(UpdateProfileRequest $request, UpdateProfileService $service)
    {
        $service->execute(new UpdateProfileDto($request->validated('name'), $request->validated('email')));
    }
}
// DTO adds 10+ lines of ceremony for a 2-field pass-through used in one place.
```

---

## Good Example

```php
class UpdateProfileController
{
    public function __invoke(UpdateProfileRequest $request, UpdateProfileService $service)
    {
        $service->execute($request->validated());
    }
}
// No DTO. Simple flow uses validated array. Add DTO when a second entry point appears.
```

---

## Exceptions

When the service layer is a package or library consumed by other projects, a DTO is beneficial even for single-layer use because it provides a typed API contract.

---

## Consequences Of Violation

Maintenance: unnecessary DTOs increase file count, test surface, and cognitive load. Team efficiency: ceremony budget is consumed on low-value abstractions instead of solving business problems.

---

## Rule 2: Skip DTOs That Mirror FormRequest Keys Exactly with No Transformation

---

## Category

Design

---

## Rule

Do not create a DTO whose properties are identical to a FormRequest's validated keys with no type transformation, field renaming, flattening, or domain mapping. Either transform the data meaningfully or skip the DTO entirely.

---

## Reason

A DTO that mirrors HTTP form keys provides zero decoupling benefit. Renaming a field in the FormRequest requires renaming it in the DTO, and all consumers must change. The DTO adds ceremony without any of the architectural benefits that justify its existence.

---

## Bad Example

```php
// FormRequest validates: first_name, last_name, email_address
// DTO mirrors exactly:
readonly class UserDto
{
    public function __construct(
        public string $first_name,    // same as HTTP field
        public string $last_name,     // same as HTTP field
        public string $email_address, // same as HTTP field
    ) {}
}
// No transformation. HTTP rename forces DTO rename. DTO adds ceremony without value.
```

---

## Good Example

```php
// Either transform meaningfully:
readonly class UserDto
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $email,
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
// Or skip the DTO entirely for simple flows. Transformation justifies the DTO's existence.
```

---

## Exceptions

When the HTTP form structure already matches the domain concept and types exactly, a DTO is still justified if the data crosses 3+ layers or multiple entry points.

---

## Consequences Of Violation

Maintenance: HTTP field renames cascade to DTOs and services, providing no decoupling benefit. Architecture: DTO is a ceremonial abstraction with no architectural value.

---

## Rule 3: Make DTOs Opt-In, Not Default — Avoid Team Dogma

---

## Category

Code Organization

---

## Rule

Do not enforce a "every controller action must have a DTO" policy. DTOs should be opt-in based on the 2-3 layer threshold. Apply DTOs only when the data flow complexity justifies the ceremony.

---

## Reason

Dogmatic DTO requirements convert simple operations into ceremony-heavy code. A policy that requires DTOs for every endpoint creates unnecessary abstractions for simple CRUD operations where a validated array is sufficient. The ceremony budget is finite — spending it on low-value DTOs leaves less tolerance for high-value abstractions.

---

## Bad Example

```php
// Team policy: every controller must use a DTO
// Simple 2-field contact form with one service method:

readonly class ContactDto
{
    public function __construct(public string $name, public string $message) {}
}

class ContactService
{
    public function send(ContactDto $dto): void { /* ... */ }
}

class ContactController
{
    public function store(ContactRequest $request, ContactService $service)
    {
        $service->send(new ContactDto($request->validated('name'), $request->validated('message')));
    }
}
// 3 files for a 2-field form. No additional entry points expected. Ceremony exceeds benefit.
```

---

## Good Example

```php
class ContactController
{
    public function store(ContactRequest $request, ContactService $service)
    {
        $service->send($request->validated());
    }
}
// No DTO. Simple contact form. Add DTO only if queue or CLI entry point is added.
```

---

## Exceptions

When the team has a strong type-safety culture and the "always DTO" policy is enforced by static analysis (no arrays allowed in service parameters), the rule is consistent even if ceremonial.

---

## Consequences Of Violation

Maintenance: unnecessary DTOs increase file count and test surface. Team efficiency: developers spend time maintaining DTOs that provide no benefit. Developer satisfaction: ceremony-heavy code reduces morale.

---

## Rule 4: Start Without DTOs and Introduce Them When a Second Entry Point Appears

---

## Category

Architecture

---

## Rule

Begin a new feature without DTOs, using validated arrays or direct model operations. Introduce a DTO when a second entry point is added (CLI command, queue job, API endpoint) or when a field-related bug occurs that a typed contract would have prevented.

---

## Reason

Letting DTOs emerge from service needs rather than entity structure produces DTOs that exactly match the data flow requirements. Premature DTOs are often unused or need restructuring when actual requirements are discovered. Starting without DTOs keeps the codebase flexible during the rapid iteration phase.

---

## Bad Example

```php
// Phase 1: DTO created before any service code exists
readonly class UserDto { /* ... */ }

// Phase 2: Service layer built — DTO has wrong fields, needs restructuring
// Phase 3: Second entry point appears — DTO was never used from any other entry point
// Premature DTO was created before requirements were understood.
```

---

## Good Example

```php
// Phase 1: Start simple — no DTO
$user = User::create($request->validated());

// Phase 2: API consumer needs same data — introduce DTO for shared contract
// Phase 3: Queue job uses same data — DTO validated across all entry points
// DTO was introduced when the need was proven, not before.
```

---

## Exceptions

For public packages and libraries, DTOs should be designed upfront because the API contract is the product. For internal applications, let DTOs emerge.

---

## Consequences Of Violation

Maintenance: premature DTOs need restructuring when actual requirements are discovered. Team efficiency: effort is spent maintaining DTOs that may never be used by more than one entry point.

---

## Rule 5: Use API Resources, Not DTOs, for HTTP Response Shaping

---

## Category

Architecture

---

## Rule

Use Laravel API Resources (JsonResource) for HTTP response shaping. Do not use DTOs as the primary mechanism for formatting HTTP responses. Output DTOs are for internal data flow, not for API response formatting.

---

## Reason

API Resources are designed specifically for HTTP response shaping — they provide built-in conditional attributes, pagination support, relationship loading, and metadata inclusion. DTOs lack these features and require manual implementation of response-shaping logic. Using the wrong tool for output creates unnecessary complexity.

---

## Bad Example

```php
// DTO used for HTTP response — manually implementing conditional attributes
readonly class UserListDto
{
    public function toArray(): array
    {
        $result = ['id' => $this->id, 'name' => $this->name];
        if ($this->includeEmail) { // Manual conditional — brittle
            $result['email'] = $this->email;
        }
        if ($this->includeRoles) { // Manual conditional — brittle
            $result['roles'] = $this->roles;
        }
        return $result;
    }
}
```

---

## Good Example

```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->when($request->user()->can('viewEmail', $this->resource), $this->email),
            'roles' => RoleResource::collection($this->whenLoaded('roles')),
        ];
    }
}
// API Resource has built-in conditional loading and authorization checks.
```

---

## Exceptions

For non-HTTP output (CLI output, file exports, email content), DTOs with `toArray()` are appropriate because API Resources are HTTP-specific.

---

## Consequences Of Violation

Maintenance: manually implementing conditional attributes, pagination, and metadata inclusion in DTOs duplicates what API Resources provide. Architecture: DTOs are used for a purpose they were not designed for, creating unnecessary complexity.

---

## Rule 6: Document the Rationale When Intentionally Skipping a DTO for a Complex Operation

---

## Category

Maintainability

---

## Rule

When a DTO seems warranted by the complexity of the operation but is intentionally skipped, add a code comment or inline documentation explaining why. This prevents future developers from adding a DTO without understanding the tradeoff.

---

## Reason

Future developers may see a complex operation without a DTO and assume it was an oversight. Without documentation, they may add a DTO that was deliberately avoided for specific reasons (performance requirements, rapid prototyping, planned refactor). Documentation of the decision prevents wasted effort and clarifies the architecture.

---

## Bad Example

```php
class BatchImportController
{
    public function import(ImportRequest $request, BatchImportService $service)
    {
        $service->import($request->validated());
        // No DTO. No explanation. Future developer adds a DTO, not knowing:
        // 1. Performance: 50k records processed, DTO construction adds 50ms overhead
        // 2. Planned refactor: external API contract is changing next sprint
    }
}
```

---

## Good Example

```php
class BatchImportController
{
    public function import(ImportRequest $request, BatchImportService $service)
    {
        // DTO intentionally skipped: batch import processes 50k records per call.
        // DTO construction overhead of ~0.005ms each would add 250ms to response time.
        // Validated array is sufficient since this is a single-entry-point operation.
        // Revisit if a CLI or queue entry point is added.
        $service->import($request->validated());
    }
}
```

---

## Exceptions

For simple operations where the lack of a DTO is self-explanatory, no documentation is needed. Document only when the complexity would naturally suggest a DTO.

---

## Consequences Of Violation

Maintenance: future developers add DTOs that were intentionally avoided, wasting effort and potentially degrading performance. Architecture: undocumented decisions lead to inconsistent architectural evolution.

---

## Rule 7: Avoid DTO Churn During Rapid Prototyping and MVP Phases

---

## Category

Maintainability

---

## Rule

During rapid prototyping, MVP, or early-stage development where data shapes change frequently, prefer validated arrays over DTOs. Introduce DTOs when the data shape stabilizes and the 2-3 layer threshold is met.

---

## Reason

DTO churn occurs when data shapes change rapidly — each field addition, rename, or type change cascades through the DTO class, factory methods, serialization logic, and tests. Arrays absorb these changes with a single edit. Premature DTOs during rapid iteration slow down development without providing sufficient protection against bugs that arrays would cause.

---

## Bad Example

```php
// Week 1: CreateUserDto with name, email
// Week 2: Add phone field — update DTO, factory, tests
// Week 3: Rename email to emailAddress — update DTO, factory, tests, all consumers
// Week 4: Add username field — update DTO, factory, tests
// 4 weeks of churn. DTO changes in every sprint because requirements are unstable.
```

---

## Good Example

```php
// Week 1: Pass validated array directly to service
// Week 2: Add phone field — one line in FormRequest, array carries it automatically
// Week 3: Rename email to emailAddress — one line in FormRequest
// Week 4: Add username field — one line in FormRequest
// Zero DTO changes. Data shape stabilizes by month 3. DTO introduced at month 3.
```

---

## Exceptions

When the data shape is defined by an external specification (OpenAPI contract, third-party API) that is stable, DTOs can be designed upfront even during prototyping.

---

## Consequences Of Violation

Team efficiency: DTO churn during rapid iteration consumes development time on ceremonial changes. Maintenance: every field change requires updating DTO, factories, and tests, slowing iteration speed.
