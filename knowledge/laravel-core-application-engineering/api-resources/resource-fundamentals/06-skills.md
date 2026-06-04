# Skill: Create an API Resource

## Purpose

Build a `JsonResource` class that transforms an Eloquent model (or any data source) into a JSON response, defining the explicit API contract between the server and clients.

## When To Use

- Every public API endpoint that returns model data
- Internal API endpoints where consistency and testability matter
- Any response where the API shape differs from the model shape
- Versioned APIs where schema evolution must be controlled

## When NOT To Use

- Trivial internal endpoints where the API shape exactly matches the model and will never change
- CLI commands or queue job outputs where JSON structure is ad-hoc
- Prototypes where raw `response()->json()` is faster and the API is not consumed externally
- When a dedicated DTO layer already handles all transformation and no HTTP-specific features are needed

## Prerequisites

- A Laravel application with Eloquent models (or other data sources)
- `Illuminate\Http\Resources\Json\JsonResource` available

## Inputs

- Model or data source to transform
- API field specification (which fields to expose, under what keys, with what transformations)
- Request context for conditional fields

## Workflow

1. Generate the resource: `php artisan make:resource UserResource`.
2. Name the resource after the API resource name (what the client sees), not necessarily the model name: `ProfileResource` for a "profile" API even if the model is `User`.
3. Implement `toArray($request)` returning an explicit associative array with only the intended fields — never use `$this->resource->toArray()`.
4. Transform fields as needed: rename (`full_name` from `name`), format (ISO dates), cast (`(bool) $this->is_admin`).
5. Keep `toArray()` as pure transformation — no business logic, database queries, or external API calls.
6. Use `when()` for conditional fields and `whenLoaded()` for relationship accesses (see related skills).
7. Return the resource from the controller: `return new UserResource($user)`.
8. Never pass resources into services — services receive typed DTOs or models.
9. Use per-endpoint resources when shape varies significantly (`UserListResource`, `UserDetailResource`) rather than excessive conditionals in a single resource.

## Validation Checklist

- [ ] Every public API endpoint uses a resource class
- [ ] `toArray()` returns an explicit array, not `$this->resource->toArray()`
- [ ] No business logic or database queries exist inside `toArray()`
- [ ] Relationship accesses use `whenLoaded()` or are guaranteed to be eager-loaded
- [ ] Resource names match the API resource name, not necessarily the model name
- [ ] Resources are returned from controllers, not passed into services

## Common Failures

- Direct model exposure — returning `$this->resource->toArray()` exposes every model attribute including sensitive fields (`password`, `remember_token`)
- Business logic in `toArray` — computing values (discounts, permissions, totals) inside the resource scatters business logic and makes it hard to test and version
- Redundant resource — a resource that mirrors the model structure exactly with no transformation adds maintenance overhead without benefit
- God Resource — a single resource class handling multiple endpoints via excessive conditional flags; use per-endpoint resources instead

## Decision Points

- **One resource per model vs per endpoint**: Use one resource per model when the API shape closely matches the model. Use per-endpoint resources when different endpoints need significantly different field sets.
- **Explicit vs dynamic field listing**: Always prefer explicit field listing. It makes the contract obvious, auditable, and prevents accidental exposure of sensitive attributes.
- **Conditional vs separate resources**: When the difference between endpoint shapes is 1-2 conditional fields, use conditionals. For larger differences, create separate resources.

## Performance Considerations

- Resource construction allocates ~0.01ms per response — for 100 items, ~1ms overhead
- The proxy chain (`$this->name` → `$this->resource->name`) adds negligible overhead
- Resources do not load relationships — accessing `$this->relation` without eager loading triggers N+1 queries; always pair relationship access with controller-side eager loading

## Security Considerations

- Never use `$this->resource->toArray()` — it exposes every model attribute, including sensitive fields
- Conditional `when()` is not access control — hiding a field via omission does not prevent access if the underlying endpoint is reachable; use policies and middleware
- Always explicitly list every field in `toArray()` — the resource is the whitelist of what the API exposes

## Related Rules

- Always Explicitly List Every Field in toArray (Security)
- Keep toArray as Pure Transformation — No Business Logic (Architecture)
- Never Pass Resources into Services (Architecture)
- Match Resource Names to API Resource Names, Not Model Names (Design)
- Use Per-Endpoint Resources When Shape Varies Significantly (Design)
- Use Resources for All Public API Endpoints (Architecture)
- Never Access Relationships Without Eager Loading in Resources (Performance)

## Related Skills

- [Conditional Attributes](../conditional-attributes/06-skills.md)
- [Conditional Relationships](../conditional-relationships/06-skills.md)
- [Resource Collections](../resource-collections/06-skills.md)
- [Resource vs DTO Decision](../resource-vs-dto-decision/06-skills.md)

## Success Criteria

- Resource produces correct JSON structure matching the API contract
- All fields are explicitly listed — no accidental model attribute exposure
- No business logic, database queries, or external calls in `toArray()`
- Relationship accesses are guarded with `whenLoaded()` or guaranteed eager-loaded
- Resource is returned from controller, never passed into services
