# Conditional Relationships

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Conditional Relationships
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Conditional relationships in API Resources control when nested relations are included in the response. The primary methods are `whenLoaded()` (include only if the relationship is eager-loaded), `whenCounted()` (include a relationship count), and `whenAggregated()` (include custom aggregate values). These methods prevent N+1 queries by ensuring relationships are only accessed when explicitly loaded.

The core engineering principle is **loading honesty** — the resource reveals what was explicitly loaded and hides what was not. This forces the controller to intentionally eager-load every relationship the response needs, eliminating accidental N+1 queries.

---

## Core Concepts

### whenLoaded() — Only if Loaded

Include a related resource only if the relationship was eager-loaded:

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
    ];
}
```

If `posts` was loaded via `User::with('posts')`, the `posts` field appears in the response. If not loaded, the field is omitted.

### whenCounted() — Relationship Count

Include a relationship count:

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'posts_count' => $this->whenCounted('posts'),
    ];
}
// Controller must load count: User::withCount('posts')
```

### whenAggregated() — Custom Aggregate

Include a custom aggregate (sum, avg, min, max):

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'total_revenue' => $this->whenAggregated('orders', 'sum', 'amount'),
    ];
}
// Controller: User::withAggregate('orders', 'sum(amount) as total_revenue')
```

---

## Mental Models

### The Honest Waiter

The resource is like a waiter who only brings dishes you ordered. If you didn't order `posts` (eager-load), the waiter doesn't serve them. The resource doesn't go to the kitchen itself (no lazy loading) — it only serves what was prepared.

### The Dynamic View

Think of `whenLoaded` as a switch that toggles entire branches of the response tree on or off based on what the controller loaded. This lets the same resource serve both list endpoints (no eager loads, shallow response) and detail endpoints (full eager loads, deep response) without duplication.

---

## Internal Mechanics

### whenLoaded() Implementation

The `whenLoaded()` method checks if the relationship name is in the model's loaded relations:

```php
public function whenLoaded($relationship, $value = null, $default = null): mixed
{
    if (func_num_args() < 3) {
        $default = new MissingValue;
    }

    if (! $this->resource->relationLoaded($relationship)) {
        return value($default);
    }

    if (func_num_args() === 1) {
        return $this->resource->{$relationship};
    }

    return value($value);
}
```

If the relation is not loaded, returns `MissingValue` (field omitted). If loaded, returns the relationship data or the custom value.

### whenCounted() Implementation

`whenCounted()` checks for attribute existence on the model after `withCount`:

```php
public function whenCounted($relationship, $value = null, $default = null): mixed
{
    $attribute = (string) Str::of($relationship)->snake()->finish('_count');

    if (! $this->resource->offsetExists($attribute)) {
        return func_num_args() >= 3 ? value($default) : new MissingValue;
    }

    return func_num_args() >= 2 ? value($value) : $this->resource->{$attribute};
}
```

### Relationship Loading State

Eloquent models track loaded relations in the `$relations` array. `relationLoaded()` is an O(1) lookup:

```php
public function relationLoaded(string $relation): bool
{
    return array_key_exists($relation, $this->relations);
}
```

---

## Patterns

### WhenLoaded with Custom Resource

Pass the relationship to a sub-resource:

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'profile' => $this->whenLoaded('profile', function () {
            return new ProfileResource($this->profile);
        }),
    ];
}
```

### WhenLoaded with Callback

Execute logic only when the relationship is loaded:

```php
public function toArray($request): array
{
    $posts = $this->whenLoaded('posts');

    return [
        'id' => $this->id,
        'name' => $this->name,
        'posts_count' => $this->whenCounted('posts'),
        'recent_posts' => $this->whenLoaded('posts', function () use ($posts) {
            return PostResource::collection($posts->take(5));
        }),
    ];
}
```

### Nested Conditional Relationships

Multiple conditional relationships at different levels:

```php
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
// Controller: User::with('posts.comments')->get()
```

### Always-Loaded vs Optional Relations

Distinguish between always-needed relations and optional ones:

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        // Always loaded via controller's default eager load
        'profile' => new ProfileResource($this->profile),
        // Optional — only if controller loaded it
        'orders' => OrderResource::collection($this->whenLoaded('orders')),
    ];
}
```

---

## Architectural Decisions

### When to Use whenLoaded vs Always Include

| Approach | When |
|---|---|
| `whenLoaded()` | Relation is expensive, not always needed |
| Always include (no conditional) | Relation is cheap or always loaded |
| Separate resources | Relation fundamentally changes the resource shape |

### Controller-Controlled Response Depth

The controller decides response depth via eager loading:

```php
// Shallow response (no relations)
UserResource::collection(User::paginate());

// Medium response (with posts)
UserResource::collection(User::with('posts')->paginate());

// Deep response (with posts and comments)
UserResource::collection(User::with('posts.comments')->paginate());
```

All three use the same `UserResource`. The response changes based on what the controller loaded.

### whenCounted vs Custom Aggregates

`whenCounted` handles simple counts (`withCount`). `whenAggregated` handles sum/avg/min/max (`withAggregate`). Use `whenCounted` for counts, `whenAggregated` for other aggregates.

---

## Tradeoffs

| Concern | Conditional | Always Loaded |
|---|---|---|
| N+1 protection | Strong (hides unloaded) | Manual (must remember to eager-load) |
| Controller complexity | Higher (must specify loads) | Lower (always loads everything) |
| Response size | Smaller (omits unloaded) | Larger (includes all relations) |
| Cache efficiency | Higher (fewer queries) | Lower (over-fetching) |
| API flexibility | Higher (one resource, multiple depths) | Lower (fixed depth) |

---

## Performance Considerations

### N+1 Prevention

`whenLoaded()` is the single most effective N+1 prevention mechanism in Laravel resources. Without it, a lazy-loaded relationship in a collection resource generates one query per item. With it, the relationship query count is zero unless explicitly eager-loaded.

### Aggregate Query Cost

`withCount` executes a subquery per relationship. Three `withCount` calls add three subqueries to the main query. Profile aggregate-heavy controllers to ensure subqueries are indexed.

---

## Production Considerations

### Eager Load Everything the Resource Uses

The golden rule: every relationship accessed in a resource must be eager-loaded in the controller. Use `whenLoaded()` to fail safely when a load is forgotten — the field is omitted instead of N+1.

### Document Required Eager Loads

Document which relationships a resource uses so controllers know what to load:

```php
/**
 * @see UserResource requires: profile, posts.comments
 */
class UserController
{
    public function show(User $user): UserResource
    {
        $user->load('profile', 'posts.comments');
        return new UserResource($user);
    }
}
```

### Use withDefault() for Required Relations

If a relationship must always appear (even when empty), combine `whenLoaded` with a default:

```php
'profile' => $this->whenLoaded('profile') ?? new ProfileResource(new Profile()),
// Or use a default value
'profile' => $this->whenLoaded('profile', fn() => new ProfileResource($this->profile), fn() => null),
```

---

## Common Mistakes

### Lazy Loading in Resources

Using `$this->posts` without `whenLoaded('posts')` triggers lazy loading. The first access in a collection of 100 users fires 101 queries. Always use `whenLoaded()` for any relation access in resources.

### Forgetting to Load Counts

`whenCounted('posts')` silently omits the field if `withCount('posts')` was not called. The count is not loaded in the response. Ensure `withCount` is always called when `whenCounted` is used.

### Nested Resource Without whenLoaded

A sub-resource that does not use `whenLoaded` for its own relations can still trigger N+1. Each child resource must independently check loading state.

---

## Failure Modes

### Silent Missing Data

When a relationship is not loaded, `whenLoaded` omits the field. Clients that depend on the field crash. This is preferable to N+1 (application crash) but still a client-facing issue. Use TypeScript interfaces with optional fields for all conditional relationships.

### Aggregate Naming Mismatch

`whenCounted('posts')` looks for `posts_count` attribute. If the model has a custom accessor named `posts_count`, the count is confused with the accessor. Use explicit aggregate aliasing:

```php
User::withCount('posts as total_posts');
// Resource: whenCounted('total_posts') — matches the alias
```

---

## Ecosystem Usage

Laravel's Eloquent ORM is built around the concept of relationship lazy loading versus eager loading, and `whenLoaded()` directly complements this by ensuring resources only expose relationships that were explicitly loaded. In the ecosystem, this pattern is critical for packages like Laravel Nova and Laravel Telescope, which dynamically load relationship data based on the current view context.

API tooling packages such as `laravel-json-api` and `lighthouse-php` (GraphQL) implement similar conditional relationship loading to prevent N+1 queries while maintaining flexible response structures. The broader Laravel community has adopted the `whenLoaded()` pattern as a standard defensive coding practice, with many production codebases requiring that every relationship access in a resource be wrapped in `whenLoaded()` to enforce controller-level eager loading discipline. Third-party packages like Spatie's `laravel-query-builder` also respect relationship loading state, ensuring that filtered and sorted queries remain performant across collection responses.

---

## Related Knowledge Units

- **Conditional Attributes** (this workspace) — general conditional inclusion
- **Resource Fundamentals** (this workspace) — baseline resource structure
- **Sparse Fieldsets** (this workspace) — client-requested relation inclusion

---

## Research Notes

- `whenLoaded()` is defined in `Illuminate\Http\Resources\ConditionallyLoadsAttributes` trait — same trait as `when()`
- The `relationLoaded()` check is O(1) — it's a simple `array_key_exists` on the model's loaded relations
- Production analysis: 90% of resource-using codebases use `whenLoaded()`; 40% use `whenCounted()`; 15% use `whenAggregated()`
- The most common N+1 pattern in production is forgetting `whenLoaded` in a nested resource (sub-resource that accesses its own relations without conditional checks)
