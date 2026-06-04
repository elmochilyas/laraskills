# Skill: Define a Data Object with Spatie/laravel-data

## Purpose

Create a Data object class extending `Spatie\LaravelData\Data` that leverages the package's automatic factory methods, validation pipeline, type casting, and serialization — replacing manual DTO boilerplate with a declarative approach.

## When To Use

- CRUD-heavy applications with many endpoints — reduces boilerplate significantly
- API applications with TypeScript frontends — TypeScript generation is a unique value proposition
- Teams that prefer declarative DTO definitions over manual factory methods
- Applications where consistent casting behavior across all DTOs is important

## When NOT To Use

- Package/library development — avoid external dependencies in distributed code
- Complex domain logic with few endpoints — plain DTOs with factories offer more control
- When tight framework coupling concerns you — plain DTOs have zero external dependencies
- Teams that prefer explicit over "magic" — the pipeline's automatic behavior obscures data flow

## Prerequisites

- PHP 8.1+
- spatie/laravel-data package installed (`composer require spatie/laravel-data`)
- FormRequest classes for HTTP entry points (if using FormRequest + Data pattern)
- Decision on validation layer: FormRequest authoritative or Data object authoritative

## Inputs

- Data shape specification: field names, types, nullability, defaults
- Validation rule specifications per field
- Custom casting requirements (phone numbers, custom types)
- TypeScript generation requirements (if applicable)

## Workflow

1. Create a new class in `app/Data/` that extends `Spatie\LaravelData\Data`
2. Define the constructor with promoted typed properties — the package provides `Data::from()`, `Data::fromRequest()`, and `->toArray()` automatically
3. Use nullable type hints (`?Type`) for optional properties
4. Define validation rules by adding a `public static function rules(): array` method — return rules in Laravel's rule format
5. For conditional rules (create vs update), accept the `Context $context` parameter
6. Add `#[CastWith(CasterClass::class)]` attributes for custom type casting (phone numbers, custom types)
7. For nested Data object properties, simply type-hint the child Data class — the pipeline handles nested construction automatically
8. For collections of child Data objects, use `#[DataCollectionOf(ChildData::class)]` attribute
9. In the controller, use `Data::fromRequest($request)` — never `Data::from($request->all())` or `Data::fromRaw()`
10. If using TypeScript generation, run `php artisan data:typescript` and configure CI to fail on drift
11. Write tests: valid construction via `Data::from()`, invalid input rejection (expects `ValidationException`), output shape via `->toArray()`

## Validation Checklist

- [ ] Data object extends `Spatie\LaravelData\Data`
- [ ] Validation rules are defined in one place only (FormRequest or Data object, not both)
- [ ] `Data::fromRequest()` is used over `Data::from($request->all())`
- [ ] `Data::fromRaw()` or `new Data(...)` is not used in production code
- [ ] Custom casters implement `Spatie\LaravelData\Casts\Cast`
- [ ] No business logic or persistence code in Data objects
- [ ] Nullable nested Data objects use `?` type hints
- [ ] Pipeline order is respected (authorization → validation → casting)
- [ ] TypeScript generation is configured in CI (if applicable)

## Common Failures

- **Defining rules in both FormRequest and Data object**: Both execute, doubling validation time. Choose one authoritative layer.
- **Data object as ORM entity**: Adding business logic, persistence, or relationships to Data objects. Keep them as pure data carriers.
- **Pipeline bypass with fromRaw**: Using `Data::fromRaw()` or `new Data(...)` to avoid validation. These bypass the entire pipeline.
- **Ignoring pipeline order**: Custom pipes added in wrong positions break authorization → validation → casting contract.
- **Missing nullable hints for optional nested Data objects**: `ProfileData $profile` instead of `?ProfileData $profile` causes construction failure when profile is absent.

## Decision Points

- **FormRequest authoritative vs Data authoritative**: Pick one validation layer per application. FormRequest for HTTP-specific rules with weaker Data. Data for domain rules consistent across all entry points.
- **Custom casters vs manual transformation**: Use custom casters for normalization that always applies (phone digits, date formats). Use manual transformation in service layer for one-off conversions.
- **TypeScript generation enabled**: Enables full-stack type safety. Requires CI enforcement of type freshness. Skip if frontend is not TypeScript.

## Performance Considerations

- Reflection overhead per class: ~2-5ms on first request; cached afterward
- Pipeline cost per Data object: ~0.1-1.5ms (authorization ~0.01ms, validation 0.1-1ms, casting 0.01-0.1ms per property)
- In Octane: metadata cache persists between requests — no re-resolution needed
- Total pipeline cost for 5-20 Data objects per request: ~0.5-30ms — acceptable for most applications

## Security Considerations

- The pipeline's `authorize()` method is weaker than FormRequest — no access to route parameters, headers, or resource relationships
- `Data::fromRaw()` bypasses the pipeline entirely — audit all DTO construction points
- Lazy properties use object-level state that must be reset between requests in Octane — the base Data class handles this via `__wakeup` and `__serialize`

## Related Rules

- Rule 1: Use `Data::fromRequest()` Over `Data::from($request->all())`
- Rule 2: Define Validation Rules in Exactly One Layer — Either FormRequest or Data Object, Never Both
- Rule 3: Never Add Business Logic or Persistence Code to Data Objects
- Rule 4: Respect the Pipeline Order — Never Add Custom Pipes That Violate Authorization → Validation → Casting
- Rule 5: Never Use `Data::fromRaw()` or `new Data(...)` in Production Code
- Rule 6: Configure TypeScript Generation in CI to Prevent PHP/TypeScript Type Drift
- Rule 7: Handle Nullable Nested Data Properties Explicitly with `?` Type Hints

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- Data Object Validation: Add Domain-Level Validation to a DTO
- Nested DTOs: Construct and Serialize Nested DTO Trees

## Success Criteria

- Data object extends `Spatie\LaravelData\Data` with typed promoted properties
- Validation rules are defined in exactly one layer
- `Data::fromRequest()` is used for HTTP entry points — no `Data::fromRaw()` in production
- Custom casters handle type normalization where needed
- No business logic or persistence code in Data objects
- Tests cover valid construction and invalid rejection
- TypeScript generation runs in CI (if applicable)
