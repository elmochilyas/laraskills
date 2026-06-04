# Authorization in Form Requests — Rules

## Always Return bool Explicitly in authorize()
---
## Category
Security | Maintainability
---
## Rule
Always return an explicit `true` or `false` from the `authorize()` method — never rely on implicit return.
---
## Reason
`authorize()` defaults to `false` if no return statement exists; forgetting a return silently denies every request to the endpoint.
---
## Bad Example
```php
public function authorize(): bool
{
    $this->user()->can('create', Post::class); // no return — always false
}
```
---
## Good Example
```php
public function authorize(): bool
{
    return $this->user()->can('create', Post::class);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
All requests to the endpoint return 403 Forbidden — the endpoint appears broken and the root cause is invisible because no error is thrown.

---

## Delegate to Policies, Not Manual Checks
---
## Category
Architecture | Maintainability
---
## Rule
Delegate authorization decisions to Laravel Policy classes via `$this->user()->can()` instead of writing manual ownership or role checks in `authorize()`.
---
## Reason
Policy classes are framework-integrated, testable in isolation, reusable across controllers, and auto-discovered — manual checks duplicate logic and fragment the authorization surface.
---
## Bad Example
```php
public function authorize(): bool
{
    $post = $this->route('post');
    return $post && $this->user()->id === $post->user_id; // Manual ownership check
}
```
---
## Good Example
```php
public function authorize(): bool
{
    $post = $this->route('post');
    return $post && $this->user()->can('update', $post);
}
```
---
## Exceptions
When a Policy class does not exist and the check is trivial (e.g., boolean field on user), you may use a simple inline condition — but promote to a Policy when reused.
---
## Consequences Of Violation
Authorization logic scattered across FormRequests, untestable in isolation, missed edge cases in role hierarchies, difficulty auditing permission rules.

---

## Ensure auth Middleware Runs Before FormRequest Resolution
---
## Category
Security | Reliability
---
## Rule
Apply the `auth` middleware to the route before the FormRequest resolves, ensuring `$this->user()` returns an authenticated user in `authorize()`.
---
## Reason
If `auth` middleware runs after the FormRequest, `$this->user()` returns `null` and `authorize()` cannot perform meaningful checks — the route silently returns 403 or errors.
---
## Bad Example
```php
// routes/api.php
Route::post('/posts', [PostController::class, 'store']); // No auth middleware
```
---
## Good Example
```php
// routes/api.php
Route::post('/posts', [PostController::class, 'store'])->middleware('auth:api');
```
---
## Exceptions
Public endpoints that skip authentication but still use a FormRequest must not define `authorize()` or must return `true` unconditionally after verifying the context does not require authentication.
---
## Consequences Of Violation
Null pointer exceptions in `authorize()`, all guarded endpoints returning 403, intermittent failures when middleware ordering changes.

---

## Use $this->user(), Not auth()->user()
---
## Category
Testing | Maintainability
---
## Rule
Always use `$this->user()` inside FormRequest methods instead of `auth()->user()` or `Auth::user()`.
---
## Reason
`$this->user()` uses the FormRequest's resolved authenticated user, which is mockable in tests via `$request->setUser()`. `auth()->user()` bypasses the request instance and cannot be easily mocked.
---
## Bad Example
```php
public function authorize(): bool
{
    return auth()->user()->can('create', Post::class);
}
```
---
## Good Example
```php
public function authorize(): bool
{
    return $this->user()->can('create', Post::class);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unit tests for authorization logic become brittle; mocking the auth facade is more complex; test setup diverges from production behavior.

---

## Override failedAuthorization() in Base ApiRequest
---
## Category
Architecture | Maintainability
---
## Rule
Override `failedAuthorization()` in the base `ApiRequest` class to return a consistent 403 JSON error envelope across all endpoints.
---
## Reason
The default `AuthorizationException` response varies by context (web vs API). A centralized override ensures every endpoint returns a uniform 403 shape without per-request duplication.
---
## Bad Example
```php
// In every FormRequest — duplicated
protected function failedAuthorization(): void
{
    throw new HttpResponseException(response()->json([
        'message' => 'Forbidden.'
    ], 403));
}
```
---
## Good Example
```php
// In App\Http\Requests\Api\ApiRequest — once
protected function failedAuthorization(): void
{
    throw new HttpResponseException(response()->json([
        'errors' => [['status' => '403', 'title' => 'Forbidden']]
    ], 403));
}
```
---
## Exceptions
Endpoints that require custom 403 response bodies (e.g., returning specific permission names) may override per-request, but the base class should handle the default.
---
## Consequences Of Violation
Inconsistent 403 response shapes across the API, increased boilerplate in every FormRequest, confusion for API consumers.

---

## Use $this->route('param') for Route Model Access
---
## Category
Framework Usage
---
## Rule
Use `$this->route('paramName')` inside `authorize()` to access route model binding results, not `$request->input('id')` or manual DB queries.
---
## Reason
Route model binding resolves the model before the FormRequest lifecycle; `$this->route('param')` retrieves the already-loaded model instance without an extra query.
---
## Bad Example
```php
public function authorize(): bool
{
    $post = Post::find($this->input('post_id')); // Extra query
    return $post && $this->user()->can('update', $post);
}
```
---
## Good Example
```php
public function authorize(): bool
{
    $post = $this->route('post'); // Route-model-bound instance
    return $post && $this->user()->can('update', $post);
}
```
---
## Exceptions
When the route parameter is a UUID or slug that must first be resolved to a model and route model binding is not configured — but prefer route model binding.
---
## Consequences Of Violation
Unnecessary duplicate database queries in every authorized request; bypassing route model binding's built-in 404 behavior.

---

## Never Distinguish 404 from 403 in Error Responses
---
## Category
Security
---
## Rule
Never reveal in the error response whether a resource was not found (404) or the user lacks permission (403) — return a generic 404 or 403 without differentiating.
---
## Reason
Distinguishing "resource exists but forbidden" from "resource doesn't exist" enables resource enumeration attacks by allowing attackers to probe for valid resource identifiers.
---
## Bad Example
```php
// Returns different messages
'Post not found.'       // 404 — resource doesn't exist
'You cannot view this post.'  // 403 — resource exists, no permission
```
---
## Good Example
```php
// Always return the same generic message
'Post not found.'  // Same for both missing and forbidden
```
---
## Exceptions
When the endpoint is internal/admin-only and enumeration is not a threat vector.
---
## Consequences Of Violation
Resource enumeration vulnerabilities, attackers mapping valid resource IDs, data leakage about resource existence.
