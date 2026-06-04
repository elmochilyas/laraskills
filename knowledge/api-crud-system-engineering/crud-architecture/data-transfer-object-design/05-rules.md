# Data Transfer Object Design — Rules

## Rule 1: Enforce Immutability with Readonly Properties
---
## Category
Design
---
## Rule
Always declare DTO properties as `public readonly` (PHP 8.1+) or use `readonly class` (PHP 8.2+); never allow property mutation after construction.
---
## Reason
Immutability guarantees that a DTO's data is consistent throughout its lifetime. Mutable DTOs can be modified unexpectedly by any consumer, causing bugs that are extremely hard to trace.
---
## Bad Example
```php
class CreateUserDto
{
    public string $name; // ❌ Mutable — can be changed by any consumer
    public string $email;
}
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
}
```
---
## Exceptions
No common exceptions. Immutability is a hard requirement for DTOs.
---
## Consequences Of Violation
Mystery mutations, data inconsistency across layers, debugging sessions tracing who changed a DTO property.
</rule>

## Rule 2: DTOs Must Not Contain Business Logic
---
## Category
Architecture
---
## Rule
Never include validation rules, business calculations, persistence logic, or authorization checks inside a DTO.
---
## Reason
DTOs are pure data carriers. Adding logic violates single responsibility and creates hidden dependencies — a DTO should be constructable and serializable in any context without side effects.
---
## Bad Example
```php
class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public function validate(): bool // ❌ Business logic in DTO
    {
        return filter_var($this->email, FILTER_VALIDATE_EMAIL) !== false;
    }
}
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
}
// Validation belongs in FormRequest or service layer
```
---
## Exceptions
Type coercion in constructors (string to Carbon, string to int) is acceptable as infrastructure, not business logic.
---
## Consequences Of Violation
DTOs that cannot be constructed without side effects, mixed concerns, testing requires DTO construction to test unrelated logic.
</rule>

## Rule 3: Always Construct DTOs from Validated Data
---
## Category
Security
---
## Rule
Never pass raw `$request->all()` or unvalidated input to a DTO factory method or constructor.
---
## Reason
Unvalidated data may contain unexpected fields, type mismatches, or malicious payloads. DTOs assume input is valid and enforce type safety, not semantic correctness.
---
## Bad Example
```php
$dto = new CreateUserDto(...$request->all()); // ❌ Unvalidated — may contain extra fields
```
---
## Good Example
```php
$dto = CreateUserDto::fromRequest($request); // Uses $request->validated() internally
```
---
## Exceptions
No common exceptions. DTOs must always receive validated data.
---
## Consequences Of Violation
Mass-assignment vulnerabilities, type errors at runtime, unvalidated data reaching business logic.
</rule>

## Rule 4: Prefer Per-Operation DTOs Over Per-Entity DTOs
---
## Category
Design
---
## Rule
Create separate DTO classes per operation (`CreateUserDto`, `UpdateUserDto`) rather than a single `UserDto` for all operations.
---
## Reason
Create and update operations rarely need identical fields. A single `UserDto` with all fields optional creates confusion about which fields are valid for which operation and silently accepts invalid field combinations.
---
## Bad Example
```php
class UserDto // ❌ God DTO — serves create, update, and response
{
    public function __construct(
        public ?string $name = null,
        public ?string $email = null,
        public ?string $password = null,
        public ?string $bio = null,
        public ?string $role = null,
    ) {}
}
```
---
## Good Example
```php
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
readonly class UpdateUserDto
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $bio = null,
    ) {}
}
```
---
## Exceptions
Per-entity DTOs (`UserDto`) are acceptable for read/response operations where the same data shape is returned from multiple endpoints.
---
## Consequences Of Violation
Ambiguous DTO contracts, runtime errors from missing required fields, silent acceptance of invalid data.
</rule>

## Rule 5: DTOs Must Not Import HTTP Classes
---
## Category
Layer Isolation
---
## Rule
Never import `Illuminate\Http\Request`, `Response`, or any HTTP-related class inside a DTO.
---
## Reason
HTTP imports couple the DTO to the web layer, making it unusable in CLI, queue, or test contexts. DTOs exist to decouple layers — they must not depend on any layer.
---
## Bad Example
```php
use Illuminate\Http\Request;

class CreateUserDto
{
    public static function fromRequest(Request $request): self // ❌ HTTP import in DTO
    {
        return new self(name: $request->input('name'));
    }
}
```
---
## Good Example
```php
class CreateUserDto
{
    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(
            name: $request->validated('name'), // Uses the FormRequest, not generic Request
        );
    }
}
```
---
## Exceptions
No common exceptions. DTOs must be transport-agnostic.
---
## Consequences Of Violation
DTOs cannot be constructed without HTTP stack, unreusable from CLI/queue, layer isolation violation.
</rule>

## Rule 6: Use Typed Constructor Properties with Full Type Hints
---
## Category
Reliability
---
## Rule
Always declare explicit PHP type hints for every DTO constructor parameter — `string`, `int`, `?Carbon`, `array<int, LineItemDto>`.
---
## Reason
Type hints are the compiler-checked contract of the DTO. Without them, callers can pass any type, and errors surface deep in service code instead of at the DTO construction boundary.
---
## Bad Example
```php
class CreateUserDto
{
    public function __construct(
        public $name,     // ❌ No type hint
        public $email,    // ❌ No type hint
        public $password, // ❌ No type hint
    ) {}
}
```
---
## Good Example
```php
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
```
---
## Exceptions
No common exceptions. Every parameter must have a type hint.
---
## Consequences Of Violation
Runtime type errors, undocumented DTO contracts, callers must guess expected types, no IDE autocompletion.
</rule>

## Rule 7: Provide Factory Methods for Each Primary Data Source
---
## Category
Maintainability
---
## Rule
Always include at least one static named constructor (`fromArray()`, `fromRequest()`) on every DTO to encapsulate source-to-DTO mapping.
---
## Reason
Without factory methods, mapping logic bleeds into controllers and services — duplicating key mappings and violating DRY. Factory methods centralize construction in one place.
---
## Bad Example
```php
// Mapping logic duplicated in every controller
$dto = new CreateUserDto(
    name: $request->validated('name'),
    email: $request->validated('email'),
);
```
---
## Good Example
```php
class CreateUserDto
{
    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            email: $request->validated('email'),
        );
    }
}
```
---
## Exceptions
Direct constructor calls are acceptable when DTOs are constructed from other DTOs or domain objects that already match the parameter structure exactly.
---
## Consequences Of Violation
Duplicated mapping logic, inconsistent field mapping, brittle refactoring when DTO fields change.
</rule>
