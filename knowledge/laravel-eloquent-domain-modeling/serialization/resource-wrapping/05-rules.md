# Resource Wrapping — Rules

## Rule 1: Decide on a Wrapping Strategy Early, Document It, and Never Change It Without Versioning
---
## Category
Architecture
---
## Rule
Choose your resource wrapping strategy (wrapped vs. flat) at project inception, document it in the API specification, and never change it within the same API version.
---
## Reason
Changing from wrapped to flat (or vice versa) is a breaking API change that silently breaks all existing consumers expecting a specific response structure.
---
## Bad Example
```php
// v1: No wrapping — flat responses
// v2 (same endpoint): Calls JsonResource::withoutWrapping() removed
// Response now wrapped — all consumers break
```
---
## Good Example
```php
// Document in API spec: "All responses use wrapped 'data' key for collections"
// V1: App\Http\Resources\V1 — wrapped
// V2: App\Http\Resources\V2 — flat (new version, new contract)
```
---
## Exceptions
Internal-only APIs where all consumers are controlled by the same team and can be updated simultaneously.
---
## Consequences Of Violation
Broken mobile apps, SPAs, and third-party integrations; emergency hotfixes to revert wrapping; lost consumer trust.

---

## Rule 2: Call `JsonResource::withoutWrapping()` in a Service Provider, Not Per-Resource
---
## Category
Code Organization
---
## Rule
If disabling wrapping, call `JsonResource::withoutWrapping()` exactly once in `AppServiceProvider::boot()` or a dedicated `ApiServiceProvider`.
---
## Reason
Calling `withoutWrapping()` per-resource or per-controller creates an inconsistent API where some endpoints are wrapped and others are not, depending on the code path.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        JsonResource::withoutWrapping(); // Called inside resource — inconsistent
        return [...];
    }
}
```
---
## Good Example
```php
// AppServiceProvider
public function boot(): void
{
    JsonResource::withoutWrapping();
}

// All resources now consistently unwrapped
```
---
## Exceptions
No common exceptions. The wrapping decision is application-wide, not per-resource.
---
## Consequences Of Violation
Inconsistent API response shapes across endpoints; some endpoints wrapped, others flat, depending on serialization order.

---

## Rule 3: Never Set Both `$wrap` and Also Return Manually Wrapped Data in `toArray()`
---
## Category
Reliability
---
## Rule
Do not combine the `$wrap` static property with manual wrapping (e.g., returning `['user' => [...]]` from `toArray()`). Use one or the other.
---
## Reason
Combining both causes double-wrapping — `$wrap` wraps the result in a key, but that result already contains the key, producing `{"user": {"user": {...}}}`.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public static $wrap = 'user';

    public function toArray(Request $request): array
    {
        return ['user' => ['id' => $this->id, 'name' => $this->name]];
        // Double-wrapped: { "user": { "user": { "id": 1, "name": "John" } } }
    }
}
```
---
## Good Example
```php
class UserResource extends JsonResource
{
    public static $wrap = 'user';

    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name];
        // Correct: { "user": { "id": 1, "name": "John" } }
    }
}
```
---
## Exceptions
No common exceptions. Choose the wrapping mechanism and use it exclusively.
---
## Consequences Of Violation
Deeply nested, confusing JSON responses; consumer parsing failures; months of production bugs before detection.

---

## Rule 4: Remember That `$wrap` Does Not Affect Collection Resources
---
## Category
Framework Usage
---
## Rule
Do not rely on the `$wrap` static property to change the collection wrapping key. Collections always use `data` as their wrapping key, controlled by `ResourceCollection`.
---
## Reason
`$wrap` only controls single-resource wrapping. Collection wrapping is hardcoded to `data` in `ResourceCollection::resolve()`. Expecting `$wrap` to affect collections creates inconsistency.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public static $wrap = 'user';
}

// Single: { "user": { "id": 1 } }
// Collection: { "data": [ { "id": 1 } ] }
// Inconsistent — consumer expects both to use 'user'
```
---
## Good Example
```php
// Accept the default:
// Single resource — no wrap
// Collection — "data" wrap
// Document this behavior in the API specification

// Or use withoutWrapping() globally for flat responses
JsonResource::withoutWrapping();
```
---
## Exceptions
No common exceptions. The behavior is a framework constraint, not configurable.
---
## Consequences Of Violation
Unexpected response structure where single and collection resources use different wrapping keys; consumer confusion and parsing errors.

---

## Rule 5: Test Wrapping Structure in Feature Tests for Both Single and Collection Responses
---
## Category
Testing
---
## Rule
Write feature tests that explicitly assert the top-level JSON keys of both single-resource and collection-resource responses.
---
## Reason
Wrapping behavior is silently changed by `withoutWrapping()` calls, `$wrap` modifications, or resource refactoring. Without tests, wrapping regressions go undetected.
---
## Bad Example
```php
public function test_show_user(): void
{
    $response = $this->getJson('/api/users/1');
    $response->assertOk();
    // No assertion about wrapping structure
}
```
---
## Good Example
```php
public function test_single_user_response_is_not_wrapped(): void
{
    $response = $this->getJson('/api/users/1');
    $response->assertJsonMissingPath('data');
    $response->assertJsonStructure(['id', 'name']);
}

public function test_user_collection_is_wrapped_in_data(): void
{
    $response = $this->getJson('/api/users');
    $response->assertJsonStructure(['data']);
    $response->assertJsonMissingPath('id'); // id should be inside data
}
```
---
## Exceptions
No common exceptions. Wrapping is a top-level contract that must be verified.
---
## Consequences Of Violation
Undetected wrapping changes breaking all consumers; emergency rollbacks; debugging sessions tracing structure changes.

---

## Rule 6: Never Modify `$wrap` at Runtime
---
## Category
Reliability
---
## Rule
Do not change the static `$wrap` property at runtime. It is shared across all requests and mutating it affects subsequent serializations globally.
---
## Reason
`$wrap` is a static property on `JsonResource`. Modifying it in one request (e.g., based on user role) changes the wrapping key for all concurrent requests, causing race conditions.
---
## Bad Example
```php
class UserController
{
    public function show(int $id): UserResource
    {
        if (request()->user()?->isAdmin()) {
            UserResource::$wrap = 'admin_user'; // Modifies static property — race condition!
        }
        return new UserResource(User::findOrFail($id));
    }
}
```
---
## Good Example
```php
// Use conditional logic in toArray instead
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $request->user()?->isAdmin()
            ? ['admin_user' => ['id' => $this->id, 'name' => $this->name]]
            : ['id' => $this->id, 'name' => $this->name];
    }
}
```
---
## Exceptions
No common exceptions. Static property mutation at runtime is unsafe by design.
---
## Consequences Of Violation
Intermittent wrapping key corruption; race condition bugs in production; impossible to reproduce locally.

---

## Rule 7: Use `withoutWrapping()` for SPAs That Expect Flat JSON Responses
---
## Category
Architecture
---
## Rule
For single-page applications and frontend frameworks (React, Vue, Alpine) that consume your API, call `JsonResource::withoutWrapping()` globally to return flat JSON.
---
## Reason
Most frontend frameworks expect flat responses. The `data` wrapping layer adds unnecessary nesting that complicates frontend data access patterns and state management.
---
## Bad Example
```php
// Frontend must always access: response.data.user.id
// Instead of: response.user.id
```
---
## Good Example
```php
// AppServiceProvider
public function boot(): void
{
    JsonResource::withoutWrapping();
}

// Frontend accesses: response.id
```
---
## Exceptions
APIs conforming to JSON:API or other specifications that mandate resource object wrapping.
---
## Consequences Of Violation
Frontend boilerplate to unwrap nested responses; state management complexity; developer frustration with deeply nested JSON.

---

## Rule 8: Handle the `data` Attribute Name Collision When Wrapping Collections
---
## Category
Design
---
## Rule
If a model has an attribute named `data`, avoid wrapping collections in the `data` key — rename the wrapping key by overriding the collection's `toArray()`, or rename the model attribute.
---
## Reason
Collection wrapping uses `data` as the key. If the model itself has a `data` attribute, the response produces `{"data": {"data": "value"}}` or ambiguous nesting.
---
## Bad Example
```php
class Configuration extends Model
{
    // Has a 'data' column containing JSON
}

// Collection response: { "data": [ { "data": "{...}", ... } ] }
// Ambiguous — is "data" the wrapping key or the attribute?
```
---
## Good Example
```php
class ConfigurationCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'configurations' => $this->collection,
            'meta' => [...],
        ];
    }
}

// Response: { "configurations": [ { "data": "{...}", ... } ] }
// Clear distinction between wrapping key and attribute
```
---
## Exceptions
Models without a `data` column (the vast majority).
---
## Consequences Of Violation
Ambiguous API responses; consumer confusion; parser ambiguity between wrapping key and attribute value.

---

## Rule 9: Align Wrapping Strategy with API Versioning
---
## Category
Architecture
---
## Rule
If changing the wrapping strategy between API versions, create entirely separate resource classes per version rather than conditionally wrapping in the same class.
---
## Reason
Conditional version-based wrapping inside `toArray()` creates the same maintainability problems as version-conditional data fields — unreadable, hard to deprecate, and prone to logic errors.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = ['id' => $this->id, 'name' => $this->name];
        return $request->version() >= 2 ? ['data' => $data] : $data;
    }
}
```
---
## Good Example
```php
// V1/UserResource — flat
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
}

// V2/UserResource — wrapped
class UserResource extends JsonResource
{
    public static $wrap = 'user';

    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
}
```
---
## Exceptions
No common exceptions. Version-specific classes are the standard pattern.
---
## Consequences Of Violation
Unmaintainable resource files with nested version conditions; difficult to remove old version wrapping behavior.
