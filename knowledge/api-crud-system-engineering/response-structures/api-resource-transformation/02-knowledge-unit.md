# API Resource Transformation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** API Resource Transformation
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
API Resource Transformation converts Eloquent models and collections into structured JSON responses using Laravel's `JsonResource` classes. Proper transformation ensures consistent, predictable API responses that decouple internal model structure from API contracts.

---

## Core Concepts
- **JsonResource Classes**: Classes extending `JsonResource` that define the `toArray()` method for response shaping
- **Resource Collection**: `ResourceCollection` or `Resource::collection()` for transforming model collections
- **Conditional Attributes**: `$this->when()`, `$this->mergeWhen()`, `$this->whenLoaded()` for conditional field inclusion
- **Relationship Inclusion**: `$this->whenLoaded('posts')` to include relationships only when eager-loaded
- **Resource Wrapping**: `$this->wrap('data')` to control the top-level wrapper key
- **Pagination Resources**: `Resource::collection($users->paginate())` for paginated response transformation

---

## Mental Models
1. **Translation Layer Model**: Resources translate internal model language (database columns, relationships) to external API language (JSON field names, structures).
2. **Stage Makeup Model**: Models backstage are raw data; resources apply the "makeup" that presents them beautifully on stage (API response).

---

## Internal Mechanics
When `return new UserResource($user)` is returned from a controller, Laravel's `JsonResource::toResponse()` converts the resource to JSON. The `toArray()` method defines the structure. `when()`, `merge()`, and `whenLoaded()` control conditional logic. Resources implement the `Responsable` interface, making them returnable directly from controllers.

---

## Patterns

### Pattern 1: Dedicated Resource Class
**Purpose**: One resource class per model (e.g., `UserResource`)
**Benefits**: Single source of truth; easy to maintain
**Tradeoffs**: Can become large with many conditional fields

### Pattern 2: Parent-Child Resource Separation
**Purpose**: Separate `UserListResource` (summary) from `UserDetailResource` (full)
**Benefits**: Different shapes for different endpoints; smaller classes
**Tradeoffs**: More classes to maintain

---

## Architectural Decisions
### When To Use
- Any API returning model data
- APIs needing to decouple internal schema from external contract
- Projects following RESTful resource conventions

### When To Avoid
- APIs returning raw data without transformation
- Very simple APIs returning exactly the database schema
- Prototypes where speed is the priority
- GraphQL APIs (field selection is handled by queries)

### Alternatives
- `toArray()` on Eloquent models directly
- Fractal transformers (external package)
- Manual `collect()` and `map()` transformations
- Spatie's `laravel-data` for DTO-based responses

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouple API shape from DB schema | Additional resource classes | Organize resources in App\Http\Resources |
| Conditional field inclusion | Learning curve for when()/whenLoaded() | Follow convention; document in team standards |
| Relationship control | Nested resources add complexity | Keep nesting to 2-3 levels |
| Pagination support | Resource collection boilerplate | Use Resource::collection() helper |

---

## Performance Considerations
- Resource transformation is proportional to result set size
- Each `whenLoaded()` check is O(1) — relationship load status is tracked by Eloquent
- Nested resources recursively transform relationships — be mindful of deep nesting
- Avoid loading relationships just to check `whenLoaded()` — use `$this->relationLoaded()`

---

## Production Considerations
- Cache resource transformation results for frequently accessed resources
- Monitor resource transformation time for performance regression
- Ensure sensitive fields are never exposed via resources
- Test resource transformation directly via unit tests
- Document resource field descriptions in API docs

---

## Common Mistakes
**Exposing sensitive fields**: Including `is_admin`, `email_verified_at`, or internal IDs in the resource response.
**Inconsistent naming**: `user_name` in some resources and `username` in others. Use consistent field naming conventions.
**Missing conditional checks**: Including relationship data unconditionally causes N+1 queries.
**Direct model access**: Using `$this->model` instead of `$this->resource` for accessing the underlying model.
**Returning unused relationships**: Loading relationships only for resource transformation wastes queries.

---

## Failure Modes
**Infinite resource recursion**: Two resources that include each other cause infinite transformation. *Detection:* Stack overflow / timeout. *Mitigation:* Use `whenLoaded()` or a max depth guard.
**Sensitive data leak**: A resource field that exposes internal data. *Detection:* Security audit. *Mitigation:* Explicit allowlist of fields in the resource; never blacklist.

---

## Ecosystem Usage
Laravel's `Illuminate\Http\Resources\Json\JsonResource` is the base class. `JsonResource::collection()` creates an anonymous resource collection. `Resource::withoutWrapping()` globally disables the `data` wrapper. Artisan `make:resource UserResource` generates resource classes.

---

## Related Knowledge Units
### Prerequisites
- Eloquent model basics
- Controller response handling

### Related Topics
- API response shapes
- Include related resources
- Sparse field selection

### Advanced Follow-up Topics
- Custom resource collection classes
- Resource transformation caching
- Conditional resource attributes deep dive

---

## Research Notes
- `$this->resource` accesses the underlying model; `$this` on `JsonResource` proxies to the model via `__get`
- `Resource::withoutWrapping()` affects all subsequent resource responses globally
- Resources can implement `JsonSerializable` for custom JSON serialization beyond `toArray()`
- `when()`, `merge()`, `whenHas()`, `whenNotNull()` are all available for conditional transformation
