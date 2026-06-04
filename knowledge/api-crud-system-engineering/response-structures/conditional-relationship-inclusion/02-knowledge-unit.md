# conditional-relationship-inclusion
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** conditional-relationship-inclusion  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Conditional relationship inclusion controls whether related resource data appears in API responses based on whether the relationship was loaded on the underlying Eloquent model. The `whenLoaded()` and `whenCounted()` methods prevent N+1 queries by ensuring relationship data is only serialized when the controller has eager-loaded it, while `whenHas()` and `whenRelationLoaded()` provide additional condition granularity. This decouples the resource layer from the controller's loading decisions.

## Core Concepts
- **`whenLoaded($relation)`: Includes the relationship data only if the relation was eager-loaded on the model. Prevents lazy-loading via resource serialization.
- **`whenCounted($relation)`: Includes the count of a relationship only if `withCount()` was called on the model. Prevents N+1 count queries.
- **`whenHas($relation)`: Conditionally includes based on whether the related model has the attribute (not the same as loaded).
- **`whenRelationLoaded($relation, $callback)`: Provides a callback pattern for more complex conditional relationship inclusion.
- **Nested Relationships**: `whenLoaded('posts.comments')` checks if the nested relationship chain was loaded.
- **Loaded State Check**: Internally checks `$this->relationLoaded($relation)` on the underlying model. This is a property check, not a query.
- **Relationship Serialization**: When a relation is loaded, the included data is typically serialized using the related resource class for consistency.

## Mental Models
- **Drawbridge**: `whenLoaded()` is a drawbridge — the relationship data only crosses into the response if the controller lowered the bridge (loaded the relation). If the bridge is up, nothing crosses.
- **Lazy vs. Eager Guard**: Acts as a guard against lazy loading. If a controller forgets to eager-load, the resource silently omits the relationship rather than triggering a query.
- **Dependency Injection for Resources**: Think of `whenLoaded()` as making the controller explicitly declare its resource dependencies via eager loading.

## Internal Mechanics
- **`relationLoaded()` Check**: `$this->relationLoaded($name)` iterates the model's loaded relationships array. This is a constant-time operation.
- **Serialization Lazy Loading Protection**: Without `whenLoaded()`, calling `$this->posts` inside `toArray()` triggers a lazy load, executing a query. `whenLoaded()` checks first and skips the access.
- **`whenCounted()` Implementation**: Checks if the attribute `$relation . '_count'` exists on the model. Laravel's `withCount()` appends this attribute dynamically.
- **Pivot Data Conditionality**: For BelongsToMany relationships, pivot data (`$this->pivot`) is also conditionally available. `whenLoaded('roles')` gates pivot inclusion.
- **Nested Loading Check**: `whenLoaded('posts.comments')` checks `relationLoaded('posts')` first, then checks if the loaded posts collection's first model has 'comments' loaded.
- **Return Value**: When the relation is not loaded, the key is omitted entirely from the response. No null, no error — just absence.

## Patterns
- **Eager-Load-Driven Resource Design**: Design resource `toArray()` exclusively around `whenLoaded()`. Every relationship field is gated. This forces the controller to be explicit about loading and prevents lazy N+1 queries.
- **Explicit Loading Contract**: Document in the resource which relationships can be included. This forms a contract with the controller layer.
- **Conditional Nested Inclusion**: Use `whenLoaded('profile')` to include a nested resource `ProfileResource::make($this->whenLoaded('profile'))`. The nested resource is only instantiated when the relation is loaded.
- **Collection Relationship Inclusion**: For HasMany relationships, wrap in `whenLoaded()` and serialize with `Resource::collection($this->whenLoaded('posts'))`.
- **Resource-Based Include Strategy**: Combine `whenLoaded()` with query string parameters (like JSON:API's `include`) to let clients request specific relationships. Controller maps `include` to eager loads, resource maps `whenLoaded` to serialization.

## Architectural Decisions
- **Silent Omission vs. Error**: When a relationship is not loaded, `whenLoaded()` silently omits it. Decide if this should instead throw an exception in development to catch missing eager loads early.
- **N+1 Detection Strategy**: Use Laravel's lazy loading prevention (or packages like `laravel-n+1`) in development to detect missing eager loads that `whenLoaded()` silently hides.
- **Required vs. Optional Relationships**: Some relationships are always included (e.g., `user` on a post). These should not use `whenLoaded()` and should always be loaded by the controller. Use `whenLoaded()` only for optional includes.
- **Relationship Depth Limit**: Set a maximum nesting depth for included relationships to prevent overly deep response objects and circular references.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| N+1 query prevention | Silent omission of relationships | Client may not notice missing data until UI breaks |
| Controller-resource decoupling | Controller must know which relations to load | Adding a new `whenLoaded()` check requires controller update |
| No accidental lazy loading | Cannot rely on resource to lazy-load anything | All relationship data must be explicitly loaded |
| Client-driven includes possible | Include parameter parsing adds complexity | Must validate and sanitize client include requests |
| Self-documenting loading contract | More verbose `toArray()` | Every relationship field needs a `whenLoaded()` wrapper |

## Performance Considerations
- **Zero-Cost When Not Loaded**: When the relation is not loaded, `whenLoaded()` adds only a property check. No serialization, no query, no memory allocation.
- **Nested Serialization Cost**: When a relationship IS loaded and serialized with a nested resource, the serialization cost includes the entire nested resource's `toArray()` logic.
- **Collection Serialization**: Loading a HasMany relation with 1000 models serializes all 1000 related models through their resource. This can dominate response time.
- **Caching Granularity**: Relationship variants increase cache fragmentation. Each combination of loaded relations creates a distinct response to cache.

## Production Considerations
- **Monitoring Missing Includes**: Log when `whenLoaded()` returns false but the relationship exists in the resource's documented response. This catches controllers that forget to eager-load.
- **Client Error Handling**: Clients that depend on a relationship field that the server omitted will encounter undefined property errors. Document which relationships are always present vs. conditional.
- **Testing Relationship Absence**: Write tests that assert responses do not crash when relationships are NOT loaded. The resource should still return valid data for the core resource.
- **Performance Testing**: When adding a new `whenLoaded()` include, test the response time with the relationship loaded. A new nested resource can significantly increase response size.

## Common Mistakes
- **Using `whenLoaded()` for Required Fields**: Wrapping core resource fields (e.g., post `title`) in `whenLoaded()` — these are not relationships and don't need it.
- **Forgetting `whenLoaded()` on Pivot Data**: Including `pivot` data without `whenLoaded()` triggers lazy loading of the pivot table.
- **Nested Resource Without `whenLoaded()`**: Calling `ProfileResource::make($this->profile)` inside `toArray()` without wrapping in `whenLoaded()` triggers lazy loading.
- **Counting Without `whenCounted()`**: Accessing `$this->posts_count` without `whenCounted()` triggers a lazy count query or throws an exception.
- **Loading Check on Missing Method**: Calling `whenLoaded('nonExistentRelation')` returns false without error. The omission is silent and hard to debug.

## Failure Modes
- **Serialization of Non-Loaded Relation**: Forgetting `whenLoaded()` causes a lazy load query per resource during serialization. For collections, this is a classic N+1 that appears in the serialization layer, not the controller.
- **Deep Nested Loading Check False Positive**: `whenLoaded('posts.comments')` may return true even when only the parent `posts` is loaded, if the check is not strict about the full path.
- **Silent Data Loss**: A controller that previously loaded `posts` stops doing so (refactoring). `whenLoaded()` returns false silently. The client stops receiving posts. No error is raised.
- **Aggregate Loading Conflict**: `whenLoaded('posts')` and `whenCounted('posts')` can coexist but must check different internal model state. Confusing the two leads to incorrect serialization.

## Ecosystem Usage
- **Laravel Framework**: `Illuminate\Http\Resources\Json\JsonResource` provides `whenLoaded()` and `whenCounted()` via the `ConditionallyLoadsAttributes` trait.
- **Spatie/laravel-query-builder**: Spatie's `allowedIncludes()` integrates with `whenLoaded()` by eager-loading requested relationships based on query parameters.
- **Laravel Nova**: Nova uses `whenLoaded()` throughout its resource responses to conditionally include related data in the admin panel API.
- **JSON:API Include Parameter**: The JSON:API `include` query parameter directly maps to `whenLoaded()` in resource implementation - the spec mandates that included resources are only present when the client requests them.

## Related Knowledge Units
### Prerequisites
- conditional-field-inclusion
- resource-controllers (eager loading patterns)

### Related Topics
- conditional-aggregate-inclusion
- sparse-fieldset-design

### Advanced Follow-up Topics
- json-api-compound-documents

---

## Research Notes

### Source Analysis
- `Illuminate\Http\Resources\ConditionallyLoadsAttributes` (`whenLoaded()`, `whenCounted()`, `whenRelationLoaded()`)
- `Illuminate\Database\Eloquent\Model::relationLoaded()` (constant-time property check on loaded relations array)
- `Illuminate\Http\Resources\Json\JsonResource` (base resource class)

### Key Insight
`whenLoaded()` acts as a serialization-layer circuit breaker — it checks the pre-loaded relations array on the model instance without triggering any database query, making it the primary defense against N+1 queries originating from the resource layer rather than the controller.

### Version-Specific Notes
- Laravel 6+: `whenLoaded()` and `whenCounted()` available since API Resources inception
- Laravel 10/11/12/13: No behavioral changes; nested relationship checking (`whenLoaded('posts.comments')`) works consistently
- `whenRelationLoaded()` callback variant added later but available across current versions
