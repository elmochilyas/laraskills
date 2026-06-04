## Use Backed Enums for Route Parameters

Type-hint only backed enums (`enum Foo: string`) in route parameters. Do not use pure (non-backed) enums.

---

## Category

Framework Usage

---

## Rule

Route parameters that resolve to an enum value must use PHP backed enums (`: string` or `: int`). Pure enums without a backing type cannot be used for implicit binding.

---

## Reason

Laravel's implicit enum binding calls `tryFrom()` on the route segment value. `tryFrom()` is only available on backed enums. Pure enums throw a `BindingResolutionException` because the framework cannot resolve them from a string value.

---

## Bad Example

```php
enum PostStatus { case Draft; case Published; } // Pure enum

Route::get('/posts/{status}', function (PostStatus $status) {
    // BindingResolutionException — pure enum cannot be resolved
});
```

---

## Good Example

```php
enum PostStatus: string { case Draft = 'draft'; case Published = 'published'; }

Route::get('/posts/{status}', function (PostStatus $status) {
    return $status; // PostStatus::Draft for /posts/draft
});
```

---

## Exceptions

No common exceptions. Pure enums can be used in non-route contexts (domain logic, database casts) but never as route parameter type hints.

---

## Consequences Of Violation

Runtime `BindingResolutionException` when the route is matched; the application returns a 500 error instead of handling the invalid value gracefully.

---

## Reject Manual tryFrom() in Controllers

Do not write `Enum::tryFrom($value) ?? abort(404)` in controllers when the enum is a route parameter.

---

## Category

Code Organization

---

## Rule

When an enum value comes from a route parameter, type-hint the backed enum in the controller signature. Do not manually call `tryFrom()` and `abort()` in the controller body.

---

## Reason

Laravel's implicit enum binding already handles `tryFrom()` and returns a 404 when the value doesn't match any case. Manual resolution duplicates framework behavior and adds unnecessary boilerplate.

---

## Bad Example

```php
Route::get('/posts/{status}', [PostController::class, 'index']);

class PostController
{
    public function index(string $status)
    {
        $enum = PostStatus::tryFrom($status) ?? abort(404);
        // Manual resolution — framework would handle this automatically
    }
}
```

---

## Good Example

```php
Route::get('/posts/{status}', [PostController::class, 'index']);

class PostController
{
    public function index(PostStatus $status)
    {
        // $status is already PostStatus::Draft or 404 returned
    }
}
```

---

## Exceptions

When the enum value comes from a request body (JSON payload) or query parameter (not a route parameter), manual `tryFrom()` is appropriate because implicit binding only works for route parameters.

---

## Consequences Of Violation

Unnecessary boilerplate in every controller method; inconsistent error handling if some developers forget the `?? abort(404)` pattern.

---

## Apply Regex Constraints for Additional Validation

Combine enum binding with `->where()` regex constraints for early rejection of invalid formats.

---

## Category

Security

---

## Rule

When a route parameter backed by an enum could receive invalid format values, add a `->where()` constraint to reject obviously invalid values before the binding engine runs.

---

## Reason

Enum binding returns 404 for non-matching values, but the value is still parsed and matched. Regex constraints reject invalid formats at the routing level before the binding closure executes, providing defense in depth and clearer behavior.

---

## Bad Example

```php
Route::get('/posts/{status}', function (PostStatus $status) {
    // Works, but "INVALID_LONG_STRING_THAT_WILL_NEVER_MATCH"
    // still reaches the binding engine
});
```

---

## Good Example

```php
Route::get('/posts/{status}', function (PostStatus $status) {
    // ...
})->whereIn('status', ['draft', 'published', 'archived']);
```

---

## Exceptions

For enums with a small, static set of cases and no alias values, regex constraints may be redundant since `tryFrom()` already handles invalid values. Add constraints when the enum set is large or when invalid values should produce a different response than other 404 cases.

---

## Consequences Of Violation

No direct security risk, but slightly less precise error responses and marginal extra work in the binding engine for invalid values.

---

## Do Not Use Enum Binding as Authorization

A valid enum in a URL does not mean the user is authorized to access resources filtered by that value.

---

## Category

Security

---

## Rule

Always apply authorization checks (policies, gates, middleware) independently of enum binding. Do not rely on enum binding to restrict access to resources.

---

## Reason

Enum binding only validates that the URL segment matches a known enum case. It does not verify that the current user is permitted to access resources under that status, type, or category. Authorization is a separate concern.

---

## Bad Example

```php
Route::get('/admin/posts/{status}', function (PostStatus $status) {
    // Enum binding succeeded, but user may not be authorized
    // to view posts of certain statuses
    return Post::where('status', $status)->get();
});
```

---

## Good Example

```php
Route::get('/admin/posts/{status}', function (PostStatus $status) {
    $this->authorize('viewAny', Post::class);
    // Authorization check is separate from enum resolution
    return Post::where('status', $status)->get();
})->middleware('auth');
```

---

## Exceptions

No common exceptions. Authorization and enum binding are distinct concerns.

---

## Consequences Of Violation

Unauthorized access to resources filtered by enum value; data exposure if a user can access status-filtered endpoints they should not have access to.
