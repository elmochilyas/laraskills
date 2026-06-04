# Anti-Patterns — Data Transfer Object Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Data Transfer Object Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Anemic DTO Array Alternative | High | High | Code review: data passed as arrays across layer boundaries |
| God DTO | Medium | Medium | Code review: single DTO used for create, update, and response |
| DTO as Entity | Medium | Medium | Code review: DTO mirrors Eloquent model including relationships |
| Mutable DTO | Medium | High | Code review: DTO has setters or public non-readonly properties |
| DTO with Business Logic | High | Medium | Code review: DTO contains validation rules or calculation methods |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| HTTP-Coupled DTO | DTO constructor accepts `Request` or depends on HTTP classes | DTO cannot be constructed outside HTTP context, loses transport-agnostic property |
| Inconsistent DTO Patterns | Some DTOs use `fromArray`, others use constructor only, others use Spatie Data | Developers can't predict DTO construction patterns across the codebase |
| DTO Construction from Raw Input | DTO receives `$request->all()` or unvalidated data instead of validated data | Bypasses FormRequest validation, type confusion attacks possible |

---

## Anti-Pattern Details

### AP-DTO-01: Anemic DTO Array Alternative

**Description**: Data is passed across layer boundaries as associative arrays (`$request->validated()` or `$data`) instead of typed DTOs. Method signatures like `execute(array $data): User` provide no documentation of what data is expected, and there is no compiler enforcement when fields change.

**Root Cause**: The developer sees DTOs as unnecessary boilerplate and believes that arrays are "simpler." This reasoning underestimates the cost of lost type safety and documentation.

**Impact**:
- Method signatures don't document data requirements: `execute(array $data)` vs `execute(CreateUserDto $dto)`
- Refactoring is dangerous: adding/removing a field requires manually finding every array construction site
- IDE navigation is impaired: no "go to definition" for array keys
- Nested data validation is manual and inconsistent

**Detection**:
- Code review: action/service methods accept `array $data` or `array $input`
- Code review: controller passes `$request->validated()` directly to lower layers
- Refactoring: changing a field name requires grep-and-replace across the codebase

**Solution**:
- Create a typed DTO for every operation that crosses layer boundaries
- Use `readonly` class with typed properties as the default pattern
- The 2-3 layer crossing rule: if data crosses 2+ layers, use a DTO
- Document the "no arrays across boundaries" convention in the team's architecture guide

**Example**:
```php
// BEFORE: Array across layers
class CreateUserAction
{
    public function execute(array $data): User  // what keys are expected?
    {
        return User::create($data);
    }
}

// AFTER: Typed DTO
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return User::create($dto->toArray());
    }
}
```

---

### AP-DTO-02: God DTO

**Description**: A single DTO class that serves multiple purposes — input for create, input for update, API response, and internal data transport. All fields are nullable or optional to accommodate every use case. The DTO has no clear contract — callers don't know which fields are required for which operation.

**Root Cause**: The developer creates a "UserDto" that mirrors the User model rather than creating operation-specific DTOs. The reasoning is "reuse" but the outcome is ambiguity.

**Impact**:
- No clear contract per operation: `UpdateUserService::execute(UserDto $dto)` doesn't show which fields are updatable
- Backward compatibility issues: adding a field to the response accidentally makes it required input
- Validation logic is duplicated at every call site (each operation validates its own required fields)
- Developers read the DTO constructor to guess which fields are needed, leading to bugs

**Detection**:
- Code review: DTO named `UserDto` used in create, update, and response
- Code review: most DTO properties are nullable or have defaults
- Code review: `fromRequest()` handles create and update with conditionals

**Solution**:
- Create operation-specific DTOs: `CreateUserDto`, `UpdateUserDto`, `UserResponseDto`
- Each DTO contains only the fields relevant to its operation
- Share common fields through composition (base DTO class) or PHP 8.4 property hooks

**Example**:
```php
// BEFORE: God DTO
class UserDto
{
    public function __construct(
        public ?int $id = null,              // only for update
        public ?string $name = null,          // required for create, optional for update
        public ?string $email = null,         // required for create, optional for update
        public ?string $password = null,      // required for create
        public ?Carbon $createdAt = null,     // only for response
        public ?Carbon $updatedAt = null,     // only for response
    ) {}
}

// AFTER: Operation-specific DTOs
class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
class UpdateUserDto
{
    public function __construct(
        public int $id,
        public ?string $name = null,
        public ?string $email = null,
    ) {}
}
class UserResponseDto
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public Carbon $createdAt,
    ) {}
}
```

---

### AP-DTO-03: DTO as Entity

**Description**: A DTO that mirrors the Eloquent model structure exactly, including relationships, computed properties, and even scopes. The DTO becomes a near-copy of the model class, blurring the line between data transport (DTO) and data persistence (Model). Changes to the model are automatically reflected in the DTO (or the DTO becomes stale).

**Root Cause**: The developer creates a DTO by copying the model's fillable attributes without considering what the actual operation needs. The DTO doesn't define a contract — it passively mirrors the persistence layer.

**Impact**:
- DTO carries data the operation doesn't need (violating least-data principle)
- Model changes (new columns, renamed columns) break DTO construction
- DTO loses its value as a "contract" — it's a derivative of the model, not an independent specification
- Relationship data (loaded eagerly from the model) makes the DTO expensive to construct

**Detection**:
- Code review: DTO fields exactly match model columns including timestamps
- Code review: DTO constructor takes a `Model` parameter as primary construction path
- Code review: DTO includes nested relationships that mirror Eloquent relationships

**Solution**:
- Define DTOs based on what the consuming operation needs, not what the model has
- Use different DTOs for requests and responses (they serve different contracts)
- Map from models to DTOs explicitly, not automatically
- Keep DTOs flat where possible — use IDs instead of nested objects for relationships

**Example**:
```php
// BEFORE: DTO as entity mirror
class UserDto
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public ?Carbon $emailVerifiedAt,  // mirrored from model
        public string $password,          // should never be in response
        public ?string $rememberToken,    // security leak
        public Carbon $createdAt,         // consumer doesn't need this
        public Carbon $updatedAt,         // consumer doesn't need this
        public Collection $posts,         // eager-loaded relationship
    ) {}
}

// AFTER: Operation-specific DTO with only needed fields
class UserProfileResponseDto
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public Carbon $joinedAt,
    ) {}
}
```
