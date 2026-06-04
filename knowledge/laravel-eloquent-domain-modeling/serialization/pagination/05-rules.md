# Pagination — Rules

## Rule 1: Always Cap `per_page` with an Upper Bound
---
## Category
Security
---
## Rule
Always enforce a maximum `per_page` value using `min($request->per_page, 100)` or a configurable upper limit before passing to the paginator.
---
## Reason
Unrestricted `per_page` allows clients to request arbitrarily large pages (e.g., `per_page=100000`), causing memory exhaustion, slow responses, and potential denial of service.
---
## Bad Example
```php
return UserResource::collection(User::paginate($request->per_page));
```
---
## Good Example
```php
$perPage = min((int) $request->per_page ?: 15, 100);
return UserResource::collection(User::paginate($perPage));
```
---
## Exceptions
Internal admin endpoints behind authentication where the consumer is trusted and large pages are a documented requirement.
---
## Consequences Of Violation
Memory exhaustion on large datasets; timeout errors; degraded server performance from oversized queries.

---

## Rule 2: Use Cursor Pagination for Tables Exceeding 100k Rows
---
## Category
Performance
---
## Rule
Use `cursorPaginate()` instead of `paginate()` on any endpoint querying a table with more than 100,000 rows.
---
## Reason
`paginate()` executes a `COUNT(*)` query on every request, which becomes prohibitively expensive on large tables with complex WHERE clauses. Cursor pagination avoids the count entirely.
---
## Bad Example
```php
return LogResource::collection(ActivityLog::paginate(50));
// COUNT(*) on a 50M-row table every request
```
---
## Good Example
```php
return LogResource::collection(ActivityLog::cursorPaginate(50));
// No COUNT(*) — uses indexed column seek instead
```
---
## Exceptions
Admin panels where the total count is required for pagination UI and the count query is cached or acceptably fast.
---
## Consequences Of Violation
Database timeouts on count queries; escalating query costs as data grows; poor user experience on large-table endpoints.

---

## Rule 3: Always Use a Stable, Unique ORDER BY Clause for Pagination
---
## Category
Reliability
---
## Rule
Ensure every paginated query has an explicit `orderBy` on a unique, indexed column (typically the primary key) to guarantee consistent page results.
---
## Reason
Without stable ordering, rows may appear on multiple pages or be skipped entirely as new data is inserted between requests, causing data inconsistency for consumers.
---
## Bad Example
```php
return UserResource::collection(User::paginate());
// No orderBy — default behavior is unpredictable
```
---
## Good Example
```php
return UserResource::collection(
    User::orderBy('id')->paginate()
);
```
---
## Exceptions
Cursor pagination that uses `cursorPaginate()` with a default cursor column; the cursor itself provides stable ordering.
---
## Consequences Of Violation
Duplicate or missing records across pages; inconsistent API responses; unreliable data for downstream consumers.

---

## Rule 4: Prefer Cursor Pagination for Append-Heavy Feeds and Activity Logs
---
## Category
Architecture
---
## Rule
Use cursor pagination for feeds, activity logs, notifications, and any endpoint where new records are frequently inserted at the "end" of the result set.
---
## Reason
Length-aware pagination with offset-based navigation produces "offset drift" — newly inserted records shift the position of existing records between page requests, causing duplicates or gaps.
---
## Bad Example
```php
// Activity feed — new entries constantly added
return NotificationResource::collection(
    Notification::where('user_id', $id)->paginate()
);
// User sees duplicates as new notifications shift offsets
```
---
## Good Example
```php
// Activity feed — cursor pagination avoids offset drift
return NotificationResource::collection(
    Notification::where('user_id', $id)
        ->orderBy('id', 'desc')
        ->cursorPaginate()
);
```
---
## Exceptions
Admin panels where total count display is a hard requirement and offset drift is acceptable for the use case.
---
## Consequences Of Violation
Users seeing duplicate or missed entries in feeds; inconsistent UX; support complaints about unreliable pagination.

---

## Rule 5: Pass `per_page` from Request to Paginator Explicitly
---
## Category
Framework Usage
---
## Rule
Always read the `per_page` value from the current request and pass it to the paginator, with a sensible application-wide default.
---
## Reason
Without explicit `per_page` passing, all users get the default paginator page size (typically 15), regardless of their preference or the endpoint's data characteristics.
---
## Bad Example
```php
return UserResource::collection(User::paginate());
// Everyone gets 15 per page — no customization
```
---
## Good Example
```php
$perPage = min((int) $request->per_page ?: 15, 100);
return UserResource::collection(User::paginate($perPage));
```
---
## Exceptions
Endpoints where a fixed page size is a hard API contract requirement.
---
## Consequences Of Violation
Poor UX for consumers wanting larger pages; inefficient queries for endpoints that could safely return more data.

---

## Rule 6: Test Paginated Responses for Empty and Populated States
---
## Category
Testing
---
## Rule
Write feature tests that verify paginated response structure for both empty results and populated results, asserting correct `links`, `meta`, and `data` shape.
---
## Reason
Pagination metadata shape changes when results are empty (zero total, no next/prev links). Untested edge cases produce malformed responses that break consumers.
---
## Bad Example
```php
// Tests only populated case
$response = $this->getJson('/api/users?page=1');
$response->assertJsonStructure(['data', 'links', 'meta']);
```
---
## Good Example
```php
public function test_paginated_response_populated(): void
{
    User::factory(20)->create();
    $response = $this->getJson('/api/users?per_page=10');
    $response->assertJsonStructure([
        'data' => ['*' => ['id', 'name']],
        'links' => ['first', 'last', 'prev', 'next'],
        'meta' => ['current_page', 'last_page', 'per_page', 'total'],
    ]);
}

public function test_paginated_response_empty(): void
{
    $response = $this->getJson('/api/users');
    $response->assertJsonStructure([
        'data' => [],
        'links' => ['first', 'last', 'prev', 'next'],
        'meta' => ['current_page', 'last_page', 'per_page', 'total'],
    ]);
}
```
---
## Exceptions
No common exceptions. Both states are equally important.
---
## Consequences Of Violation
Broken client integrations when endpoint returns empty results; unchecked edge cases reaching production.

---

## Rule 7: Never Use `paginate()` for Queries That Return Small, Bounded Results
---
## Category
Performance
---
## Rule
Use `get()` or `all()` for endpoints that always return small, bounded datasets (lookups, dropdowns, enums). Pagination adds unnecessary count-query overhead.
---
## Reason
`paginate()` always executes a `COUNT(*)` even on tiny tables. For lookup tables with fewer than 100 rows, this doubles the query cost for no benefit.
---
## Bad Example
```php
return RoleResource::collection(Role::paginate());
// Role table has 5 rows — count query is wasteful
```
---
## Good Example
```php
return RoleResource::collection(Role::all());
// No count query, no pagination metadata needed
```
---
## Exceptions
API specifications that mandate uniform pagination metadata on every endpoint regardless of dataset size.
---
## Consequences Of Violation
Unnecessary database queries on trivial datasets; increased response latency for lookup endpoints; misleading API design.

---

## Rule 8: Validate and Sanitize Cursor Parameters
---
## Category
Security
---
## Rule
Validate cursor parameters received from the request before passing them to `cursorPaginate()`. Never trust raw cursor values without type and format checks.
---
## Reason
Malformed cursor values can cause SQL errors, expose encoding issues, or be used for injection if not properly handled by the paginator's internal encoding.
---
## Bad Example
```php
return UserResource::collection(User::cursorPaginate(
    perPage: 15,
    cursor: $request->cursor, // Raw unfiltered input
));
```
---
## Good Example
```php
$cursor = $request->input('cursor');
if ($cursor !== null && !is_string($cursor)) {
    abort(400, 'Invalid cursor parameter');
}
return UserResource::collection(User::orderBy('id')->cursorPaginate(
    perPage: 15,
    cursor: $cursor,
));
```
---
## Exceptions
Environments where request validation middleware already guarantees the parameter type (always validate regardless).
---
## Consequences Of Violation
SQL injection vectors in edge cases; cryptic pagination errors; malformed cursor values corrupting query state.

---

## Rule 9: Override `paginationInformation()` on a Base Collection for Consistent Metadata
---
## Category
Code Organization
---
## Rule
Override `paginationInformation()` in a base `ResourceCollection` class that all collection resources extend, rather than duplicating pagination metadata customization per collection.
---
## Reason
Without a centralized override, each custom collection duplicates pagination metadata customization, leading to inconsistent metadata formats across the API.
---
## Bad Example
```php
class UserCollection extends ResourceCollection
{
    protected function paginationInformation(...): array
    {
        return ['meta' => ['server_time' => now()]];
    }
}

class PostCollection extends ResourceCollection
{
    protected function paginationInformation(...): array
    {
        return ['meta' => ['server_time' => now()]];
    }
}
```
---
## Good Example
```php
abstract class BaseCollection extends ResourceCollection
{
    protected function paginationInformation(...): array
    {
        return [
            'links' => $default['links'],
            'meta' => array_merge($default['meta'], [
                'server_time' => now()->toIso8601String(),
            ]),
        ];
    }
}

class UserCollection extends BaseCollection { }
class PostCollection extends BaseCollection { }
```
---
## Exceptions
Collections that require a fundamentally different metadata shape (rare; document the divergence).
---
## Consequences Of Violation
Inconsistent pagination metadata across endpoints; duplicated customization code; increased maintenance burden.

---

## Rule 10: Choose Pagination Strategy Per-Endpoint Based on Dataset Characteristics
---
## Category
Architecture
---
## Rule
Decide per-endpoint whether to use `paginate()`, `cursorPaginate()`, or `simplePaginate()` based on the dataset size, query complexity, and consumer requirements.
---
## Reason
A single pagination strategy applied everywhere either wastes count queries on small datasets or fails to provide needed metadata for large ones. Each strategy has different performance characteristics and output shapes.
---
## Bad Example
```php
// In a generic BaseController or global scope
protected function paginate($query)
{
    return $query->paginate(); // One-size-fits-all
}
```
---
## Good Example
```php
// Users endpoint — moderate size, needs total count
User::with('posts')->paginate(perPage: $perPage);

// Activity logs — large table, cursor avoids count query
ActivityLog::where(...)->cursorPaginate(perPage: $perPage);

// Roles lookup — small dataset, no pagination needed
Role::all();
```
---
## Exceptions
Strict API specifications that mandate a uniform pagination contract across all endpoints.
---
## Consequences Of Violation
Performance inefficiency on large datasets; missing or unnecessary metadata in responses; consumer confusion from inconsistent pagination behavior.
