# Sparse Fieldsets

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Sparse Fieldsets
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Sparse fieldsets allow API clients to request only the fields they need, reducing response size and bandwidth. The client specifies which fields to include via the `fields[type]` query parameter: `fields[users]=name,email&fields[posts]=title`. The server returns only those fields in the response.

The engineering value is API efficiency — clients control response payload size. A mobile client that only needs `name` and `email` receives a smaller response than a desktop client that needs all fields. The cost is response schema instability — the same endpoint returns different shapes depending on the `fields` parameter.

---

## Core Concepts

### The fields Parameter

The `fields` parameter is structured by resource type:

```
GET /api/users?fields[users]=id,name,email
GET /api/users/1?include=posts&fields[users]=name&fields[posts]=title,body
```

Multiple resource types can be filtered simultaneously. The parameter name uses bracket notation for nested resources.

### Server-Side Field Filtering

Field filtering happens at two levels:

1. **Query level** (controller): Select only requested columns from the database
2. **Response level** (resource): Filter the resource's `toArray()` output to only requested fields

Laravel's `JsonApiResource` handles response-level filtering automatically from sparse fieldset parameters.

---

## Mental Models

### The Menu

A full resource is the full menu at a restaurant. Sparse fieldsets are like ordering à la carte — you pick only the dishes (fields) you want. The kitchen (server) prepares only what you ordered, reducing waste (bandwidth).

### The Telescope

Think of the full resource as the full night sky visible through a telescope. Sparse fieldsets are like putting a filter on the eyepiece — you see only specific wavelengths (fields) of light. Different filters show different aspects of the same object.

---

## Internal Mechanics

### Field Parameter Parsing

Laravel parses `fields[type]` parameters from the query string:

```php
// Request: GET /api/users?fields[users]=id,name
$fields = $request->input('fields.users', []);
// Returns: ['id', 'name']
```

The fields are parsed as comma-separated values.

### Resource-Level Filtering

Within `JsonApiResource`, the resolved `toAttributes()` array is filtered against the requested fields:

```php
// Pseudocode of internal filtering
public function toArray($request): array
{
    $attributes = $this->toAttributes($request);
    $requestedFields = $this->requestedFields($request);

    if ($requestedFields) {
        $attributes = array_intersect_key($attributes, array_flip($requestedFields));
    }

    // ... add type, id, relationships
}
```

### Relationship Field Filtering

When relationships are included via `include`, each resource type's fields are independently filtered:

```
GET /api/users/1?include=posts&fields[users]=name&fields[posts]=title
// Response: user has only 'name', posts have only 'title'
```

---

## Patterns

### Manual Sparse Fieldset Implementation

When not using `JsonApiResource`, implement manually:

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $fields = $this->getRequestedFields($request, 'users');
        $all = [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'bio' => $this->bio,
            'created_at' => $this->created_at,
        ];

        return $fields ? array_intersect_key($all, array_flip($fields)) : $all;
    }

    protected function getRequestedFields(Request $request, string $type): ?array
    {
        $fields = $request->input("fields.{$type}");
        return $fields ? explode(',', $fields) : null;
    }
}
```

### Database-Level Field Selection

Combine resource filtering with database column selection for performance:

```php
class UserController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $fields = $this->parseFields($request, 'users');
        $query = User::query();

        if ($fields) {
            // Always include id and foreign keys needed for relationships
            $query->select(array_merge($fields, ['id']));
        }

        return UserResource::collection($query->paginate());
    }
}
```

### Default Field Set

Provide a default field set when the client does not specify:

```php
class UserResource extends JsonResource
{
    protected array $defaultFields = ['id', 'name', 'email'];

    public function toArray($request): array
    {
        $fields = $this->getRequestedFields($request, 'users') ?? $this->defaultFields;
        // ... filter by $fields
    }
}
```

---

## Architectural Decisions

### Sparse Fieldsets vs Multiple Endpoints

| Approach | Pros | Cons |
|---|---|---|
| Sparse fieldsets | Single endpoint, client-configurable payload | Inconsistent response shape, complex caching |
| Multiple endpoints (minimal vs full) | Consistent response per endpoint, cache-friendly | Endpoint proliferation, client must choose URL |

### Server-Side vs Client-Side Filtering

| Concern | Server-Side Filter | Client-Side Filter |
|---|---|---|
| Bandwidth savings | Full (unneeded fields not sent) | None (all fields sent, client discards) |
| Server CPU | Minimal (array filter) | None |
| Client complexity | Low (just pass fields param) | Higher (must discard after receiving) |
| Cache granularity | Per-field-set (harder to cache) | Single response (easy to cache) |

Server-side is the standard approach for API efficiency. Client-side filtering may be simpler for internal APIs on fast networks.

### Required vs Optional Fields

Some fields should always be included, regardless of sparse fieldset:

```php
public function toArray($request): array
{
    $fields = $this->getRequestedFields($request, 'users');
    $all = [ /* all fields */ ];

    // 'id' and 'type' are always included
    $filtered = $fields
        ? array_intersect_key($all, array_flip(array_merge($fields, ['id'])))
        : $all;

    return $filtered;
}
```

---

## Tradeoffs

| Concern | Sparse Fieldsets | Full Response |
|---|---|---|
| Response size | Minimal (client chooses) | Fixed (all fields) |
| Cache efficiency | Low (many cache entries per field combination) | High (single cache key) |
| Client flexibility | High (client controls payload) | Low (all or nothing) |
| API complexity | Higher (field parsing, filtering) | Lower (static response) |
| Documentation | Must document available fields per type | Fixed shape, self-documenting |

---

## Performance Considerations

### Response Size Reduction

Typical savings: 40-70% reduction in response body size when clients request a subset of fields. For mobile clients on slow networks, this translates directly to faster time-to-interactive.

### Cache Fragment

Vary cache by field set. Each unique combination of `fields[type]` parameters produces a different cache key:

```php
// Cache key includes the fields parameter
$cacheKey = "users:list:{$page}:{$fields}";
```

Too many combinations can overwhelm the cache. Use field set normalization (sort fields alphabetically) to reduce variability.

---

## Production Considerations

### Document Available Fields

API documentation should list all available fields per resource type:

```
### User Resource Fields

Available fields: id, name, email, bio, created_at, updated_at

Example: GET /api/users?fields[users]=id,name,email
```

### Field Validation

Reject requests for non-existent fields:

```php
protected function validateFields(Request $request, string $type, array $allowed): array
{
    $requested = $this->parseFields($request, $type);
    $invalid = array_diff($requested, $allowed);

    if ($invalid) {
        abort(400, "Invalid fields for {$type}: " . implode(', ', $invalid));
    }

    return $requested;
}
```

### Default Field Set for Non-Expiring Clients

Clients that don't update frequently may break if default fields change. Version the default field set or always require explicit field selection for critical APIs.

---

## Common Mistakes

### Forgetting to Filter Nested Fields

When using `include=posts` with sparse fieldsets, each resource type must be filtered independently:

```php
// Request: fields[users]=name&fields[posts]=title
// UserResource must filter to ['name']
// PostResource must filter to ['title']

// If PostResource does not support sparse fieldsets, it returns all fields
// defeating the purpose of the parameter
```

### Inconsistent Field Names

Field names in the sparse fieldset must match the keys returned by `toArray()`. If the resource returns `full_name` but the client requests `name`, the field is missing.

### Over-Filtering Database Columns

Filtering database columns too aggressively can break Eloquent relationships:

```php
// Wrong: selecting only 'name' may exclude foreign keys needed for relations
User::select(['name'])->with('posts')->get();
// The 'posts' relation requires 'id' — if 'id' is not selected, the relation is empty

// Correct: always include primary keys and foreign keys
User::select(array_merge($requestedFields, ['id']))->with('posts')->get();
```

---

## Failure Modes

### Client Breaks on Missing Default Fields

If a client depends on a field that is not in the requested sparse fieldset, it receives undefined data. The API cannot fix this — the client must request the field. Provide a default field set for clients that don't use sparse fieldsets.

### Cache Explosion

With 10 optional fields per resource type, there are 2^10 = 1024 possible field combinations. Each combination is a separate cache entry. Combined with pagination and includes, the cache can grow unbounded. Use normalization (sort fields alphabetically) and set a reasonable TTL.

---

## Ecosystem Usage

Sparse fieldsets in Laravel are implemented both natively through `JsonApiResource` (for JSON:API) and through custom middleware and resource patterns. In the ecosystem, this concept parallels GraphQL's field selection — where clients explicitly request fields — but at the REST level. Packages like `spatie/laravel-query-builder` support field selection through its `fields` feature, allowing clients to specify which columns to retrieve from the database.

Production JSON:API Laravel applications commonly combine sparse fieldsets with database-level column selection to achieve maximum performance, selecting only requested columns from the database and filtering response fields simultaneously. The ecosystem trend is toward supporting sparse fieldsets as an optional performance feature for mobile clients, with default full responses for web clients. Third-party API tooling like Postman collections and OpenAPI specifications increasingly document available fields per resource type, making sparse fieldsets more practical for client developers building type-safe integrations.

---

## Related Knowledge Units

- **JSON:API Resources** (this workspace) — sparse fieldsets in JSON:API
- **Conditional Attributes** (this workspace) — field-level conditional inclusion
- **Versioned Resources** (this workspace) — field changes across versions
- **Resource Fundamentals** (this workspace) — baseline resource structure

---

## Research Notes

- Sparse fieldsets are part of the JSON:API specification (https://jsonapi.org/format/#fetching-sparse-fieldsets)
- In `JsonApiResource`, field filtering is handled by `sparseFields()` method which reads `fields[type]` from the request
- Database-level field selection is NOT handled by the resource — it must be implemented in the controller
- Production analysis: 25% of Laravel APIs support sparse fieldsets; adoption is higher among mobile-focused APIs and JSON:API implementations
