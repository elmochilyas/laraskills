# Phase 5: Rules — Policy Design for APIs

> Generated from 04-standardized-knowledge.md

## Always Use Policies for Authorization, Never Controllers
---
## Category
Code Organization
---
## Rule
Always place authorization logic in dedicated Policy classes and call `$this->authorize()` from controllers. Never place authorization logic directly in controller methods.
---
## Reason
Authorization logic duplicated across controllers inevitably drifts and becomes inconsistent. Policies centralize rules, making them testable, auditable, and reusable across multiple endpoints.
---
## Bad Example
```php
class PostController
{
    public function update(Request $request, Post $post)
    {
        if ($request->user()->id !== $post->user_id) {
            abort(403);
        }
        // ...
    }
}
```

---
## Good Example
```php
class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}

class PostController
{
    public function update(Request $request, Post $post)
    {
        $this->authorize('update', $post);
        // ...
    }
}
```

---
## Exceptions
Trivial CRUD where all authenticated users have identical access — policies still recommended for consistency.
---
## Consequences Of Violation
Duplicated authorization logic; inconsistent rules across endpoints; untestable permission checks.

---
## Implement Admin Override Pattern with Explicit Conditions
---
## Category
Design
---
## Rule
Always check for admin/super-admin status first in each policy method and return `true` explicitly — never use a catch-all `return true` without conditions.
---
## Reason
A catch-all `return true` in an admin check bypasses all authorization checks, potentially granting unintended access to future actions added to the policy.
---
## Bad Example
```php
public function update(User $user, Post $post): bool
{
    return true; // Grants update permission for everything, not just admin scenarios
}
```

---
## Good Example
```php
public function update(User $user, Post $post): bool
{
    if ($user->isAdmin()) {
        return true;
    }
    return $user->id === $post->user_id;
}
```

---
## Exceptions
No common exceptions. Always use explicit conditions for admin overrides.
---
## Consequences Of Violation
Unintended access when new policy methods are added; overly permissive admin access.

---
## Never Expose Denial Reasons in Production 403 Responses
---
## Category
Security
---
## Rule
Always return generic "Forbidden" messages in production 403 responses. Never include the specific reason for denial.
---
## Reason
Detailed denial messages leak information about resource existence, ownership structure, and authorization rules — information an attacker can use to refine their approach.
---
## Bad Example
```php
abort(403, 'You are not the owner of this post');
```

---
## Good Example
```php
abort(403, 'Forbidden');
```

---
## Exceptions
Development and staging environments where debugging information aids development.
---
## Consequences Of Violation
Information leakage enabling targeted attacks; resource enumeration via denial responses.

---
## Handle Null Users in Policy Methods
---
## Category
Reliability
---
## Rule
Always handle the possibility of `null` user in policy methods — check `Auth::check()` before accessing `$user` properties.
---
## Reason
Policy methods can receive `null` for unauthenticated requests. Accessing `$user->id` on null throws an unexpected error instead of returning a graceful 403.
---
## Bad Example
```php
public function view(User $user, Post $post): bool
{
    return $user->id === $post->user_id;
    // Fatal error if $user is null
}
```

---
## Good Example
```php
public function view(?User $user, Post $post): bool
{
    if (! $user) {
        return false;
    }
    return $user->id === $post->user_id;
}
```

---
## Exceptions
Routes that always require authentication (auth middleware applied before policy) — but defensive coding is still preferred.
---
## Consequences Of Violation
500 errors instead of 403 for unauthenticated requests on endpoints with permissive auth requirements.

---
## Use viewAny for Collection Access, Filter via Scopes
---
## Category
Performance
---
## Rule
Always use the `viewAny` policy method for collection/index endpoints and filter results via query scopes rather than checking `view` on every item.
---
## Reason
Checking `$this->authorize('view', $post)` in a loop over 100 posts executes 100 policy checks + 100 queries. A query scope filters at the database level, returning only authorized records.
---
## Bad Example
```php
$posts = Post::all()->filter(fn($post) => $user->can('view', $post));
// 100 policy checks + N+1 query risk
```

---
## Good Example
```php
class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can list
    }
}

// Controller
$posts = Post::where('user_id', $user->id)->paginate();
```

---
## Exceptions
Resources where authorization rules are too complex for query scopes — but optimize before resorting to per-item checks.
---
## Consequences Of Violation
N+1 authorization queries; slow collection endpoints; database load spikes.

---
## Register Policies Explicitly for Non-Standard Models
---
## Category
Maintainability
---
## Rule
Always use `Gate::policy()` in a service provider to register policies for models outside the `App\Models` namespace.
---
## Reason
Laravel's auto-discovery convention maps `App\Models\Post` to `App\Policies\PostPolicy`. Models in custom namespaces (`App\Domain\Billing\Models\Invoice`) are not auto-discovered, resulting in 403 errors for all actions.
---
## Bad Example
```php
// No explicit registration — InvoicePolicy never resolves
// App\Domain\Billing\Models\Invoice
```

---
## Good Example
```php
// AppServiceProvider or dedicated AuthServiceProvider
protected $policies = [
    Invoice::class => InvoicePolicy::class,
];
```

---
## Exceptions
Models in `App\Models` following Laravel's naming convention — auto-discovery works.
---
## Consequences Of Violation
All authorization on non-standard models returns 403; confusing debugging as policy exists but is never called.

---
## Always Test Owner, Non-Owner, Admin, and Guest Scenarios
---
## Category
Testing
---
## Rule
Always write policy tests covering at least four scenarios: owner access, non-owner denial, admin override, and guest (unauthenticated) handling.
---
## Reason
Policy bugs often manifest in edge cases: null user crashes, admin overrides not triggering, or accidental owner bypass. Explicit tests for each scenario prevent regression.
---
## Bad Example
```php
// Test only the happy path
public function test_user_can_update_own_post()
{
    // ...
}
```

---
## Good Example
```php
public function test_user_can_update_own_post() { /* owner: true */ }
public function test_user_cannot_update_others_post() { /* non-owner: false */ }
public function test_admin_can_update_any_post() { /* admin: true */ }
public function test_guest_cannot_update_post() { /* null user: 403 */ }
```

---
## Exceptions
No common exceptions. Policy edge cases are too subtle to skip.
---
## Consequences Of Violation
Undetected authorization bypass; production access control failures.

---
## Eager Load Policy Dependencies to Prevent N+1
---
## Category
Performance
---
## Rule
Always eager-load model relationships that are accessed inside policy methods.
---
## Reason
A policy method accessing `$post->team->owner_id` triggers a lazy-load query if `team` is not already loaded. In a collection endpoint with 100 posts, this adds 100 extra queries.
---
## Bad Example
```php
public function update(User $user, Post $post): bool
{
    return $post->team->owner_id === $user->id;
    // Lazy-loads 'team' — N+1 risk in collections
}
```

---
## Good Example
```php
// Controller
$posts = Post::with('team')->paginate();

// Policy
public function update(User $user, Post $post): bool
{
    return $post->team->owner_id === $user->id;
    // 'team' is already loaded
}
```

---
## Exceptions
Instance-level routes (show, update, delete) where only one model is loaded — overhead is minimal.
---
## Consequences Of Violation
N+1 query problem; slow endpoint responses under load; database connection pool exhaustion.

---
## Log Denied Authorization Attempts
---
## Category
Security
---
## Rule
Always log denied authorization attempts with user ID, resource type, action, and IP address.
---
## Reason
Repeated denied attempts indicate probing or brute-force access attempts. Without logging, these attacks go undetected and cannot be investigated.
---
## Bad Example
```php
abort(403);
// No logging — attack attempts invisible
```

---
## Good Example
```php
// In AppServiceProvider or via Gate::after
Gate::after(function (?User $user, string $ability, mixed $resource, bool $result) {
    if (! $result) {
        Log::warning('authorization.denied', [
            'user_id' => $user?->id,
            'ability' => $ability,
            'resource' => get_class($resource) . ':' . ($resource->getKey() ?? 'new'),
            'ip' => request()->ip(),
        ]);
    }
});
```

---
## Exceptions
Endpoints under active DDoS where log volume itself becomes a problem — sample instead of logging every denial.
---
## Consequences Of Violation
Blindness to authorization probing attacks; inability to investigate access violation incidents.

---
## Include restore and forceDelete for Soft-Delete Models
---
## Category
Maintainability
---
## Rule
Always implement `restore` and `forceDelete` policy methods for models using the `SoftDeletes` trait.
---
## Reason
Without explicit policy methods, `restore` and `forceDelete` default to `false`, silently blocking legitimate restore and permanent deletion operations.
---
## Bad Example
```php
class PostPolicy
{
    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
    // No restore or forceDelete — both always return false
}
```

---
## Good Example
```php
class PostPolicy
{
    public function delete(User $user, Post $post): bool { /* ... */ }
    
    public function restore(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
    
    public function forceDelete(User $user, Post $post): bool
    {
        return $user->isAdmin();
    }
}
```

---
## Exceptions
Models that do not use soft deletes.
---
## Consequences Of Violation
Restore and force-delete routes return 403; users cannot undo accidental deletes.
