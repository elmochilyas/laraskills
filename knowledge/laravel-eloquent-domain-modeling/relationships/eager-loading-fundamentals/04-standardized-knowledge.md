# Eager Loading Fundamentals — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Eager Loading Fundamentals
- **ECC Version:** 1.0

## Overview
Eager loading loads related models in a controlled number of database queries, preventing the N+1 problem. The `with()` method on query builders, `load()` on collections/models, and `loadMissing()` for conditional loading form the three pillars of eager loading in Laravel.

## Core Concepts
- N+1 problem: looping over parents and lazy-loading a relationship produces 1 + N queries
- Eager loading collapses this to a fixed number of queries (1 parent query + 1 per relationship)
- `with('relation')`: registers relationships to load when the query executes
- `load('relation')`: loads relationships on already-hydrated models/collections
- `loadMissing('relation')`: loads only if not already loaded
- Dot notation: `with('posts.comments.author')` loads nested relationships level by level
- Separate-query design: each relationship level gets its own query (no JOIN-based row duplication)

## When To Use
- Always when iterating models and accessing relationships in views, API resources, or loops
- Any request where relationship data is needed — default to eager loading over lazy loading
- Nested relationship access via dot notation for multi-level graphs
- `load()` when you discover a need for a relationship after the initial query
- `loadMissing()` in API resources and middleware for defensive loading

## When NOT To Use
- Do NOT use `with()` for relationships that are rarely used — lazy loading may be more efficient for edge cases
- Do NOT use `load()` in a loop — this recreates the N+1 problem
- Do NOT assume nested eager loading is one query — each dot adds a separate query
- Do NOT eager load after pagination if relationships are only used within the looped items

## Best Practices (WHY)
- Always eager load in Blade templates and API resources to prevent N+1 from view/serialization layers
- Use `loadMissing()` defensively in reusable components that don't control the query
- Profile with Laravel Debugbar or Telescope to verify query count is as expected
- Enable `Model::preventLazyLoading()` in development to catch missing eager loads
- Use constrained loading to limit which related records are loaded

## Architecture Guidelines
- Prefer `with()` at the query site over `$with` on the model (see `$with` Blast Radius)
- Extract complex `with()` arrays into dedicated query scopes or methods
- For deeply nested loading, consider whether the intermediate models are needed
- Use chunking or cursor-based iteration for large datasets where eager loading would exhaust memory

## Performance
- Eager loading guarantees O(levels) queries rather than O(parents × levels)
- Memory cost scales with the total number of related rows — all related models are hydrated
- Very large parent sets (>10,000) may hit SQL `max_allowed_packet` limits on `WHERE IN` clauses
- Separate-query design avoids row duplication from JOINs but uses more round trips
- Each relationship level adds exactly one query, regardless of parent set size

## Security
- Eager loading does not bypass model security or authorization — relationships must be defined explicitly
- `loadMissing()` prevents redundant queries but doesn't add authorization
- Ensure that eager-loaded relationships are authorized if they contain sensitive data

## Common Mistakes
- Eager loading after pagination: only the current page's models get the relationship
- Assuming nested eager loading is 1 query: `with('posts.comments')` is 3 queries, not 1
- Using `load()` in a loop: calling `$model->load('relation')` inside `foreach` recreates N+1
- Forgetting to eager load in API resources: each resource serialization triggers a lazy load

## Anti-Patterns
- **N+1 in Blade**: iterating `$users` and accessing `$user->posts` without prior eager loading
- **N+1 in API resources**: accessing relationships in `toArray()` without `loadMissing()`
- **Giant eager loads**: loading all relationships for all models without constraint limiting
- **Eager loading everything**: using `with('*')` or loading all possible relationships unconditionally

## Examples
```php
// Basic eager loading
$users = User::with('posts')->get();

// Multiple relationships
$users = User::with(['posts', 'profile', 'roles'])->get();

// Nested eager loading
$users = User::with('posts.comments.author')->get();

// Conditional loading
$users = User::all();
if (auth()->user()->isAdmin()) {
    $users->load('hiddenRelations');
}

// Load missing (defensive)
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        $this->resource->loadMissing('comments');
        return [
            'id' => $this->id,
            'comments' => CommentResource::collection($this->comments),
        ];
    }
}

// Prevent lazy loading in development
Model::preventLazyLoading(! app()->isProduction());
```

## Related Topics
- Constrained Eager Loading — filtering/limiting eager-loaded relationships
- Lazy Eager Loading — `load()` and `loadMissing()` in detail
- `$with` Blast Radius — automatic eager loading dangers
- N+1 Detection — tooling and prevention strategies

## AI Agent Notes
- Always eager load relationships that are accessed in loops or serialization
- Use `loadMissing()` in API resources and middleware for defensive loading
- Each dot in `with('a.b.c')` adds a separate query — factor this into performance considerations
- `load()` on a collection is 1 query; `load()` on individual models in a loop is N queries
- Enable `preventLazyLoading()` in development environments to catch N+1 early

## Verification
- [ ] N+1 is eliminated — query count is O(levels) not O(parents × levels)
- [ ] `with()` is used for relationships known at query time
- [ ] `load()` is used for post-retrieval discovery
- [ ] `loadMissing()` is used defensively in reusable components
- [ ] No eager loading after pagination for cross-page relationship access
- [ ] Debugbar/Telescope shows expected query count
- [ ] `preventLazyLoading()` is enabled in development
