# Relationship Touch — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** relationship-touch
- **ECC Version:** 1.0

## Overview
The `$touches` property and `touch()` method automatically update the `updated_at` timestamp of a parent model whenever a related model is created, updated, or deleted. This ensures cache invalidation, dirty detection, and freshness tracking propagate through the relationship hierarchy without manual calls.

## Core Concepts
- `protected $touches = ['user']` on child model — automatically calls `$this->user->touch()` on save/delete
- `touch()` updates `updated_at` to the current timestamp and fires `touching`/`touched` events
- Recursive: if the parent model also has `$touches`, touching it triggers further touches up the chain
- `Model::withoutTouching()` temporarily suppresses touch propagation for batch operations
- Only works on singular relationships (BelongsTo, HasOne) — not HasMany or BelongsToMany
- Each touch generates a separate `UPDATE` query on the parent table

## When To Use
- Cache invalidation: when a Comment changes, touch the Post to invalidate its cache
- Hierarchical timestamps: Category touches parent Category — full ancestry chain stays fresh
- Feed/listing freshness: Post touches User so user profile "last active" reflects new posts
- "Last modified" tracking on parent when child changes
- Any scenario where parent's `updated_at` should reflect the latest child activity

## When NOT To Use
- Do NOT use on write-heavy relationships — each child save generates an extra UPDATE on the parent
- Do NOT use on relationships with deep chains — recursive touches multiply query cost
- Do NOT use on `HasMany` or `BelongsToMany` — only works with singular relations
- Do NOT use when the parent doesn't have an `updated_at` column
- Do NOT use `$touches` on a `belongsToMany` relationship — pivot timestamps must be managed separately

## Best Practices (WHY)
- Use `Model::withoutTouching()` around batch operations to prevent N+1 UPDATE queries
- Keep `$touches` chains shallow (1–2 levels max) to avoid query cascades
- Monitor query logs for excessive `UPDATE ... SET updated_at = ...` queries — they indicate touch overhead
- Use `touch()` manually for one-off updates rather than `$touches` for automatic propagation
- Consider asynchronous alternatives for high-traffic systems: queued cache invalidation instead of synchronous touches

## Architecture Guidelines
- Declare `$touches` only on models where the timestamp propagation is a domain requirement
- Override `touchOwners()` for conditional touch propagation based on business rules
- Use `withoutTouching()` in seeders, factories, and bulk import scripts
- Document touch chains clearly to prevent confusion about cascading UPDATE queries
- For write-heavy relationships, consider replacing touches with a scheduled cache invalidation

## Performance
- Each touch generates one `UPDATE` query on the parent table
- A Post with 100 Comment saves generates 100 extra `UPDATE posts SET updated_at = ...` queries
- Each touch lazy-loads the parent model (one SELECT per touch) — doubles query cost per touch
- Recursive touches multiply: Comment → Post → User = 2 extra queries per Comment save
- `withoutTouching()` is essential for batch operations with thousands of child saves

## Security
- Touches are synchronous and database-bound — no security implications
- `touch()` fires `saving`/`saved` events which could trigger observers — be aware of cascading side effects
- `touching`/`touched` events can be listened to for cache invalidation or audit logging

## Common Mistakes
- Listing a relationship in `$touches` that returns a collection (HasMany) — touch only works on singular relations
- Forgetting that `touch()` fires `saving`/`saved` events — can trigger unexpected observer chains
- Using `$touches` on a `belongsToMany` relationship — unsupported; pivot timestamps are separate
- Expecting `touch()` to work without an `updated_at` column on the parent table

## Anti-Patterns
- **Deep touch chains**: Comment → Post → Category → User — 3 extra UPDATEs per Comment save
- **Touch on write-heavy relations**: 1,000 child saves = 1,000 extra parent UPDATEs
- **withoutTouching() forgotten in batch ops**: seeder or import causing thousands of UPDATE queries
- **Circular touches**: Post touches User, User touches Post — infinite loop until timeout

## Examples
```php
// Automatic touch via $touches
class Comment extends Model
{
    protected $touches = ['post'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}

// Manual touch
$post->touch(); // Updates updated_at to now

// Recursive touch chain
class Comment extends Model
{
    protected $touches = ['post'];
}

class Post extends Model
{
    protected $touches = ['user'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
// Saving a Comment touches: Comment → Post → User

// Suppress touches for batch operations
Model::withoutTouching(function () {
    Comment::factory(1000)->create();
    // No UPDATE queries on posts table
});

// Suppress for a specific model class
Model::withoutTouching([Comment::class], function () {
    Comment::factory(1000)->create();
});

// Touch events
Event::listen('eloquent.touching: App\Models\Post', function ($post) {
    Cache::forget('post_'.$post->id);
});
```

## Related Topics
- BelongsTo — relationship type supporting touch
- Model Events — touching/touched event lifecycle
- Cache Invalidation Strategies — common use case for touches
- withoutTouching() — suppression mechanism

## AI Agent Notes
- `$touches` only works with singular relationships (BelongsTo, HasOne)
- Each touch generates a separate UPDATE query — benchmark for write-heavy paths
- Use `Model::withoutTouching()` in seeders, factories, and bulk operations
- Touch chains are recursive — be mindful of deep chains
- The `touch()` method fires `saving`/`saved` events on the parent model
- For BelongsToMany, pivot timestamps are managed separately via `->withTimestamps()`

## Verification
- [ ] Child model with `$touches` updates parent's `updated_at` on save
- [ ] Touch chain propagates correctly to grandparent models
- [ ] `Model::withoutTouching()` suppresses touch queries
- [ ] No circular touch chains exist
- [ ] Touch queries are monitored and within acceptable limits
- [ ] Parent model has `updated_at` column
- [ ] `touch()` fires expected events
