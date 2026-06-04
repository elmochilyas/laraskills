# Sparse Fieldsets — Engineering Rules

---

## Rule: Always Include Identifier Fields Regardless of Sparse Fieldset

---

## Category

Design

---

## Rule

Always include the resource identifier fields (`id`, `type` in JSON:API) in the response, even when the client's sparse fieldset request does not include them.

---

## Reason

Clients need identifier fields for data referencing, caching, and relationship mapping. A client that requests `fields[users]=name` still needs the `id` to associate the response with its internal data structures. Omitting identifiers breaks client-side data management regardless of the client's field preferences.

---

## Bad Example

```php
public function toArray($request): array
{
    $fields = $this->getRequestedFields($request, 'users');
    return array_intersect_key([
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
    ], array_flip($fields));
    // If client requests only 'name', 'id' is omitted
}
```

---

## Good Example

```php
public function toArray($request): array
{
    $fields = $this->getRequestedFields($request, 'users');
    $all = [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
    ];

    // Always include 'id' regardless of client request
    $fields = array_unique(array_merge($fields ?? [], ['id']));
    return array_intersect_key($all, array_flip($fields));
}
```

---

## Exceptions

No common exceptions. Identifiers must always be present in the response.

---

## Consequences Of Violation

Client-side data management failures; broken caching and reference tracking; integration bugs when clients depend on identifier presence.

---

## Rule: Validate Requested Field Names Against an Allowed List

---

## Category

Security

---

## Rule

Always validate client-requested sparse field names against a whitelist of allowed fields. Reject unknown fields with a 400 error or silently ignore them.

---

## Reason

Unvalidated field names can be exploited for information gathering. When unknown field names are passed to database `select()` statements, error messages may reveal actual column names. Field validation also prevents clients from requesting fields that do not exist, returning empty responses without explanation.

---

## Bad Example

```php
// No validation — passes client field names directly
public function index(Request $request): AnonymousResourceCollection
{
    $fields = explode(',', $request->input('fields.users', ''));
    $users = User::select($fields)->paginate(); // Security risk
    return UserResource::collection($users);
}
```

---

## Good Example

```php
protected array $allowedUserFields = ['id', 'name', 'email', 'bio'];

public function index(Request $request): AnonymousResourceCollection
{
    $fields = $this->parseFields($request, 'users');
    $query = User::query();

    if ($fields) {
        $query->select(array_unique(array_merge($fields, ['id'])));
    }

    return UserResource::collection($query->paginate());
}

protected function parseFields(Request $request, string $type): array
{
    $requested = explode(',', $request->input("fields.{$type}", ''));
    return array_intersect($requested, $this->allowedUserFields);
}
```

---

## Exceptions

No common exceptions. Field validation against an allowed list is always required.

---

## Consequences Of Violation

Security risks from information leakage via error messages; client confusion from silently missing fields; database injection surface through unvalidated column names.

---

## Rule: Each Resource Type Must Independently Filter Its Own Fields

---

## Category

Design

---

## Rule

When a compound response includes multiple resource types (e.g., via `include=posts`), each resource type must independently support sparse fieldsets and filter its own `fields[type]` parameter.

---

## Reason

Sparse fieldsets do not cascade to related resources. A request with `fields[users]=name&include=posts` must filter users by `name` but must NOT automatically filter posts — posts have their own `fields[posts]` parameter. If `PostResource` ignores sparse fieldsets, included posts return all fields regardless of the client's intent.

---

## Bad Example

```php
// UserResource filters fields
public function toArray($request): array
{
    $fields = $this->getRequestedFields($request, 'users');
    return array_intersect_key([
        'id' => $this->id,
        'name' => $this->name,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
    ], array_flip($fields));
    // Posts are not filtered — $this->getRequestedFields not called for 'posts'
}
```

---

## Good Example

```php
// UserResource filters its own fields
public function toArray($request): array
{
    $fields = $this->getRequestedFields($request, 'users');
    $data = [
        'id' => $this->id,
        'name' => $this->name,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
    ];
    return array_intersect_key($data, array_flip($fields));
}

// PostResource independently filters its own fields
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        $fields = $this->getRequestedFields($request, 'posts');
        $all = ['id' => $this->id, 'title' => $this->title];
        return array_intersect_key($all, array_flip($fields));
    }
}
```

---

## Exceptions

APIs that do not support includes or compound documents (single resource type per response).

---

## Consequences Of Violation

Inconsistent field filtering where included resources return all fields; inefficient responses with omitted parent fields but full child data.

---

## Rule: Always Include Primary and Foreign Keys in Database Selection

---

## Category

Performance

---

## Rule

When selecting columns from the database based on sparse fieldsets, always include primary keys, foreign keys, and any columns needed for Eloquent relationship resolution — even if the client did not request them.

---

## Reason

Eloquent relationships depend on primary and foreign keys to resolve related models. If a client requests `fields[users]=name` and the controller selects only `name`, Eloquent cannot load relationships because the `id` column is missing. This breaks resource resolution silently.

---

## Bad Example

```php
public function index(Request $request): AnonymousResourceCollection
{
    $fields = explode(',', $request->input('fields.users', ''));
    $users = User::select($fields)->paginate();
    // If $fields = ['name'], 'id' is missing — relationships break
    return UserResource::collection($users);
}
```

---

## Good Example

```php
public function index(Request $request): AnonymousResourceCollection
{
    $fields = $this->parseFields($request, 'users');
    $query = User::query();

    if ($fields) {
        // Always include 'id' for Eloquent relationship resolution
        $query->select(array_unique(array_merge($fields, ['id'])));
    }

    return UserResource::collection($query->paginate());
}
```

---

## Exceptions

When selecting from a non-Eloquent data source (array, DTO, external API) that has no relationship dependencies.

---

## Consequences Of Violation

Broken relationship loading in resources; silent failures or errors when models cannot resolve relations; debugging overhead from missing key columns.

---

## Rule: Provide a Sensible Default Field Set

---

## Category

Design

---

## Rule

Define a default field set for each resource type that is returned when the client does not specify a sparse fieldset parameter.

---

## Reason

When the client does not use sparse fieldsets, the response must return a sensible set of fields. Returning all available fields may be excessive (bandwidth waste), while returning none would be a contract violation. The default field set should be curated for the common client use case.

---

## Bad Example

```php
public function toArray($request): array
{
    $requested = $request->input('fields.users');
    $fields = $requested ? explode(',', $requested) : [];
    // Empty array when not specified — returns nothing or falls through to all fields

    if (empty($fields)) {
        return []; // Returns empty object — breaks client
    }
    // ...
}
```

---

## Good Example

```php
protected array $defaultFields = ['id', 'name', 'email'];

public function toArray($request): array
{
    $requested = $this->getRequestedFields($request, 'users');
    $fields = $requested ?? $this->defaultFields;
    $fields = array_unique(array_merge($fields, ['id']));

    return array_intersect_key([
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'bio' => $this->bio,
        'created_at' => $this->created_at,
    ], array_flip($fields));
}
```

---

## Exceptions

When the API contract specifies that all clients MUST use sparse fieldsets (rare — typically only for bandwidth-sensitive mobile APIs).

---

## Consequences Of Violation

Unpredictable response content when fieldsets are not specified; client crashes from missing or excessive data; bandwidth waste from returning all fields by default.

---

## Rule: Never Use Sparse Fieldsets as Authorization

---

## Category

Security

---

## Rule

Sparse fieldsets are a client-driven optimization feature, not an authorization mechanism. Sensitive fields must be controlled by conditional attributes or separate resources, never by hoping clients do not request them.

---

## Reason

Sparse fieldsets only filter fields that are already in `toArray()`. If a sensitive field is in `toArray()`, the client can request it via sparse fieldsets and receive it. There is no server-side filtering that prevents a client from requesting any field in `toArray()`.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'secret_key' => $this->secret_key, // Sensitive field exposed
        // Developer assumes clients "won't request it"
    ];
}
// Client requests: fields[users]=id,secret_key
// Receives secret_key without authorization
```

---

## Good Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        $this->when($request->user()?->isAdmin(), [
            'secret_key' => $this->secret_key,
        ]),
    ];
}
// Client cannot access secret_key via sparse fieldsets
// because it's not in toArray() output for non-admin users
```

---

## Exceptions

No common exceptions. Sparse fieldsets and authorization must never be conflated.

---

## Consequences Of Violation

Security risks from unauthorized data access; data breach when clients discover sensitive fields via enumeration; regulatory compliance violations.

---

## Rule: Normalize Field Set Keys for Caching

---

## Category

Performance

---

## Rule

Sort sparse fieldset keys alphabetically before using them for cache key generation. This normalizes equivalent requests that specify fields in different orders.

---

## Reason

The same set of fields requested in different orders (`fields[users]=name,email` vs `fields[users]=email,name`) produces different cache keys but the same response content. Without normalization, each permutation is a separate cache entry, multiplying cache storage and reducing hit rates.

---

## Bad Example

```php
// Cache key uses raw query string — different keys for same fields
$cacheKey = 'users:' . md5(request()->fullUrl());
// ?fields[users]=name,email → users:abc123
// ?fields[users]=email,name → users:def456
// Same response, two cache entries
```

---

## Good Example

```php
// Normalize before cache key generation
$fields = $this->parseFields(request(), 'users');
sort($fields); // Alphabetical normalization

$cacheKey = 'users:' . md5(implode(',', $fields));
// Both requests produce the same cache key
```

---

## Exceptions

APIs without response caching, or where sparse fieldset usage is minimal.

---

## Consequences Of Violation

Cache fragmentation with 2^n entries for n fields; reduced cache hit rates; unnecessary storage consumption from duplicate cache entries.

---

## Rule: Document Available Fields Per Resource Type

---

## Category

Maintainability

---

## Rule

Document the exact field names available for each resource type in the API documentation, including which fields are always present (identifiers) and which are conditional.

---

## Reason

Clients cannot use sparse fieldsets effectively if they do not know which field names to request. The field names must match the `toArray()` keys exactly — any discrepancy between documentation and implementation causes silent field omission.

---

## Bad Example

```php
// No documentation — clients must guess field names
public function toArray($request): array
{
    return [
        'full_name' => $this->name, // Key is 'full_name', not 'name'
        'email_address' => $this->email, // Key is 'email_address', not 'email'
    ];
}
// Client requests fields[users]=name,email — gets empty response
```

---

## Good Example

```php
/**
 * @apiResourceField id integer Always present
 * @apiResourceField full_name string Display name
 * @apiResourceField email_address string Always present
 * @apiResourceField bio string|null Only present when set
 */
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'full_name' => $this->name,
        'email_address' => $this->email,
        'bio' => $this->whenNotNull($this->bio),
    ];
}
```

---

## Exceptions

No common exceptions. Sparse fieldset documentation is essential for client adoption.

---

## Consequences Of Violation

Client confusion about available field names; support overhead from field-discovery questions; sparse fieldset underutilization because clients do not know what to request.

---

## Rule: Validate Before Passing to Database select()

---

## Category

Security

---

## Rule

Always validate client-provided field names against an allowed list before passing them to the database query builder's `select()` method.

---

## Reason

Passing unvalidated field names to `Model::select()` or `DB::select()` can leak internal column names through SQL error messages or, in edge cases, be exploited for column enumeration. Even with parameterized queries, invalid column names produce SQL errors that reveal schema information.

---

## Bad Example

```php
$fields = explode(',', $request->input('fields.users', ''));
$users = User::select($fields)->paginate();
// Client sends: fields[users]=password,credit_card,secret_column
// SQL error reveals which columns exist: "Unknown column 'secret_column'"
```

---

## Good Example

```php
protected array $allowedUserFields = ['id', 'name', 'email', 'bio'];

public function index(Request $request): AnonymousResourceCollection
{
    $requested = explode(',', $request->input('fields.users', ''));
    $valid = array_intersect($requested, $this->allowedUserFields);

    $invalid = array_diff($requested, $this->allowedUserFields);
    if ($invalid) {
        abort(400, 'Invalid fields: ' . implode(', ', $invalid));
    }

    $query = User::query();
    if ($valid) {
        $query->select(array_unique(array_merge($valid, ['id'])));
    }

    return UserResource::collection($query->paginate());
}
```

---

## Exceptions

No common exceptions. Unvalidated database column selection is always a security risk.

---

## Consequences Of Violation

Security risks from schema information leakage via SQL errors; potential column enumeration attacks; confusion from invalid fields producing empty or error responses.
