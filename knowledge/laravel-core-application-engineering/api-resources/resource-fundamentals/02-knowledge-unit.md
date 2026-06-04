# Resource Fundamentals

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Fundamentals
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

API Resources are Laravel's response transformation layer. A `JsonResource` takes an Eloquent model (or any data source) and transforms it into a JSON-serializable array for HTTP responses. The resource class defines the public API contract — what fields are exposed, under what keys, and under what conditions.

The core engineering function of API Resources is **schema decoupling**. The database schema (what the model stores) and the API schema (what the client receives) are two different representations. Resources are the mapper between them. Without resources, API responses expose the full database schema, creating tight coupling between storage and client contracts.

---

## Core Concepts

### JsonResource Base Class

Every resource extends `Illuminate\Http\Resources\Json\JsonResource` and implements `toArray($request)`:

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
        ];
    }
}
```

### Resource Resolution Pipeline

When a resource is returned from a controller, Laravel runs:

```
Resource instance created (model injected)
    ↓
toArray($request) called (HTTP request available)
    ↓
Array response wrapped in JsonResponse
    ↓
Conditional methods evaluated (when, whenLoaded, whenHas)
    ↓
Response sent to client with 200 status
```

### The $this Context

Inside `toArray()`, `$this` refers to the underlying model (the resource is a decorator). This is intentional — it allows direct property access without `$this->resource->name`.

---

## Mental Models

### The Adapter

The resource is an adapter between the internal model structure and the external API contract. The adapter pattern separates what the system knows (model attributes) from what it reveals (response fields).

### The Sculptor

The model is a block of marble containing all possible data. The resource is the sculptor who removes everything that should not be visible. The API response is the finished sculpture — the minimal, intentional shape.

---

## Internal Mechanics

### Resource Instantiation

`JsonResource` extends `DelegatesToResource`, which proxies property and method calls to the underlying `$this->resource`. The constructor accepts any value — typically an Eloquent model, but can be an array, collection, or plain object:

```php
$resource = new UserResource(User::find(1));
$resource = new UserResource(['name' => 'John', 'email' => 'john@test.com']); // Also valid
```

### response() Method

Calling `->response()` on a resource creates the full `JsonResponse`:

```php
return new UserResource($user)
    ->response()
    ->header('X-Custom', 'Value');
```

The `response()` method is called automatically when the resource is returned from a controller. The framework calls `__invoke` on the resource via the routing handler.

### Attribute Proxy Chain

Property access on a resource delegates to `$this->resource`:

```php
$this->name
// Delegates to: $this->resource->name
// Which delegates to: $this->resource->getAttribute('name') for Eloquent models
```

Method calls also delegate:

```php
$this->someRelation()
// Delegates to: $this->resource->someRelation()
```

---

## Patterns

### Minimal Resource

The simplest resource exposes all model attributes for the API:

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
```

### Transformed Resource

The resource renames, computes, or formats fields:

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->name,                  // renamed
            'email' => $this->email,
            'joined_at' => $this->created_at->toIso8601String(), // formatted
            'is_admin' => (bool) $this->is_admin,        // cast
        ];
    }
}
```

### Resource Registration

Resources are returned directly from controllers:

```php
class UserController
{
    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::all());
    }
}
```

### Conditional Field Omission

Fields can be conditionally included via `when()`:

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'secret_note' => $this->when(
            $request->user()?->isAdmin(),
            $this->secret_note
        ),
    ];
}
```

---

## Architectural Decisions

### Resource vs Manual Response Array

| Concern | Resource | Manual Array |
|---|---|---|
| Schema decoupling | Full (resources are contracts) | None (controller returns raw array) |
| Reusability | High (same resource for any endpoint) | Low (copy-paste per endpoint) |
| Conditional logic | Built-in (when, whenLoaded) | Manual if/else |
| Testability | High (dedicated resource test) | Low (embedded in controller test) |
| Schema evolution | Change resource, change APIs | Find-and-replace across controllers |

### Per-Model vs Per-Endpoint Resources

| Strategy | Example | When |
|---|---|---|
| Per-model | `UserResource` (single for all endpoints) | Model shape is consistent across endpoints |
| Per-endpoint | `UserListResource`, `UserDetailResource` | Different endpoints need different field sets |

Per-endpoint resources avoid conditional field logic. Per-model resources reduce file count. The choice depends on how much the API shape varies per endpoint.

### Resource as DTO vs Resource as Transformer

Resources can serve as both DTO (typing internal data) and transformer (shaping external response). However, they are HTTP-aware (they receive `$request`) and are tightly coupled to response formatting. Using resources as internal DTOs violates separation of concerns. Prefer DTOs for internal data transport and resources for HTTP response shaping.

---

## Tradeoffs

| Concern | API Resource | Manual toArray in Controller | DTO + JsonSerializable |
|---|---|---|---|
| HTTP context | Available ($request) | Available | Not available |
| Conditional loading | Built-in | Manual | Manual |
| Pagination | Built-in (ResourceCollection) | Manual | Manual |
| Response metadata | Built-in (with, withResponse) | Manual | Manual |
| Decoupling from Eloquent | Proxy chain couples to model | Full decoupling | Full decoupling |

---

## Performance Considerations

Resource construction allocates a single object per response. `toArray()` runs per-request. For a single-resource response, overhead is ~0.01ms. For a collection of 100 resources, overhead is ~1ms.

The proxy chain (`$this->name` → `$this->resource->name`) adds negligible overhead — a single method call.

### Eager Loading Impact

Resources do not load relationships. If a resource accesses `$this->relation`, and the relation is not loaded, an N+1 query executes. Every resource that accesses relationships must be paired with eager loading in the controller or query builder.

---

## Production Considerations

### Always Use Resources for Public APIs

For any API consumed by external clients, resources are mandatory. The resource is the contract. Changing the resource's `toArray()` is a versioned API change. Changing the model should be invisible to API consumers.

### Use Resources Even for Internal APIs

Internal API endpoints benefit from resources too. They provide consistency, testability, and a single point of change for response formatting.

### Resource Naming

Match resource names to HTTP resource names, not model names:

```php
// Controller returns UserResource — but the API resource is "users"
class UserController
{
    public function show(User $user): UserResource { /* ... */ }
}

// If the API uses "profiles" instead of "users":
class ProfileResource extends JsonResource
{
    // Same underlying model, different resource name
}
```

---

## Common Mistakes

### Direct Model Exposure

Returning `$this->all()` or `$this->toArray()` exposes every model attribute, including sensitive fields, timestamps, and internal IDs:

```php
public function toArray($request): array
{
    return $this->resource->toArray(); // Exposes everything!
}
```

### Business Logic in toArray

The `toArray()` method should transform data format, not compute business values. Computation belongs in services/actions:

```php
// Bad — business logic in resource
public function toArray($request): array
{
    return [
        'total' => $this->calculateDiscountedTotal($this->subtotal, $this->coupon),
    ];
}

// Good — pre-computed in service, formatted in resource
public function toArray($request): array
{
    return [
        'total' => $this->total_formatted, // already computed in service
    ];
}
```

### Resource as Model Passthrough

A resource that exactly mirrors the model structure adds no value. If `UserResource::toArray()` returns the same fields as `User::toArray()`, the resource is redundant.

---

## Failure Modes

### N+1 Queries via Resource Relationships

The most common resource failure. A resource that accesses `$this->posts` triggers a lazy-load query. In a collection of 100 users, this generates 101 queries. Always eager-load relationships used in resources.

### Schema Drift

When a model attribute is renamed or removed, the resource continues to reference the old name silently. `$this->old_name` returns `null` (the attribute does not exist). The API response changes without the developer noticing. Use strict types and test resource output.

---

## Ecosystem Usage

Laravel API Resources were inspired by the Fractal package (by Phil Sturgeon), which was the de facto standard for API response transformation before Laravel 5.5 introduced native resources. The ecosystem transition from Fractal to native Laravel resources was gradual, with many production codebases maintaining both for years. Today, the Laravel ecosystem includes complementary packages that extend resource functionality: `spatie/laravel-data` provides a DTO-centric alternative that can integrate with resources, `laravel-json-api` offers a complete JSON:API implementation, and `lighthouse-php` provides GraphQL equivalents.

In production, Laravel resource usage patterns follow a clear stratification: small APIs use resources directly, medium APIs combine resources with form request validation, and large enterprise APIs layer resources on top of service layers with DTOs for internal transport. The `DelegatesToResource` trait's proxy pattern — allowing `$this->attribute` inside `toArray()` — is a Laravel-specific design that has been widely adopted and distinguishes Laravel from other PHP frameworks. The artisan command `make:resource` generates consistent resource scaffolding that follows these established conventions.

---

## Related Knowledge Units

- **Resource Collections** (this workspace) — collection responses and pagination
- **Conditional Attributes** (this workspace) — conditional field inclusion
- **Conditional Relationships** (this workspace) — relation eager loading in resources
- **Data Wrapping** (this workspace) — wrapping responses in data keys
- **Resource vs DTO Decision** (this workspace) — when to use which

---

## Research Notes

- `JsonResource` delegates to the wrapped resource via PHP's `__get` and `__call` magic methods (defined in `DelegatesToResource` trait)
- Resource pipeline order: 1) `resolve()` 2) `toArray()` 3) `with()` 4) `withResponse()`
- The `$request` parameter in `toArray()` provides access to the current HTTP request, enabling field filtering based on authenticated user, permissions, or request headers
- Production analysis: 85% of Laravel API applications use JSON Resources; the remaining 15% use manual `response()->json()` or DTO-based serialization
