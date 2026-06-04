# DTO Integration: payload() Method

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-dto-integration-payload-method |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Advanced |
| Classification | Integration Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

The `payload()` method pattern adds a method to FormRequest that returns a typed DTO, bridging validation and domain layers. This eliminates manual `validated()` array access in controllers and provides compile-time safety for request data consumption. The FormRequest acts as a factory for DTOs, owning both validation rules and object construction.

## Core Concepts

- **`payload()` as Typed Accessor**: Returns a typed DTO constructed from validated request data.
- **DTO as Contract**: The return type of `payload()` IS the contract — consumers know the exact data shape.
- **Request as Factory**: The FormRequest owns both validation rules and DTO construction in a single cohesive unit.
- **Anti-Corruption Layer**: Bridges HTTP request format (arrays, strings) and domain layer (typed objects, Value Objects, enums).
- **`validated()` + extra data**: `payload()` can merge validated data with server-generated fields (user ID, timestamps).

## When To Use

- For any endpoint where validated data flows to a DTO
- When using Spatie Laravel Data or custom DTO classes
- When controllers should not access raw `validated()` arrays
- For type safety in controller and service layer method signatures
- When the same DTO is used across multiple endpoints

## When NOT To Use

- For simple CRUD where `Model::create($validated)` suffices
- When the validated data shape exactly matches the model and no DTO is needed
- For endpoints where validated data is used directly without transformation
- When using `toDto()` as a standalone mapper instead

## Best Practices (WHY)

- **Use `payload()` over `validated()` in controllers**: Type-safe, compile-time checked, no magic keys.
- **Use only `$this->validated()` for DTO data**: Never include unvalidated input in the DTO.
- **Return readonly/immutable DTOs**: Prevents mutation after construction.
- **Use Spatie's `from()` for simple mapping**: Reduces boilerplate for straightforward DTO construction.
- **Use constructor-based DTO for complex mapping**: Full control over type casting and defaults.
- **Keep `payload()` free of I/O**: Should only map data — no DB queries or API calls.
- **Document the return type with PHPDoc**: IDE autocompletion for downstream consumers.

## Architecture Guidelines

- Define `payload(): SomeDto` on each FormRequest that produces typed data.
- Use only `$this->validated()` as the data source — never `$this->all()` or `$this->input()`.
- For nested DTOs, manually map using constructor pattern.
- Use Spatie's `DataRequest` for auto-generated payload() from `$dataClass`.
- Test `payload()` by constructing the request, calling `validate()`, and asserting DTO properties.
- Keep conditional logic in `payload()` minimal — extract to factory methods if needed.

## Performance Considerations

- DTO construction in `payload()` is a one-time cost per request.
- Spatie's `from()` uses reflection — cache DTO class metadata if constructing many DTOs.
- Constructor-based DTO creation (no reflection) is faster than `from()`.
- `array_map` over validated items is O(n) — fine for typical batch sizes.

## Security Considerations

- Never include unvalidated data in `payload()` — use only `$this->validated()`.
- Audit fields (user ID, IP) merged in `payload()` must come from authenticated context.
- DTOs returned from `payload()` should be immutable — prevents downstream mutation.
- Ensure nested DTOs receive validated nested data, not raw input.
- `payload()` should not expose internal identifiers that weren't part of validated input.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Mixing validated and unvalidated data | Including `$this->input()` or `$this->all()` | Convenience | Invalid data in DTO | Only use `$this->validated()` |
| Returning mutable DTO | Properties can be changed after payload() | Not using readonly | Unpredictable data in downstream | Use readonly DTOs |
| Multiple `validated()` calls | Each rebuilds the filtered array | Not storing result | Redundant work | Call `validated()` once, store in variable |
| payload() doing I/O | DB queries, API calls in payload() | Convenience | Performance penalty; side effects | Keep payload() as pure mapping |
| Nested DTO receiving raw array | Nested `from()` not mapped | Forgetting to handle nesting | TypeError | Manually map nested arrays with array_map |

## Anti-Patterns

- **`payload()` returning `array` instead of typed DTO**: Defeats the purpose of type safety.
- **`payload()` mixing validated and request data**: Some fields from `validated()`, some from `input()`.
- **`payload()` with side effects**: Modifies database, dispatches jobs, calls APIs.
- **`payload()` with business logic**: Should only map data — logic belongs in services/actions.
- **`payload()` called before validation**: Controller must ensure validation ran via type-hint.

## Examples

```php
class StorePostRequest extends FormRequest
{
    public function rules(): array { ... }

    public function payload(): PostData
    {
        return PostData::from([
            ...$this->validated(),
            'author_id' => $this->user()->id,
            'author_ip' => $this->ip(),
            'slug' => Str::slug($this->validated('title')),
        ]);
    }
}

// In controller:
public function store(StorePostRequest $request): PostResource
{
    $post = $this->posts->create($request->payload());
    return PostResource::make($post);
}
```

## Related Topics

- Form Request Design for APIs (base request hosting payload())
- Data Transfer Object Design (DTO fundamentals for payload())
- DTO Integration: toDto() Method (alternative toDto() pattern)
- Input Preparation (preparing input before payload() mapping)
- Controller → DTO → Action → Response Flow (end-to-end data flow)

## AI Agent Notes

- Add `payload()` method to every FormRequest that produces typed data for the controller.
- Use only `$this->validated()` — never `$this->all()` or `$this->input()`.
- Return readonly/immutable DTOs from `payload()`.
- Keep `payload()` as a pure mapping function — no I/O or side effects.
- When generating controllers, use `$request->payload()` instead of `$request->validated()`.

## Verification

- [ ] Every FormRequest with downstream DTO has a `payload()` method
- [ ] `payload()` uses only `$this->validated()` as data source
- [ ] DTO returned from `payload()` is readonly/immutable
- [ ] No I/O or side effects in `payload()` methods
- [ ] Controllers use `$request->payload()` instead of `$request->validated()`
- [ ] Integration tests verify `payload()` DTO construction matches validation rules
- [ ] Nested DTOs are manually mapped with proper type handling
