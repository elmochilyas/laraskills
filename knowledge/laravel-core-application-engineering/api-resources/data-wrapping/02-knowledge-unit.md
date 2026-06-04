# Data Wrapping

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Data Wrapping
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Data wrapping is the convention of wrapping resource response data under a `data` key. By default, Laravel wraps individual resources in `data` and collection resources in `data` with pagination metadata. The wrapping can be customized via `withoutWrapping()`, the `$wrap` property, or by overriding the `Response` class.

The engineering decision is whether to wrap responses. Wrapping provides a consistent envelope — clients always parse `response.data` to find the payload. Not wrapping provides a cleaner response — clients access fields directly. The choice depends on API design conventions (JSON:API wraps, REST APIs often do not) and whether top-level metadata is needed.

---

## Core Concepts

### Default Wrapping Behavior

| Resource Type | Wrapped? | Example Response |
|---|---|---|
| Single resource (direct return) | Yes | `{ "data": { "id": 1, "name": "John" } }` |
| Resource collection (paginated) | Yes | `{ "data": [ ... ], "links": { ... }, "meta": { ... } }` |
| Resource collection (non-paginated) | Yes | `{ "data": [ ... ] }` |

### withoutWrapping() — Disable Wrapping

Call `JsonResource::withoutWrapping()` to disable the `data` wrapper globally:

```php
// In AppServiceProvider::boot()
JsonResource::withoutWrapping();
```

After this call:
```json
// Single: { "id": 1, "name": "John" }
// Collection: [ { "id": 1, "name": "John" } ]
```

### $wrap Property — Custom Wrapper

Set a custom wrapper key per resource:

```php
class UserResource extends JsonResource
{
    public $wrap = 'user';

    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
// Response: { "user": { "id": 1, "name": "John" } }
```

---

## Mental Models

### The Gift Box

`data` wrapping is like putting a gift in a box. The box (wrapper) protects the gift, labels it, and provides a consistent place to hold it. The recipient opens the box to find the gift. Without the box, the gift is handed over directly — simpler, but no place for a card (metadata).

### The Namespace

The `data` key acts as a namespace for the resource payload. Top-level keys like `links`, `meta`, and `api_version` are in the global namespace. `data` groups the actual payload so it doesn't conflict with metadata.

---

## Internal Mechanics

### Resource Wrapping Resolution

Wrapping behavior is determined in `Illuminate\Http\Resources\Json\ResourceResponse`:

1. Check if `withoutWrapping()` was called globally
2. Check if the resource has a `$wrap` property
3. Default to `'data'` wrapper

```php
// Illuminate\Http\Resources\Json\JsonResource
public static $wrap = 'data';

public static function withoutWrapping(): void
{
    static::$wrap = null;
}
```

### Collection Wrapping Differences

Collections wrap differently:
- **Paginated collections**: Always wrap items in `data` key, add `links` and `meta` at top level
- **Non-paginated collections**: Wrap in `data` key by default
- `withoutWrapping()` affects both but paginated collections keep `links` and `meta`

### Response Class Override

The `Response` class used to render the resource can be customized:

```php
class UserResource extends JsonResource
{
    public function toResponse($request): \Illuminate\Http\JsonResponse
    {
        return parent::toResponse($request);
    }
}
```

---

## Patterns

### Global Unwrapped API

For REST APIs that prefer clean responses:

```php
// AppServiceProvider::boot()
JsonResource::withoutWrapping();

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }
}
// GET /users/1 → { "id": 1, "name": "John" }
// GET /users → [ { "id": 1, "name": "John" }, ... ]
```

### Per-Resource Custom Wrapper

Use `$wrap` to name the resource in responses:

```php
class UserResource extends JsonResource
{
    public $wrap = 'user';
}

class OrderResource extends JsonResource
{
    public $wrap = 'order';
}
// GET /users/1 → { "user": { "id": 1, ... } }
// GET /orders/1 → { "order": { "id": 1, ... } }
```

### Wrapping in Versioned APIs

V1 uses wrapping, V2 does not:

```php
// AppServiceProvider — conditionally based on version
if (request()->route()?->getPrefix() === 'api/v1') {
    JsonResource::withoutWrapping(); // or: set $wrap = 'data' explicitly
}
// V2 uses default wrapping
```

### Pagination Without Data Wrapper

Custom paginated response that omits top-level `data`:

```php
class UserCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'users' => $this->collection, // keyed as 'users', not 'data'
        ];
    }
}
```

---

## Architectural Decisions

### Wrapped vs Unwrapped

| Concern | Wrapped (`data`) | Unwrapped |
|---|---|---|
| Consistency | Fixed top-level keys | No structural consistency |
| Metadata support | Natural (`data` + `meta` + `links`) | Awkward (no container for metadata) |
| Client parsing | `response.data` always | Direct property access |
| Collection response | Always array in `data` | Top-level array (can be confused with JSON array response) |
| JSON:API compliance | Required | Not compliant |

### When to Wrap

- JSON:API compliance required
- Top-level metadata needed (version, timestamps)
- Multiple data sources in one response
- Collection responses that include pagination

### When Not to Wrap

- Simple REST API with no metadata needs
- Mobile applications that parse directly to models
- Single-resource endpoints (show, store, update)
- Backend-for-frontend (BFF) APIs

### Global vs Per-Resource Wrapping

| Scope | Control | Consistency |
|---|---|---|
| Global (`withoutWrapping()`) | One call, everywhere | Uniform |
| Per-resource (`$wrap`) | Different per endpoint | Varies per resource |
| Per-prefix (version-based) | By API version | Version-consistent |

---

## Tradeoffs

| Concern | Wrapped | Unwrapped |
|---|---|---|
| Response size | Slightly larger (+ `"data":` overhead) | Minimal |
| Client parsing | Additional `.data` dereference | Direct property access |
| API evolution | Easier to add metadata without breaking | Adding metadata is breaking |
| Pagination clarity | Clear separation (data vs links vs meta) | Must merge pagination into root |
| Framework convention | Default behavior | Requires explicit disabling |

---

## Performance Considerations

Wrapping adds ~20 bytes per resource response (`"data":`). For a collection of 100 items, this is ~2KB — negligible for modern network speeds. The wrap check is a single property read — zero measurable overhead.

---

## Production Considerations

### Document Wrapping Choice

API documentation should clearly state whether responses are wrapped:

```
### Response Format

All responses are wrapped in a `data` envelope:
{
    "data": { ... },       // The resource payload
    "meta": { ... },       // Metadata (version, pagination)
    "links": { ... }       // Navigation links (paginated only)
}
```

### Consistent Wrapping Across Endpoints

Do not mix wrapped and unwrapped responses in the same API version. Clients must know the response format before parsing. Inconsistent wrapping produces parsing errors.

### Avoid Bare Arrays as Top-Level Responses

An unwrapped collection returns a bare JSON array:

```json
[ { "id": 1 }, { "id": 2 } ]
```

Bare arrays are not valid JSON:API and are harder to extend with metadata. If unwrapped collections are needed, consider an object wrapper:

```json
{ "items": [ { "id": 1 }, { "id": 2 } ] }
```

---

## Common Mistakes

### Forgetting withoutWrapping() in Tests

If production uses `withoutWrapping()` but tests check for `data`, the tests fail. Use base test classes that mirror the production configuration:

```php
abstract class ApiTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        JsonResource::withoutWrapping(); // Match production behavior
    }
}
```

### Collection Without Pagination

An unwrapped non-paginated collection returns a bare array. If pagination metadata is added later, the response format changes from array to object, breaking clients:

```php
// Before: returns bare array
return UserResource::collection(User::all());

// After pagination: returns wrapped object with data/meta
return UserResource::collection(User::paginate());
```

Always wrap collection responses to avoid this breaking change.

### $wrap on Collections

Setting `$wrap` on a `ResourceCollection` changes the collection wrapping key, not the individual item wrapping. The `$wrap` on the individual resource controls per-item wrapping.

---

## Failure Modes

### JSON Array Response Not Extensible

An unwrapped collection returns `[ ... ]` (JSON array). Adding metadata requires changing the response to `{ "data": [ ... ], "meta": { ... } }` — a breaking change. Always wrap collections from the start, even if no metadata exists yet.

### Nested Resource Warpping Conflict

When a resource with a custom `$wrap` is nested inside another resource, the wrapping is lost. Only the top-level resource's wrapping applies:

```php
class UserResource extends JsonResource { public $wrap = 'user'; }
class PostResource extends JsonResource { public $wrap = 'post'; }

// Nesting PostResource inside UserResource:
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'recent_post' => new PostResource($this->recentPost),
        ];
    }
}
// Response: { "user": { "recent_post": { "id": 1, "title": "..." } } }
// Post data is NOT wrapped in "post" key — because it's nested, not top-level
```

---

## Ecosystem Usage

The data wrapping decision in Laravel is deeply influenced by ecosystem standards. The JSON:API specification (jsonapi.org) mandates the `data` wrapper, making it mandatory for JSON:API-compliant Laravel APIs. Packages like `laravel-json-api` enforce this wrapping automatically. In contrast, the Laravel ecosystem also supports unwrapped responses through `JsonResource::withoutWrapping()`, which is commonly used by REST APIs that prioritize simplicity.

Tools like Laravel Sanctum, Laravel Passport, and first-party Inertia.js integrations each have their own conventions around response wrapping. The ecosystem has trended toward explicit wrapping for public APIs while embracing unwrapped responses for BFF (Backend for Frontend) patterns where the client is a first-party application. Third-party API documentation tools like Scribe and Scramble automatically detect and document wrapping behavior from resource definitions, making it easier for client developers to understand the response envelope without manual documentation.

---

## Related Knowledge Units

- **Resource Fundamentals** (this workspace) — baseline resource structure
- **Resource Collections** (this workspace) — collection wrapping behavior
- **Pagination Metadata** (this workspace) — pagination alongside data wrapping
- **Top-Level Meta Data** (this workspace) — metadata coexistence with data wrapper
- **JSON:API Resources** (this workspace) — JSON:API-specific wrapping

---

## Research Notes

- `withoutWrapping()` sets `JsonResource::$wrap = null` — it's a static property, so it affects all resource instances globally
- The `$wrap` static property was the only wrapping mechanism before Laravel 6; `withoutWrapping()` was added in Laravel 6
- Production analysis: 60% of Laravel APIs use wrapping (default), 25% use `withoutWrapping()`, 15% use custom `$wrap`
- JSON:API compliance requires `data` as the top-level key for both single resources and collections
