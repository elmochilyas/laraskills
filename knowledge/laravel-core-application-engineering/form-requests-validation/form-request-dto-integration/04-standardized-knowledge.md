# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Form Request DTO Integration |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Form Request DTO integration bridges the HTTP validation layer and the typed data transfer layer. The pattern converts a validated FormRequest into a typed DTO before passing it to services or actions. This ensures that services receive strongly-typed, validated data without depending on the HTTP request object. The bridge pattern is typically a `toDto()` method on the FormRequest or a static factory method on the DTO that accepts a FormRequest.

---

## Core Concepts

- **Bridge pattern**: Client → FormRequest (validates) → toDto() → DTO (typed) → Service/Action
- **validated() as DTO source**: Returns only data that passed validation — safe input for DTO construction
- **Anti-corruption layer**: DTO insulates domain code from HTTP concepts — domain never touches the request
- **payload() method**: Some teams add this convenience method to FormRequest to return DTO directly
- **safe() for scoped access**: `$request->safe()->only(['field1', 'field2'])` for subset DTO construction

---

## When To Use

- Services and actions that need typed, validated input
- Data crossing multiple layers (controller → service → action → repository)
- API-first applications where request data must be serialized, cached, or queued
- Teams that enforce strong typing and immutability in the domain layer

## When NOT To Use

- Simple CRUD where data flows directly from controller to Eloquent create/update
- Single-layer operations where the DTO adds ceremony without benefit
- Actions that only need 1-2 fields from the request

---

## Best Practices

- **Use `validated()` not `$request->all()`** — ensures only validated data reaches the DTO
- **Make DTOs immutable** — use `readonly` properties (PHP 8.1+) for type safety and immutability
- **Keep DTOs in the domain layer** — not in the HTTP layer — so they can be used without HTTP dependency
- **Use static factory methods**: `UserDto::fromRequest($request)` for clean controller code
- **Add `payload()` convenience method** on FormRequest when the pattern is used consistently
- **Don't pass the FormRequest to the service layer** — always convert to DTO first

---

## Architecture Guidelines

- DTO construction from `$request->validated()` via constructor spread or named arguments
- `safe()` returns `ValidatedInput` with `->only()` and `->except()` for scoped DTO creation
- `validated()` excludes fields that failed or were excluded (`exclude_if`/`exclude_unless`)
- `validated()` includes fields with rules and matching data, even through `nullable`
- The DTO namespace should be in the domain/feature layer, not in `App\Http\Requests`

---

## Performance

DTO construction adds negligible overhead — creating a PHP object from an array is sub-millisecond. The benefit of type safety and immutability far outweighs the minimal performance cost. In hot code paths, the DTO can be cached or reused.

---

## Security

DTOs provide an additional security layer by ensuring only validated, typed data reaches domain code. The `validated()` method guarantees no extra fields leak through. DTOs prevent type confusion attacks by enforcing proper types.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Passing FormRequest to service | Convenience | Service coupled to HTTP | Convert to DTO in controller |
| Using `$request->all()` for DTO | Hastily copying all input | Unvalidated data in DTO | Use `$request->validated()` |
| DTO in HTTP namespace | Placing DTO in `Http/DTOs/` | Domain code depends on HTTP | Place DTO in domain/feature layer |
| Mutable DTO properties | Not using readonly | DTO mutated after creation | Use `readonly` properties |
| DTO with no validation guarantee | Skipping valid() check | Invalid data enters domain | Always build from validated() |

---

## Anti-Patterns

- **Passing FormRequest directly to service**: `$service->execute($request)` — couples service to HTTP
- **Using `$request->all()` for DTO**: `new UserDto($request->all())` — unvalidated data
- **DTO with public setters**: Breaks immutability guarantee
- **One giant DTO for all actions**: Same DTO used for store, update, and partial updates — leads to nullable fields

---

## Examples

**DTO with fromRequest factory:**
```php
class UserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $bio,
    ) {}

    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(...$request->validated());
    }
}
```

**Controller usage:**
```php
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute(UserDto::fromRequest($request));
}
```

**payload() on FormRequest:**
```php
class StoreUserRequest extends FormRequest
{
    public function rules(): array { /* ... */ }

    public function payload(): UserDto
    {
        return new UserDto(...$this->validated());
    }
}

// Controller
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute($request->payload());
}
```

**safe() for scoped DTO:**
```php
public function payload(): UserDto
{
    $data = $this->safe()->only(['name', 'email', 'bio']);
    return new UserDto(...$data);
}
```

---

## Related Topics

- form-request-fundamentals — FormRequest architecture
- input-preparation — Preparing data for validation before DTO
- request-organization — Where requests live
- dtos — DTO fundamentals and patterns
- service-layer-pattern — Services that consume DTOs

---

## AI Agent Notes

- `validated()` excludes fields that have rules but no matching data AND excluded fields
- `safe()` returns `ValidatedInput` instance supporting `->only()` and `->except()`
- The service layer should never depend on HTTP concepts — always convert to DTO in controller
- DTO construction from `validated()` guarantees only validated data enters the DTO
- PHP 8.1's `readonly` properties enforce immutability at the language level

---

## Verification

- [ ] Services receive DTOs, not FormRequests
- [ ] DTOs built from `$request->validated()` not `$request->all()`
- [ ] DTOs use readonly properties
- [ ] DTOs in domain/feature layer, not HTTP layer
- [ ] Controller converts request to DTO before passing to service
- [ ] `payload()` or `fromRequest()` pattern used consistently
- [ ] No HTTP coupling in domain layer
- [ ] Tests cover DTO construction from valid/invalid data
