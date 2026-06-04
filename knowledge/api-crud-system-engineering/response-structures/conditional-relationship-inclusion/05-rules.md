# conditional-relationship-inclusion Rules

## Rule 1: Always Wrap Relationship Serialization in `whenLoaded()`
---
## Category
Performance
---
## Rule
Always wrap every relationship field in a resource's `toArray()` with `whenLoaded()` to prevent lazy-loading during serialization.
---
## Reason
Accessing an unloaded relationship (`$this->relation`) inside `toArray()` triggers an N+1 database query. `whenLoaded()` checks the in-memory relations array (constant-time) and omits the field when the relation was not eager-loaded.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'profile' => new ProfileResource($this->profile), // N+1 if not loaded
    ];
}
```
---
## Good Example
```php
public function toArray($request)
{
    return [
        'profile' => new ProfileResource($this->whenLoaded('profile')),
    ];
}
```
---
## Exceptions
Required relationships that are always eager-loaded on every code path of the endpoint (document and enforce with `preventLazyLoading()` in development).
---
## Consequences Of Violation
N+1 queries during serialization multiply query count by items in the collection. A list of 100 users with an unguarded `$this->profile` generates 101 queries instead of 2.

## Rule 2: Use `whenCounted()` for Counts, Not `whenLoaded()`
---
## Category
Performance
---
## Rule
Always use `whenCounted()` for relationship count fields, never `whenLoaded()` combined with manual count calls.
---
## Reason
`whenCounted()` checks for the `{relation}_count` attribute loaded via `withCount()`. `whenLoaded('posts')` checks if the entire collection was loaded — loading all posts just to get a count wastes memory and query cost.
---
## Bad Example
```php
'posts_count' => $this->whenLoaded('posts')
    ? $this->posts->count()
    : null, // loads entire posts collection just for count
```
---
## Good Example
```php
'posts_count' => $this->whenCounted('posts'),
// Only checks for the aggregate attribute — no relation loading
```
---
## Exceptions
When you need both the count and the full relationship in the same response.
---
## Consequences Of Violation
Entire collections loaded into memory from the database just to count them. Memory usage spikes on endpoints with large has-many relationships.

## Rule 3: Prevent Lazy Loading in Development to Catch Missing Loads
---
## Category
Testing
---
## Rule
Always enable `Model::preventLazyLoading()` in all non-production environments to detect missing eager loads that `whenLoaded()` silently hides.
---
## Reason
`whenLoaded()` silently omits fields when a relation was not loaded — no error, no warning. Without lazy loading prevention, developers never discover that their resources are returning incomplete data.
---
## Bad Example
```php
// AppServiceProvider — no prevention
// Developer adds profile to resource toArray():
'profile' => new ProfileResource($this->whenLoaded('profile')),
// But controller never calls ->with('profile') — field always absent, no error
```
---
## Good Example
```php
// AppServiceProvider
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
// Developer immediately discovers missing ->with('profile') call
```
---
## Exceptions
Production environment where lazy loading may be intentional for performance-critical paths.
---
## Consequences Of Violation
Missing fields in production responses go unnoticed. Serialization silently omits data that clients depend on, causing difficult-to-debug UI issues.

## Rule 4: Gate Pivot Data with `whenLoaded()`
---
## Category
Reliability
---
## Rule
Always wrap pivot data (`$this->pivot`) inside `whenLoaded()` for the parent relationship in BelongsToMany serialization.
---
## Reason
`$this->pivot` is only available when the parent BelongsToMany relationship is loaded. Accessing it without a `whenLoaded()` guard triggers a lazy query or throws an error.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'roles' => $this->whenLoaded('roles', function () {
            return $this->roles->map(fn($role) => [
                'name' => $role->name,
                'expires_at' => $role->pivot->expires_at, // crashes if roles not loaded
            ]);
        }),
    ];
}
```
---
## Good Example
```php
public function toArray($request)
{
    return [
        'roles' => $this->whenLoaded('roles', function () {
            return $this->roles->map(fn($role) => [
                'name' => $role->name,
                'expires_at' => $this->whenLoaded('roles', fn() => $role->pivot->expires_at),
            ]);
        }),
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
`ErrorException: Trying to get property 'pivot' of non-object` when pivot data is accessed on an unloaded relation. Response crashes with 500 error.

## Rule 5: Never Nest `whenLoaded()` Inside Sub-Arrays Without Explicit Handling
---
## Category
Framework Usage
---
## Rule
Always pass `$this->whenLoaded('relation')` directly to a nested resource constructor rather than calling `whenLoaded()` inside a sub-array that isn't at the top level of `toArray()`.
---
## Reason
`Conditional` proxy objects only resolve at the top level of `toArray()`. Sub-arrays and nested structures evaluate conditionals eagerly, causing the `Conditional` object to be serialized as `{"condition": true, "value": ...}` or discarded.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'data' => [
            'profile' => $this->whenLoaded('profile')
                ? new ProfileResource($this->profile)
                : null, // Conditional outside top-level — not resolved
        ],
    ];
}
```
---
## Good Example
```php
public function toArray($request)
{
    return [
        'data' => [
            'profile' => $this->whenLoaded('profile')
                ? new ProfileResource($this->profile)
                : null, // Explicit ternary — not relying on Conditional proxy
        ],
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Serialized response contains unexpected `{"data": {"condition": true, "value": ...}}` structure instead of the intended fields. Response shape is broken for all clients.

## Rule 6: Document Relationship Loading Contracts Between Controller and Resource
---
## Category
Maintainability
---
## Rule
Always document which relationships each resource requires to be loaded for complete serialization, forming an explicit contract between the controller layer and the resource layer.
---
## Reason
`whenLoaded()` silently omits fields, making it invisible which relationships must be loaded for a complete response. Without documentation, future developers add new endpoints without loading required relationships, and fields silently disappear.
---
## Bad Example
```php
// No documentation — developer must read full toArray() to find all whenLoaded() calls
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
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
 * @resource UserResource
 * @requires-load profile, posts — these relations must be eager-loaded
 *            for the corresponding fields to appear in the response.
 */
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'profile' => new ProfileResource($this->whenLoaded('profile')),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
New controllers forget to load required relationships, fields silently disappear from production responses, and the inconsistency goes unnoticed until clients report missing data.

## Rule 7: Test Resource Serialization with Zero Relationships Loaded
---
## Category
Testing
---
## Rule
Always write at least one test that serializes the resource with no relationships loaded to verify graceful degradation.
---
## Reason
The most common failure mode for conditional relationship inclusion is a crash when no relations are loaded. Testing the null case (no loaded relations) ensures `whenLoaded()` guards are all correctly placed.
---
## Bad Example
```php
// Test always loads all relationships — never exercises the unloaded path
public function test_user_resource_returns_all_fields(): void
{
    $user = User::factory()->hasProfile()->hasPosts()->create();
    $response = (new UserResource($user))->response();

    $this->assertArrayHasKey('profile', $response);
}
```
---
## Good Example
```php
public function test_user_resource_graceful_without_loaded_relations(): void
{
    $user = User::factory()->create(); // no relations loaded
    $response = (new UserResource($user))->response();

    $this->assertArrayNotHasKey('profile', $response);
    $this->assertArrayNotHasKey('posts', $response);
}

public function test_user_resource_with_loaded_relations(): void
{
    $user = User::factory()->hasProfile()->create();
    $user->load('profile');
    $response = (new UserResource($user))->response();

    $this->assertArrayHasKey('profile', $response);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Production crash when a controller path omits an eager load that the developer assumed was always present. 500 error served to clients for an otherwise valid request.
