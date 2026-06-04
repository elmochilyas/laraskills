# Conditional Relationships — Engineering Rules

---

## Rule: Always Use whenLoaded for Every Relationship Access

---

## Category

Performance

---

## Rule

Every relationship access inside any resource's `toArray()` must be wrapped in `whenLoaded()`, unless that relationship is unconditionally and always eager-loaded in every controller that uses the resource.

---

## Reason

Accessing `$this->relation` without `whenLoaded()` triggers lazy loading — a separate SQL query per model instance. In a collection of 100 items accessing one unloaded relation, this produces 101 queries (the initial query plus 100 lazy loads). `whenLoaded()` returns `MissingValue` when the relation is not loaded, preventing N+1 queries entirely.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'posts' => PostResource::collection($this->posts),  // Lazy-loads for each item
    ];
}
```

---

## Good Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
    ];
}
// Controller must: User::with('posts')->get()
```

---

## Exceptions

Relationships that are always loaded on the model via `$with` property or always eager-loaded in every controller route. Even then, prefer `whenLoaded` for defense-in-depth.

---

## Consequences Of Violation

Performance risks from N+1 queries in every collection response; scalability risks as collection size grows; database load spikes on list endpoints.

---

## Rule: Document Required Eager Loads in the Resource Class

---

## Category

Maintainability

---

## Rule

Add a docblock to every resource class listing every relationship that must be eager-loaded before the resource can access it.

---

## Reason

Without documentation, the controller developer has no way to know which relationships a resource expects. The field silently disappears (via `whenLoaded`) when the eager load is forgotten, leading to debugging sessions that trace missing fields back to missing `with()` calls. Documentation makes the contract explicit.

---

## Bad Example

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'profile' => new ProfileResource($this->whenLoaded('profile')),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```

---

## Good Example

```php
/**
 * Requires eager loads: 'profile', 'posts'
 * For nested access: 'posts.comments'
 */
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'profile' => new ProfileResource($this->whenLoaded('profile')),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```

---

## Exceptions

Resources used in a single controller where the same developer maintains both the controller and the resource.

---

## Consequences Of Violation

Maintainability risks from undocumented contracts; debugging overhead when relationships are silently missing; onboarding friction for new team members.

---

## Rule: Controllers Must Eager-Load Every Relationship the Resource Uses

---

## Category

Architecture

---

## Rule

Every relationship that a resource accesses (even through `whenLoaded()`) must be eager-loaded at the controller level. The resource must never trigger a lazy load — it can only format data that the controller has already loaded.

---

## Reason

The controller controls response depth and database query volume. When the controller eager-loads, the resource merely formats. When the resource lazy-loads, the controller has no control over query count. This rule enforces that the controller is the single source of truth for data loading strategy.

---

## Bad Example

```php
// Controller — no eager loading
public function show(User $user): UserResource
{
    return new UserResource($user);
    // Resource's whenLoaded('posts') returns MissingValue
    // because posts were never eager-loaded
}
```

---

## Good Example

```php
// Controller
public function show(User $user): UserResource
{
    $user->load('posts');
    return new UserResource($user);
}

// Resource formats what was loaded
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
    ];
}
```

---

## Exceptions

Trivial relationships (always-loaded via model `$with` property) where the controller cannot "forget" to load them.

---

## Consequences Of Violation

Performance risks from N+1 queries; unreliable field presence (fields silently disappear when loading is forgotten); architectural confusion about who controls query strategy.

---

## Rule: Sub-Resources Must Independently Use whenLoaded

---

## Category

Architecture

---

## Rule

Every resource class must independently use `whenLoaded()` for its own relationship accesses, regardless of whether the parent resource has loaded the relationship.

---

## Reason

Nested resources do not inherit the parent's eager load state. A `PostResource` that accesses `$this->comments` must independently check whether `comments` was loaded, even if the parent `UserResource` had `posts.comments` eager-loaded. Without the check, the sub-resource triggers lazy loads when iterating over each post.

---

## Bad Example

```php
// PostResource — assumes comments are always loaded
class PostResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'title' => $this->title,
            'comments' => CommentResource::collection($this->comments),  // N+1 risk
        ];
    }
}

// Parent UserResource
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```

---

## Good Example

```php
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
// Controller must: User::with('posts.comments')->get()
```

---

## Exceptions

When a sub-resource only accesses attributes and never traverses its own relationships.

---

## Consequences Of Violation

Performance risks from nested N+1 queries (each sub-resource triggers separate queries); unpredictable response depth; database load multiplication per parent item.

---

## Rule: Pair whenCounted with withCount and whenAggregated with withAggregate

---

## Category

Framework Usage

---

## Rule

Every `whenCounted($relation)` call must have a corresponding `withCount($relation)` in the controller. Every `whenAggregated($relation, $function, $column)` must have a corresponding `withAggregate()` call in the controller.

---

## Reason

`whenCounted` and `whenAggregated` only check whether the aggregate attribute exists — they do not compute anything. If the controller has not called `withCount` or `withAggregate`, the field is silently omitted from the response without any error, creating a debugging trap where developers assume counts are computed but see empty responses.

---

## Bad Example

```php
// Controller
public function index(): UserCollection
{
    $users = User::paginate();
    // Missing: ->withCount('posts')
    return new UserCollection($users);
}

// Resource
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'posts_count' => $this->whenCounted('posts'),  // Always omitted — no error
    ];
}
```

---

## Good Example

```php
// Controller
public function index(): UserCollection
{
    $users = User::withCount('posts')->paginate();
    return new UserCollection($users);
}

// Resource
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'posts_count' => $this->whenCounted('posts'),
    ];
}
```

---

## Exceptions

No common exceptions. The controller and resource must always be paired for aggregates.

---

## Consequences Of Violation

Maintenance risks from silent field omission; debugging overhead tracing missing aggregates; unreliable API contracts where count fields appear only when the developer remembers the pairing.

---

## Rule: Test Both Loaded and Unloaded States

---

## Category

Testing

---

## Rule

For every conditional relationship (`whenLoaded`, `whenCounted`, `whenAggregated`), write test cases for both states: the relationship loaded (field present) and not loaded (field omitted).

---

## Reason

A conditional relationship that is always absent (because the controller never loads it) is functionally equivalent to a missing feature — clients expect the field under certain conditions. Without testing both paths, the relationship contract is undocumented and untested, leading to client crashes when fields disappear.

---

## Bad Example

```php
public function test_user_resource_includes_posts(): void
{
    $user = User::factory()->has(Post::factory()->count(3))->create();
    $user->load('posts');

    $response = (new UserResource($user))->response()->getData(true);

    $this->assertArrayHasKey('posts', $response['data']);
    // Never tests the "not loaded" case
}
```

---

## Good Example

```php
public function test_posts_included_when_loaded(): void
{
    $user = User::factory()->has(Post::factory()->count(3))->create();
    $user->load('posts');
    $response = (new UserResource($user))->response()->getData(true);
    $this->assertArrayHasKey('posts', $response['data']);
}

public function test_posts_omitted_when_not_loaded(): void
{
    $user = User::factory()->create();
    $response = (new UserResource($user))->response()->getData(true);
    $this->assertArrayNotHasKey('posts', $response['data']);
}
```

---

## Exceptions

No common exceptions. Every conditional relationship must be tested in both states.

---

## Consequences Of Violation

Reliability risks from untested field omission; client integration failures when relationships are conditionally missing; regressions when controller loading strategy changes.

---

## Rule: Use Explicit Aggregate Aliasing to Avoid Accessor Collisions

---

## Category

Design

---

## Rule

When using `whenCounted` or `whenAggregated`, use explicit aliases in the controller that do not collide with existing model accessors or attributes.

---

## Reason

If a model has a `posts_count` accessor and the controller uses `withCount('posts')`, the returned attribute `posts_count` may conflict with the accessor's computed value. Explicit aliasing (`withCount('posts as total_posts')`) prevents naming collisions and makes the aggregate source clear in the resource.

---

## Bad Example

```php
// Model has: public function getPostsCountAttribute() { ... }
// Controller uses default alias
$users = User::withCount('posts')->get();

// Resource — conflicting source
'posts_count' => $this->whenCounted('posts'),
// Does this come from withCount or the accessor? Unclear.
```

---

## Good Example

```php
// Controller
$users = User::withCount('posts as total_posts')->get();

// Resource
'total_posts' => $this->whenCounted('posts'),
```

---

## Exceptions

Models without any accessor that could collide with the default `_count` suffix.

---

## Consequences Of Violation

Maintenance risks from unclear data provenance; debugging overhead when aggregate values differ from accessor values; accidental double-counting or incorrect values in responses.

---

## Rule: Never Use whenLoaded as Error Handling for Forgotten Eager Loads

---

## Category

Reliability

---

## Rule

Do not rely on `whenLoaded()` to silently hide data when the developer forgets to eager-load. Write tests that catch missing eager loads instead of treating the silent omission as a safety net.

---

## Reason

When a relationship is not loaded, `whenLoaded()` silently returns `MissingValue` and the field disappears. While this prevents N+1 crashes, it also hides the developer error. The field is missing, the controller has no warning, and a client that depends on the field breaks silently. Tests must explicitly verify that the relationship field appears when expected.

---

## Bad Example

```php
// Controller forgets to load 'posts'
public function show(User $user): UserResource
{
    return new UserResource($user);
    // Resource silently omits 'posts' — no error, no warning
}
```

---

## Good Example

```php
// Controller
public function show(User $user): UserResource
{
    $user->load('posts');
    return new UserResource($user);
}

// Test catches missing loads
public function test_posts_field_present(): void
{
    $user = User::factory()->has(Post::factory()->count(3))->create();
    $user->load('posts');
    $response = (new UserResource($user))->response()->getData(true);
    $this->assertArrayHasKey('posts', $response['data']);
}
```

---

## Exceptions

No common exceptions. `whenLoaded` is a performance optimization, not an error recovery mechanism.

---

## Consequences Of Violation

Reliability risks from silent field disappearance; debugging overhead tracing missing relationship fields; client-facing regressions from broken contracts.
