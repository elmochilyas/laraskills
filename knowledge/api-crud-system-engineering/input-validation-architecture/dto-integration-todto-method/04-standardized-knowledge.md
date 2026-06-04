# DTO Integration: toDto() Method

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-dto-integration-todto-method |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Advanced |
| Classification | Integration Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

The `toDto()` method convention converts validated request data into a DTO. Unlike `payload()`, which is request-bound, `toDto()` can exist as a standalone mapper, decoupling DTO construction from HTTP concerns. This flexibility enables version bridging — an API v2 request can produce a v1 DTO or vice versa.

## Core Concepts

- **`toDto()` as Explicit Conversion**: Converts validated request data into a domain DTO, either on the request or as a standalone mapper.
- **`payload()` vs `toDto()`**: `payload()` is request-bound; `toDto()` can be a separate converter. `toDto()` is more flexible for version bridging.
- **Standalone Mapper**: Separate class that converts request → DTO, enabling independent versioning and testing.
- **Version Bridging**: Standalone mappers allow different API versions to produce the same DTO or vice versa.
- **Invokable Mapper Pattern**: Single-action class registered in the container for clean controller injection.

## When To Use

- When DTO construction logic is complex enough to warrant separation from the request
- When multiple request types produce the same DTO
- When API versioning requires different request→DTO mappings per version
- When the DTO conversion requires dependencies (services, repositories)
- When the same mapping is needed in non-HTTP contexts (jobs, commands)

## When NOT To Use

- For simple DTO construction that mirrors validated data exactly — use `payload()` instead
- When the request class already has a `payload()` method (choose one pattern per endpoint)
- For endpoints where the DTO is constructed directly in the controller
- When no DTO is used and validated data flows directly to models

## Best Practices (WHY)

- **Use standalone mappers for cross-version scenarios**: Enables version bridging without changing request classes.
- **Use invokable mappers for clean injection**: Single-action, container-resolved, testable.
- **Separate mapping from validation**: toDto() can live independently, allowing mapping to evolve separately from validation rules.
- **Use constructor injection in mappers**: Service dependencies are explicit and mockable.
- **Return readonly DTOs**: Prevent mutation after mapping.
- **Test mappers independently**: No HTTP dependency — test with validated arrays directly.
- **Name mappers descriptively**: `PostRequestToDtoMapper` or `MapPostRequestToData`.

## Architecture Guidelines

- Place standalone mappers in `App\Mappers\{Resource}\` directory.
- Name invokable mappers with action-oriented names: `MapPostRequestToData`.
- Register mappers in the container for dependency injection.
- For update scenarios, pass the existing model to `toDto()` for default values.
- Use `toDto()` on the request for simple endpoint-specific mapping.
- Use standalone mappers when the same DTO construction is needed across multiple request types.

## Performance Considerations

- DTO construction in `toDto()` is in-memory — negligible cost.
- Standalone mappers add one class per request-to-DTO mapping.
- Invokable mappers resolved via container per request — fine for typical use.
- Mapper services are shared (singleton) in the container — resolved once.

## Security Considerations

- `toDto()` should only use validated data from the request — never raw input.
- Standalone mappers must not bypass validation — they receive `validated()` data, not the raw request.
- Audit fields should come from authenticated context, not user input.
- Mappers should not have side effects — only data transformation.
- When version bridging, ensure the mapper doesn't introduce fields that didn't pass validation.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Calling toDto() before validation | `validated()` throws or returns empty | Wrong lifecycle timing | Exception or empty DTO | Controller type-hint ensures validation ran |
| Including unvalidated data | Fields from `$this->input()` in DTO | Not using `validated()` | Invalid data in DTO | Only use `$request->validated()` |
| Mapper doing I/O | DB queries, API calls in mapper | Convenience | Performance issues; side effects | Keep mappers as pure transformation |
| Naming collision with Eloquent | `$model->toDto()` vs `$request->toDto()` | Overloaded naming | Confusion about source | Use class-specific naming |
| Not registering mapper | `BindingResolutionException` | Forgetting container registration | Runtime error | Register in service provider |

## Anti-Patterns

- **Mapper that accesses the request object directly**: Should receive validated data, not the request.
- **Mapper with business logic**: Only data transformation — logic belongs in services/actions.
- **`toDto()` on request and standalone mapper coexisting for the same endpoint**: Confusing.
- **Mapper serializing/deserializing**: Should construct objects directly.
- **Mapper with side effects**: No DB writes, job dispatches, or external calls.

## Examples

```php
// Standalone invokable mapper
class MapPostRequestToData
{
    public function __invoke(StorePostRequest $request): PostData
    {
        return PostData::from([
            ...$request->validated(),
            'author_id' => $request->user()->id,
        ]);
    }
}

// In controller:
public function store(StorePostRequest $request, MapPostRequestToData $mapper): PostResource
{
    $post = Post::create($mapper($request));
    return PostResource::make($post);
}
```

## Related Topics

- Form Request Design for APIs (request providing validated data)
- DTO Integration: payload() Method (alternative payload() pattern)
- Data Transfer Object Design (DTO fundamentals)
- Input Preparation (preparing input before toDto())
- Controller → DTO → Action → Response Flow (end-to-end data flow)

## AI Agent Notes

- Choose `payload()` or `toDto()` per endpoint — don't use both.
- Use standalone mappers for cross-version scenarios; use request-bound for simple cases.
- Mappers should only transform data — no I/O or side effects.
- Register invokable mappers in the container for automatic injection.
- When generating update endpoints, pass existing model to mapper for default values.

## Verification

- [ ] toDto() / mapper uses only validated data from the request
- [ ] Standalone mappers are registered in the container
- [ ] Mappers are pure transformation — no I/O or side effects
- [ ] Returned DTOs are readonly/immutable
- [ ] Mapper naming is clear and doesn't collide with Eloquent methods
- [ ] Version bridging mappers exist for each API version when needed
- [ ] Tests verify mapper output matches expected DTO structure
