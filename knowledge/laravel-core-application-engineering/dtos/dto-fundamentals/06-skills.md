# Skill: Implement a Baseline DTO

## Purpose

Create a new Data Transfer Object with readonly properties, typed constructor parameters, universal factory methods, and no business logic — establishing the canonical DTO pattern for the project.

## When To Use

- Adding a new data flow that crosses 2-3+ application layers
- Creating a typed contract for a service method
- Standardizing data shared across multiple entry points (HTTP, CLI, queue)
- Introducing DTOs to a codebase that currently uses raw arrays

## When NOT To Use

- Simple controller-to-model CRUD with a single entry point
- Fewer than 3 fields with no transformation (pass-through to model)
- Prototype/MVP where data shapes change rapidly
- When the 2-3 layer threshold is not yet met

## Prerequisites

- PHP 8.1+ (for readonly properties) or PHP 8.2+ (for readonly classes)
- Team convention on naming suffix (`Dto` vs `Data`)
- Team convention on organizational strategy (centralized vs per-domain)
- Decision on which data sources the DTO will be constructed from

## Inputs

- Data shape specification: field names, types, nullability, defaults
- Source types the DTO will be constructed from (array, FormRequest, Eloquent model)
- Output format requirements (key naming convention, date formats)

## Workflow

1. Create a new PHP file in the correct directory per team organizational strategy
2. Declare the class with `readonly class` (PHP 8.2+) or add `public readonly` to all promoted properties (PHP 8.1)
3. Define the constructor with promoted typed properties — use PHP 8.0+ native types for all properties
4. Add nullable type hints (`?Type`) for optional fields — use `?string`, not default empty strings
5. Implement `fromArray(array $data): self` as the universal factory with explicit key mapping and `?? null` for optional fields
6. Add source-specific factories as needed: `fromRequest()`, `fromModel()`
7. Implement `toArray(): array` with explicit key mapping and type formatting (dates, enums)
8. Implement `JsonSerializable` if `json_encode()` compatibility is needed — delegate to `toArray()`
9. Verify the DTO has no business logic methods (no calculations, no validation rules, no persistence)
10. Verify the DTO has no HTTP dependencies (no `Illuminate\Http\Request` imports)

## Validation Checklist

- [ ] Class declared as `readonly class` (PHP 8.2+) or all properties `public readonly` (PHP 8.1)
- [ ] All properties use constructor promotion — no manual property declarations
- [ ] All properties have PHP native type hints
- [ ] `fromArray()` factory exists with explicit key mapping
- [ ] `toArray()` method exists with explicit output mapping
- [ ] No business logic methods (calculations, validation, persistence)
- [ ] No HTTP dependencies (no `Request` imports or type hints)
- [ ] No setters or mutable properties
- [ ] No default values that mask missing data — use nullable types
- [ ] DTO is in the correct directory per team organizational strategy

## Common Failures

- **Non-readonly DTO**: Properties without `readonly` — data can be mutated by intermediate layers. Apply `readonly class` from the first commit.
- **Missing fromArray**: Every caller must manually map keys to constructor parameters. Add `fromArray()` as the universal factory.
- **Business logic in DTO**: Adding `calculateTotal()` or `validate()` methods. Business logic belongs in services.
- **HTTP dependency**: Importing `Illuminate\Http\Request` in a DTO. DTOs must be pure — extract request data in the controller.
- **Array spread without mapping**: Using `new self(...$data)` everywhere. Use explicit mapping for safety.

## Decision Points

- **Per-entity vs per-operation DTO**: Single `UserDto` for everything vs `CreateUserDto` + `UserListDto` + `UserDetailDto`. Use per-operation for codebases >50k LOC or when nullable fields exceed 30%.
- **Dto vs Data suffix**: Choose one consistently across the project. `Dto` for plain DTOs, `Data` for spatie/laravel-data objects, or one suffix for all.
- **fromArray in constructor vs static method**: Prefer static `fromArray()` so construction from validated data can bypass validation when needed.

## Performance Considerations

- DTO construction overhead is ~3µs — negligible for typical applications
- Readonly properties add zero runtime overhead in PHP 8.1+
- The array-to-DTO mapping in `fromArray()` is the dominant cost, not the object allocation

## Security Considerations

- Never construct DTOs from `$request->all()` — unvalidated input propagates bad data through the service layer
- DTOs should contain only scalar types and nested DTOs — never request objects, session data, or file uploads
- Nullable properties with `??` defaults can mask missing keys — be explicit about which fields are required

## Related Rules

- Rule 1: Declare All DTOs as `readonly class`
- Rule 2: Apply the 2-3 Layer Threshold Before Introducing a DTO
- Rule 3: Never Include Business Logic Methods in DTOs
- Rule 4: Use Per-Operation DTOs for Larger Codebases
- Rule 5: Include `fromArray()` as the Minimal Factory on Every DTO
- Rule 6: Never Type-Hint `Request` or Contain HTTP Dependencies in DTOs

## Related Skills

- DTO Construction Patterns: Add Named Static Factories to a DTO
- Data Object Transformation: Implement and Test DTO Output Methods
- Readonly Data Objects: Apply Readonly Enforcement to a DTO

## Success Criteria

- DTO class is `readonly` with fully typed promoted constructor properties
- `fromArray()` factory exists with explicit mapping and null handling
- `toArray()` method exists with explicit output mapping
- No business logic, HTTP dependencies, or setters exist in the DTO
- The 2-3 layer threshold is met before the DTO was introduced
- All properties are typed with PHP native types
