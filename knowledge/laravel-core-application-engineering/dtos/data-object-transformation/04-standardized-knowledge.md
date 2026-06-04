# Data Object Transformation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Data Object Transformation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

## Overview

DTO transformation is the process of converting a DTO into other representations — arrays, JSON, API resource responses, or database persistence shapes. While DTOs are primarily input carriers at the HTTP boundary, they are frequently used as output carriers too, serving as the source data for API resources, Blade views, and Inertia responses.

The engineering challenge is that output transformation often needs different data shapes than input. An input DTO may contain nested objects that should be flattened for JSON output, or include computed values that have no input equivalent. The spatie/laravel-data package handles this via a reverse pipeline that casts typed properties back into primitives, while plain DTOs use explicit `toArray()` or `jsonSerialize()` methods.

## Core Concepts

- **Bidirectional Mapping:** Input DTOs receive raw data and produce typed objects. Output DTOs reverse this — typed objects produce raw data. When used bidirectionally, each property's caster must work in both directions.
- **The toArray Contract:** `toArray()` is the canonical output method. Every output representation ultimately derives from it. Key mapping decouples internal DTO shape from external representation.
- **JsonSerializable:** Implementing `JsonSerializable` allows `json_encode($dto)` to work directly. Typically delegates to `toArray()`.
- **Computed Properties:** Properties that exist only in output, derived from input properties. They have no input equivalent — cannot be set during DTO construction.
- **Recursive toArray:** For nested DTOs, `toArray` must recurse through child DTOs, calling their `toArray()` methods.

## When To Use

- `toArray()` for simple output with no conditional logic
- `JsonSerializable` for JSON-only output requiring `json_encode` compatibility
- Dedicated Transformer class when a DTO has many output shapes (API, export, report, email)
- Separate Output DTO when output shape differs significantly from input shape

## When NOT To Use

- Do NOT put business logic or expensive computations in `toArray()` — it should be a pure transformation of pre-computed data
- Do NOT create a single bidirectional DTO when input and output shapes diverge significantly — use input-only DTOs and separate output transformers
- Do NOT use DTOs for HTTP response shaping when API Resources are available — Resources provide built-in conditional loading and pagination

## Best Practices (WHY)

- **Why separate output DTOs for complex shapes:** A single DTO with conditional `toArray()` logic becomes hard to maintain. Separate DTOs per output shape (list, detail) avoid conditional complexity.
- **Why avoid business logic in toArray:** `toArray` should transform data format, not compute business values. Pre-compute business values in the service layer and store as DTO properties.
- **Why round-trip consistency:** A DTO that cannot be reconstructed from its own `toArray` breaks serialization/deserialization patterns. Ensure `fromArray` can consume `toArray` output, or document they are not inverses.
- **Why input-only DTOs + API Resources for output:** DTOs handle typed internal data flow; API Resources handle HTTP response shaping with built-in conditionals. Complementary, not competing.

## Architecture Guidelines

- Establish output format conventions: ISO 8601 for dates, integers for cents, consistent null handling
- Use `toArray()` as the single output method; `JsonSerializable` delegates to it
- For bidirectional DTOs, ensure casters are invertible (input cast ↔ output serialize)
- Test each output method: expected keys, value types, null handling, date formatting
- For large collections (10,000+), use streaming serialization instead of bulk `toArray()`

## Performance

`toArray()` is O(n) in property count — microsecond-level cost. Recursive `toArray` on nested DTOs is O(total properties in the tree). Spatie's reverse pipeline adds ~0.01-0.1ms per property. Lazy property serialization can dominate response time if the underlying resolution is expensive. Profile lazy properties as part of endpoint performance.

## Security

- Avoid exposing internal property names in output — use key mapping to rename
- Strip internal fields (database IDs, internal flags) before output
- Computed properties should not leak sensitive derived data
- For API output, always control the serialization surface explicitly

## Common Mistakes

1. **Inconsistent Naming Between Input and Output:** Using `snake_case` for input and `camelCase` for output creates confusion. Choose one or use explicit mapping in both directions.

2. **Round-Trip Breaking:** A DTO that produces `full_name` in `toArray()` but expects `firstName`/`lastName` in `fromArray()` cannot round-trip. Ensure consistency or document the asymmetry.

3. **Over-Computation in toArray:** Expensive operations in `toArray` appear as "JSON encoding time" in profiling. Keep transformations pure and lightweight.

4. **Recursive Serialization Overflow:** A DTO that references itself (directly or through children) causes infinite recursion in `toArray`. Replace parent references with scalar IDs.

## Anti-Patterns

- **The Conditional toArray:** A single `toArray()` method with complex conditional logic depending on context. Makes the output contract unpredictable. Use separate transformers or output DTOs.
- **The Business Logic Transformer:** Computing totals, applying discounts, or formatting currency inside `toArray()`. Business logic belongs in the service layer; `toArray` formats pre-computed values.
- **The Leaky DTO:** A `toArray()` that returns the full internal DTO structure including sensitive or internal fields. Always control the serialization surface.

## Examples

### Basic toArray Implementation
```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public CarbonImmutable $createdAt,
    ) {}

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->createdAt->toIso8601String(),
        ];
    }
}
```

### Transformer for Multiple Output Shapes
```php
class UserDtoTransformer
{
    public function toApiResponse(UserDto $dto): array
    {
        return [
            'id' => $dto->id,
            'fullName' => "{$dto->firstName} {$dto->lastName}",
            'email' => $dto->email,
            'links' => ['self' => route('api.users.show', $dto->id)],
        ];
    }

    public function toCsvRow(UserDto $dto): array
    {
        return [$dto->id, $dto->email, $dto->createdAt->toDateString()];
    }
}
```

### Separate Output DTO
```php
readonly class UserListDto
{
    public function __construct(
        public int $id,
        public string $fullName,
        public string $email,
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->fullName,
            'email' => $this->email,
        ];
    }
}
```

## Related Topics

- **DTO Fundamentals** — baseline DTO definition
- **DTO Construction Patterns** — input-side factories
- **Nested DTOs** — recursive toArray for DTO trees
- **API Resources** — HTTP-specific output transformation
- **DTO vs Form Request** — input boundary decisions

## AI Agent Notes

- Use `toArray()` as the canonical output method
- Implement `JsonSerializable` for direct `json_encode` support
- Pre-compute business values before DTO construction, not during serialization
- For multiple output shapes, use a dedicated Transformer class
- Ensure output key naming conventions are consistent with the rest of the project
- Test each output method for expected keys, types, and edge cases

## Verification

- [ ] `toArray()` is implemented and produces expected output shape
- [ ] `JsonSerializable` is implemented for JSON compatibility
- [ ] No business logic or expensive computations in `toArray()`
- [ ] Output key naming is consistent across all DTOs
- [ ] Round-trip consistency is verified (or documented asymmetry)
- [ ] Nested DTO serialization recurses correctly
- [ ] No circular references in DTO serialization
- [ ] Each output method has a dedicated test
