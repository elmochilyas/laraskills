# Resource Collection — Rules

## Rule 1: Always Paginate Collection Endpoints
---
## Category
Performance
---
## Rule
Every listing endpoint that returns a resource collection must use a paginator (`paginate()`, `cursorPaginate()`, or `simplePaginate()`). Never return `Resource::collection(Model::all())` without pagination.
---
## Reason
Unpaginated collections load the entire database table into memory and serialize every row, causing unbounded memory consumption and response sizes that grow linearly with dataset size.
---
## Bad Example
```php
return UserResource::collection(User::all());
// Loads every user into memory — dangerous at scale
```
---
## Good Example
```php
return UserResource::collection(User::paginate(15));
// Only loads one page at a time
```
---
## Exceptions
Lookup endpoints with a documented, enforced maximum row count (e.g., `< 100` rows) that is validated at the database level.
---
## Consequences Of Violation
Memory exhaustion on large tables; timeouts; degraded server performance; DoS vector through unbounded query results.

---

## Rule 2: Always Set `$collects` Explicitly in Custom Collection Classes
---
## Category
Maintainability
---
## Rule
Declare `public $collects = ResourceClass::class` on every custom `ResourceCollection` subclass to explicitly specify the item resource class.
---
## Reason
Without `$collects`, Laravel infers the resource class from the collection name, which silently resolves to the wrong class when naming conventions diverge or namespaces change.
---
## Bad Example
```php
class UserCollection extends ResourceCollection
{
    // No $collects — relies on fragile naming convention
}
```
---
## Good Example
```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    // Additional collection logic
}
```
---
## Exceptions
Collections used exclusively via `Resource::collection()` which never invoke a custom class.
---
## Consequences Of Violation
Silent resolution to a wrong or missing resource class; runtime errors that only appear in specific serialization paths.

---

## Rule 3: Never Put Per-Item Transformation Logic in Collection `toArray()`
---
## Category
Code Organization
---
## Rule
Keep item-level transformations in the item resource class. The collection `toArray()` should only handle structural wrapping and collection-level metadata.
---
## Reason
Per-item logic in the collection layer duplicates the item resource's responsibility, couples collection behavior to item structure, and makes both harder to test independently.
---
## Bad Example
```php
class UserCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection->map(fn ($user) => [
                'full_name' => $user->first_name . ' ' . $user->last_name,
                'is_active' => $user->status === 'active',
            ]),
        ];
    }
}
```
---
## Good Example
```php
// Collection
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => ['total_active' => $this->collection->sum('is_active')],
        ];
    }
}

// Item resource
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'full_name' => "{$this->first_name} {$this->last_name}",
            'is_active' => $this->status === 'active',
        ];
    }
}
```
---
## Exceptions
No common exceptions. Item transformation belongs in the item resource.
---
## Consequences Of Violation
Duplicated transformation logic; collections that bypass item resource structure; difficult-to-maintain collection classes.

---

## Rule 4: Add Collection-Level Metadata via `with()`, Not Inside `toArray()`
---
## Category
Code Organization
---
## Rule
Return collection-level metadata (status, version, server time) from the `with($request)` method, not as keys inside the `toArray()` data structure.
---
## Reason
Data inside `toArray()` becomes part of the `data` array or requires manual array merging. `with()` automatically merges metadata at the response root, keeping it separate from data.
---
## Bad Example
```php
public function toArray(Request $request): array
{
    return [
        'data' => $this->collection,
        'server_time' => now(), // Mixed into data-level structure
    ];
}
```
---
## Good Example
```php
public function toArray(Request $request): array
{
    return ['data' => $this->collection];
}

public function with(Request $request): array
{
    return [
        'meta' => ['server_time' => now()->toIso8601String()],
    ];
}
```
---
## Exceptions
API specifications that require metadata to be nested within the data structure (rare; document the exception).
---
## Consequences Of Violation
Inconsistent API response structure; metadata mixed with data items; manual merging workarounds that are fragile.

---

## Rule 5: Graduate from Anonymous Collections to Named Classes When Metadata Is Needed
---
## Category
Maintainability
---
## Rule
Use `Resource::collection()` for simple paginated lists. Create a named `ResourceCollection` subclass when you need custom metadata, pagination override, or collection-level computed fields.
---
## Reason
Anonymous `Resource::collection()` provides no hook for customization. When metadata needs grow, retrofitting requires changing all call sites. Named classes provide an extension point from the start.
---
## Bad Example
```php
// Controller adds metadata outside the resource
$users = UserResource::collection(User::paginate());
return response()->json([
    'data' => $users,
    'server_time' => now(),
]);
```
---
## Good Example
```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function with(Request $request): array
    {
        return ['meta' => ['server_time' => now()->toIso8601String()]];
    }
}

// Controller remains clean
return new UserCollection(User::paginate());
```
---
## Exceptions
Endpoints that will never need metadata and where the response structure is stable (difficult to guarantee; default to named classes).
---
## Consequences Of Violation
Metadata logic scattered across controllers; difficult to maintain consistent metadata structure; refactoring cost when upgrading from anonymous to named collections.

---

## Rule 6: Test Both Paginated and Non-Paginated Collection Response Shapes
---
## Category
Testing
---
## Rule
Write separate feature tests for paginated and non-paginated collection responses, verifying that pagination keys (`links`, `meta`) are present only when expected.
---
## Reason
Non-paginated collections should not include pagination metadata. Tests catch accidental inclusion or omission of pagination keys when the query changes between `get()` and `paginate()`.
---
## Bad Example
```php
// Tests only the paginated path
public function test_list_users(): void
{
    $response = $this->getJson('/api/users?page=1');
    $response->assertJsonStructure(['data', 'links', 'meta']);
}
```
---
## Good Example
```php
public function test_paginated_list(): void
{
    $response = $this->getJson('/api/users?page=1');
    $response->assertJsonStructure(['data', 'links', 'meta']);
}

public function test_non_paginated_list(): void
{
    $response = $this->getJson('/api/roles');
    $response->assertJsonStructure(['data']);
    $response->assertJsonMissingPath('links');
    $response->assertJsonMissingPath('meta');
}
```
---
## Exceptions
No common exceptions. Both response shapes must be validated.
---
## Consequences Of Violation
Pagination metadata leaking into non-paginated responses; missing metadata in paginated endpoints; consumer parsing failures.

---

## Rule 7: Never Modify `$this->collection` Inside `toArray()`
---
## Category
Reliability
---
## Rule
Treat `$this->collection` as read-only inside `toArray()`. Do not filter, map, or mutate it directly.
---
## Reason
`$this->collection` is the wrapped underlying items. Mutating it can cause side effects on subsequent calls or break the paginator's internal state, leading to unpredictable behavior.
---
## Bad Example
```php
public function toArray(Request $request): array
{
    $this->collection = $this->collection->filter(...); // Mutates wrapped state
    return ['data' => $this->collection];
}
```
---
## Good Example
```php
public function toArray(Request $request): array
{
    $items = $this->collection->filter(...); // Operate on a copy
    return ['data' => $items];
}
```
---
## Exceptions
No common exceptions. The wrapped collection should never be reassigned.
---
## Consequences Of Violation
Unexpected behavior on serialization; paginator state corruption; hard-to-reproduce bugs in collection iteration.

---

## Rule 8: Use `$preserveKeys` Intentionally and Document Why
---
## Category
Maintainability
---
## Rule
Only set `$preserveKeys = true` when the original collection keys carry semantic meaning that must be retained in the JSON output. Always document the reason.
---
## Reason
Preserving keys (e.g., database IDs as array keys) surprises JSON consumers who expect sequential numeric indices and can expose internal identifiers.
---
## Bad Example
```php
class UserCollection extends ResourceCollection
{
    public $preservesKeys = true;
    // No comment — consumers surprised by non-sequential JSON keys
}
```
---
## Good Example
```php
class UserCollection extends ResourceCollection
{
    // Preserve keys because the API returns user_id => user mapping
    // for client-side lookup by ID
    public $preservesKeys = true;
}
```
---
## Exceptions
No common exceptions. Key preservation is a conscious API design choice that must be justified.
---
## Consequences Of Violation
API consumers receiving unexpected non-sequential array keys; internal database IDs leaking through array key exposure.

---

## Rule 9: Keep Collection Resources Alongside Their Item Resources
---
## Category
Code Organization
---
## Rule
Place custom `ResourceCollection` classes in the same namespace/directory as their corresponding `JsonResource` item class, following the naming convention `{Model}Collection`.
---
## Reason
Co-location makes the relationship between collection and item resources obvious. A new developer can find both classes in the same location without searching.
---
## Bad Example
```php
// App\Http\Resources\Collections\UserCollection.php
// App\Http\Resources\UserResource.php
// Different directories — hard to find related classes
```
---
## Good Example
```php
// App\Http\Resources\UserCollection.php
// App\Http\Resources\UserResource.php
// Same directory — clear relationship
```
---
## Exceptions
Projects with a large number of resources where collections are organized into subdirectories by domain (consistent within the project).
---
## Consequences Of Violation
Difficulty locating related resource classes; inconsistent project structure; onboarding friction for new developers.

---

## Rule 10: Handle Empty Collections with Correct Response Structure
---
## Category
Reliability
---
## Rule
Ensure that collection endpoints return a valid JSON structure (`{"data": []}`) when no records match, not a `null` body or an error response.
---
## Reason
Empty results are a valid state, not an error. Returning the expected structure with an empty array allows consumers to handle empty results generically without special-casing.
---
## Bad Example
```php
public function index(): ?JsonResponse
{
    $users = User::where('status', 'inactive')->get();
    if ($users->isEmpty()) {
        return response()->json(null, 404); // Wrong — empty is not missing
    }
    return UserResource::collection($users)->response();
}
```
---
## Good Example
```php
public function index(): JsonResource
{
    return UserResource::collection(
        User::where('status', 'inactive')->paginate()
    );
    // Produces {"data": [], "links": {...}, "meta": {...}}
}
```
---
## Exceptions
No common exceptions. Empty collections must always return valid `{"data": []}` structure.
---
## Consequences Of Violation
API consumers that crash on empty responses; special-case handling in every client; inconsistent error handling patterns.
