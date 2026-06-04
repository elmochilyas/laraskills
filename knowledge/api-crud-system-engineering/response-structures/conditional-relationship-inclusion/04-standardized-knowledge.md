# conditional-relationship-inclusion

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: conditional-relationship-inclusion
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Conditional relationship inclusion controls whether related resource data appears in API responses based on whether the relationship was eager-loaded on the model. `whenLoaded()` and `whenCounted()` prevent N+1 queries by ensuring relationship serialization only occurs when the controller has explicitly loaded the data.

This decouples the resource from the controller's loading decisions — the controller decides what to load, the resource decides how to serialize it. If a relationship wasn't loaded, it's silently omitted from the response rather than triggering a lazy query.

## Core Concepts
- **`whenLoaded($relation)`**: Includes relationship data only if the relation was eager-loaded.
- **`whenCounted($relation)`**: Includes relationship count only if `withCount()` was called.
- **`whenRelationLoaded($relation, $callback)`**: Callback pattern for complex conditional inclusion.
- **`relationLoaded()` Check**: Constant-time property check on the model's loaded relations array — no query.
- **Nested Relationships**: `whenLoaded('posts.comments')` checks the nested chain.
- **Pivot Data**: For BelongsToMany, `whenLoaded('roles')` gates pivot data inclusion.
- **Silent Omission**: Not-loaded relations are omitted entirely — no null, no error.

## When To Use
- Every optional relationship in resource `toArray()` — prevents N+1 from resource serialization.
- JSON:API `include` parameter integration — client-requested includes map to `whenLoaded()`.
- Collection endpoints where different items may have different loaded states.
- Resources designed for multiple controller paths that load different relationships.

## When NOT To Use
- Required relationships that are always loaded — should not be conditional.
- Simple eager relationships that don't need serialization (just return count/existence).
- In place of proper eager loading — `whenLoaded()` is a guard, not a replacement for loading.
- For non-relationship fields that are always present (core scalar attributes).

## Best Practices (WHY)
- **Design `toArray()` around `whenLoaded()`**: Every relationship field should be gated — this forces controllers to be explicit about loading.
- **Combine with `when()` for additional conditions**: `when($this->relationLoaded('profile'), fn() => new ProfileResource($this->profile))`.
- **Use `whenCounted()` instead of `whenLoaded('posts')` for counts**: If you only need the count, `whenCounted()` is more efficient.
- **Document loading contracts**: Which relationships are available for conditional inclusion forms the contract between controller and resource.
- **Test relationship absence**: Ensure responses don't crash when relationships are intentionally not loaded.

## Architecture Guidelines
- Establish whether `whenLoaded()` omission is silent (production) or throws (development) for missing required relations.
- Use Laravel's lazy loading prevention (`Model::preventLazyLoading()`) in development to catch missing loads that `whenLoaded()` silently hides.
- For JSON:API-style include parameters, map `include` query params to controller eager loads; `whenLoaded()` handles serialization.
- Set a maximum nesting depth for included relationships to prevent circular references and deep response objects.

## Performance
- Zero cost when relation is not loaded — just a property check on the relations array.
- When loaded, serialization cost includes the entire nested resource's `toArray()`.
- For HasMany with thousands of models, `whenLoaded()` doesn't prevent the cost — the controller shouldn't load that many.
- Cache fragmentation increases with each loaded-relation variant — each combination creates a distinct cache entry.

## Security
- `whenLoaded()` does not authorize access to the related data — the controller must ensure the user is authorized to see loaded relations.
- Silent omission can mask bugs where a relation is accidentally not loaded — the field simply disappears from the response.
- Nested resource serialization inside `whenLoaded()` uses the related resource's own authorization logic.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Using `whenLoaded()` for non-relationships | Wrapping core fields like `title` in `whenLoaded()` | Misunderstanding scope | Field omitted because it's not a relationship | Only use for Eloquent relationships |
| Forgetting `whenLoaded()` on pivot data | Including `$this->pivot` without guard | Overlooking pivot availability | Lazy loading triggers pivot query | Always wrap pivot data in `whenLoaded()` |
| Nested resource without `whenLoaded()` | `ProfileResource::make($this->profile)` without wrapping | Assuming relation is always loaded | N+1 query during serialization | Wrap in `when($this->relationLoaded('profile'), ...)` |
| Counting without `whenCounted()` | `$this->posts_count` without guard | Assuming count is always available | Missing attribute error or lazy count | Use `whenCounted('posts')` |
| Loading check on missing method | `whenLoaded('nonexistent')` returns false silently | Typo in relation name | Hard-to-debug missing data | Test that relation names match exactly |

## Anti-Patterns
- **Unconditional Nested Resource Serialization**: `new ProfileResource($this->profile)` without `whenLoaded()` triggers lazy N+1.
- **Mixed Required and Optional Relationships**: Some relations gated by `whenLoaded()`, others accessed directly — confusing contract.
- **`whenLoaded()` Without Controller Loading**: Resource gates all relations, but no controller ever loads them — nothing appears.
- **Deep Nested Loading Without Depth Limit**: `whenLoaded('a.b.c.d.e')` without checking depth creates fragile serialization.

## Examples
```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'profile' => new ProfileResource($this->whenLoaded('profile')),
        'posts' => PostResource::collection($this->whenLoaded('posts')),
        'posts_count' => $this->whenCounted('posts'),
        'roles' => $this->whenLoaded('roles', function () {
            return $this->roles->map(fn($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'pivot' => $this->whenLoaded('roles', fn() => [
                    'expires_at' => $role->pivot->expires_at,
                ]),
            ]);
        }),
    ];
}
```

## Related Topics
- **Prerequisites**: conditional-field-inclusion, resource-controllers (eager loading)
- **Related**: conditional-aggregate-inclusion, sparse-fieldset-design
- **Advanced**: json-api-compound-documents

## AI Agent Notes
- Always wrap relationship serialization in `whenLoaded()` — never access relations directly in `toArray()`.
- Use `whenCounted()` for relationship counts, not `whenLoaded()`.
- For nested resources, pass `$this->whenLoaded('relation')` to the nested resource constructor.
- Test that resource responses are valid even when NO relationships are loaded.
- When generating include-parameter support, map includes to eager loads in the controller and `whenLoaded()` in the resource.

## Verification
- Every relationship field in `toArray()` is wrapped in `whenLoaded()` or `whenCounted()`.
- Responses without eager loading never trigger database queries during serialization.
- `whenCounted()` is used for all aggregate/calculated relationship fields.
- Pivot data is gated by `whenLoaded()` for the parent relation.
- Integration tests verify response validity with and without each relationship loaded.
