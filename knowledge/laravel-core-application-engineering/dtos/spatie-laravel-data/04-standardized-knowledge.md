# Spatie/laravel-data Integration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Spatie/laravel-data Integration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

Spatie/laravel-data is the dominant third-party DTO package for Laravel, providing automatic type casting, validation integration, pipeline hooks, and TypeScript type generation. It replaces handwritten factory methods with a declarative approach: DTO properties are annotated with PHP attributes that control casting, validation, and transformation behavior.

The core value proposition is eliminating boilerplate. A single `Data` class replaces 3-4 files used in the manual DTO pattern: the DTO class, factory methods, casters, and serialization logic. The `DataPipeline` (AuthorizedDataPipe → ValidatePropertiesDataPipe → CastPropertiesDataPipe) runs in a fixed order: authorization first, then validation, then casting.

## Core Concepts

- **Data Object Definition:** A class extending `Spatie\LaravelData\Data` with constructor-promoted properties. Automatically provides `Data::from()`, `Data::fromRequest()`, `DataCollection::fromModel()`, and `->toArray()`.
- **The DataPipeline:** Runs in fixed order: `AuthorizedDataPipe` → `ValidatePropertiesDataPipe` → `CastPropertiesDataPipe`. Not configurable per instance — always authorization before validation before casting.
- **Automatic Cast Resolution:** Built-in casters for Carbon dates, enums, booleans, nested Data objects, and DataCollections. Custom casters via `#[CastWith(MyCast::class)]`.
- **DataCollection:** Typed collection wrapper providing map, filter, reduce, and toArray. Immutable — operations return new collections.
- **TypeScript Generation:** `php artisan data:typescript` generates TypeScript type definitions from Data objects for full-stack type safety.

## When To Use

- CRUD-heavy applications with many endpoints — reduces boilerplate significantly
- API applications with TypeScript frontends — TypeScript generation is a unique value proposition
- Teams that want declarative DTO definitions instead of manual factory methods
- Applications where consistent casting behavior across all DTOs is important

## When NOT To Use

- Package/library development — avoid external dependencies in distributed code
- Legacy PHP 8.0 codebases — spatie/laravel-data requires PHP 8.1+
- Complex domain logic with few endpoints — plain DTOs with factories offer more control
- When tight framework coupling concerns you — plain DTOs have zero external dependencies
- Teams that prefer explicit over "magic" — the pipeline's automatic behavior obscures the data flow

## Best Practices (WHY)

- **Why use the pipeline order:** Authorization before validation before casting ensures invalid data never reaches casters. This ordering is critical for security and type safety.
- **Why define rules in one place:** Define validation rules either in FormRequest OR in Data object, not both. Duplicate rules diverge over time.
- **Why prefer `Data::fromRequest()`:** Uses validated data from the FormRequest. `Data::from($request->all())` bypasses FormRequest validation.
- **Why not treat Data objects as ORM entities:** Data objects are not Eloquent models. They should not carry persistence logic, accessors, mutators, or relationships.

## Architecture Guidelines

- Place Data objects in `app/Data/` with namespace `App\Data\` and suffix `Data` (e.g., `UserData`)
- Use FormRequest for HTTP-specific concerns (authorization, input preparation); Data object for type casting
- Configure TypeScript generation in CI to prevent PHP/TypeScript type drift
- Handle nullable nested Data properties explicitly with `?` type hints
- Keep the default pipeline — custom pipes are rarely needed and can break the authorization → validation → casting contract

## Performance

- Reflection overhead per class: ~2-5ms on first request; cached per class afterward
- Pipeline cost per DTO: ~0.1-1.5ms total (authorization: ~0.01ms, validation: 0.1-1ms, casting: 0.01-0.1ms per property)
- In Octane, the metadata cache persists between requests (shared memory) — no re-resolution needed
- Total pipeline cost for 5-20 Data objects per request: ~0.5-30ms — acceptable for most applications

## Security

- The pipeline's authorization check (`authorize()` method) is weaker than FormRequest's — no access to route parameters, headers, or resource relationships
- Lazy properties use object-level state that must be reset between requests in Octane — the base Data class handles this via `__wakeup` and `__serialize`
- `Data::fromRaw()` bypasses the pipeline entirely — audit all DTO construction points

## Common Mistakes

1. **Using Both FormRequest and Data Validation:** When both define rules, both execute, doubling validation time and creating two sources of truth. Choose one layer.

2. **Data Object as an ORM Entity:** Adding business logic, persistence, or relationships to Data objects violates the separation between data transport and domain logic.

3. **Ignoring Pipeline Order:** Custom pipes added in the wrong position break the authorization → validation → casting contract. A caster that normalizes data before validation runs may hide validation errors.

4. **Using `Data::from()` with Unvalidated Input:** Bypasses FormRequest validation. The Data object's own rules run during the pipeline, but this is weaker than FormRequest validation (no authorization, no input preparation).

## Anti-Patterns

- **The Mega Data Object:** A Data object with 20+ properties and complex validation rules used everywhere. Breaks single responsibility — split into focused Data objects per operation.
- **The Double Validation:** Defining the same rules in both FormRequest and Data object. Always diverges over time — one is updated, the other forgotten.
- **The Pipeline Bypass:** Using `new Data(...)` or `Data::fromRaw()` directly to avoid validation overhead. Creates a path for invalid data to enter the system.
- **The Framework Lock-In:** Using spatie/laravel-data in a package or shared library. External consumers must also install the package, creating an unwanted dependency.

## Examples

### Data Object Definition
```php
use Spatie\LaravelData\Data;

class UserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $bio,
    ) {}
}

// Usage in controller
public function store(CreateUserRequest $request, StoreUserAction $action)
{
    $data = UserData::fromRequest($request);
    return $action->execute($data);
}
```

### Custom Caster
```php
use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\DataProperty;

class PhoneNumberCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $context): string
    {
        return preg_replace('/[^0-9]/', '', $value);
    }
}

class UserData extends Data
{
    public function __construct(
        #[CastWith(PhoneNumberCast::class)]
        public string $phone,
    ) {}
}
```

## Related Topics

- **DTO Fundamentals** — baseline DTO concepts
- **Readonly Data Objects** — comparison with plain readonly DTOs
- **Data Object Validation** — validation rules in Data objects
- **Data Object Transformation** — serialization and output
- **DTO vs Form Request** — validation boundary decisions

## AI Agent Notes

- Use `extends Data` for automatic factory methods, casting, and validation
- Define validation rules in one place only — either FormRequest or Data object, not both
- Default namespace is `App\Data` with `Data` suffix (e.g., `UserData`)
- Use `#[CastWith]` attribute for custom type casting
- Never bypass the pipeline with `Data::fromRaw()` or `new Data(...)` directly
- For TypeScript generation, run `php artisan data:typescript` in CI

## Verification

- [ ] Data objects extend `Spatie\LaravelData\Data`
- [ ] Validation rules are defined in one place (FormRequest or Data object, not both)
- [ ] `Data::fromRequest()` is used over `Data::from($request->all())`
- [ ] Custom casters implement `Spatie\LaravelData\Casts\Cast`
- [ ] No business logic or persistence code exists in Data objects
- [ ] TypeScript generation is configured in CI if applicable
- [ ] Nullable nested Data objects use `?` type hints
- [ ] Pipeline order is respected (authorization → validation → casting)
