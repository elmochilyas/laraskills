# Skill: Implement and Test DTO Output Methods

## Purpose

Implement canonical output methods (`toArray()`, `JsonSerializable`) on DTOs that produce consistent, controlled output representations without leaking business logic or internal fields.

## When To Use

- Adding `toArray()` to a new DTO
- Adding `JsonSerializable` for `json_encode()` compatibility
- Refactoring existing DTOs with multiple or inconsistent output methods
- Setting up output for nested DTOs

## When NOT To Use

- When output shapes differ significantly — use a dedicated Transformer class or Output DTO instead
- When HTTP response shaping is needed — use API Resources
- For batch/streaming serialization of 10,000+ items — use streaming instead of bulk `toArray()`

## Prerequisites

- DTO class declared with readonly properties
- Understanding of which properties should be exposed vs internal
- Output key naming convention decided (snake_case vs camelCase)

## Inputs

- DTO class definition with typed properties
- List of properties to include in output (with key mappings)
- Date and number formatting requirements
- Nested DTO serialization requirements

## Workflow

1. Identify all properties that should appear in output — exclude internal flags, database IDs, computed intermediates, and sensitive fields
2. Define key mapping: decide external key names for each property (e.g., `createdAt` → `created_at`)
3. Implement `toArray()` with explicit array key-value pairs — do not use `get_object_vars()` or dynamic iteration
4. Implement `JsonSerializable` by delegating to `toArray()` — do not duplicate the mapping
5. For each property that needs type transformation (date formatting, number formatting), apply it inside `toArray()`
6. For nested DTOs, call `->toArray()` on child DTOs — do not access child properties directly
7. For collections of DTOs, use `array_map(fn(ChildDto $d) => $d->toArray(), $this->items)`
8. For nullable child DTOs, check for null before calling `toArray()`
9. Verify no circular references exist in the DTO tree — replace parent object refs with scalar IDs
10. Write a test that asserts exact output shape including keys, value types, date formatting, and null handling

## Validation Checklist

- [ ] `toArray()` is the single canonical output method
- [ ] `JsonSerializable` delegates to `toArray()`
- [ ] Output keys are explicitly mapped, not derived from property names
- [ ] Internal/sensitive fields are not exposed
- [ ] No business logic or expensive computations in `toArray()`
- [ ] Nested DTOs serialize recursively via child `toArray()` calls
- [ ] No circular references in DTO tree
- [ ] Round-trip consistency verified for bidirectional DTOs
- [ ] Test asserts exact output shape including all keys and types

## Common Failures

- **Leaky output**: `get_object_vars($this)` exposes internal fields. Always use explicit key mapping.
- **Business logic in toArray**: Computing totals or applying discounts during serialization. Pre-compute in service layer.
- **Circular reference crash**: Child DTO holding parent reference causes infinite recursion. Use scalar parent IDs.
- **Inconsistent key naming**: Mixing snake_case and camelCase across DTOs. Decide one convention.
- **Round-trip breakage**: `toArray()` produces `full_name` but `fromArray()` expects `first_name`/`last_name`. Ensure consistency.

## Decision Points

- **Single bidirectional DTO vs separate input/output DTOs**: If input/output shapes share fewer than 50% of fields, use separate DTOs.
- **Transformer class vs inline toArray**: If a DTO has 3+ output shapes (API, CSV, email), use a Transformer class.
- **Date format in output**: Decide ISO 8601 vs locale-specific. Use ISO 8601 for API, locale for presentation.

## Performance Considerations

- `toArray()` is O(n) in property count — microsecond cost for typical DTOs
- Recursive nested serialization is O(total properties in tree)
- Spatie reverse pipeline adds ~0.01-0.1ms per property
- For 10,000+ items, consider streaming serialization instead of bulk `toArray()`

## Security Considerations

- Strip internal fields (database IDs, internal flags, secret keys) before output
- Computed properties must not leak sensitive derived data
- Control the serialization surface explicitly — every property in output must be intentional

## Related Rules

- Rule 1: Use `toArray()` as the Canonical Output Method
- Rule 2: Never Include Business Logic in `toArray()`
- Rule 3: Separate Output Shapes with Dedicated Transformers or Output DTOs
- Rule 4: Ensure Round-Trip Consistency for Bidirectional DTOs
- Rule 5: Use Key Mapping to Decouple Internal Property Names from External Representations
- Rule 6: Control the Serialization Surface — Never Leak Internal Fields
- Rule 7: Use Dedicated Output DTOs When Input and Output Shapes Diverge Significantly
- Rule 8: Prevent Circular References in Recursive Serialization

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- Nested DTOs: Construct and Serialize Nested DTO Trees
- DTO Testing: Write DTO Contract Tests

## Success Criteria

- All DTOs have a single `toArray()` method with explicit key mapping
- `json_encode($dto)` produces the same output as `$dto->toArray()`
- No business logic or expensive computation is present in any output method
- Output shape is verified by contract tests that assert exact keys and types
- DTO tree serializes without error — no circular references
- Sensitive/internal fields are absent from all output

---

# Skill: Build a Dedicated DTO Transformer for Multiple Output Shapes

## Purpose

Create a Transformer class that converts a single DTO into multiple output representations (API response, CSV row, email data, export format) without polluting the DTO's own `toArray()` method.

## When To Use

- A DTO needs 3+ distinct output shapes with different field sets
- Output shapes include structural conditionals (add/remove entire keys per context)
- Different consumers need different data from the same DTO
- Current `toArray()` has become a conditional mess

## When NOT To Use

- Only one output shape exists — keep it on the DTO's `toArray()`
- Minor conditional formatting (null handling, locale dates) — acceptable in `toArray()`
- Output is for HTTP responses — prefer API Resources

## Prerequisites

- Source DTO class with all properties needed across all output shapes
- Clear specification of each output shape's field set and format
- Naming convention for transformer methods

## Inputs

- Source DTO class definition
- List of output shapes (e.g., API list, API detail, CSV export, email)
- Per-shape field specifications: which fields, key names, formatting rules
- Per-shape null handling rules

## Workflow

1. Create a Transformer class named `{Entity}DtoTransformer` (e.g., `UserDtoTransformer`)
2. Define one public method per output shape following `to{Shape}()` naming (e.g., `toApiList()`, `toCsvRow()`, `toEmailContext()`)
3. Each method receives the source DTO as a parameter and returns an array
4. Inside each method, build the output array with explicit key mapping from DTO properties
5. Apply type formatting per shape (API: ISO 8601 dates, CSV: date strings, email: formatted strings)
6. Include shape-specific computed fields (e.g., API: hypermedia links, CSV: row index, email: unsubscribe link)
7. Keep all methods deterministic — no external service calls, no business logic computation
8. Write one test per output method asserting exact shape, keys, types, and null handling

## Validation Checklist

- [ ] Transformer class has no mutable state — all methods are stateless
- [ ] Each method receives a typed DTO parameter
- [ ] Each method returns a typed array
- [ ] No business logic or external service calls in transformer methods
- [ ] Each output shape has a dedicated test
- [ ] Transformer is tested independently of the DTO's `toArray()`

## Common Failures

- **Transformer with state**: Instance properties used to cache or accumulate across calls. Keep methods stateless.
- **Duplicate DTO methods**: Some shape-specific logic leaks into the DTO's `toArray()`, creating two paths. Remove conditional logic from `toArray()`.
- **Missing null handling**: One shape includes optional fields, another omits them. Handle explicitly per method.
- **Transformer as service**: Injecting repositories or HTTP clients. Transformers format data; they do not fetch it.

## Decision Points

- **Transformer class vs separate Output DTOs**: Transformer is stateless and operates on a single source DTO. Output DTO is a separate readonly class with its own factory — use when the output shape is complex enough to warrant its own type.
- **Method naming convention**: `toApiListResponse(UserDto $dto)` vs `toList(UserDto $dto)`. Choose a consistent pattern that documents the output format.

## Performance Considerations

- Transformer methods are O(output fields) — negligible cost
- Multiple output methods per DTO in the same request add proportional cost
- For batch transformations (1000+ items), consider collecting and transforming in bulk

## Security Considerations

- Each output method must control its own serialization surface — do not share a common `toArray()` that may include fields not intended for all shapes
- Ensure sensitive fields are explicitly excluded from shapes that do not need them

## Related Rules

- Rule 3: Separate Output Shapes with Dedicated Transformers or Output DTOs
- Rule 6: Control the Serialization Surface — Never Leak Internal Fields

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- DTO Testing: Write DTO Contract Tests

## Success Criteria

- Transformer class exists with one method per output shape
- No conditional logic in the source DTO's `toArray()`
- Each output method has a passing test asserting exact shape
- Adding a new output shape requires adding one method and one test — no changes to the source DTO
