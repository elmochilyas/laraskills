# JSON:API Resources — Engineering Rules

---

## Rule: Always Return Closures from toRelationships

---

## Category

Performance

---

## Rule

Every relationship returned from `toRelationships()` must be wrapped in a closure (`fn() => ...`). Never return resolved values directly.

---

## Reason

Closures in `toRelationships()` are lazily evaluated — they only execute when the relationship is included in the response via the `include` parameter. Resolved values are computed eagerly on every request, wasting resources even when the client never requests the relationship.

---

## Bad Example

```php
public function toRelationships($request): array
{
    return [
        'posts' => PostResource::collection($this->posts), // Eagerly resolved every time
    ];
}
```

---

## Good Example

```php
public function toRelationships($request): array
{
    return [
        'posts' => fn() => PostResource::collection($this->whenLoaded('posts')),
    ];
}
```

---

## Exceptions

No common exceptions. `toRelationships()` must always return closures.

---

## Consequences Of Violation

Performance risks from unnecessary relationship resolution on every request; scalability risks as relationship count and complexity grow.

---

## Rule: Validate Include Parameters Against a Whitelist

---

## Category

Security

---

## Rule

Always validate the `include` query parameter against a whitelist of allowed relationships. Reject or silently remove any relationship not in the whitelist.

---

## Reason

Unvalidated `include` parameters allow clients to load arbitrary model relationships, potentially exposing non-public data, triggering N+1 queries on deeply nested includes, or causing performance degradation through massive compound documents.

---

## Bad Example

```php
// Controller — no validation
public function show(User $user): UserResource
{
    $includes = explode(',', request('include', ''));
    $user->load($includes); // Loads ANY relationship the client requests
    return new UserResource($user);
}
```

---

## Good Example

```php
class UserController
{
    protected array $allowedIncludes = ['posts', 'profile'];

    public function show(User $user): UserResource
    {
        $includes = $this->parseIncludes();
        $user->load($includes);
        return new UserResource($user);
    }

    protected function parseIncludes(): array
    {
        $requested = explode(',', request('include', ''));
        return array_intersect($requested, $this->allowedIncludes);
    }
}
```

---

## Exceptions

Internal APIs where all relationships are safe to expose and performance impact is understood and monitored.

---

## Consequences Of Violation

Security risks from unauthorized relationship exposure; performance risks from arbitrary deep includes; scalability risks from clients triggering N+1 queries on unindexed relationships.

---

## Rule: Ensure Every JSON:API Resource Has a Valid type and String id

---

## Category

Framework Usage

---

## Rule

Every `JsonApiResource` class must produce a valid `type` (either explicitly set via `$type` or correctly derived from the model table) and an `id` cast to string.

---

## Reason

The JSON:API specification requires `type` and `id` as mandatory fields in every resource object. `type` must be a string. `id` must be a string. Violating these requirements produces responses that fail JSON:API client validation, breaking interoperability.

---

## Bad Example

```php
class UserResource extends JsonApiResource
{
    // $type not set — assumes table name
    // If resource wraps a non-Eloquent source, type derivation fails
    public function toAttributes($request): array
    {
        return ['name' => $this->name];
    }
}
// Response id may be integer if not auto-cast
```

---

## Good Example

```php
class UserResource extends JsonApiResource
{
    protected string $type = 'users';

    public function toAttributes($request): array
    {
        return ['name' => $this->name];
    }
}
// Response: { "type": "users", "id": "1", "attributes": {...} }
```

---

## Exceptions

Resources wrapping Eloquent models where the table name correctly represents the API resource type and `JsonApiResource` auto-casts the ID correctly.

---

## Consequences Of Violation

Reliability risks from JSON:API validation failures; interoperability issues with JSON:API client libraries; client-side parsing errors from integer IDs.

---

## Rule: Set application/vnd.api+json Content Type

---

## Category

Framework Usage

---

## Rule

Every JSON:API endpoint must set the `Content-Type` header to `application/vnd.api+json` using `withResponse()`.

---

## Reason

The JSON:API specification mandates the `application/vnd.api+json` media type. API gateways, firewalls, and JSON:API client libraries use this content type to apply spec-appropriate processing, validation, and routing rules. Omitting it breaks spec compliance.

---

## Bad Example

```php
class UserResource extends JsonApiResource
{
    public function toAttributes($request): array
    {
        return ['name' => $this->name];
    }
    // No withResponse override — Content-Type is application/json
}
```

---

## Good Example

```php
class UserResource extends JsonApiResource
{
    public function toAttributes($request): array
    {
        return ['name' => $this->name];
    }

    public function withResponse($request, $response): void
    {
        $response->header('Content-Type', 'application/vnd.api+json');
    }
}
```

---

## Exceptions

When a base resource class (extended by all JSON:API resources) sets the content type globally, individual resources do not need to override it.

---

## Consequences Of Violation

Interoperability issues with JSON:API client libraries; gateway/routing misconfiguration; non-compliance with the JSON:API specification.

---

## Rule: Detect and Prevent Circular Includes

---

## Category

Reliability

---

## Rule

Implement circular include detection to prevent infinite serialization loops when resources include each other (e.g., `UserResource` includes `posts`, `PostResource` includes `user`).

---

## Reason

Circular includes create infinite recursion during serialization. `?include=posts.user.posts.user...` causes memory exhaustion or a stack overflow. The resource layer must detect cycles and either truncate or reject them before serialization.

---

## Bad Example

```php
// PostResource includes user
public function toRelationships($request): array
{
    return [
        'user' => fn() => new UserResource($this->whenLoaded('user')),
    ];
}
// Client requests: ?include=user.posts.user.posts
// Infinite recursion
```

---

## Good Example

```php
// Controller — track include depth and reject cycles
public function show(Request $request, User $user): UserResource
{
    $includes = $this->parseIncludes($request);
    $this->validateIncludes($includes); // Reject circular chains

    $user->load($includes);
    return new UserResource($user);
}

protected function validateIncludes(array $includes): void
{
    $depth = 0;
    foreach ($includes as $include) {
        $levels = explode('.', $include);
        if (count($levels) !== count(array_unique($levels))) {
            abort(400, 'Circular includes detected');
        }
        if (count($levels) > 3) {
            abort(400, 'Include depth exceeds maximum');
        }
    }
}
```

---

## Exceptions

Resources with no cross-referencing relationships (no possibility of cycles).

---

## Consequences Of Violation

Reliability risks from infinite serialization loops; performance risks from memory exhaustion; denial of service via crafted include parameters.

---

## Rule: Map Include Parameters to Eager Loads in the Controller

---

## Category

Architecture

---

## Rule

Handle all include-to-eager-load mapping in the controller, not in the resource. The resource must only format what the controller has already loaded.

---

## Reason

The controller controls query execution. When the resource handles includes, the controller has no visibility into which queries are executed. Keeping the mapping in the controller centralizes database query strategy, making it testable, visible, and easier to optimize.

---

## Bad Example

```php
// Resource — handles its own includes
class UserResource extends JsonApiResource
{
    public function toRelationships($request): array
    {
        if (in_array('posts', explode(',', $request->input('include', '')))) {
            $this->resource->load('posts'); // Controller has no control
        }
        return [
            'posts' => fn() => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```

---

## Good Example

```php
// Controller
public function show(User $user): UserResource
{
    $includes = $this->parseIncludes();
    $user->load($includes);
    return new UserResource($user);
}

// Resource — only formats what was loaded
class UserResource extends JsonApiResource
{
    public function toRelationships($request): array
    {
        return [
            'posts' => fn() => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```

---

## Exceptions

No common exceptions. Query control belongs exclusively in the controller.

---

## Consequences Of Violation

Architectural confusion about query responsibility; controller losing control over database load; difficult-to-trace N+1 issues originating in resources.

---

## Rule: Expose Resource Type via $type Property for Non-Eloquent Sources

---

## Category

Framework Usage

---

## Rule

Always explicitly set the `$type` property on `JsonApiResource` classes that wrap non-Eloquent data sources (arrays, DTOs, API responses).

---

## Reason

`JsonApiResource` derives the type from the model's table name by default. When the resource wraps a non-Eloquent source, table name derivation fails or produces an incorrect type. Explicit `$type` ensures the JSON:API type field is always correct regardless of the underlying data source.

---

## Bad Example

```php
class ExternalUserResource extends JsonApiResource
{
    // Wraps an API response array, not an Eloquent model
    // Type derivation produces unexpected values or errors
    public function toAttributes($request): array
    {
        return ['name' => $this->resource['name']];
    }
}
```

---

## Good Example

```php
class ExternalUserResource extends JsonApiResource
{
    protected string $type = 'users';

    public function toAttributes($request): array
    {
        return ['name' => $this->resource['name']];
    }
}
```

---

## Exceptions

Resources wrapping Eloquent models where the default table name matches the desired API resource type.

---

## Consequences Of Violation

Incorrect `type` values in responses; JSON:API validation failures; client-side mismatches when resource types do not match documented values.

---

## Rule: Limit Include Depth and Count

---

## Category

Scalability

---

## Rule

Set a maximum include depth (recommended: 3 levels) and a maximum include count (recommended: 5 relationships) to prevent clients from requesting excessively large compound documents.

---

## Reason

A single request with `?include=posts.comments.author.profile` can produce compound documents with hundreds or thousands of resources. Deep includes multiply response size by each level of nesting. Limits protect the server from processing abusive requests and protect clients from receiving impractically large responses.

---

## Bad Example

```php
// No limits on include depth or count
$includes = explode(',', request('include', ''));
$user->load($includes); // Accepts: posts.comments.author.profile.settings (5 levels deep)
```

---

## Good Example

```php
protected function parseIncludes(): array
{
    $requested = explode(',', request('include', ''));
    $allowed = array_intersect($requested, $this->allowedIncludes);

    // Enforce limits
    return array_filter($allowed, function ($include) {
        $levels = explode('.', $include);
        return count($levels) <= 3; // Max 3 levels deep
    });
}
```

---

## Exceptions

Internal APIs where include depth and response size are tightly controlled by the consuming application.

---

## Consequences Of Violation

Scalability risks from massive compound documents; performance risks from deep join chains; denial-of-service vulnerability from crafted include parameters.

---

## Rule: Use JsonApiResource for JSON:API Compliance

---

## Category

Framework Usage

---

## Rule

When building a JSON:API-compliant API, extend `JsonApiResource` (not `JsonResource`) and implement `toAttributes()`, `toRelationships()`, and `toLinks()`. Do not manually build JSON:API structure inside regular `JsonResource::toArray()`.

---

## Reason

`JsonApiResource` enforces the required JSON:API structure (`type`, `id`, `attributes`, `relationships`, `links`), provides built-in include handling, and supports sparse fieldsets automatically. Manual construction inside `JsonResource` is error-prone, misses spec requirements, and duplicates framework functionality.

---

## Bad Example

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'type' => 'users',
            'id' => (string) $this->id,
            'attributes' => ['name' => $this->name],
        ];
    }
    // Missing toRelationships, toLinks, include support, sparse fieldsets
}
```

---

## Good Example

```php
class UserResource extends JsonApiResource
{
    protected string $type = 'users';

    public function toAttributes($request): array
    {
        return ['name' => $this->name];
    }

    public function toRelationships($request): array
    {
        return [
            'posts' => fn() => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```

---

## Exceptions

Very old Laravel versions (< Laravel 11) where `JsonApiResource` is not available in the core framework.

---

## Consequences Of Violation

Non-compliance with JSON:API specification; missing features (include handling, sparse fieldsets); maintenance overhead from manual spec implementation.
