# Resource Fundamentals

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Fundamentals
- **Difficulty:** Foundation
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
API Resources are Laravel's response transformation layer. A `JsonResource` takes an Eloquent model (or any data source) and transforms it into a JSON-serializable array for HTTP responses. The resource class defines the public API contract — what fields are exposed, under what keys, and under what conditions.

The core engineering function is **schema decoupling**: the database schema (model storage) and the API schema (client contract) are two different representations, and resources are the mapper between them. Without resources, API responses expose the full database schema, creating tight coupling between storage and client contracts.

## Core Concepts
- **JsonResource base class:** Extend `Illuminate\Http\Resources\Json\JsonResource` and implement `toArray($request)`.
- **Decorator pattern:** `$this` inside `toArray()` refers to the underlying model (the resource is a decorator via `DelegatesToResource`), allowing direct property access.
- **Resolution pipeline:** Resource created → `toArray($request)` called → array wrapped in `JsonResponse` → conditionals evaluated → response sent.
- **Minimal resource:** Return explicit fields — never `$this->resource->toArray()` as it exposes everything.
- **Transformed fields:** Rename, format, or cast fields (e.g., `full_name` from `name`, ISO dates).
- **Conditional inclusion:** `when()` for permission or context-based field omission.
- **response() method:** Returns the full `JsonResponse` for header customization.

## When To Use
- Every public API endpoint that returns model data.
- Internal API endpoints where consistency and testability matter.
- Any response where the API shape differs from the model shape.
- Versioned APIs where schema evolution must be controlled.

## When NOT To Use
- Trivial internal endpoints where the API shape exactly matches the model and will never change.
- CLI commands or queue job outputs where JSON structure is ad-hoc.
- Prototypes where raw `response()->json()` is faster and the API is not consumed externally.
- When a dedicated DTO layer already handles all transformation and no HTTP-specific features are needed.

## Best Practices (WHY)
- **Always use resources for public APIs.** The resource is the contract — changing `toArray()` is a versioned API change, while changing the model should be invisible to consumers.
- **Match resource names to API resource names, not model names.** If the API uses "profiles," name it `ProfileResource` even if the model is `User`.
- **Keep `toArray()` as pure transformation — no business logic.** Computation (discounts, totals) belongs in services/actions; resources only format pre-computed values.
- **Prefer explicit field listing over dynamic.** Returning individual fields makes the contract obvious and prevents accidental exposure of sensitive attributes.
- **Use per-endpoint resources when shape varies significantly.** `UserListResource` and `UserDetailResource` avoid excessive conditional logic in a single resource.

## Architecture Guidelines
- Place resources in `app/Http/Resources/` following PSR-4.
- One resource class per model or per endpoint shape — the choice depends on how much the API shape varies.
- Resources should be returned from controllers, never passed into services (services receive DTOs, models, or primitives).
- For collections, use `Resource::collection()` or extend `ResourceCollection`.
- Version resources via namespace directories (`V1/`, `V2/`) when the API evolves.

## Performance
- Resource construction allocates ~0.01ms per response. For a collection of 100, ~1ms overhead.
- The proxy chain (`$this->name` → `$this->resource->name`) adds negligible overhead — a single method call.
- **Critical:** Resources do not load relationships. Accessing `$this->relation` without eager loading triggers N+1 queries. Always pair resource relationship access with controller-side eager loading.

## Security
- **Never use `$this->resource->toArray()`** — it exposes every model attribute, including sensitive fields (`password`, `remember_token`), timestamps, and internal IDs.
- Conditional `when()` is not access control. Hiding a field via omission does not prevent access if the underlying endpoint is reachable. Use policies and middleware alongside conditional visibility.
- Always explicitly list every field in `toArray()`. The resource is the whitelist of what the API exposes.

## Common Mistakes

### Direct Model Exposure (desc)
Returning `$this->resource->toArray()` or `$this->all()`.
- **Cause:** Developer wants to avoid listing fields manually.
- **Consequence:** Every model attribute, including sensitive fields, is exposed in the API response.
- **Better:** Always explicitly return an array with only the intended fields.

### Business Logic in toArray (desc)
Computing values (discounts, permissions, totals) inside the resource.
- **Cause:** Convenience — the data is available on the model, so why not compute it inline?
- **Consequence:** Business logic is scattered across resources, making it hard to test, version, and maintain.
- **Better:** Pre-compute values in services/actions; resources only format and present.

### Redundant Resource (desc)
A resource that mirrors the model structure exactly with no transformation.
- **Cause:** Assuming resources are always required, even when no transformation is needed.
- **Consequence:** Extra file with no value, creating maintenance overhead without benefit.
- **Better:** Skip the resource or add meaningful transformation (field renaming, formatting, omission).

## Anti-Patterns
- **God Resource:** A single resource class handling multiple endpoints via excessive conditional flags. Use per-endpoint resources instead.
- **DTO-Resource Hybrid:** Using a resource as an internal DTO (passing it to services). Resources are HTTP-aware; services should receive typed DTOs or models.
- **Leaky Resource:** Returning computed values that require database queries or external API calls inside `toArray()`.

## Examples

### Minimal Resource
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
```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->name,
            'email' => $this->email,
            'joined_at' => $this->created_at->toIso8601String(),
            'is_admin' => (bool) $this->is_admin,
        ];
    }
}
```

### Controller Integration
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

## Related Topics
- Resource Collections — collection responses and pagination
- Conditional Attributes — `when()`, `whenHas()`, `whenNotNull()`
- Conditional Relationships — `whenLoaded()`, `whenCounted()`
- Data Wrapping — `data` key wrapping and `withoutWrapping()`
- Resource vs DTO Decision — when to use which

## AI Agent Notes
- **Generate:** Use `php artisan make:resource UserResource` for scaffolding.
- **Key constraint:** Resources must never contain business logic, database queries, or external service calls.
- **Validation:** The `toArray()` return should be an associative array of serializable values.
- **Common fix:** If a resource is accessing `$this->relation`, ensure the controller calls `->with('relation')`.
- **Testing pattern:** `(new UserResource($user))->response()->getData(true)` for unit tests.

## Verification
- [ ] Every public API endpoint uses a resource class.
- [ ] `toArray()` returns an explicit array, not `$this->resource->toArray()`.
- [ ] No business logic or database queries exist inside `toArray()`.
- [ ] Relationship accesses use `whenLoaded()` or are guaranteed to be eager-loaded.
- [ ] Resource names match the API resource name, not necessarily the model name.
- [ ] Resources are returned from controllers, not passed into services.
