# pagination-information-customization

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: pagination-information-customization
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Pagination information customization allows API developers to override the default pagination metadata shape produced by Laravel's `PaginatedResourceResponse`. By overriding `paginationInformation()` on resource collections, developers can rename fields, restructure the metadata object, add custom keys, or omit sensitive or internal pagination data — tailoring the pagination contract to specific API consumers without modifying the underlying paginator.

The method acts as a filter between the paginator's raw output and the response. It receives the serialized paginator array and the current request, returns the final metadata array, and is called during `PaginatedResourceResponse::toResponse()`.

## Core Concepts
- **paginationInformation() Method**: A protected method on `ResourceCollection` that transforms paginator output before response assembly.
- **Override Point**: Called during `PaginatedResourceResponse::toResponse()`. Overriding in a custom `ResourceCollection` subclass intercepts metadata before serialization.
- **Request Awareness**: Receives the current request, enabling conditional metadata inclusion based on query parameters, headers, or client capabilities.
- **Paginator Type Awareness**: The method can detect whether the paginator is `LengthAwarePaginator`, `Paginator`, or `CursorPaginator` and adjust output accordingly.
- **Inheritance**: Custom `paginationInformation()` behavior is inherited by child resource collections unless overridden.
- **Call Chain**: `ResourceCollection::toResponse()` → `PaginatedResourceResponse::toResponse()` → `PaginatedResourceResponse::paginationInformation()` → `ResourceCollection::paginationInformation()`.
- **Merge Order**: The returned array is merged into the response's `meta` key alongside additional meta from `ResourceCollection::with()`.
- **Links Control**: The method also controls the `links` object via the paginator's `linkCollection()` method.

## When To Use
- APIs that need different pagination field naming (camelCase for JS clients, snake_case for PHP)
- Public APIs where pagination metadata must be minimized for bandwidth
- Multi-version APIs where pagination metadata shape changes between versions
- APIs serving diverse consumers with different metadata requirements
- Wrapping third-party paginator output into a consistent internal format

## When NOT To Use
- Internal APIs where the default Laravel pagination shape is acceptable to all consumers
- Prototypes or MVPs where customization overhead provides no immediate value
- Single-consumer APIs where the client controls both request and response parsing
- APIs without paginated endpoints — customization is dead code until pagination exists
- When customization breaks automatic tooling that expects the default paginator output

## Best Practices (WHY)
- **Extend a base collection class globally**: A single base `ResourceCollection` with overridden `paginationInformation()` provides consistency. Per-collection overrides should be rare exceptions.
- **Match naming convention to API style**: If the API uses camelCase for resource fields, pagination metadata should follow suit. Inconsistency confuses clients.
- **Dual-emit during field renames**: When renaming a pagination field, include both old and new names for one version, then remove the old name in the next. Avoids breaking existing clients.
- **Always return an array**: `paginationInformation()` must return an array. Returning null or a string breaks `PaginatedResourceResponse` response assembly.
- **Check paginator type explicitly**: `CursorPaginator` lacks `total` and `last_page`. Accessing them without type checking throws errors. Use `instanceof` checks.

## Architecture Guidelines
- Place the base `paginationInformation()` override in `App\Http\Resources\BaseCollection` extended by all resource collections.
- Transform the paginator array immutably — never modify the paginator object inside `paginationInformation()`.
- For version-conditional metadata, check `$request->header('Accept')` inside `paginationInformation()` rather than duplicating entire resource collections.
- Document the customized metadata shape in OpenAPI using the custom field names, not the default paginator names.
- Write explicit tests for `paginationInformation()` output for each paginator type — subtle bugs break all paginated endpoints.

## Performance
- `paginationInformation()` operates on the already-serialized paginator array — overhead is negligible (sub-millisecond).
- Stripping `from`, `to`, and `path` saves ~50-80 bytes per response, which compounds at scale.
- Complex conditional chains inside `paginationInformation()` remain in the sub-millisecond range.
- If `paginationInformation()` uses request data to conditionally include fields, cached responses must vary by those request parameters, fragmenting the cache.

## Security
- Never expose raw cursor values or internal paginator state through custom metadata.
- Conditional metadata inclusion based on user roles must be consistent with authorization policies.
- Stripping metadata fields reduces information leakage about dataset size and structure.
- Custom links should use HTTPS URLs and validated route names to prevent host injection.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Modifying paginator state | Mutating the paginator object inside `paginationInformation()` | Treating parameter as mutable reference | Side effects on paginator state cascade to other responses | Transform the array — never touch the paginator object |
| Forgetting parent call | Overriding without `parent::paginationInformation()` | Not understanding inheritance requirement | Entire paginator output is lost | Always call `parent::paginationInformation($paginated, $request)` |
| Assuming LengthAwarePaginator | Accessing `total` or `last_page` on a `CursorPaginator` | Not checking paginator type | TypeError at runtime | Check `$paginated instanceof LengthAwarePaginator` before accessing page-specific fields |
| Returning non-array | Returning null, string, or Collection from the method | Misunderstanding return type contract | Breaks `PaginatedResourceResponse` assembly | Always return `array` — cast or collect if needed |
| Hardcoding paginator keys | Using `$paginated['current_page']` assuming the key exists | Assuming Laravel internals are stable | Breaks on Laravel upgrades that change paginator output keys | Use `$paginated['current_page'] ?? null` with fallback |
| Inconsistent customization across resources | One collection customizes, another does not | No base collection pattern | Clients parse different metadata shapes per endpoint | Centralize customization in a base collection class |

## Anti-Patterns
- **Per-Endpoint Customization**: Each resource collection overrides `paginationInformation()` independently. Use a base class.
- **Modifying Paginator in Place**: Calling methods on the paginator object inside `paginationInformation()`. The method should be a pure transformation.
- **Mixing Snake and Camel Case**: Some metadata fields renamed, others using default Laravel keys. Choose one convention and apply consistently.
- **Silent Field Removal**: Removing fields without versioning or documentation. Clients discover missing fields at runtime.
- **Empty Metadata Array**: Returning `[]` from `paginationInformation()` removes all navigation context from paginated responses.

## Examples
```php
use Illuminate\Http\Resources\Json\ResourceCollection;

class BaseCollection extends ResourceCollection
{
    protected function paginationInformation($request, $paginated, $default)
    {
        // Rename snake_case to camelCase for JS consumers
        return [
            'currentPage' => $paginated['current_page'] ?? null,
            'perPage' => $paginated['per_page'] ?? null,
            'total' => $paginated['total'] ?? null,
            'lastPage' => $paginated['last_page'] ?? null,
            'hasMore' => $paginated['has_more'] ?? null,
            'nextCursor' => $paginated['next_cursor'] ?? null,
            'prevCursor' => $paginated['prev_cursor'] ?? null,
        ];
    }
}

// Usage — every collection extending BaseCollection gets customized metadata
class UserCollection extends BaseCollection {}

return new UserCollection($users);
```

## Related Topics
- **Prerequisites**: pagination-metadata-design, cursor-pagination-metadata
- **Related**: top-level-meta-and-links, response-versioning
- **Advanced**: response-format-decision-framework

## AI Agent Notes
- Override `paginationInformation()` in a base `ResourceCollection` for global customization.
- Check paginator type with `instanceof` before accessing page-specific fields like `total` or `last_page`.
- Use `$request` parameter for version-conditional or role-conditional metadata.
- Never mutate the paginator object — transform the array only.
- Call `parent::paginationInformation()` to preserve default behavior and extend selectively.

## Verification
- A single base collection class centralizes all `paginationInformation()` overrides — no per-collection customization without justification.
- `paginationInformation()` output matches the documented API contract (OpenAPI schema).
- Both `LengthAwarePaginator` and `CursorPaginator` paths are tested.
- Returning camelCase pagination metadata when the API uses camelCase for resource fields.
- Field renames use dual-emit strategy for one version before removing old field names.
- Integration tests assert the customized metadata shape, not the default paginator output.
