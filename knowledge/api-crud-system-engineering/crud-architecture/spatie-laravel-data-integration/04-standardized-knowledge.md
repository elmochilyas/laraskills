# ECC Standardized Knowledge — Spatie Laravel Data Integration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Spatie Laravel Data Integration |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Spatie's `laravel-data` package is a comprehensive DTO framework for Laravel that provides automatic type casting, validation integration, serialization, and TypeScript generation. It replaces manual DTO infrastructure (named constructors, `toArray`, `JsonSerializable`) with a declarative approach — define the DTO class structure, and the package handles construction, casting, and transformation automatically. A `Data` class with `string $name` and `Carbon $birthDate` automatically casts strings to Carbon, validates via Laravel rules, serializes to arrays/JSON, and generates TypeScript interfaces for frontend consumption.

## Core Concepts

- **Data Class Definition**: Extend `Data` and define typed constructor properties. The package reads constructor parameter types and handles construction automatically.
- **Automatic Construction**: `Data::from()` accepts arrays, requests, or JSON and auto-maps keys to constructor parameters with snake_case to camelCase conversion.
- **Type Casting**: Automatic casts for common types (string → Carbon, array → Collection, string → int). Custom casts can be registered for application-specific types (Money, Email, PhoneNumber).
- **Validation Integration**: Define `rules()` on Data classes — validation runs automatically during construction. Invalid data throws `DataValidationException`.
- **TypeScript Generation**: `php artisan data:typescript` generates TypeScript interfaces from PHP Data classes, keeping frontend types in sync.

## When To Use

- Codebases with 20+ DTOs where manual maintenance becomes burdensome
- When nested DTOs are common — the package handles recursion automatically
- When TypeScript generation is needed for frontend-backend type synchronization
- When validation is tightly coupled to data structure (rules on the DTO itself)
- Teams that prefer declarative patterns over imperative factory methods

## When NOT To Use

- Small codebases (<20 DTOs) where manual patterns are sufficient
- Teams that prefer minimal dependencies and plain PHP patterns
- Extremely simple DTOs (2-3 fields, no nesting, no validation) — manual is simpler
- When the team is not willing to learn package conventions

## Best Practices

- Choose one approach (Spatie or manual) and apply it consistently across the codebase
- Test DTO construction for each Data class — snake_case to camelCase mapping has edge cases
- Decide on validation strategy: FormRequest + Data or Data-only — apply consistently
- Pin the exact package version and review upgrade guides before updating major versions
- Use `DataCollection` for arrays of nested Data objects instead of plain arrays

## Architecture Guidelines

- Spatie Data can serve as both input DTOs and output resources via transformers
- Validation strategy options: FormRequest handles HTTP validation, Data handles structural validation (types, nested structures); or Data handles all validation
- The package handles nested construction automatically — child Data classes are constructed recursively
- Custom casts are registered as classes implementing the `Cast` interface with the `#[WithCast]` attribute
- TypeScript generation produces `.d.ts` files from all Data classes in the application

## Performance Considerations

- Spatie Data objects are slightly slower than manual DTOs due to reflection-based construction and type casting
- For typical usage (10-50 DTO constructions per request), overhead is ~0.1-0.5ms — negligible
- The reflection overhead is incurred once per class per process, then cached

## Security Considerations

- Validation in Data classes runs automatically — ensure validation rules are as strict as FormRequest rules
- `Data::from()` with invalid input throws `DataValidationException` — catch it appropriately to avoid 500 errors
- TypeScript generation may expose internal DTO structure — review generated types for sensitive fields
- Custom casts must not introduce security vulnerabilities (e.g., executing code from input)

## Common Mistakes

- **Mixing Package and Manual Patterns**: Some DTOs use Spatie, others use manual `fromArray`. Solution: Choose one approach and apply it consistently.
- **Over-Reliance on Automatic Construction**: Assuming the package always maps keys correctly without testing. Solution: Test DTO construction for each Data class.
- **Ignoring the Learning Curve**: Expecting the package to work exactly like manual DTOs. Solution: Allocate time for the team to learn package conventions before production use.
- **Validation Exception in Controllers**: `Data::from()` throws uncaught validation exceptions producing 500 errors. Solution: Wrap Data construction in try-catch or use the package's automatic HTTP exception handling.

## Anti-Patterns

- **Manual + Spatie Mix**: Some DTOs use `fromArray`/`toArray`, others use `Data::from()`. Confusing and prevents TypeScript generation for all types.
- **Data as FormRequest Replacement**: Using Data validation while bypassing FormRequest entirely, losing the clear HTTP validation boundary. Valid if intentional but a decision must be made.
- **Ignoring Package Updates**: Pinning an outdated version with known bugs because "upgrading is too much work."

## Examples

### Basic Data Class with Validation
```php
class CreateUserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public Carbon $birthDate,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'birth_date' => ['required', 'date', 'before:today'],
        ];
    }
}

// Construction
$data = CreateUserData::from($request->validated());
```

### Custom Cast for Value Objects
```php
class MoneyCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $context): Money
    {
        return Money::fromDecimal($value);
    }
}

class PriceData extends Data
{
    public function __construct(
        #[WithCast(MoneyCast::class)]
        public Money $amount,
        public Currency $currency,
    ) {}
}
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Data Transfer Object Design | Core DTO concepts that Spatie formalizes | Prerequisite |
| DTO Construction Patterns | Manual patterns that Spatie automates | Prerequisite |
| DTO Nesting Composition | Nesting patterns (Spatie automates these) | Related |
| Validation Patterns | FormRequest vs Data validation strategy | Related |
| Custom Casts and Transformers | Extending Spatie Data | Follow-up |
| TypeScript Generation from DTOs | Frontend integration | Follow-up |

## AI Agent Notes

- Spatie/laravel-data is the dominant DTO package in the Laravel ecosystem — it solves the biggest DTO pain points: boilerplate and consistency
- Particularly valuable for teams with 20+ DTOs where manual maintenance becomes burdensome
- When generating Data classes, include validation rules, type hints, and consider TypeScript generation
- Choose between FormRequest + Data or Data-only validation strategy at the project level
- Pin the exact version — the package has breaking changes between major versions

## Verification

- [ ] Data classes use `extends Data` with typed constructor properties
- [ ] Construction uses `Data::from()`, not manual factories
- [ ] Validation rules are defined via `rules()` method where needed
- [ ] Custom casts are registered for application-specific types
- [ ] TypeScript generation is configured and run during CI
- [ ] Package approach is applied consistently across all DTOs
- [ ] DTO construction is tested for edge cases (missing keys, type mismatches)
- [ ] Package version is pinned and upgrade plan is documented
