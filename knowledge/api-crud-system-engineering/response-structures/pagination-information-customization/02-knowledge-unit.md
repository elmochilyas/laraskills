# pagination-information-customization
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** pagination-information-customization  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Pagination information customization allows API developers to override the default pagination metadata shape produced by Laravel's `PaginatedResourceResponse`. By overriding `paginationInformation()` on resource collections, developers can rename fields, restructure the metadata object, add custom keys, or omit sensitive/internal pagination data — tailoring the pagination contract to specific API consumers without modifying the underlying paginator.

## Core Concepts
- **`paginationInformation()` Method**: A protected method on `ResourceCollection` that receives the paginator's `toArray()` output and the `$request`, returning the final pagination metadata array.
- **Override Point**: `paginationInformation()` is called during `PaginatedResourceResponse::toResponse()`. Overriding it in a custom `ResourceCollection` subclass intercepts metadata before response assembly.
- **Request Awareness**: The method receives the current request, enabling conditional metadata inclusion based on query parameters, headers, or client capabilities.
- **Paginator Type Awareness**: The method can detect whether the paginator is `LengthAwarePaginator`, `Paginator`, or `CursorPaginator` and adjust output accordingly.
- **Inheritance**: Custom `paginationInformation()` behavior is inherited by child resource collections unless overridden.

## Mental Models
- **Filter on the Faucet**: `paginationInformation()` is a filter on the metadata faucet. The paginator produces raw metadata; `paginationInformation()` decides what flows into the response.
- **Transform Adapter**: The method acts as an adapter between Laravel's internal pagination structure and your API's external contract.
- **White-list vs. Blacklist**: Use `paginationInformation()` to white-list (only include specific fields) or blacklist (exclude specific fields from) the paginator output.

## Internal Mechanics
- **Call Chain**: `ResourceCollection::toResponse()` → `PaginatedResourceResponse::toResponse()` → `PaginatedResourceResponse::paginationInformation()` → `ResourceCollection::paginationInformation()`.
- **Default Implementation**: The base `ResourceCollection::paginationInformation()` returns the paginator's `toArray()` output unchanged.
- **Merge Order**: The pagination metadata returned by `paginationInformation()` is merged into the response's `meta` key alongside any additional meta added via `ResourceCollection::with()`.
- **Cursor Pagination Differences**: When using `CursorPaginator`, the `toArray()` output contains cursor-specific fields. The customization method handles both page-based and cursor-based paginators transparently.
- **Links Generation**: The method also controls the `links` object in the response. The default implementation uses the paginator's `linkCollection()` method.

## Patterns
- **Field Renaming Pattern**: Override `paginationInformation()` to transform snake_case paginator keys to camelCase for JavaScript clients:
  `'currentPage' => $paginator['current_page']`
- **Metadata Minimization**: Strip `from`, `to`, `path` from the metadata for machine-to-machine APIs that only need `total` and `current_page`.
- **Conditional Total Inclusion**: Include `total` only when the request includes `?include_total=true`. Otherwise omit it to save the count query.
- **Custom Links Structure**: Replace the default paginator links with a custom structure that includes application-specific link relations.
- **Versioned Pagination Metadata**: Serve different pagination metadata shapes per API version by checking `$request->header('Accept')` inside `paginationInformation()`.

## Architectural Decisions
- **Global vs. Per-Collection Customization**: A base resource collection class with overridden `paginationInformation()` provides global consistency. Per-collection overrides should be exceptions.
- **Field Names: snake_case vs. camelCase**: Choose a naming convention for the entire API. The pagination metadata should match the rest of the API's naming style.
- **Metadata Level of Detail**: Decide how much pagination information to expose. Internal APIs may expose raw cursor values; public APIs should only expose opaque cursors.
- **Backward Compatibility**: When changing `paginationInformation()` output, existing clients break. Version the metadata shape or use the existing paginator keys.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Tailored metadata per consumer | Additional code to maintain | Every override point increases surface area |
| Version-conditional metadata | Complex request inspection logic | Conditional branches are harder to test |
| Field renaming improves client ergonomics | Renaming is a breaking change if clients already parse old names | Must version or dual-emit fields during migration |
| Stripping unused fields reduces response size | Stripping may break future clients that need those fields | Hard to add fields back without version bump |
| Consistent metadata across paginator types | Cursor and page paginators have different fields | Customization must handle both paginator types |

## Performance Considerations
- **Minimal Overhead**: `paginationInformation()` operates on the paginator's already-serialized array. The method itself adds negligible CPU time.
- **Conditional Logic Cost**: Complex conditional chains inside `paginationInformation()` are still in the sub-millisecond range.
- **Response Size Impact**: Stripping `from`, `to`, and `path` saves ~50-80 bytes per response. At scale, this compounds.
- **Caching Granularity**: If `paginationInformation()` uses request data to conditionally include fields, cached responses must vary by those request parameters.

## Production Considerations
- **Testing Custom Metadata**: Write explicit tests for `paginationInformation()` output for each paginator type. A subtle bug can break all paginated endpoints.
- **Monitoring Metadata Compliance**: Add middleware that asserts pagination metadata structure matches the documented contract.
- **Documentation Alignment**: If `paginationInformation()` renames fields, ensure API documentation (OpenAPI) uses the custom names, not the default paginator names.
- **Version Transition Strategy**: To rename a field, dual-emit both old and new names in `paginationInformation()` for one version, then remove the old name in the next.

## Common Mistakes
- **Modifying Paginator State Inside `paginationInformation()`**: The method should transform the array, not modify the paginator object. Mutating the paginator causes side effects.
- **Returning Non-Array Values**: `paginationInformation()` must return an array. Returning null or a string breaks the response assembly.
- **Forgetting Parent Call**: Overriding `paginationInformation()` without calling `parent::paginationInformation()` loses the entire paginator output.
- **Assuming LengthAwarePaginator**: Not checking paginator type inside the method. `CursorPaginator` doesn't have `total` or `last_page`. Accessing them throws errors.
- **Hardcoding Paginator Keys**: Using `$paginated['current_page']` assumes that key exists. Different paginator versions may have different keys.

## Failure Modes
- **Silent Metadata Loss**: Overriding `paginationInformation()` to filter fields can accidentally remove `links` entirely, breaking client navigation.
- **Inconsistent Customization Across Resources**: One resource collection customizes pagination, another doesn't. Clients get different metadata shapes from different endpoints.
- **Breaking Change on Laravel Upgrade**: Upgrading Laravel may change paginator output keys. Custom `paginationInformation()` that depends on specific keys breaks.
- **Empty Metadata Array**: Returning `[]` from `paginationInformation()` removes all pagination metadata. Clients have no navigation context.

## Ecosystem Usage
- **Laravel Framework**: `Illuminate\Http\Resources\Json\ResourceCollection` defines `paginationInformation()`. The default implementation returns `$paginated` unchanged.
- **Spatie/laravel-json-api-paginate**: Provides its own pagination information customization that outputs JSON:API-compatible pagination metadata.
- **Laravel Nova**: Nova overrides pagination metadata to use its own field naming convention (`perPage`, `currentPage`, `page`).

## Related Knowledge Units
### Prerequisites
- pagination-metadata-design
- cursor-pagination-metadata

### Related Topics
- top-level-meta-and-links

### Advanced Follow-up Topics
- response-versioning

---

## Research Notes

### Source Analysis
- `Illuminate\Http\Resources\Json\ResourceCollection::paginationInformation()` — override point
- `Illuminate\Http\Resources\Json\PaginatedResourceResponse` — calls `paginationInformation()` during response assembly
- `Illuminate\Pagination\LengthAwarePaginator::toArray()` — raw paginator output
- `Illuminate\Pagination\CursorPaginator::toArray()` — cursor variant

### Key Insight
`paginationInformation()` receives the paginator's serialized array AFTER it is fully computed, not a reference to the paginator object — any transformation is purely structural array manipulation with zero side effects on the paginator's internal state.

### Version-Specific Notes
- Laravel 6+: `paginationInformation()` available since API Resources
- Laravel 10/11/12/13: Signature unchanged; paginator output keys (`current_page`, `per_page`, etc.) stable across versions
- Cursor paginator metadata differences (`next_cursor`, `prev_cursor`, `has_more`) handled transparently — customization method must check paginator type explicitly
