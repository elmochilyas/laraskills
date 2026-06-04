# Lazy Eager Loading — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Lazy Eager Loading
- **ECC Version:** 1.0

## Overview
Lazy eager loading — via `load()` and `loadMissing()` — is the post-retrieval counterpart to `with()`. It loads relationships on already-hydrated models or collections, executing the same eager-loading queries but after the initial query has already run. This is essential for conditional loading and defensive patterns in reusable components.

## Core Concepts
- `load()`: loads relationships on a model or collection, identical SQL to `with()`
- `loadMissing()`: loads only if the relationship isn't already loaded (checks `relationLoaded()`)
- Both accept the same syntax as `with()`: strings, dot-notation, array with constraint closures
- `Model::load()` delegates to `Collection::load()` by wrapping the model in a collection
- `Collection::load()` calls `Builder::eagerLoadRelations()` — same engine as `with()`
- `loadMissing()` checks `$model->relationLoaded($name)` before executing the query

## When To Use
- Conditional loading based on runtime logic: `if ($condition) { $model->load('relation'); }`
- API resources: defensive `loadMissing()` to ensure relationships are available
- Middleware: loading relationships on the request model for downstream use
- Multiple batch loads: `$users->load('posts'); $users->load('profile');`
- Deferred loading for performance: load common relationships first, defer expensive ones

## When NOT To Use
- Do NOT use `load()` in a loop — this recreates the N+1 problem
- Do NOT use `load()` when `with()` would be more efficient (relationships known at query time)
- Do NOT use `load()` without `loadMissing()` when multiple components may load the same relation
- Do NOT use `load()` on raw arrays — models must be in a Collection

## Best Practices (WHY)
- Use `loadMissing()` defensively in API resources and middleware
- Batch independent relationships into a single `load(['rel1', 'rel2'])` call
- Prefer `with()` for relationships known at query definition time
- Enable `preventLazyLoading()` in development to detect unloaded relationships
- Use constraint closures with `load()` exactly as with `with()`: `$users->load(['posts' => fn($q) => ...])`

## Architecture Guidelines
- Use `loadMissing()` as a defensive pattern in shared/reusable components
- The choice between `load()` and `with()` is a timing decision, not a query optimization decision
- Keep `load()` calls close to where the relationship data is consumed
- For collections with thousands of models, consider memory implications before `load()`

## Performance
- Each `load()` call executes a separate database query — batch independent relationships
- `loadMissing()` checks `relationLoaded()` (array key lookup) before querying — very cheap
- `load()` on a collection of 10,000 models with a relationship of 100 each hydrates 1M models
- Redundant `load()` calls execute unnecessary SQL — use `loadMissing()` to prevent

## Security
- `load()` does not bypass authorization — relationships loaded are those defined on the model
- `loadMissing()` prevents redundant queries but doesn't add authorization checks
- Ensure sensitive relationships are only loaded when the user is authorized

## Common Mistakes
- Calling `load()` in a loop: `foreach ($users as $user) { $user->load('posts'); }` — N queries
- Using `load()` when `with()` would be more efficient: extra round trip vs combining
- Not using `loadMissing()` when multiple components may load the same relationship
- Assuming `load()` after pagination is wrong — it's actually correct for page-scoped models

## Anti-Patterns
- **load() in a loop**: recreating N+1 with load() instead of lazy loading
- **Redundant loads**: calling load('relation') on a collection that already has it loaded
- **Serialization before load**: serializing the model before calling load(), losing the relationship
- **Memory explosion**: load() on a 10,000-model collection with large relationships

## Examples
```php
// Basic load
$user = User::find(1);
$user->load('posts');

// Conditional loading
if (auth()->user()->isAdmin()) {
    $post->load('hiddenNotes');
}

// Collection batch loading
$users = User::all();
$users->load('posts');
$users->load('profile');

// Load with constraints
$users->load(['posts' => fn($q) => $q->where('published', true)->limit(5)]);

// Defensive loadMissing in API resource
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        $this->resource->loadMissing('comments.author');
        return [
            'id' => $this->id,
            'comments' => CommentResource::collection($this->comments),
        ];
    }
}

// Batch multiple relationships
$users->load(['posts', 'profile', 'roles']);

// Deferred loading
$users = User::with('profile')->get(); // load common first
if ($someExpensiveCondition) {
    $users->load('expensiveRelation'); // defer expensive
}
```

## Related Topics
- Eager Loading Fundamentals — core eager loading with `with()`
- Constrained Eager Loading — applying constraints in `load()` closures
- `$with` Blast Radius — automatic vs explicit loading

## AI Agent Notes
- `load()` and `with()` use the same eager loading engine — the difference is timing
- Use `loadMissing()` in API resources for defensive loading
- Never call `load()` inside a loop — call `load()` on the collection instead
- `load()` on a single model wraps it in a collection internally
- Batch independent relationships into one `load()` call to reduce query count

## Verification
- [ ] No `load()` calls inside loops
- [ ] `loadMissing()` is used in reusable components and API resources
- [ ] Relationships known at query time use `with()` instead of `load()`
- [ ] Independent relationships are batched into a single `load()` call
- [ ] `preventLazyLoading()` is enabled in development
- [ ] No redundant `load()` calls on already-loaded relationships
