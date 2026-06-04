# JSON Resource — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** JSON Resource
- **ECC Version:** 1.0

## Overview
Laravel API Resources (`JsonResource`) provide a dedicated transformation layer between Eloquent models and JSON responses. A resource class wraps a model and defines `toArray($request)` to customize output structure. Resources decouple API representation from model serialization, enabling attribute renaming, computed fields, conditional inclusion, and nested relationship transformations. They are the recommended approach for all public API endpoints where default model serialization is insufficient.

## Core Concepts
- `JsonResource` — base class extended by application resources; wraps a model and customizes JSON output
- `toArray($request)` — must-implement method returning the array representation; receives the HTTP request
- `Resource::make()` — creates a single resource wrapping the given model
- `Resource::collection()` — wraps a collection/paginator into a resource collection with `data` wrapping
- `$this->resource` — the underlying model/resource inside the resource class
- `with($request)` — returns additional metadata merged at the top level of the response
- `withResponse($request, $response)` — hook for modifying HTTP response headers/status
- Conditional methods — `when()`, `whenLoaded()`, `whenHas()` for conditional attribute inclusion
- Implements `Responsable` — returning a resource from a controller auto-converts to JSON response

## When To Use
- Any public API endpoint where the default model `toArray()` shape is insufficient
- When you need to rename, flatten, nest, or compute attributes differently than the model's internal shape
- When you need request-aware serialization (include admin fields based on authenticated user)
- When you need conditional attributes, pagination metadata, or top-level wrapping
- Applying API versioning via separate resource classes per version

## When NOT To Use
- Do NOT use for non-HTTP serialization (queue, broadcast, CLI, events) — use DTOs or model `toArray()`
- Do NOT use when model `toArray()` with `$hidden`/`$appends` already produces the desired output
- Do NOT use for internal/admin panels where raw model data is acceptable
- Do NOT use when the resource would contain business logic or SQL queries — resources are for transformation only

## Best Practices (WHY)
- Always eager-load relationships used in nested resources to prevent N+1
- Use `whenLoaded()` on every relationship field in a resource to guard against unloaded relations
- Keep resources thin — they should transform, not compute; extract complex logic to private methods
- Version resources by namespace or directory: `App\Http\Resources\V1\UserResource`
- Test resource output structure with `$response->assertJsonStructure()` in feature tests
- Use `Resource::collection()` for all listing endpoints to maintain consistent structure

## Architecture Guidelines
- Place resources in `App\Http\Resources` following model naming convention (`UserResource` for `User`)
- One resource class per model exposed via API; create variant resources for different contexts (admin vs public)
- Resources wrap models; they should not extend or depend on other resources except through nesting
- Use `ResourceCollection` subclasses for custom collection-level behavior and metadata
- Keep resources at the HTTP boundary — never pass them to service layers or domain logic
- Apply `$hidden` on models as a safety net even when using resources

## Performance
- Resource instantiation is lightweight; collection iteration over many models creates many objects but is generally acceptable
- Resource resolution calls `toArray()` once — memoization inside `toArray()` is unnecessary
- Nested resources trigger eager loading chains; verify with Laravel Debugbar or logged queries
- Consider cursor pagination with resource collections for large datasets
- Heavy `with()` data merged per-resource can inflate response size — keep metadata minimal

## Security
- Resources can expose data not intended for the client — always verify against a known-safe model state
- Use `when()` with authorization checks for role-sensitive fields: `'ssn' => $this->when(auth()->user()->isAdmin(), $this->ssn)`
- Resources cannot override model `$hidden` — model `$hidden` is always applied; check it covers sensitive fields
- Never pass raw user input into resource output without escaping/validation
- Test that conditionally-included fields are absent for unauthorized users

## Common Mistakes
- Calling `Resource::collection()` on a `LengthAwarePaginator` but expecting simple collection behavior — collections handle paginators automatically
- Overriding `toArray()` but not calling parent, losing conditional attribute support
- Nesting resources without verifying relationships are loaded — silent empty data or errors
- Using resources for internal serialization (queues) where model serialization suffices
- Putting SQL queries or business logic inside `toArray()` — violates separation of concerns

## Anti-Patterns
- **Resource as a domain object**: putting business logic, computation, or database queries inside a resource
- **Resource coupled to request**: using `$request` inside `toArray()` for non-serialization purposes (session writes, authentication)
- **Deep resource nesting without eager loading**: causing N+1 disasters that are hard to debug
- **Single resource for all contexts**: using one resource for both admin and public API, leading to complex conditional logic
- **Returning resource from a non-HTTP context**: queuing or broadcasting a `JsonResource` which carries HTTP baggage

## Examples
```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'avatar' => $this->avatar_url,
            'posts' => PostResource::collection($this->whenLoaded('posts')),
            'last_login' => $this->last_login_at?->diffForHumans(),
            'is_admin' => $this->when($request->user()?->isAdmin(), $this->is_admin),
        ];
    }

    public function with(Request $request): array
    {
        return [
            'meta' => [
                'version' => '1.0',
                'timestamp' => now()->toIso8601String(),
            ],
        ];
    }
}

// In controller:
return new UserResource($user);
return UserResource::collection(User::paginate());
```

## Related Topics
- resource-collection — collection-level wrapping and pagination
- conditional-attributes — when/unless methods for conditional inclusion
- resource-wrapping — data key wrapping and customization
- pagination — paginated resource responses
- resources-vs-dtos — when to use resources vs dedicated DTOs
- to-array-to-json — underlying model serialization that resources build upon

## AI Agent Notes
- Use `Resource::make()` for single resources, `Resource::collection()` for lists
- Always wrap relationship fields in `$this->whenLoaded('relation')` to prevent N+1
- Resources should be created with `php artisan make:resource UserResource`
- For paginated responses, pass a paginator to `Resource::collection()` — it auto-detects pagination
- Do not put SQL or heavy computation inside `toArray()` — resources are a presentation layer
- Version resources by creating separate classes, not by adding conditional version logic inside one class

## Verification
- [ ] Relationships used in nested resources are always eager-loaded at the query site
- [ ] Resources contain no SQL queries or business logic
- [ ] `whenLoaded()` guards all nested relationship resource calls
- [ ] Sensitive fields are excluded (model `$hidden` as fallback)
- [ ] Resource structure is tested via `assertJsonStructure`
- [ ] Paginated collection resources use `ResourceCollection` correctly
- [ ] No circular resource references exist
- [ ] Resources are not serialized to queues or broadcast events
