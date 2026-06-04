# ECC Standardized Knowledge — DTO Unit Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | DTO Unit Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

DTO (Data Transfer Object) unit tests validate that data objects correctly construct from input, serialize to arrays/JSON, enforce type constraints, handle optional fields with defaults, and remain immutable after construction. DTOs are plain PHP objects with typed properties, often using `Spatie\LaravelData` or custom constructor + `toArray()` patterns. Testing DTOs requires no database, no framework booting, and no mocking — they are the purest form of unit test. Comprehensive DTO tests ensure data integrity across the API boundary.

## Core Concepts

- **Construction**: `new PostDTO(...)` or `PostDTO::from([...])` — test with full and minimal input
- **Type enforcement**: PHP 8 typed properties ensure type safety — test with wrong types (expect `TypeError`)
- **Serialization**: `$dto->toArray()`, `$dto->toJson()`, `json_encode($dto)` — test output shape
- **Immutability**: No setters — test that DTO cannot be modified after construction
- **Optional fields with defaults**: Test that omitted fields get expected default values
- **Named constructors**: `fromArray()`, `fromRequest()`, `fromModel()` — test each input source
- **Nested DTOs**: DTOs containing other DTOs — test recursive construction and serialization

## When To Use

- Every DTO class in the application
- DTOs that define API request/response contracts
- DTOs used as input/output for action/service classes
- DTOs with `Spatie\LaravelData` or custom implementation

## When NOT To Use

- Plain arrays passed between layers (no contract to test)
- Eloquent models used directly as data carriers (use model tests instead)
- Value Objects that are simple wrappers (test at the consumer level)

## Best Practices

- **Test construction from each input type**: `PostDTO::fromArray([...])`, `PostDTO::fromModel($post)`.
- **Test default values**: Assert optional fields have expected defaults when not provided.
- **Test type enforcement**: Pass wrong types and assert `TypeError` for typed properties.
- **Test serialization**: `$dto->toArray()`, `$dto->toJson()`, `json_encode($dto)`.
- **Test immutability**: Assert no setter methods exist; verify DTO doesn't change after `toArray()`.
- **Test from request**: If DTO has `fromRequest()`, pass a mock request and verify mapping.
- **Test nested DTOs**: Test construction and serialization recursively for nested structures.

## Architecture Guidelines

- DTOs are the contract definition between API layers — test them in isolation (no framework, no database).
- The decision to use DTOs (vs raw arrays) is architectural: DTOs provide type safety and documentation but add boilerplate.
- Unit tests make DTO boilerplate maintainable by catching regressions.
- PHP 8.2 `readonly` classes are ideal for DTOs — immutability by default.

## Performance Considerations

- DTO unit tests are essentially free — no dependencies, no database, no framework.
- Run on every file save — a DTO test suite for 50 DTOs completes in <100ms.
- No special CI configuration needed; include in the pre-commit hook.

## Security Considerations

- DTOs that carry data from untrusted sources should have validation integrated (via Spatie\LaravelData or manual asserts).
- Immutability prevents accidental data corruption after construction.
- Serialization tests ensure no unexpected data leaks via `toArray()`.
- Ensure `fromRequest()` doesn't map hidden/guarded fields from user input.

## Common Mistakes

- Not testing serialization — DTO constructs correctly but `toArray()` returns wrong keys or missing fields.
- Making DTOs mutable — setters allow accidental modification after construction.
- Testing DTOs through feature tests (HTTP → controller → DTO) — tests wiring, not the DTO itself.
- Omitting optional fields from construction tests — nullable field that defaults wrong goes undetected.
- Using PHP 8 promoted properties but forgetting to declare types — `public $title` defaults to mixed.

## Anti-Patterns

- **DTOs with business logic**: Adding methods that calculate or transform data — DTOs should be pure data carriers.
- **Testing DTOs via integration tests**: Creating DTOs through HTTP requests instead of direct instantiation — slower and less targeted.
- **Mutable DTOs with public setters**: Defeats the purpose of a DTO as an immutable contract.

## Examples

```php
it('constructs from array', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello', 'body' => 'World']);

    expect($dto->title)->toBe('Hello');
    expect($dto->body)->toBe('World');
});

it('applies default values', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello']);

    expect($dto->status)->toBe('draft');
    expect($dto->published_at)->toBeNull();
});

it('serializes to array', function () {
    $dto = PostDTO::fromArray(['title' => 'Hello', 'body' => 'World']);

    expect($dto->toArray())->toBe([
        'title' => 'Hello',
        'body' => 'World',
        'status' => 'draft',
        'published_at' => null,
    ]);
});

it('enforces types', function () {
    expect(fn() => PostDTO::fromArray(['title' => 123]))->toThrow(TypeError::class);
});
```

## Related Topics

- **Prerequisites**: PHP 8 Typed Properties and Promoted Constructor, DTO Design Patterns
- **Siblings**: response-shape-testing, action-service-unit-testing, layer-isolation-in-tests
- **Advanced**: Spatie Laravel Data advanced features, CQRS with DTOs, Auto-generating DTOs from OpenAPI schemas

## AI Agent Notes

- DTOs are the purest subject for unit testing in Laravel — no framework dependencies, no database, no mocking.
- A DTO test is the fastest test you can write and provides the most reliable signal.
- PHP 8.2 `readonly` classes are ideal for DTOs — they enforce immutability at the language level.

## Verification

- [ ] Every DTO has tests for construction from each input type
- [ ] Default values for optional fields are verified
- [ ] Type enforcement is tested (wrong types throw `TypeError`)
- [ ] Serialization (`toArray`, `toJson`) matches expected structure
- [ ] Immutability is verified (no setters, no modification after construction)
- [ ] Nested DTOs are tested recursively
