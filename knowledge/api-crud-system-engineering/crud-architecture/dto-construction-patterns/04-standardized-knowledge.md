# ECC Standardized Knowledge — DTO Construction Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | DTO Construction Patterns |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

DTO construction patterns define how DTOs are built from various data sources — HTTP requests, Eloquent models, external API responses, and user input. The core patterns are static named constructors (`fromRequest`, `fromArray`, `fromModel`), collection construction for arrays of DTOs, and hydration strategies for populating DTOs from different source shapes. Centralizing mapping logic in factory methods prevents duplication and inconsistency across callers.

## Core Concepts

- **Named Constructor Pattern**: Static methods on the DTO class that serve as intention-revealing factories — `fromArray`, `fromRequest`, `fromModel`. Each factory encapsulates source-specific mapping logic.
- **Collection Construction**: Building arrays of DTOs from nested data using `array_map` or typed collection wrapper classes.
- **Type Coercion in Constructors**: The constructor can coerce types that are not inherently type-safe — e.g., parsing date strings to `Carbon` instances, ensuring consumers receive typed data.
- **Static vs Instance Factories**: Static named constructors are sufficient for most DTOs. Instance factories (separate factory classes with injected dependencies) are needed when construction requires database lookups, external API calls, or complex conditional logic.

## When To Use

- Centralizing mapping logic from multiple data sources to a single DTO type
- When callers should not know the internal mapping logic between source and DTO fields
- For collection construction of DTO arrays from nested API or request data
- When construction requires type coercion (string dates → Carbon, integers → enums)

## When NOT To Use

- When the DTO has only one caller and mapping is trivial (a direct constructor call suffices)
- For operations where the source format and DTO format are identical (no mapping needed)
- When the factory method would have no transformation logic — just pass-through to the constructor

## Best Practices

- Always construct DTOs from validated data, never from raw input
- Name factories by source: `fromArray`, `fromRequest`, `fromModel`
- Handle missing keys explicitly in `fromArray`: use `?? throw new InvalidArgumentException(...)` instead of silent null
- Coerce types in the constructor or factory method — don't leave string-to-Carbon parsing to downstream consumers
- Test each named constructor independently, including error cases for missing keys
- Keep factories consistent across all DTOs in the codebase

## Architecture Guidelines

- For complex construction logic, extract a separate factory class with injectable dependencies
- Use `fromArray` for pure key-to-property mapping without source-specific transformations
- Use `fromRequest` for request-specific transformations (extracting validated data, formatting)
- Use `fromModel` for Eloquent model-to-DTO mappings
- Limit named constructors to 3-4 per DTO — more indicates the DTO is used in too many contexts

## Performance Considerations

- Static factory method overhead is identical to direct construction — the static method is inlined by OpCache
- Collection construction using `array_map` is efficient for typical sizes (10-100 items)
- For large collections (1000+ items), consider generator-based construction
- Instance factories add ~0.005ms resolution cost per factory

## Security Considerations

- DTO factories must only receive validated data — never raw `$request->all()`
- Type coercion in factories protects against type confusion (e.g., string where int is expected)
- Factory methods should not silently accept missing keys — explicit validation prevents data corruption
- Instance factories with injected dependencies must not leak database/external state into DTOs

## Common Mistakes

- **Mixing Source-Specific Logic in fromArray**: Adding request-specific mapping in `fromArray` couples it to a specific source format. Solution: Keep `fromArray` a pure key-to-property mapping; use `fromRequest` for request-specific logic.
- **Skipping Type Coercion**: Passing raw strings as dates or integers as enum values. Solution: Coerce types in the constructor or factory method.
- **Factory Methods Without Error Handling**: Assuming input data is always complete. Solution: Validate key presence with explicit checks.
- **Factory Method Explosion**: 6+ named constructors on one DTO. Solution: Split into operation-specific DTOs or extract factories to dedicated classes.

## Anti-Patterns

- **Silent Null Assignment**: `$data['missing_key']` emits a Warning and returns null. If the property is nullable, null is silently accepted — masking missing data.
- **God Factory**: A single factory class constructing all DTOs in the application. Creates coupling between unrelated DTOs.
- **Factory in Controller**: DTO construction logic inline in the controller instead of encapsulated in a factory method on the DTO.

## Examples

### Named Constructors
```php
class UserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'] ?? throw new InvalidArgumentException('name is required'),
            email: $data['email'] ?? throw new InvalidArgumentException('email is required'),
        );
    }

    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            email: $request->validated('email'),
        );
    }
}
```

### Collection Construction
```php
class LineItemDto
{
    public static function collection(array $items): array
    {
        return array_map(
            fn(array $item) => self::fromArray($item),
            $items,
        );
    }
}
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Data Transfer Object Design | Core DTO principles | Prerequisite |
| DTO Nesting Composition | Nested DTO construction | Related |
| Spatie Laravel Data Integration | Package-based construction | Related |
| Factory Pattern for Complex DTOs | Separate factory classes with DI | Follow-up |
| DTO Validation Integration | Validation in DTO construction | Follow-up |

## AI Agent Notes

- Named constructors are the most important DTO construction pattern — they document data source and encapsulate mapping logic
- Without them, mapping logic bleeds into controllers and services — the exact problem DTOs are meant to solve
- Use static factories by default; extract to instance factories only when DI is required
- When generating DTOs, always include `fromArray()` and at least one source-specific named constructor
- Keep factory method count per DTO to 3-4 maximum

## Verification

- [ ] Each DTO has at least one named constructor for its primary data source
- [ ] Named constructors handle missing keys explicitly (throw on required, default on optional)
- [ ] Type coercion is performed in constructors or factory methods
- [ ] Factories only receive validated data, never raw input
- [ ] Each named constructor is independently tested
- [ ] No DTO has more than 4 named constructors
- [ ] Collection construction is typed (returns array of DTOs, not array of arrays)
