# JSON:API Resources

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** JSON:API Resources
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel provides `JsonApiResource` for building responses that conform to the JSON:API specification (jsonapi.org). JSON:API standardizes how resources are identified (type + id), structured (attributes, relationships, links), and linked (resource linkage, compound documents with includes). The `JsonApiResource` base class enforces this structure, while the `relationship()` method maps Eloquent relations to JSON:API relationships.

The engineering value is API consumer interoperability. A JSON:API-compliant endpoint is consumable by any JSON:API client library (ember-data, JSON API Client) without custom parsing. The cost is stricter response structure — every resource must declare a `type`, provide an `id`, and structure relationships explicitly.

---

## Core Concepts

### Resource Type and ID

Every JSON:API resource must have a `type` (string) and `id` (string):

```php
use Illuminate\Http\Resources\Json\JsonApiResource;

class UserResource extends JsonApiResource
{
    public function toAttributes($request): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
// Response:
// {
//     "data": {
//         "type": "users",
//         "id": "1",
//         "attributes": { "name": "John", "email": "john@test.com" }
//     }
// }
```

### Resource Relationships

Relationships are declared via `toRelationships()`:

```php
class UserResource extends JsonApiResource
{
    public function toRelationships($request): array
    {
        return [
            'posts' => fn() => PostResource::collection($this->posts),
        ];
    }
}
```

### Compound Documents (Includes)

Related resources can be included in the same response via `include`:

```php
// GET /api/users/1?include=posts
// Response includes both user data and posts in an "included" array
```

---

## Mental Models

### The Library Catalog

JSON:API is like a library catalog card. The card has:
- **Type**: "Book" (resource type)
- **ID**: "ISBN-12345" (unique identifier)
- **Attributes**: Title, Author, Year (data fields)
- **Relationships**: "Located in: Fiction section" (links to other catalog cards)

Just as a catalog card references other cards but doesn't include their full text, JSON:API relationships provide links (`related`, `self`) and optionally include the related data in a separate `included` section.

### The Standard Form

JSON:API is a standard form that every response must fill out. The form has required fields (type, ID) and optional sections (attributes, relationships, links, meta). All API consumers know how to read this form because the specification defines its layout.

---

## Internal Mechanics

### JsonApiResource vs JsonResource

`JsonApiResource` extends `JsonResource` and overrides `toArray()` to enforce JSON:API structure:

```
JsonResource::toArray() → returns attributes directly
JsonApiResource::toArray() → returns { type, id, attributes, relationships, links }
```

The `toArray()` in `JsonApiResource` wraps the result of `toAttributes()`, `toRelationships()`, and `toLinks()` into the required envelope.

### Type Resolution

The type is derived from the model's table name by default (`User → users`). Override via `$type` property:

```php
class AdminResource extends JsonApiResource
{
    public $type = 'admins';
}
```

### Relationship Resolution

Relationships can be:
1. **Resource identifiers**: just type and ID (lightweight)
2. **Full resources**: included in the `included` array
3. **Links**: URLs for fetching the relationship

The `toRelationships()` method returns an array where keys are relationship names and values are closures returning the related resource(s).

### Sparse Fieldsets

JSON:API clients can request specific fields via `fields[type]`:

```
GET /api/users/1?fields[users]=name,email
// Response includes only name and email attributes
```

Laravel's `JsonApiResource` automatically filters attributes based on sparse fieldset parameters.

---

## Patterns

### Basic JSON:API Resource

The minimum viable JSON:API resource:

```php
class UserResource extends JsonApiResource
{
    public function toAttributes($request): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
        ];
    }
}
```

### Relationships with Includes

Define relationships that can be included:

```php
class UserResource extends JsonApiResource
{
    public function toRelationships($request): array
    {
        return [
            'posts' => [
                'data' => PostResource::collection($this->whenLoaded('posts')),
            ],
        ];
    }
}
```

### Resource Links

Add resource-specific links:

```php
class UserResource extends JsonApiResource
{
    public function toLinks($request): array
    {
        return [
            'self' => route('api.users.show', $this->id),
            'related' => [
                'posts' => route('api.users.posts', $this->id),
            ],
        ];
    }
}
```

### Top-Level Meta

Add JSON:API-compliant top-level meta:

```php
class UserResource extends JsonApiResource
{
    public function with($request): array
    {
        return [
            'jsonapi' => ['version' => '1.1'],
            'meta' => [
                'copyright' => 'Copyright 2026',
            ],
        ];
    }
}
```

---

## Architectural Decisions

### JSON:API vs Custom JSON

| Concern | JSON:API | Custom JSON |
|---|---|---|
| Specification | Strict (type, id, attributes, relationships) | Flexible |
| Client compatibility | Universal (ember-data, JSON API client) | Custom client per API |
| Learning curve | Steep (specification must be learned) | Gentle (team-defined) |
| Tooling | JSON:API validator, documentation generators | Manual |
| Response flexibility | Limited by spec | Full control |
| Compound documents | Built-in (includes) | Manual implementation |

### When to Adopt JSON:API

- Public API consumed by third parties
- API consumed by multiple client types (web, mobile, desktop)
- Large API with many related resources
- When JSON:API tooling is desired (documentation, testing)

#### When to Skip JSON:API

- Internal API with single mobile client
- BFF (Backend for Frontend) API
- Simple CRUD with <10 resources
- Team unfamiliar with JSON:API specification

### Includes vs Side-Loading

JSON:API's `include` parameter replaces custom side-loading patterns:

```php
// Without JSON:API — manual side-loading
// GET /api/users/1?include=posts
// Returns: { "user": { ... }, "posts": [ ... ] }

// With JSON:API — standard includes
// GET /api/users/1?include=posts
// Returns: { "data": { "type": "users", ..., "relationships": { "posts": { "data": [...] } } }, "included": [ ... ] }
```

---

## Tradeoffs

| Concern | JSON:API | Custom Resource |
|---|---|---|
| Response structure | Fixed (type, id, attributes) | Flexible (any keys) |
| Client implementation | Generic JSON:API client | Custom per API |
| Resource nesting | Via relationships + includes | Nested objects |
| Field selection | Sparse fieldsets built-in | Custom implementation |
| Error format | Standardized (errors array) | Custom format |
| Versioning | Via content negotiation | URL or header-based |

---

## Performance Considerations

### Include Query Impact

Including related resources via `include` parameter triggers additional eager loading:

```php
// Without include: 1 query
User::find(1)

// With include=posts: 2 queries (users + posts)
// Assuming controller handles: User::with('posts')->find(1)
```

The `include` parameter must be mapped to eager loads in the controller. Unmapped includes produce N+1 queries.

### Sparse Fieldsets

Field filtering reduces response size proportionally to the number of fields omitted. For models with 50 fields, a 3-field sparse fieldset reduces response size by ~94%.

---

## Production Considerations

### Validate Include Parameters

Only allow safe includes. Reject arbitrary relationship inclusion:

```php
class UserController
{
    protected $allowedIncludes = ['posts', 'profile'];

    public function show(User $user): UserResource
    {
        $includes = $this->parseIncludes(request());
        $user->load($includes);
        return new UserResource($user);
    }

    protected function parseIncludes(Request $request): array
    {
        $requested = explode(',', $request->input('include', ''));
        return array_intersect($requested, $this->allowedIncludes);
    }
}
```

### JSON:API Error Format

Use Laravel's `JsonApiResource` exception formatting for consistent errors:

```php
// Exception handler
public function register(): void
{
    $this->renderable(function (ValidationException $e, $request) {
        return response()->json([
            'errors' => collect($e->errors())->map(fn($messages, $field) => [
                'source' => ['pointer' => "/data/attributes/{$field}"],
                'detail' => implode(', ', $messages),
            ]),
        ], 422);
    });
}
```

### Content Type

JSON:API responses should use the `application/vnd.api+json` content type:

```php
class UserResource extends JsonApiResource
{
    public function withResponse($request, $response): void
    {
        $response->header('Content-Type', 'application/vnd.api+json');
    }
}
```

---

## Common Mistakes

### Forgetting Relationship Closures

`toRelationships()` must return closures, not resolved values. Closures are lazily evaluated and only called when the relationship should be included:

```php
// Wrong — eager resolved
public function toRelationships($request): array
{
    return [
        'posts' => PostResource::collection($this->posts), // Resolved even when not included
    ];
}

// Correct — lazy via closure
public function toRelationships($request): array
{
    return [
        'posts' => fn() => PostResource::collection($this->posts), // Only resolved when included
    ];
}
```

### Non-String IDs

JSON:API requires `id` to be a string. If the model uses integer IDs, cast them:

```php
// JsonApiResource automatically casts id to string
// If using custom id: explicitly cast
'id' => (string) $this->id,
```

### Missing Resource Type

Every JSON:API resource must have a `type`. If the type cannot be derived from the model table name (non-Eloquent resource), set it explicitly via `$type`.

---

## Failure Modes

### Include Parameter Injection

If `include` parameters are not validated, a client could request arbitrary relationships, triggering eager loading of non-existent relations (error) or expensive relations (performance degradation). Always whitelist allowed includes.

### Compound Document Size

A single response with deeply nested includes can produce a very large document. A user with 1000 posts included produces a response with 1001 resources. Set limits on include depth and count.

### Circular Includes

If `PostResource` includes `user` and `UserResource` includes `posts`, a request with `include=posts.user.posts` produces infinite recursion. Detect and prevent circular includes.

---

## Ecosystem Usage

Laravel's native `JsonApiResource` (introduced in Laravel 11) brings first-class JSON:API support directly into the framework. Before this, the ecosystem relied on community packages like `laravel-json-api` (by lindyhopchris) and `cloudcreativity/laravel-json-api` to implement JSON:API compliance. These packages provided complete JSON:API server implementations including error handling, pagination, filtering, and relationship inclusion — functionality that Laravel's native support covers partially.

In production, JSON:API Laravel applications commonly use client libraries like `ember-data` (Ember.js), `json-api-client` (JavaScript), and Dart's `json_api` package for Flutter mobile apps. The JSON:API specification v1.1 (released in 2025) adds atomic operations and extended error objects, which Laravel's native support does not yet fully implement, leading many production APIs to still use community packages for complete compliance. The ecosystem continues to evolve, with the Laravel core team and community package maintainers collaborating on specification coverage.

---

## Related Knowledge Units

- **Resource Fundamentals** (this workspace) — baseline resource concepts
- **Conditional Relationships** (this workspace) — whenLoaded with JSON:API
- **Sparse Fieldsets** (this workspace) — field filtering in JSON:API
- **Versioned Resources** (this workspace) — JSON:API versioning

---

## Research Notes

- `JsonApiResource` was added in Laravel 11; before that, JSON:API compliance required manual implementation or packages
- The `toRelationships()` lazy closure pattern was introduced to prevent unnecessary relationship resolution — closures are only called when the relationship is included or explicitly requested
- JSON:API specification v1.1 (2025) added: atomic operations, extended error objects, and profile media types
- Laravel's `JsonApiResource` does NOT implement the full JSON:API specification — it covers resource objects, relationships, includes, and sparse fieldsets, but not pagination links, filtering, or error objects (these require manual implementation or packages)
- Production adoption: ~15% of Laravel APIs use JSON:API, growing with Laravel 11+ native support
