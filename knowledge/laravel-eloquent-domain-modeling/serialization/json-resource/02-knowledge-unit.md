# json-resource

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

Laravel API Resources (`JsonResource`) provide a transformation layer between Eloquent models and JSON responses. A resource class receives a model and exposes a `toArray()` method that defines the output structure. Resources decouple API representation from model serialization, enabling attribute renaming, computed fields, conditional inclusion, and nested relationship transformations. They are the recommended approach for all public API endpoints where the default model serialization is insufficient.

## Core Concepts

- **`JsonResource`** — Base class extended by application resources. Wraps a model (or any arrayable) and customizes its JSON output.
- **`toArray($request)`** — The must-implement method that returns the array representation. Receives the current request instance for context-aware serialization.
- **`Resource::make()`** — Creates a single resource instance wrapping the given model.
- **`Resource::collection()`** — Creates a `ResourceCollection` from a collection of models.
- **`new Resource($model)`** — Alternative to `make()`; direct instantiation.
- **`$this->resource`** — The underlying model/resource wrapped by the resource.
- **`with($request)`** — Returns additional metadata merged at the top level of the response.
- **`withResponse($request, $response)`** — Hook for modifying the HTTP response headers/status.
- **Conditional methods** — `when()`, `whenHas()`, `whenLoaded()`, etc. for conditional attribute inclusion.
- **Resource-to-resource nesting** — Resources can return other resources for relationship data.

## Mental Models

1. **Presenter layer** — Resources sit between the model and the HTTP response, transforming shape without modifying the domain object.
2. **View model for APIs** — A resource is akin to a Laravel view model: it takes domain data and formats it for the presentation layer (JSON).
3. **One resource per resource type** — Typically one resource class per model exposed via API (e.g., `UserResource` for `User`).

## Internal Mechanics

```php
// Illuminate\Http\Resources\Json\JsonResource
class JsonResource implements Arrayable, Responsable, JsonSerializable
{
    public $resource;
    public $preserveKeys = false;
    public $with = [];
    
    public function toArray($request): array
    {
        return $this->resource->toArray(); // Default: delegates to model
    }
    
    public function jsonSerialize(): array
    {
        return $this->resolve();
    }
    
    public function resolve($request = null): array
    {
        $data = $this->toArray($request);
        // Merge additional with() data
        return $data;
    }
    
    public function toResponse($request): JsonResponse
    {
        return (new JsonResourceResponse($this))->toResponse($request);
    }
}
```

`JsonResource` implements `Responsable`, so returning a resource from a controller automatically converts it to a JSON response. `jsonSerialize` calls `resolve()` which calls `toArray($request)` and merges `with()` data.

## Patterns

- **Attribute mapping** — Rename DB columns to API-friendly keys: `'user_id' => $this->user_id` → `'userId' => $this->user_id`.
- **Computed fields** — Include derived values computed in `toArray()` rather than via model appends.
- **Nested resources** — Return `new UserResource($this->user)` inside `PostResource::toArray()`.
- **Resource collections** — Use `PostResource::collection($posts)` for listing endpoints.
- **Conditional inclusion** — Use `$this->when(...)` for fields that appear only under certain conditions.
- **Metadata injection** — Override `with($request)` to include top-level meta like pagination links.
- **Sparse fieldsets** — Accept `$request->fields` parameter and conditionally include requested fields only.

## Architectural Decisions

- Resources received the request in `toArray($request)` enabling context-aware serialization — a key differentiator from model `toArray()`.
- `JsonResource` implements `Responsable` for seamless controller returns — no explicit `response()->json()` needed.
- Laravel chose explicit resource classes over convention-based transformation to maintain clarity and type-safety.
- Resources are composed (wrap the model) rather than inherit from it, keeping concerns separated.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clean separation of model and API representation | Additional files/classes for each exposed model | Establish clear naming conventions and resource directory |
| Request-aware serialization | Resource is coupled to HTTP context — less reusable for non-HTTP serialization | Use DTOs for domain-level, resources for API-level serialization |
| Conditional attributes reduce response size | Conditional logic can make `toArray()` harder to read | Extract complex conditionals into private methods |
| Resource nesting mirrors relationship structure | Deep nesting can trigger N+1 if relationships not eager-loaded | Always eager-load relationships used in resources |
| `with()` for top-level metadata | No built-in way to conditionally exclude with data | Check `$request` inside `with()` |

## Performance Considerations

- Each resource instantiation is lightweight, but collection iteration over thousands of models creates many objects.
- Resource resolution calls `toArray()` and merges `with()` data per item — expensive if each resource loads/decorates heavy data.
- Relationship resources should eager-load via the query builder, not lazy-load inside `toArray()`.
- Consider cursor pagination combined with resource collections for large datasets.
- `resolve()` is called once per resource. Memoization inside `toArray()` is unnecessary (it's not called twice).

## Production Considerations

- Always eager-load relationships used in nested resource classes to avoid N+1.
- Use `ResourceCollection` classes for customizing collection-level metadata (pagination, totals).
- Test resource output structure with HTTP tests: `$response->assertJsonStructure([...])`.
- Version resources by creating separate resource classes per API version (e.g., `UserResourceV1`, `UserResourceV2`).
- Avoid business logic inside resources — they are for transformation, not computation.

## Common Mistakes

- Calling `Resource::collection()` on a `LengthAwarePaginator` when a simple collection is expected — resource collections handle paginators automatically.
- Overriding `toArray()` but not calling parent, losing conditional attribute support.
- Nesting resources without verifying relationships are loaded.
- Using resources for internal serialization (queues, broadcasting) where model serialization suffices.
- Putting SQL queries or business logic inside `toArray()`.

## Failure Modes

- **N+1 disaster** — Deeply nested resources each lazy-load their relationships. Debug by checking logged queries.
- **Circular resource nesting** — Resource A returns Resource B which returns Resource A. Use `whenLoaded()` to prevent infinite recursion.
- **Sensitive data exposure** — Resource forgets to exclude a field, leaking internal data. Apply `$hidden` on model as safety net.
- **Memory exhaustion** — Collection resource resolving 10,000 items with each item creating sub-resources.

## Ecosystem Usage

- **Laravel API** — First-party recommendation for API responses since Laravel 5.5.
- **Laravel Nova** — Uses resource-like pattern for its own CRUD responses.
- **Laravel Sanctum + SPA** — API Resources used for SPA JSON responses.
- **Laravel Passport** — Token responses use resource patterns internally.
- **Third-party packages** — `spatie/laravel-query-builder` integrates with resources for JSON responses.

## Related Knowledge Units

### Prerequisites

- **to-array-to-json** — Underlying model serialization that resources build upon.

### Related Topics

- **resource-collection** — Collection-level wrapping and pagination.
- **conditional-attributes** — When/unless/methods for conditional inclusion.
- **pagination** — Paginated resource responses.
- **resource-wrapping** — Data key wrapping and customization.

### Advanced Follow-up Topics

- **resources-vs-dtos** — When to use resources vs dedicated DTOs.

## Research Notes

- API Resources were introduced in Laravel 5.5 alongside the `Responsable` interface.
- The pattern is inspired by the Fractal library's transformer concept (now largely superseded).
- Laravel 11 made no structural changes to resources; they remain the recommended API serialization approach.
- Community packages like `laravel-json-api` provide alternative resource implementations with more strict specifications.
