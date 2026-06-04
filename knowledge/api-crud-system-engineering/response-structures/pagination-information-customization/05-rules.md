# pagination-information-customization Rules

## Rule 1: Centralize `paginationInformation()` in a Base Collection Class
---
## Category
Code Organization
---
## Rule
Always override `paginationInformation()` in a single base `ResourceCollection` class extended by all collection resources, never per-collection.
---
## Reason
Per-endpoint customization guarantees inconsistency — one collection renames `current_page` to `currentPage`, another does not. A base class enforces uniform pagination metadata across all paginated endpoints.
---
## Bad Example
```php
class UserCollection extends ResourceCollection
{
    protected function paginationInformation($request, $paginated, $default)
    {
        return ['currentPage' => $paginated['current_page']];
    }
}

class PostCollection extends ResourceCollection
{
    // No override — uses default Laravel snake_case keys
    // Inconsistency: User endpoint returns currentPage, Post returns current_page
}
```
---
## Good Example
```php
class BaseCollection extends ResourceCollection
{
    protected function paginationInformation($request, $paginated, $default)
    {
        return [
            'currentPage' => $paginated['current_page'] ?? null,
            'perPage' => $paginated['per_page'] ?? null,
            'total' => $paginated['total'] ?? null,
        ];
    }
}

class UserCollection extends BaseCollection {}
class PostCollection extends BaseCollection {}
```
---
## Exceptions
Version-specific collections that intentionally have different metadata shapes.
---
## Consequences Of Violation
Clients must know which pagination field naming convention each endpoint uses. Integration tests must assert different shapes per endpoint.

## Rule 2: Always Check Paginator Type Before Accessing Type-Specific Fields
---
## Category
Reliability
---
## Rule
Always check the paginator type with `instanceof` before accessing `total`, `last_page`, or other paginator-specific fields in `paginationInformation()`.
---
## Reason
`CursorPaginator` does not have `total` or `last_page`. `LengthAwarePaginator` lacks `next_cursor` or `has_more`. Accessing non-existent keys throws `ErrorException` or returns null inconsistently.
---
## Bad Example
```php
protected function paginationInformation($request, $paginated, $default)
{
    return [
        'total' => $paginated['total'], // crashes when CursorPaginator
        'lastPage' => $paginated['last_page'], // crashes when CursorPaginator
    ];
}
```
---
## Good Example
```php
protected function paginationInformation($request, $paginated, $default)
{
    return [
        'total' => $paginated['total'] ?? null,
        'lastPage' => $paginated['last_page'] ?? null,
        'hasMore' => $paginated['has_more'] ?? null,
    ];
}
```
---
## Exceptions
When the endpoint is guaranteed to always use a specific paginator type.
---
## Consequences Of Violation
500 error on any paginated endpoint that uses `CursorPaginator` or `SimplePaginator`. Production outage until paginator type is changed or code is fixed.

## Rule 3: Always Return an Array from `paginationInformation()`
---
## Category
Framework Usage
---
## Rule
Always return a plain PHP array from `paginationInformation()` — never null, a string, a Collection, or any non-array type.
---
## Reason
`PaginatedResourceResponse` merges the return value into the `meta` object using `array_merge()`. A non-array return breaks response assembly and produces a serialization error.
---
## Bad Example
```php
protected function paginationInformation($request, $paginated, $default)
{
    return null; // breaks array_merge — 500 error
}
```
---
## Good Example
```php
protected function paginationInformation($request, $paginated, $default)
{
    return [
        'currentPage' => $paginated['current_page'] ?? null,
        'perPage' => $paginated['per_page'] ?? null,
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
500 error on every paginated response. `array_merge()` expects array, receives null. Entire endpoint class becomes unusable.

## Rule 4: Never Mutate the Paginator Object Inside `paginationInformation()`
---
## Category
Reliability
---
## Rule
Always treat the `$paginated` parameter as read-only — transform the array, never call methods or set properties on the paginator object.
---
## Reason
The paginator object is shared. Mutating it inside `paginationInformation()` produces side effects that cascade to other responses, middleware, or subsequent requests in the same request lifecycle.
---
## Bad Example
```php
protected function paginationInformation($request, $paginated, $default)
{
    // Mutating paginator state — dangerous
    $paginated->setPageName('page_number');
    return $paginated->toArray();
}
```
---
## Good Example
```php
protected function paginationInformation($request, $paginated, $default)
{
    return [
        'currentPage' => $paginated['current_page'] ?? null,
        'perPage' => $paginated['per_page'] ?? null,
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unpredictable pagination behavior across middleware and subsequent serialization. Side effects that are impossible to reproduce or debug.

## Rule 5: Match Pagination Field Naming to the API's Existing Convention
---
## Category
Design
---
## Rule
Always use the same naming convention (camelCase, snake_case) for customized pagination metadata as the rest of the API response fields.
---
## Reason
Inconsistent naming conventions within a single API confuse clients and increase parsing complexity. If resource fields are camelCase, pagination metadata should also be camelCase.
---
## Bad Example
```php
// API uses camelCase for resource fields: userId, fullName
// But pagination uses snake_case:
'meta' => [
    'current_page' => 1,
    'total_count' => 50,
]
```
---
## Good Example
```php
// Consistent camelCase
'meta' => [
    'currentPage' => 1,
    'totalCount' => 50,
]
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client parsing code must handle two naming conventions within the same response. Code generators and type systems produce inconsistent type definitions.

## Rule 6: Dual-Emit Renamed Pagination Fields for One Version
---
## Category
Reliability
---
## Rule
When renaming a pagination metadata field, always include both the old and new field names in the response for at least one full API version before removing the old name.
---
## Reason
Renaming pagination fields breaks existing clients that parse by field name. Dual-emission gives clients a migration window to switch from the old name to the new name without service disruption.
---
## Bad Example
```php
// V2 → removed 'total' and added 'totalCount' — immediate break
return ['totalCount' => $paginated['total']];
```
---
## Good Example
```php
// V2 → emit both old and new names
return [
    'total' => $paginated['total'],      // deprecated — clients migrate off
    'totalCount' => $paginated['total'], // new name
];

// V3 → remove old name
return ['totalCount' => $paginated['total']];
```
---
## Exceptions
Internal-only APIs where all consumers are updated simultaneously.
---
## Consequences Of Violation
All existing clients break immediately on the version update. Emergency client-side fixes required. Mobile clients with app store delays cannot be fixed quickly.
