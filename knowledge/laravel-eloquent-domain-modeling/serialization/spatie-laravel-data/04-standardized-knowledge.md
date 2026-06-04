# Spatie Laravel Data — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Spatie Laravel Data
- **ECC Version:** 1.0

## Overview
`spatie/laravel-data` is the most popular DTO package for Laravel, providing a formalized framework for data transfer objects with automatic casting, validation integration, and extensible transformers. It reduces boilerplate by inferring property types from PHP declarations, supporting nested data objects, integrating with Laravel's validation system, and providing output transformers. It serves as both a replacement for and complement to API Resources.

## Core Concepts
- `Data` class — base class for all data objects; define typed structures with promoted constructor properties
- `DataCollection` — typed collection class for arrays of `Data` objects
- Automatic casting — properties cast based on PHP type declarations (string, int, Carbon, enum, etc.)
- Nested data objects — a `Data` class can contain another `Data` as a property; casting is automatic
- Validation integration — `rules()` method defines validation rules; `from()` validates input
- Transformers — customize output serialization per property via transformer classes or closures
- `from()` / `fromModel()` — static factory methods for creating Data from arrays, models, or JSON
- `toArray()` / `toJson()` — serialization with transformation support
- `only()` / `except()` — select or exclude specific properties from serialization
- `Optional` type — distinguishes "not provided" from `null`, enabling partial updates

## When To Use
- Any project already using DTO patterns that wants to reduce boilerplate
- Applications needing automatic type casting and nested data object resolution
- Projects using Domain-Driven Design or Hexagonal Architecture with Laravel
- Multi-channel serialization where Data objects serve API, queue, broadcast, and CLI
- When you need validation integrated with the data structure itself

## When NOT To Use
- Do NOT use for simple CRUD APIs where API Resources already suffice
- Do NOT use when you only need HTTP-specific serialization — Resources are simpler
- Do NOT use in performance-critical hot paths where reflection overhead matters
- Do NOT use when the team is not familiar with DTO patterns — adds learning curve
- Do NOT use for models that never cross application boundaries — keeps things simple

## Best Practices (WHY)
- Use `php artisan data:make` to generate Data classes consistently
- Register custom casters and transformers in a ServiceProvider
- Define `rules()` on all Data classes used for input validation
- Use `Optional` for PATCH/update endpoints where fields may not be provided
- Test Data validation rules independently from controller tests
- Cache Data configuration in production (the package respects Laravel's config cache)

## Architecture Guidelines
- Place Data classes in `App\Data\{Entity}Data` following a consistent naming convention
- Keep Data classes free of business logic — they should only define structure, casting, and validation
- Use Data objects at domain boundaries; use API Resources only for HTTP-specific presentation
- Define custom casters for application-specific value objects (Money, Address, Slug)
- Version Data classes by namespace for contract evolution
- Document casing convention (snake_case vs camelCase) and follow it consistently

## Performance
- Reflection-based type resolution is cached after first call per class — subsequent creations are faster
- Validation runs on every `from()` call if `rules()` is defined — avoid in hot paths or validate separately
- `DataCollection` creation is linear — 10k items = 10k Data objects; use chunked processing for large datasets
- Serialization via `toArray()` is comparable to manual DTOs — no significant overhead
- Transformer pipeline runs per property — many transformers add overhead proportionally

## Security
- `from()` with `rules()` validates input, preventing malformed data from entering the system
- Data objects are immutable after creation — no risk of mutation-based data leaks
- Only properties explicitly defined in the Data class are serialized — prevents accidental data exposure
- Ensure `rules()` is defined on Data classes used for input — otherwise invalid data passes through silently
- Custom casters should validate and sanitize input data during casting

## Common Mistakes
- Not using `Optional` for partial updates — all fields are required by default, including `null` assignments
- Putting business logic in Data classes — they should be data-only
- Defining `rules()` that duplicate Form Request validation — choose one validation layer
- Forgetting to register custom casters — `from()` fails with `Uncastable` exception
- Using `from()` with unvalidated request data — security risk if `rules()` is not defined
- Mixing snake_case and camelCase in properties — consistency matters for serialization output

## Anti-Patterns
- **Business logic in Data classes**: adding methods that compute, validate, or transform beyond simple casting
- **Data class for every model**: creating Data classes for models that never cross application boundaries
- **No `rules()` on input Data**: using `from()` with request data but no validation rules defined
- **Circular nested Data**: Data A contains Data B contains Data A — causes infinite recursion on `from()`
- **Over-using Optional**: wrapping every property in `Optional` instead of using explicit nullable types

## Examples
```php
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class UserData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public Carbon $created_at,
        public null|string|Optional $email_verified_at,
    ) {}

    public static function rules(): array
    {
        return [
            'id' => ['required', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ];
    }
}

// Usage
$userData = UserData::from($request->all());
$userData = UserData::fromModel($user);
$array = $userData->toArray();

// DataCollection
$collection = UserData::collection(User::all());

// Optional for partial updates
class UpdateUserData extends Data
{
    public function __construct(
        public int|Optional $id,
        public string|Optional $name,
        public string|Optional $email,
    ) {}
}
```

## Related Topics
- dto-patterns — the foundational pattern that `spatie/laravel-data` formalizes
- json-resource — alternative serialization layer compatible with Data objects
- to-array-to-json — underlying serialization mechanics
- resources-vs-dtos — decision framework for Data vs API Resources
- custom-casters — extending the package with application-specific type casting

## AI Agent Notes
- `spatie/laravel-data` is the de facto DTO package for Laravel — use it for typed data contracts
- Define `rules()` for input Data classes; omit for output-only Data classes
- Use `Optional` for partial updates instead of nullable types
- Register custom casters in a ServiceProvider for application-specific value objects
- Data objects are immutable — create new instances for changes, don't mutate existing ones
- Test `fromModel()` to catch drift when the underlying Eloquent model changes columns

## Verification
- [ ] Custom casters and transformers are registered in a ServiceProvider
- [ ] `rules()` method is defined on all Data classes used for input
- [ ] `Optional` is used for PATCH/update endpoints
- [ ] Data classes contain no business logic (strictly data)
- [ ] Reflection cache is cleared on deploy
- [ ] Nested Data relationships are tested for circular references
- [ ] `DataCollection` is used consistently for list endpoints
- [ ] snake_case vs camelCase convention is documented and followed
