# Conditional Relationships

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Conditional Relationships
- **Difficulty:** Intermediate
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Conditional relationships in API Resources control when nested relations are included in the response. The primary methods are `whenLoaded()` (include only if the relationship is eager-loaded), `whenCounted()` (include a relationship count), and `whenAggregated()` (include custom aggregate values). These methods prevent N+1 queries by ensuring relationships are only accessed when explicitly loaded.

The core engineering principle is **loading honesty** — the resource reveals what was explicitly loaded and hides what was not. This forces the controller to intentionally eager-load every relationship the response needs, eliminating accidental N+1 queries.

## Core Concepts
- **`whenLoaded($relation)`:** Include the relationship only if it was eager-loaded. Returns `MissingValue` if not loaded (field omitted).
- **`whenCounted($relation)`:** Include a relationship count (requires `withCount($relation)` in the controller).
- **`whenAggregated($relation, $function, $column)`:** Include a custom aggregate (sum, avg, min, max) — requires `withAggregate()` in the controller.
- **`relationLoaded($relation)`:** O(1) check on the model's loaded relations array.
- **Closure form:** `whenLoaded('posts', fn() => PostResource::collection($this->posts))` for custom sub-resource wrapping.

## When To Use
- Every relationship access in a resource — `whenLoaded()` should be the default for any relation.
- When the same resource serves both list endpoints (shallow, no relations) and detail endpoints (deep, full relations).
- When relationship counts or aggregates are conditionally included based on controller loading.
- Nested resources where each level independently checks its own relation load state.

## When NOT To Use
- When a relationship is always loaded and always needed (baseline eager load in the controller). Use direct access in this case.
- When the relationship fundamentally changes the resource shape — use separate resources instead.
- For non-Eloquent resources (plain arrays, DTOs) that do not have relation loading state.

## Best Practices (WHY)
- **Use `whenLoaded()` for every relationship access in resources.** This is the single most effective N+1 prevention mechanism in Laravel. Without it, a lazy-loaded relation in a collection generates one query per item.
- **Document required eager loads** in the resource class docblock so controllers know what to load.
- **Eager-load everything the resource uses in the controller.** The golden rule: every relation accessed in a resource must be eager-loaded at the controller level.
- **Combine `whenLoaded` with `withDefault()`** when a relation must always appear in the response (even if empty).
- **Use `whenCounted` for simple counts, `whenAggregated` for other aggregates.** `whenCounted` expects `_count` suffix; `whenAggregated` allows arbitrary aggregate naming.

## Architecture Guidelines
- The controller controls response depth via eager loading. Shallow response: no `with()`. Medium: `with('posts')`. Deep: `with('posts.comments')`. Same resource, three response depths.
- Sub-resources must independently use `whenLoaded()` for their own relationships. A `PostResource` that accesses `$this->comments` must use `whenLoaded('comments')` regardless of the parent resource.
- For nested conditions, pass relationships in dot notation: `User::with('posts.comments')` enables `whenLoaded('posts.comments')` at any level.
- Use `withCount('posts as total_posts')` with explicit aliasing when aggregate naming might conflict with model accessors.

## Performance
- **N+1 prevention:** `whenLoaded()` is zero-cost when the relation is not loaded (returns `MissingValue`). When loaded, it adds no extra query — the data is already in memory.
- `whenCounted()` checks attribute existence via `offsetExists` — an O(1) array lookup.
- `withCount` executes a subquery per relationship. Profile aggregate-heavy controllers to ensure subqueries use indexes.
- The `relationLoaded()` check is `array_key_exists` — O(1) on the model's loaded relations array.

## Security
- Conditional relationships do not perform authorization checks on related data. If `whenLoaded('posts')` includes posts, all posts the user owns are included. Use policy-based filtering on the eager load or resource-level filtering for authorization.
- When a relationship is not loaded, the field is silently omitted. Clients that depend on the field crash. Document all conditional relationships as optional.
- `whenCounted` and `whenAggregated` expose aggregate values. Ensure these do not leak information about unrelated data (e.g., a count of hidden records).

## Common Mistakes

### Lazy Loading in Resources (desc)
Using `$this->posts` without `whenLoaded('posts')`.
- **Cause:** Convenience — the relationship is available via the magic property.
- **Consequence:** N+1 queries. For 100 users, 101 queries are executed.
- **Better:** Always use `whenLoaded()` for any relationship access in resources.

### Forgetting to Load Counts (desc)
Using `whenCounted('posts')` without `withCount('posts')` in the controller.
- **Cause:** Assuming the resource handles counting.
- **Consequence:** The field is silently omitted from the response (no error, no count).
- **Better:** Pair `whenCounted` with `withCount` in the controller. Test both loaded and unloaded states.

### Nested Sub-Resource N+1 (desc)
A sub-resource that accesses its own relations without `whenLoaded()`.
- **Cause:** Assuming the parent's eager loading covers all levels.
- **Consequence:** Each child resource triggers its own lazy load query.
- **Better:** Every resource independently uses `whenLoaded()` for its own relationship accesses.

## Anti-Patterns
- **Always-loaded everything:** Loading every possible relationship in every controller to avoid conditionals. This wastes database resources and memory on every request.
- **Silent omission as error handling:** Relying on `whenLoaded()` to silently hide data when the developer forgets to eager-load. The field disappears without warning. Use tests to catch missing eager loads.
- **Aggregate naming collisions:** Using `whenCounted('posts')` when the model has a `posts_count` accessor, causing confusion between count and accessor values.

## Examples

### WhenLoaded with Sub-Resource
```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
// Controller: User::with('posts')->find(1)
```

### WhenLoaded with Callback
```php
public function toArray($request): array
{
    $posts = $this->whenLoaded('posts');

    return [
        'id' => $this->id,
        'name' => $this->name,
        'recent_posts' => $this->whenLoaded('posts', function () use ($posts) {
            return PostResource::collection($posts->take(5));
        }),
    ];
}
```

### Relationship Counts and Aggregates
```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'posts_count' => $this->whenCounted('posts'),
        'total_revenue' => $this->whenAggregated('orders', 'sum', 'amount'),
    ];
}
// Controller: User::withCount('posts')->withAggregate('orders', 'sum(amount) as total_revenue')
```

### Nested Conditional Relationships
```php
// UserResource requires: posts.comments eager-loaded
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'title' => $this->title,
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}
// Controller: User::with('posts.comments')->get()
```

## Related Topics
- Conditional Attributes — general conditional inclusion (`when()`, `whenHas()`)
- Resource Fundamentals — baseline resource structure
- Sparse Fieldsets — client-requested relation inclusion via `include` parameter
- Eager Loading (Eloquent) — controller-level relationship loading strategies

## AI Agent Notes
- **Generate:** `whenLoaded()`, `whenCounted()`, and `whenAggregated()` are available in any resource extending `JsonResource`.
- **Key constraint:** Every relationship access in a resource must be wrapped in `whenLoaded()` unless the relationship is guaranteed to always be loaded.
- **Validation:** If a resource accesses `$this->relation`, check that the controller calls `->with('relation')`.
- **Common fix:** When a relationship field is missing from the response, verify that the controller is eager-loading it.
- **Testing pattern:** Test both states: `load('relation')` → field present; no load → field absent.

## Verification
- [ ] Every relationship access in every resource uses `whenLoaded()`.
- [ ] Controllers eager-load all relationships used in their resources.
- [ ] `whenCounted()` is paired with `withCount()` in the controller.
- [ ] `whenAggregated()` is paired with `withAggregate()` in the controller.
- [ ] Sub-resources independently use `whenLoaded()` for their own relationships.
- [ ] Tests verify both loaded and unloaded states for each conditional relationship.
