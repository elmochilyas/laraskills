# Prevention Strategies

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Prevention Strategies |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Prevention strategies are proactive patterns that eliminate N+1 queries before they reach production. Unlike detection (which finds existing problems) or strict mode (which throws exceptions), prevention embeds eager loading discipline into the development workflow through conventions, code structure, and defensive programming.

## Core Concepts

- **Eager loading before access**: Always call `load()` or `loadMissing()` before iterating related data. If you will access a relationship for each model in a collection, eager-load it first.
- **Constrained loading**: `Post::with(['comments' => fn($q) => $q->where('approved', 1)])` loads only the related records you need.
- **Lazy eager loading**: `load()` and `loadMissing()` for post-hoc loading. `loadMissing()` only loads relations not already present.
- **`$with` on models**: `protected $with = ['relation']` always eager-loads a relation. Use sparingly — it applies globally to all queries.
- **`loadCount()` / `loadExists()`**: Load scalar values instead of full relation collections when only counts or existence checks are needed.

## When To Use

- Every controller method that returns a view or API resource listing multiple models with relations
- Accessors that reference relationships — use `loadMissing()` to ensure they are loaded
- Blade components that accept models and access their relations
- Any code path where a collection of models is iterated and relationships are accessed

## When NOT To Use

- Single-model endpoints with no relationship access (no N+1 risk)
- Administrative tools where query performance is not critical
- Read-replica queries where you want to minimize query count at the cost of more data per query

## Best Practices

- **Always eager in controllers**: Controller methods should eagerly load all relations that the view or API resource will consume. This creates a clear contract: the controller fetches everything needed; the view/resource only renders. If a new relation is added to the view, the controller must be updated — making the dependency explicit.
- **Use `loadMissing()` in accessors**: When an accessor needs a relationship, use `loadMissing()` to ensure it's loaded without re-querying if already present. This makes accessors defensive against both pre-loaded and unloaded models without adding redundant queries.
- **Prefer explicit `with()` over `$with`**: `$with` applies globally to every query on that model, including relationship resolution and serialization. Use it only for relations that are nearly always needed (e.g., `User` always needing `Profile`). For everything else, use explicit `with()` scoped to the specific query path.
- **Use constrained loading for nested relations**: `Post::with(['comments' => fn($q) => $q->limit(10)])` prevents loading all related data when you only need a subset. Without constraints, deeply nested eager loading can load millions of child rows.

## Architecture Guidelines

- Separate data-fetching code (controllers/repositories) from data-access code (views/resources)
- Repository-level eager loading map: define `$withMap` arrays mapping view contexts to required relations
- Use `load()` in repositories, not in views — views should access pre-loaded relations
- Pass pre-loaded models to Blade components as parameters rather than lazy-loading internally

## Performance Considerations

- Eager loading adds one query per relation — loading 10 relations executes 10 `WHERE IN` queries
- Large `WHERE IN (...ids)` clauses (10k+ IDs) can exceed MySQL's `max_allowed_packet` — batch via `chunk()`
- Constrained eager loading reduces memory — loading only required child rows instead of entire relation sets
- Cache expensive eager loads: `Cache::remember('posts', 3600, fn() => Post::with('comments')->get())`

## Security Considerations

- Over-eager loading of sensitive relations may expose data through serialization or debugging
- Use `whenLoaded()` in API resources to conditionally include relations — prevents exposing data that wasn't explicitly loaded

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `$with` for rarely-needed relations | Convenience without awareness of global scope | Every query fetches unused relations | Use explicit `with()` per query |
| Eager loading but never accessing | Over-optimizing without profiling | Wasted memory and I/O | Profile actual relation usage |
| Nested eager loading without constraints | Not anticipating data volume | Millions of child rows loaded | Constrain with closures |
| Forgetting eager loading in serialization | Only testing in-memory | `$post->toArray()` triggers lazy loads | Use `loadMissing()` before serialization |

## Anti-Patterns

- **$with-global-for-convenience**: Adding relations to `$with` because they are "sometimes" needed. Every query pays the join cost. Use explicit `with()` or `load()` instead.
- **View-level lazy loading**: Blade templates calling `$post->comments` without pre-loading. The view should receive already-loaded data. Move loading to the controller/repository.
- **Unconstrained nested loading**: `Post::with('comments.replies.likes')` without limits. Can load millions of rows per page. Always constrain deeply nested relations.

## Examples

```php
// Controller eager loading — clear contract
class PostController
{
    public function index(): View
    {
        $posts = Post::with(['comments' => fn($q) => $q->latest()->limit(5)])
            ->latest()
            ->paginate(20);
        return view('posts.index', compact('posts'));
    }
}

// Defensive accessor with loadMissing
class User extends Model
{
    public function getDisplayNameAttribute(): string
    {
        $this->loadMissing('profile');
        return $this->profile->display_name ?? $this->name;
    }
}

// loadCount instead of full relation
Post::withCount('comments')->get()->each(function ($post) {
    echo $post->comments_count; // No N+1
});

// Dynamic eager loading bypass
Post::withoutEagerLoads()->get(); // Bypasses $with defaults
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Relationship definition |
| Prerequisite | Eager loading basics (with(), load()) |
| Closely Related | detection |
| Closely Related | lazy-loading-violations |
| Closely Related | select-constraints |

## AI Agent Notes

- Generate `with()` calls for every relationship accessed in controller methods
- Use `loadMissing()` when generating accessors that reference relations
- Default to explicit `with()` over `$with` model property
- Add `whenLoaded()` guards in API resources for conditional relation exposure

## Verification

- [ ] Every controller method eager-loads all relations consumed by its view/resource
- [ ] Accessors use `loadMissing()` before accessing relationships
- [ ] `$with` is only used for universally-needed relations (reviewed individually)
- [ ] Nested eager loading has constraints (limits, where clauses)
- [ ] Views receive pre-loaded models — no lazy loading in Blade templates
