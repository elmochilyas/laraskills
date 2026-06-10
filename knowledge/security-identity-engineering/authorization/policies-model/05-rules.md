# Rules: Policies (Model-Centric Authorization)

## Create One Policy Per Model With Standard CRUD Methods
---
## Category
Architecture
---
## Rule
Create a dedicated Policy class for each Eloquent model. Implement standard methods: `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`.
---
## Reason
A single policy per model provides clear separation of concerns. Standard method names ensure consistency across the codebase and enable `authorizeResource()` to work automatically. Missing methods (e.g., `restore` for soft-deletable models) cause 403 errors when users attempt those actions.
---
## Bad Example
```php
// No policy — authorization logic spread across controllers
public function update(Request $request, Post $post) {
    if ($request->user()->id !== $post->user_id) { abort(403); }
}
```
---
## Good Example
```php
class PostPolicy {
    public function update(User $user, Post $post): bool {
        return $user->id === $post->user_id;
    }
    public function restore(User $user, Post $post): bool {
        return $user->isAdmin();
    }
}
```
---
## Exceptions
Models that are internal-only and require no authorization (e.g., log entries).
---
## Consequences Of Violation
Scattered authorization logic, missing soft-delete authorization.
---

## Use authorizeResource() in Resource Controllers
---
## Category
Framework Usage
---
## Rule
Call `$this->authorizeResource()` in the constructor of resource controllers to automatically authorize all standard CRUD actions.
---
## Reason
`authorizeResource()` automatically maps controller actions to policy methods (index→viewAny, show→view, create→create, store→create, edit→update, update→update, destroy→delete). This eliminates the risk of forgetting to authorize a specific action and centralizes authorization mapping.
---
## Bad Example
```php
// Manual authorize() in each method — easy to miss one
public function show(Post $post) { $this->authorize('view', $post); ... }
public function edit(Post $post) { $this->authorize('update', $post); ... }
// What about index? create? destroy?
```
---
## Good Example
```php
class PostController extends Controller {
    public function __construct() {
        $this->authorizeResource(Post::class, 'post');
    }
}
```
---
## Exceptions
Non-resource controllers that don't follow the standard CRUD pattern.
---
## Consequences Of Violation
Missing authorization on some actions, inconsistent protection.
---

## Return Boolean From Policy Methods, Do Not Throw Exceptions
---
## Category
Framework Usage
---
## Rule
Policy methods must return `true` (allowed) or `false` (denied). Never throw exceptions from within policy methods — let Laravel convert `false` to a 403 response.
---
## Reason
Laravel's authorization system expects boolean return values. Returning `false` automatically triggers a 403 `AuthorizationException`. Throwing custom exceptions from inside policies bypasses this mechanism, may produce inconsistent error responses, and makes testing harder.
---
## Bad Example
```php
public function update(User $user, Post $post): bool {
    if (!$post->isEditable()) {
        throw new \App\Exceptions\PostLockedException('Post is locked');
    }
    return $user->id === $post->user_id;
}
```
---
## Good Example
```php
public function update(User $user, Post $post): bool {
    return $user->id === $post->user_id && $post->isEditable();
}
```
---
## Exceptions
No common exceptions — policies should always return boolean.
---
## Consequences Of Violation
Inconsistent error handling, unexpected exception propagation.
---

## Keep Policy Logic Simple — Delegate Business Logic to Services
---
## Category
Code Organization
---
## Rule
Policies should only check authorization conditions. Delegate complex business logic, data retrieval, and validation to services or action classes.
---
## Reason
Policies execute on every authorized action. Complex business logic in policies makes them hard to test, slow, and violates single responsibility. Authorization questions (can user do X?) should be simple boolean checks, not multi-step processes.
---
## Bad Example
```php
public function publish(User $user, Post $post): bool {
    $subscription = $user->subscription;
    $usage = Usage::calculate($user, 'published_posts');
    $quota = $subscription->plan->quota('published_posts');
    return $usage < $quota && $post->isComplete(); // Business logic in policy
}
```
---
## Good Example
```php
public function publish(User $user, Post $post): bool {
    return $user->can('create-posts') && $post->isComplete();
}
// Quota checking in a service
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Slow, untestable policies; business logic mixed with authorization.
---

## Implement Guest-Safe Policies With Nullable User Parameter
---
## Category
Security
---
## Rule
Type-hint the user parameter as nullable (`?User $user`) in Policy methods that may be accessed by unauthenticated users. Return `false` for guests by default.
---
## Reason
By default, unauthenticated users fail all policies (return false). But `viewAny` or `view` may intentionally allow guest access (e.g., public post listing). A null check prevents errors when accessing user properties on guest requests.
---
## Bad Example
```php
public function viewAny(?User $user): bool {
    return $user->isAdmin(); // Error when guest — $user is null
}
```
---
## Good Example
```php
public function viewAny(?User $user): bool {
    return true; // Anyone can view post list
}
public function view(?User $user, Post $post): bool {
    return $post->is_published || ($user?->id === $post->user_id); // Null-safe
}
```
---
## Exceptions
Routes always behind `auth` middleware — user is guaranteed authenticated.
---
## Consequences Of Violation
500 errors for guest users on public endpoints.
---

## Include restore and forceDelete for Soft-Deletable Models
---
## Category
Architecture
---
## Rule
Always add `restore` and `forceDelete` methods to policies for models that use soft deletes.
---
## Reason
Soft-deletable models have two additional actions beyond standard CRUD. Without `restore` and `forceDelete` policy methods, `$this->authorize('restore', $post)` throws a 403 `AuthorizationException` because the method does not exist. The policy must explicitly authorize these actions.
---
## Bad Example
```php
class PostPolicy {
    public function delete(User $user, Post $post): bool { ... }
    // Missing restore and forceDelete — both always return false
}
```
---
## Good Example
```php
class PostPolicy {
    public function delete(User $user, Post $post): bool { ... }
    public function restore(User $user, Post $post): bool {
        return $user->isAdmin();
    }
    public function forceDelete(User $user, Post $post): bool {
        return $user->isSuperAdmin();
    }
}
```
---
## Exceptions
Models without soft deletes.
---
## Consequences Of Violation
Users cannot restore or force-delete, 403 errors on these actions.
---

## Enforce Policy at Every Protected Endpoint
---
## Category
Security
---
## Rule
Every non-public controller method must explicitly call `$this->authorize()`, `$request->user()->can()`, `Gate::authorize()`, or `authorizeResource()`. Creating and registering a Policy class does NOT automatically protect endpoints. Public routes (guest-accessible) are exempt.
---
## Reason
Policy classes define authorization logic but do not automatically execute it. A controller method with authentication middleware (`auth`) verifies identity but does not authorize specific actions. Without an explicit authorization call in every controller method, the Policy exists but has zero effect — routes are unprotected. This is a critical security gap that is invisible during code review because the Policy file exists and appears to provide protection.
---
## Bad Example
```php
class PostController extends Controller {
    public function __construct() {
        $this->middleware('auth');
    }
    public function destroy(Post $post): void {
        $post->delete(); // auth middleware passes but NO authorization check
    }
}
// PostPolicy exists and is registered, but destroy() never calls $this->authorize()
```
---
## Good Example
```php
class PostController extends Controller {
    public function __construct() {
        $this->middleware('auth');
        $this->authorizeResource(Post::class, 'post'); // OR:
    }
    public function destroy(Post $post): void {
        $this->authorize('delete', $post); // explicit enforcement
        $post->delete();
    }
}
```
---
## Exceptions
Public endpoints that intentionally allow guest access (no authentication or authorization needed).
---
## Consequences Of Violation
Routes appear protected (auth middleware + registered Policy) but have zero authorization — any authenticated user can perform any action.
