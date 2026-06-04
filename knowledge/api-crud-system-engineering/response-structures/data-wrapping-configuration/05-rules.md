# data-wrapping-configuration Rules

## Rule 1: Declare `$wrap` as Public Static
---
## Category
Framework Usage
---
## Rule
Always declare the `$wrap` property as `public static` on resource classes, never as an instance property.
---
## Reason
Laravel resolves `$wrap` via static property access on the called class. An instance property (`public $wrap = 'data'`) is never read by `ResourceResponse` and silently falls back to the default, breaking wrapping behavior.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public $wrap = 'data'; // instance property — never read
}
```
---
## Good Example
```php
class UserResource extends JsonResource
{
    public static $wrap = 'data'; // static — correctly resolved
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Resource silently uses default wrapping, ignoring the intended key. Response shape does not match documented contract. Developers waste hours debugging.

## Rule 2: Use a Base Resource Class for Consistent Wrapping
---
## Category
Code Organization
---
## Rule
Always create a base resource class with `$wrap = 'data'` and extend it from all concrete resources, rather than declaring `$wrap` on each class individually.
---
## Reason
Laravel has no global wrapping configuration. Without a base class, every resource must independently declare `$wrap`, and a single omission creates an inconsistency. A base class enforces one source of truth.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public static $wrap = 'data';
}
class PostResource extends JsonResource
{
    // forgot $wrap — uses default, inconsistent with UserResource
}
```
---
## Good Example
```php
class BaseResource extends JsonResource
{
    public static $wrap = 'data';
}
class UserResource extends BaseResource {}
class PostResource extends BaseResource {}
// Both consistently wrap in 'data'
```
---
## Exceptions
Resources explicitly designed for bare-body APIs — use `withoutWrapping()` on those specific classes.
---
## Consequences Of Violation
Random inconsistency where some endpoints return `{data: {...}}` and others return `{...}` directly. Clients cannot write a single parsing path.

## Rule 3: Never Call `withoutWrapping()` Conditionally
---
## Category
Reliability
---
## Rule
Never call `withoutWrapping()` inside `toArray()` or based on request-time conditions.
---
## Reason
`withoutWrapping()` is a static configuration read during `toResponse()`. Calling it conditionally creates non-deterministic wrapping behavior where the same resource class wraps or doesn't wrap depending on request state.
---
## Bad Example
```php
public function toArray($request)
{
    if ($request->is('api/v2/*')) {
        UserResource::withoutWrapping(); // conditional — unpredictable
    }
    return ['id' => $this->id];
}
```
---
## Good Example
```php
// Version-specific resource classes with fixed wrapping
class UserResourceV1 extends BaseResource
{
    public static $wrap = 'data';
}
class UserResourceV2 extends BaseResource
{
    use WithoutWrapping; // or static::$wrap = null;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Same resource endpoint returns different wrapping shapes depending on request ordering, caching, or timing. Client integration tests pass intermittently.

## Rule 4: Configure Collection Wrapping Independently
---
## Category
Design
---
## Rule
Always call both `withoutWrapping()` and `withoutWrappingCollection()` when disabling wrapping, or verify that both single and collection responses have the same wrapping behavior.
---
## Reason
Single-resource wrapping and collection wrapping are configured independently. Disabling wrapping for single resources does not automatically disable it for collections, creating asymmetric response shapes.
---
## Bad Example
```php
UserResource::withoutWrapping();
return new UserResource($user);
// { "id": 1, "name": "Alice" }

UserResource::withoutWrapping(); // called above, but collection still wraps
return UserResource::collection($users);
// { "data": [ { "id": 1, "name": "Alice" } ] } — inconsistent
```
---
## Good Example
```php
UserResource::withoutWrapping();
UserResource::withoutWrappingCollection();
// Both single and collection are bare
return new UserResource($user);    // { "id": 1, "name": "Alice" }
return UserResource::collection($users); // [ { "id": 1, "name": "Alice" } ]
```
---
## Exceptions
Intentional asymmetry — e.g., collection wraps but single does not — must be documented and consistent across all endpoints.
---
## Consequences Of Violation
Clients parse collection responses differently from single-resource responses. Half the API surface is bare, half is wrapped.

## Rule 5: Never Override `$wrap` in Child Classes Without Explicit Intent
---
## Category
Reliability
---
## Rule
Always explicitly declare or confirm `$wrap` inheritance when creating child resource classes that extend a parent with wrapping configuration.
---
## Reason
Child classes inherit `$wrap` from their parent. Changing the parent's `$wrap` silently propagates to all children, potentially breaking their response contracts. Explicit declaration makes the intent clear.
---
## Bad Example
```php
class AdminUserResource extends UserResource
{
    // Inherits UserResource::$wrap — but what if UserResource changes?
    public function toArray($request) { ... }
}
```
---
## Good Example
```php
class AdminUserResource extends UserResource
{
    public static $wrap = 'data'; // explicitly declared — no ambiguity
    public function toArray($request) { ... }
}
```
---
## Exceptions
When the base class is the single source of truth and changed intentionally across all children.
---
## Consequences Of Violation
Refactoring a base resource's `$wrap` unexpectedly changes the response format of all child resources. Breaking change deployed silently.

## Rule 6: Test Wrapping Behavior Exhaustively in a Single Test
---
## Category
Testing
---
## Rule
Always write one comprehensive test that verifies all resources wrap (or don't wrap) according to the project convention.
---
## Reason
Wrapping configuration is a binary property — every resource either wraps or doesn't. A single test can iterate all resource classes and assert consistent behavior, catching regressions instantly.
---
## Bad Example
```php
// Tests only one resource wrapping — others may differ
public function test_user_resource_wraps_in_data(): void
{
    $response = (new UserResource(User::factory()->make()))->response();
    $this->assertArrayHasKey('data', $response);
}
```
---
## Good Example
```php
public function test_all_resources_wrap_consistently(): void
{
    $resources = [
        UserResource::class,
        PostResource::class,
        CommentResource::class,
    ];
    foreach ($resources as $resourceClass) {
        $this->assertEquals('data', $resourceClass::$wrap,
            "{$resourceClass} does not wrap consistently.");
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Developers add new resources without wrapping configuration. Inconsistency creeps into the API surface gradually. Clients discover broken endpoints in production rather than CI.
