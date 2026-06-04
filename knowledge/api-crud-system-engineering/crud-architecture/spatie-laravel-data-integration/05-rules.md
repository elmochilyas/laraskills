# Spatie Laravel Data Integration — Rules

## Rule 1: Choose One Approach — Package or Manual — and Apply Consistently
---
## Category
Maintainability
---
## Rule
Never mix Spatie Data classes and manual DTO patterns within the same codebase; choose one approach and apply it to all DTOs.
---
## Reason
Mixing patterns creates confusion about which DTOs use which construction method, prevents TypeScript generation for all types, and forces developers to remember two different APIs for the same concept.
---
## Bad Example
```php
// Some DTOs use Spatie
class CreateUserData extends Data { /* ... */ }

// Others use manual pattern
class UpdateUserDto
{
    public static function fromArray(array $data): self { /* ... */ }
}
// No consistency — developers don't know which pattern to follow
```
---
## Good Example
```php
// All DTOs use Spatie Data consistently
class CreateUserData extends Data { /* ... */ }
class UpdateUserData extends Data { /* ... */ }
class UserResponseData extends Data { /* ... */ }

// Or all DTOs use manual pattern consistently
class CreateUserDto { /* ... */ }
class UpdateUserDto { /* ... */ }
```
---
## Exceptions
A gradual migration from manual to Spatie is acceptable during a defined transition period, but no new DTOs should use the deprecated pattern.
---
## Consequences Of Violation
Confusing API surface, TypeScript generation misses mixed-pattern DTOs, onboarding confusion about which pattern to use.
</rule>

## Rule 2: Pin the Exact Package Version
---
## Category
Reliability
---
## Rule
Always pin the exact major.minor.patch version of `spatie/laravel-data` in `composer.json` and review upgrade guides before updating.
---
## Reason
The package has breaking changes between major versions. Unpinned updates can silently break DTO construction, casting, and validation behavior in production.
---
## Bad Example
```json
{
    "require": {
        "spatie/laravel-data": "^4.0" // ❌ Loose — may auto-update to breaking version
    }
}
```
---
## Good Example
```json
{
    "require": {
        "spatie/laravel-data": "4.8.0" // ✅ Pinned — intentional upgrades only
    }
}
```
---
## Exceptions
No common exceptions. Package version must always be pinned.
---
## Consequences Of Violation
Unexpected breaking changes from automated dependency updates, production outages from changed behavior.
</rule>

## Rule 3: Decide on Validation Strategy — FormRequest + Data or Data-Only
---
## Category
Architecture
---
## Rule
Never use both validation strategies inconsistently; decide at project level whether FormRequests handle HTTP validation and Data handles structural validation, or whether Data handles all validation.
---
## Reason
Inconsistent validation splits create confusion — some endpoints validate in FormRequests, others in Data classes, some in both. Developers cannot predict where validation rules live.
---
## Bad Example
```php
// Endpoint 1: FormRequest validates everything, Data has no rules
class CreateUserRequest extends FormRequest
{
    public function rules(): array { return ['email' => 'required|email']; }
}
class CreateUserData extends Data { /* no rules */ }

// Endpoint 2: Data validates, no FormRequest
class UpdateUserData extends Data
{
    public static function rules(): array { return ['email' => 'required|email']; }
}
// Inconsistent — validation rules scattered across two systems
```
---
## Good Example
```php
// Strategy A: FormRequest handles HTTP validation, Data handles types
class CreateUserRequest extends FormRequest
{
    public function rules(): array { return ['email' => 'required|email']; }
}
class CreateUserData extends Data
{
    public static function rules(): array
    {
        return ['email' => ['required', 'email']]; // Structural + type validation
    }
}

// OR Strategy B: Data handles all validation, no FormRequest rules needed
```
---
## Exceptions
No common exceptions. The strategy must be project-wide and documented.
---
## Consequences Of Violation
Validation rules split unpredictably, some endpoints missing validation, duplication between FormRequest and Data rules.
</rule>

## Rule 4: Test Data Class Construction for Edge Cases
---
## Category
Testing
---
## Rule
Always test Data class construction with edge cases — missing keys, type mismatches, null values — for every Data class in the application.
---
## Reason
The package's automatic snake_case to camelCase mapping and type casting has edge cases. Without explicit tests, a field rename or type change in the source data silently breaks construction.
---
## Bad Example
```php
class CreateUserData extends Data
{
    public function __construct(
        public string $name,
        public Carbon $birthDate,
    ) {}
}
// No test — if $birthDate is missing or is a string, production error
```
---
## Good Example
```php
class CreateUserData extends Data { /* ... */ }

public function test_can_construct_from_validated_data(): void
{
    $data = CreateUserData::from([
        'name' => 'John',
        'birth_date' => '2000-01-15', // Snake_case — package handles mapping
    ]);
    $this->assertEquals('John', $data->name);
    $this->assertInstanceOf(Carbon::class, $data->birthDate);
}

public function test_fails_on_missing_required_field(): void
{
    $this->expectException(\Spatie\LaravelData\Exceptions\DataValidationException::class);
    CreateUserData::from(['name' => 'John']); // Missing birth_date
}
```
---
## Exceptions
No common exceptions. Every Data class must have construction tests.
---
## Consequences Of Violation
Production errors from failed type casting, missing required fields, silent null assignments.
</rule>

## Rule 5: Configure TypeScript Generation and Run in CI
---
## Category
Scalability
---
## Rule
Always configure `php artisan data:typescript` and run it during CI to generate TypeScript interfaces from Data classes.
---
## Reason
The primary benefit of Spatie Data is frontend-backend type synchronization. Without generation, the TypeScript types become stale and developers stop trusting them.
---
## Bad Example
```php
// TypeScript generation configured but never run
// Frontend has interfaces matching an old version of the API
// Developers manually maintain .d.ts files
```
---
## Good Example
```json
// composer.json scripts
"post-autoload-dump": [
    "@php artisan data:typescript --force"
]

// CI pipeline step
- run: php artisan data:typescript --force
- run: git diff --exit-code resources/js/types/  # Fail if types changed
```
---
## Exceptions
Projects without a frontend consuming TypeScript do not need generation.
---
## Consequences Of Violation
Stale TypeScript types, manual frontend type maintenance, runtime frontend errors from mismatched types.
</rule>

## Rule 6: Use Custom Casts for Application-Specific Types
---
## Category
Design
---
## Rule
Never use raw types (string, int) where application-specific value objects exist; register custom `Cast` implementations for domain types like `Money`, `Email`, `PhoneNumber`.
---
## Reason
Raw types lose domain semantics. A `string $email` can contain any string, but an `Email $email` is guaranteed valid. Custom casts enforce domain invariants at the DTO boundary.
---
## Bad Example
```php
class CreateUserData extends Data
{
    public function __construct(
        public string $email,       // ❌ Raw string — could be any string
        public string $phoneNumber, // ❌ Raw string — no format guarantee
    ) {}
}
```
---
## Good Example
```php
class EmailCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $context): Email
    {
        return new Email($value);
    }
}

class CreateUserData extends Data
{
    public function __construct(
        #[WithCast(EmailCast::class)]
        public Email $email, // ✅ Typed value object
        #[WithCast(PhoneCast::class)]
        public PhoneNumber $phoneNumber,
    ) {}
}
```
---
## Exceptions
Simple DTOs with no value objects (all strings, ints, bools) do not need custom casts.
---
## Consequences Of Violation
Weak domain typing, runtime validation repeated in every consumer, no single point of type enforcement.
</rule>
