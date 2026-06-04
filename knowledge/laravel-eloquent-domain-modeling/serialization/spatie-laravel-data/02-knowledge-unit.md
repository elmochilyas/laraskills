# spatie-laravel-data

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

`spatie/laravel-data` is a first-party Spatie package that provides a formalized DTO system for Laravel applications. It combines data transfer objects, automatic casting, validation integration, and serialization into a single declarative framework. The package reduces boilerplate by inferring property types from PHP declarations, supporting nested data objects, integrating with Laravel's validation system, and providing extensible transformers for output formatting. It is the most widely adopted DTO solution in the Laravel ecosystem and serves as both a replacement for and complement to API Resources.

## Core Concepts

- **`Data` class** — Base class for all data objects. Extend this to define typed data structures.
- **`DataCollection`** — Typed collection class for arrays of `Data` objects.
- **Automatic casting** — Properties are automatically cast based on their PHP type declarations (string, int, Carbon, etc.).
- **Nested data objects** — A `Data` class can contain another `Data` class as a property; casting is automatic.
- **Validation integration** — `Data` classes can define validation rules using Laravel's Validator, with `from()` method validating input.
- **Transformers** — Customize output serialization per property via `DataTransformer` classes or closure transformers.
- **`from()` / `fromModel()`** — Static factory methods for creating `Data` from arrays, models, or JSON.
- **`toArray()` / `toJson()`** — Serialization methods with transformation support.
- **`only()` / `except()`** — Select or exclude specific properties from serialization.
- **Data Artisan commands** — `php artisan make:data` generates new Data classes.

## Mental Models

1. **Declarative DTO framework** — Instead of writing manual constructors and named factories, declare properties and the package handles the rest.
2. **Auto-pilot casting** — Like Eloquent casts but for DTOs: declare `public string $name` and string casting is automatic.
3. **Validation-aware DTO** — A Data class is both a contract and a validator: define rules inline and validate on creation.
4. **Transformer pipeline** — Like middleware for each property: output goes through transformer chain for formatting.

## Internal Mechanics

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
            'email' => ['required', 'email'],
        ];
    }
}

// Usage:
$userData = UserData::from($request->all());
$userData = UserData::fromModel($user);
$array = $userData->toArray();
```

The package uses PHP's reflection API to read type declarations from promoted constructor properties. During `from()`, it resolves each property's value through the casting pipeline. Built-in casters handle primitive types, Carbon, enums, collections, and other `Data` objects. Custom casters and transformers extend behavior.

## Patterns

- **Request → Data → Action** — Validate request into Data object, pass to an Action class for business logic.
- **Model → Data → Resource** — Convert Eloquent model to Data, then optionally wrap in API Resource for HTTP-specific formatting.
- **Data as event payload** — Use Data objects for queue job data and broadcast events, leveraging automatic serialization.
- **DataCollection for lists** — `UserData::collection($users)` creates a `DataCollection` with typed items.
- **Custom casters** — Register casters for custom value objects (e.g., `Money`, `Address`).
- **Custom transformers** — Format output (e.g., date format, number formatting, URL generation).
- **Partial data updates** — Use `Optional` type for partial update DTOs where some fields may not be provided.
- **Data with enums** — PHP enums as property types; built-in caster handles conversion.
- **API Resources + Data** — Use Data for cross-channel serialization; wrap in Resource for HTTP-specific meta/headers.

## Architectural Decisions

- The package uses PHP reflection for type resolution rather than annotation/docblock parsing, enabling IDE support and static analysis.
- Validation is opt-in via `rules()` method — Data objects can be used without validation for simple DTO needs.
- The `Optional` type distinguishes "not provided" from `null`, enabling partial updates.
- The package deliberately does NOT extend Eloquent or couple to Laravel's HTTP layer — Data objects are framework-agnostic within Laravel.
- Transformers are separate from casters: casters handle input (creation), transformers handle output (serialization).

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Declarative, minimal boilerplate | Reflection-based type resolution adds ~1-2ms per Data creation | Acceptable for typical request volumes |
| Built-in validation integration | Validation runs on every `from()` call even if not needed | Use separate validation or disable by not defining `rules()` |
| Nested Data auto-resolution | Circular references cause infinite recursion | Use `Optional` or manual resolution for circular structures |
| Extensible caster/transformer system | Learning curve for custom casters/transformers | Start with built-in casters, extend as needed |
| API Resource compatibility | Data + Resource can feel redundant (two classes per entity) | Use Data for domain boundaries, Resources only for HTTP-specific needs |

## Performance Considerations

- Reflection-based type resolution is cached after first call per class — subsequent creations are faster.
- Each `from()` call validates if `rules()` is defined — avoid validation in hot paths by using `Data::from()` without rules or validating separately.
- `DataCollection` creation is linear — mapping 10k items creates 10k Data objects. Use chunked processing for large datasets.
- Serialization via `toArray()` is comparable to manual DTOs — no significant overhead.
- Transformer pipeline runs per property — many transformers = more overhead.

## Production Considerations

- Register custom casters and transformers in a ServiceProvider.
- Use `php artisan data:make` to generate Data classes consistently.
- Cache Data configurations in production (the package respects Laravel's config cache).
- Test Data validation rules independently from controller tests.
- Version Data classes by creating separate namespaces (`App\Data\V1\UserData`, `App\Data\V2\UserData`).
- Monitor reflection cache — clear on deploy if Data class definitions change.

## Common Mistakes

- Not using `Optional` for partial updates — all fields are required by default, including `null` assignments.
- Putting business logic in Data classes — they should be data-only.
- Defining `rules()` that duplicate Form Request validation — choose one layer.
- Forgetting to register custom casters — `from()` fails with uncastable type.
- Using `from()` with unvalidated request data — security risk if rules are not defined.
- Mixing snake_case and camelCase in properties — consistency matters for serialization output.

## Failure Modes

- **Reflection failure** — PHP 8.2+ dynamic properties deprecated; Data class properties must be declared.
- **Infinite recursion on nested Data** — Data A contains Data B contains Data A — stack overflow on `from()`.
- **Validation bypass** — `from()` without `rules()` defined allows invalid data through.
- **Caster not found** — Unsupported type in declaration throws `Uncastable` exception.
- **Memory bloat** — Loading thousands of models into Data objects in a single request.
- **Serialization of large DataCollection** — `toArray()` on 50k Data items consumes significant memory.

## Ecosystem Usage

- **spatie/laravel-data GitHub** — 1.5k+ stars, actively maintained, stable API.
- **spatie/laravel-permission** — Often paired with Data for role/permission DTOs.
- **spatie/laravel-query-builder** — Complements Data for filtered/sorted API responses.
- **Laravel actions (lorisleiva)** — Common pattern: Request → FormRequest → Action with Data parameters.
- **Domain-Driven Design** — Data objects serve as Value Objects and DTOs in DDD architectures.
- **Event sourcing** — Data objects as immutable event payloads with versioned schemas.

## Related Knowledge Units

### Prerequisites

- **dto-patterns** — The foundational pattern that `spatie/laravel-data` formalizes.

### Related Topics

- **json-resource** — Alternative serialization layer compatible with Data objects.
- **to-array-to-json** — Underlying serialization mechanics that Data objects utilize.

### Advanced Follow-up Topics

- **resources-vs-dtos** — Decision framework for Data vs API Resources.

## Research Notes

- `spatie/laravel-data` was first released in 2021 and has become the de facto DTO package for Laravel.
- The package was inspired by similar patterns in the Spatie team's internal projects and by the `cuyz/valinor` library for object mapping.
- Laravel 11 does not implement a built-in DTO system — the ecosystem relies on packages like this one.
- The package's `Optional` pattern influenced Laravel's own `Optional` class for handling missing data.
- Version 3.x (current major) introduced improved transformer and caster APIs along with `DataCollection` improvements.
