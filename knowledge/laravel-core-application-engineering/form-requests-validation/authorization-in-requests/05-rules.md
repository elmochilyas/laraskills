# Authorization in Requests — Engineering Rules

---

## Rule 1: Keep authorize() Thin — Delegate to Policies and Gates

---

## Category

Architecture

---

## Rule

Implement `authorize()` as a single-line delegation to a Policy or Gate method. Do not write inline conditional logic, role checks, or complex access rules inside the method.

---

## Reason

Policies and Gates are the canonical location for authorization logic in Laravel. Inline logic in `authorize()` duplicates access rules, makes testing harder, and scatters authorization across request classes instead of centralizing it.

---

## Bad Example

```php
public function authorize(): bool
{
    if ($this->user()->role === 'admin') {
        return true;
    }
    if ($this->user()->id === $this->route('post')->user_id) {
        return true;
    }
    return false;
}
```

---

## Good Example

```php
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
}
```

---

## Exceptions

Trivial checks that do not warrant a separate Policy method (e.g., `return $this->user()->id === (int) $this->route('user')`) are acceptable only if no Policy exists for the resource.

---

## Consequences Of Violation

Maintenance risks: authorization logic duplicated across multiple FormRequests. Testing risks: authorization tests must mock request internals instead of testing Policy methods.

---

## Rule 2: Always Implement authorize() on Each FormRequest

---

## Category

Security

---

## Rule

Every FormRequest must explicitly implement `authorize()`. Do not rely on the default `true` return value for any request that processes user input.

---

## Reason

The default `authorize()` returns `true`, granting access to any authenticated user. Omitting `authorize()` on mutating actions (create, update, delete) silently bypasses access control. Explicit implementation forces intentional security decisions.

---

## Bad Example

```php
class UpdatePostRequest extends FormRequest
{
    // authorize() not implemented — defaults to true
    public function rules(): array
    {
        return ['title' => ['required', 'string']];
    }
}
```

---

## Good Example

```php
class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('post'));
    }

    public function rules(): array
    {
        return ['title' => ['required', 'string']];
    }
}
```

---

## Exceptions

Public endpoints (registration, password reset, contact forms) with no user-specific access control may omit `authorize()`. Document this decision explicitly in a comment.

---

## Consequences Of Violation

Security risks: unauthorized users can create, update, or delete resources. Compliance risks: missing access controls violate audit requirements.

---

## Rule 3: Do Not Put Business Logic or Database Queries in authorize()

---

## Category

Maintainability

---

## Rule

Do not write database queries, call external services, or implement business rules inside `authorize()`. Delegate all such logic to Policies, Gates, or domain services.

---

## Reason

`authorize()` fires on every request using the FormRequest. Business logic here creates coupling between HTTP-layer access control and domain rules. Policies provide proper separation, testability, and reusability.

---

## Bad Example

```php
public function authorize(): bool
{
    $subscription = Subscription::where('user_id', $this->user()->id)->first();
    $quota = Quota::where('team_id', $this->user()->team_id)->first();
    return $subscription->active && $quota->remaining > 0;
}
```

---

## Good Example

```php
public function authorize(): bool
{
    return $this->user()->can('create', Post::class)
        && $this->user()->can('createWithQuota', Post::class);
}
// Quota and subscription logic are in the PostPolicy
```

---

## Exceptions

Dependency injection in `authorize()` is acceptable for injecting lightweight services that delegate to Policies (e.g., `public function authorize(SubscriptionService $service): bool`).

---

## Consequences Of Violation

Maintenance risks: business rules scattered across request classes. Testing risks: authorization tests require database setup. Performance risks: unnecessary queries on every request.

---

## Rule 4: Return Response::deny() with a Message Instead of False

---

## Category

Design

---

## Rule

Return `Illuminate\Auth\Access\Response::deny('message')` instead of `false` when a user is not authorized. Provide a clear, user-facing reason for the denial.

---

## Reason

`false` produces a generic 403 response with no user-facing feedback. `Response::deny('reason')` allows the user to understand why their request was rejected and enables frontend code to display contextual error messages.

---

## Bad Example

```php
public function authorize(): bool
{
    if ($this->user()->cannot('update', $this->route('post'))) {
        return false; // Generic 403, no feedback
    }
    return true;
}
```

---

## Good Example

```php
public function authorize(): Response
{
    if ($this->user()->cannot('update', $this->route('post'))) {
        return Response::deny('You do not own this post.');
    }
    return Response::allow();
}
```

---

## Exceptions

For public API endpoints where the reason for denial must not be revealed (security through obscurity), returning `false` may be intentional.

---

## Consequences Of Violation

User experience risks: users receive no explanation for denied access. Debugging difficulty: developers cannot distinguish between different denial reasons.

---

## Rule 5: Override failedAuthorization() for Custom 403 Responses

---

## Category

Framework Usage

---

## Rule

Override `failedAuthorization()` in FormRequests that need custom 403 response formats, such as JSON error structures for API endpoints.

---

## Reason

The default `failedAuthorization()` throws `AuthorizationException`, which maps to a generic 403. API applications need consistent JSON error structures. Overriding this method ensures authorization failures match the application's error format.

---

## Bad Example

```php
// No override — API gets a generic 403 HTML or default JSON
// that doesn't match the app's error structure
```

---

## Good Example

```php
protected function failedAuthorization()
{
    throw new HttpResponseException(response()->json([
        'success' => false,
        'message' => 'You are not authorized to perform this action.',
    ], 403));
}
```

---

## Exceptions

Web applications using default redirect behavior do not need to override `failedAuthorization()`.

---

## Consequences Of Violation

User experience risks: inconsistent error response formats between validation errors and authorization errors.

---

## Rule 6: Route Model Binding Results Accessed via $this->route()

---

## Category

Framework Usage

---

## Rule

Access route model binding results in `authorize()` using `$this->route('paramName')` — not by resolving the model again from the database.

---

## Reason

Laravel's route model binding already resolves the model instance and binds it to the route parameter. Calling `Model::find()` again in `authorize()` executes an unnecessary second database query.

---

## Bad Example

```php
public function authorize(): bool
{
    $post = Post::findOrFail($this->input('post_id')); // Second query
    return $this->user()->can('update', $post);
}
```

---

## Good Example

```php
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('post'));
    // Uses the already-resolved model from route model binding
}
```

---

## Exceptions

When the route parameter name differs from the model variable name used in authorization, map it explicitly via the route key name.

---

## Consequences Of Violation

Performance risks: duplicate database queries on every request. Maintainability: fragile coupling between route parameter names and query logic.
