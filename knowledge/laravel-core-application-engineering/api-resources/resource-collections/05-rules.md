# Resource Collections — Engineering Rules

---

## Rule: Always Set $collects Explicitly on Custom Collections

---

## Category

Maintainability

---

## Rule

When defining a custom `ResourceCollection`, always set `$collects` to the explicit resource class it wraps. Never rely on namespace derivation.

---

## Reason

Laravel attempts to derive the resource class from the collection's namespace by convention. This derivation breaks when resource and collection names diverge, when they are in different namespaces, or when the collection is moved. An explicit `$collects` makes the relationship clear and prevents silent behavior changes from namespace refactoring.

---

## Bad Example

```php
class UserCollection extends ResourceCollection
{
    // No $collects — relies on namespace derivation
    // Breaks if collection is moved or renamed
}
```

---

## Good Example

```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;
}
```

---

## Exceptions

Anonymous collections created via `Resource::collection()` where no custom collection class exists.

---

## Consequences Of Violation

Reliability risks from incorrect resource resolution after namespace changes; debugging overhead from items rendered with the wrong resource class; silent failures when derivation produces unexpected results.

---

## Rule: Keep Pagination Logic in the Controller, Not the Collection

---

## Category

Architecture

---

## Rule

The controller must decide pagination type, page size, and sorting. The collection must only format whatever paginator instance it receives.

---

## Reason

When collections handle pagination logic, they duplicate controller concerns and make it impossible to control query strategy from the controller. This violates the single responsibility principle and creates hidden behavior that varies by collection class rather than controller.

---

## Bad Example

```php
class UserCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        // Collection decides page size — controller has no control
        $perPage = $request->input('per_page', 20);
        $this->resource = $this->resource->paginate($perPage);
        return parent::toArray($request);
    }
}
```

---

## Good Example

```php
// Controller
public function index(Request $request): UserCollection
{
    $perPage = min((int) $request->input('per_page', 20), 100);
    $users = User::paginate($perPage);
    return new UserCollection($users);
}

// Collection — only formats
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;
}
```

---

## Exceptions

No common exceptions. Pagination strategy is always a controller responsibility.

---

## Consequences Of Violation

Architectural confusion about query control; inability to test pagination strategy independently of the collection; hidden side effects in formatting code.

---

## Rule: Paginate List Endpoints That Could Exceed 50 Items

---

## Category

Performance

---

## Rule

Any list endpoint that could realistically return more than 50 items must use pagination. Never use `Model::all()` for list endpoints.

---

## Reason

Non-paginated collections load all matching records into memory at once. As the dataset grows, this causes memory exhaustion, slow responses, and poor user experience. Pagination limits the per-request memory footprint and provides a consistent navigation mechanism.

---

## Bad Example

```php
// Non-paginated — loads all users
public function index(): AnonymousResourceCollection
{
    return UserResource::collection(User::all());
    // With 100K users, loads all into memory
}
```

---

## Good Example

```php
// Paginated
public function index(): AnonymousResourceCollection
{
    return UserResource::collection(User::paginate(20));
}
```

---

## Exceptions

Export endpoints specifically designed to return the full dataset as a download, where the response is streamed or chunked.

---

## Consequences Of Violation

Performance risks from memory exhaustion; scalability risks as dataset grows; reliability risks from HTTP timeouts on large collections.

---

## Rule: Standardize the Collection Envelope via a Base Class

---

## Category

Code Organization

---

## Rule

Define a base collection class that enforces a consistent `data`, `links`, and `meta` structure across all collection endpoints.

---

## Reason

Without a base class, each collection may return a different response shape — some with pagination metadata, some without, some with custom fields embedded at different levels. A base class ensures every client can write a single pagination handler that works for all endpoints.

---

## Bad Example

```php
class UserCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return ['items' => $this->collection]; // 'items' instead of 'data'
    }
}

class PostCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return ['data' => $this->collection, 'total' => $this->total()];
    }
}
// Different envelopes — no generic client handling
```

---

## Good Example

```php
abstract class BaseCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data' => $this->collection,
            'links' => $this->paginationLinks() ?? [],
            'meta' => $this->paginationMeta() ?? [],
        ];
    }

    protected function paginationLinks(): ?array
    {
        return $this->resource instanceof AbstractPaginator
            ? $this->paginationInformation(request(), $this->resource, [])['links'] ?? null
            : null;
    }

    protected function paginationMeta(): ?array
    {
        return $this->resource instanceof AbstractPaginator
            ? $this->paginationInformation(request(), $this->resource, [])['meta'] ?? null
            : null;
    }
}

class UserCollection extends BaseCollection
{
    public $collects = UserResource::class;
}

class PostCollection extends BaseCollection
{
    public $collects = PostResource::class;
}
```

---

## Exceptions

APIs with fewer than 3 collection endpoints.

---

## Consequences Of Violation

Client integration overhead from per-endpoint envelope handling; maintenance burden of coordinating changes across collections; onboarding friction for new API consumers.

---

## Rule: Use Anonymous Collections for Simple Endpoints

---

## Category

Design

---

## Rule

Use `Resource::collection()` (anonymous collection) for simple list endpoints. Only create a named `ResourceCollection` class when custom metadata, pagination overrides, or collection-specific behavior is needed.

---

## Reason

Named collection classes add code overhead without benefit when the default behavior (format each item, wrap in `data`, add pagination metadata) is sufficient. `Resource::collection()` provides the same functionality without requiring a separate file.

---

## Bad Example

```php
// Separate file for a collection that adds no custom behavior
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;
}

// Controller
public function index(): UserCollection
{
    return new UserCollection(User::paginate(20));
}
```

---

## Good Example

```php
// Controller — uses anonymous collection
public function index(): AnonymousResourceCollection
{
    return UserResource::collection(User::paginate(20));
}
```

---

## Exceptions

When custom metadata, pagination structure overrides, or collection-level computations are required.

---

## Consequences Of Violation

Unnecessary code overhead; more files to maintain without behavioral benefit; namespace pollution from collection classes that mirror default behavior.

---

## Rule: Only Preserve Collection Keys When Clients Rely on Them

---

## Category

Design

---

## Rule

Only set `$preserveKeys = true` when the client explicitly expects non-sequential keys (e.g., ID-keyed maps). Default to sequential (re-indexed) arrays.

---

## Reason

Preserving keys produces a JSON object (`{ "1": {...}, "3": {...} }`) instead of a JSON array (`[{...}, {...}]`). Most clients expect arrays for collections and may misinterpret objects. Non-sequential keys after filtering create unexpected objects.

---

## Bad Example

```php
class UserCollection extends ResourceCollection
{
    public $preserveKeys = true; // Preserves keys without client need
}

// After filtering, response becomes an object instead of array:
// { "5": {...}, "12": {...} }
```

---

## Good Example

```php
class UserCollection extends ResourceCollection
{
    // Default — keys re-indexed to sequential array
}

// Response is always a predictable array:
// [ {...}, {...} ]
```

---

## Exceptions

When the API contract explicitly documents ID-keyed maps and all clients are designed to parse them.

---

## Consequences Of Violation

Client parsing errors from unexpected object responses; confusion when filtered collections produce non-intuitive key structures; integration friction for clients expecting arrays.

---

## Rule: Keep Collection Types Homogeneous

---

## Category

Reliability

---

## Rule

Every collection must contain items of a single resource type. Never pass mixed model types to a collection with a fixed `$collects` property.

---

## Reason

A collection with a fixed `$collects` maps every item through the same resource class. Mixed types cause the resource's `toArray()` to receive unexpected data structures, producing errors or incorrect output.

---

## Bad Example

```php
// Controller passes mixed types
public function index(): SomeCollection
{
    $items = collect([
        User::find(1),
        Post::find(1), // Different model
    ]);
    return new SomeCollection($items);
}

// SomeCollection expects User models only
```

---

## Good Example

```php
// Keep collections homogeneous
public function index(): UserCollection
{
    return new UserCollection(User::paginate(20));
}

// For mixed types, use a polymorphic resource
class FeedItemResource extends JsonResource
{
    public function toArray($request): array
    {
        if ($this->resource instanceof User) {
            return (new UserResource($this->resource))->toArray($request);
        }
        return (new PostResource($this->resource))->toArray($request);
    }
}
```

---

## Exceptions

Polymorphic collections specifically designed to handle multiple types via a delegating resource.

---

## Consequences Of Violation

Runtime errors from unexpected resource types; incorrect response data when wrong resource class processes the item; debugging overhead from type mismatches in collection output.
