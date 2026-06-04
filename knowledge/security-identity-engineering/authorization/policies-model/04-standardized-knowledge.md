# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Policies (Model-Centric Authorization) |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Policies are classes that organize authorization logic around a specific Eloquent model. Each policy class corresponds to one model (e.g., `PostPolicy` for `Post`) and contains methods for standard CRUD actions (`viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`). Policies are auto-discovered by naming convention (appending `Policy` to the model name). They provide a clean, centralized location for all model-authorization logic and integrate with controllers via `authorizeResource()` and `$this->authorize()`.

---

## Core Concepts

- **Policy Class**: A class in `app/Policies/` with methods corresponding to model actions.
- **Auto-Discovery**: Laravel finds `PostPolicy` for `Post` by convention — no manual registration needed (since Laravel auto-discovers).
- **Policy Methods**: `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`. Each receives the authenticated user and optionally the model instance.
- **`$this->authorize()`**: Controller helper that resolves the policy and calls the method. `$this->authorize('update', $post)`.
- **`authorizeResource()`**: Registers `authorize()` calls for all resource controller methods auto-magically.
- **User Model Checks**: Policy methods can omit the user parameter if unauthenticated users need different behavior.

---

## When To Use

- Model-specific CRUD authorization (Post, Comment, User, Product)
- Any model with multiple authorization rules per action
- Resource controllers using `authorizeResource()`
- Standardizing authorization across team projects

## When NOT To Use

- Non-model actions (use Gates)
- Simple boolean checks that don't involve models
- Authorization logic shared across completely different models

---

## Best Practices

- **One Policy Per Model**: A policy should handle one model. If logic overlaps, use Gates or helper methods.
- **Use authorizeResource()**: In resource controllers, call `authorizeResource()` in the constructor to automatically authorize all actions.
- **Return False, Not Exception**: Policy methods return `true` (allowed) or `false` (denied). Laravel converts `false` to a 403 exception. Do not throw exceptions from policy methods.
- **Keep Logic Simple**: Policies should check permissions, not perform complex business logic. Delegate to services or actions.

---

## Architecture Guidelines

- Policies live in `app/Policies/{Model}Policy.php`
- Auto-discovery: Policy class name = Model name + `Policy` suffix
- For non-standard naming, register manually in `AuthServiceProvider::$policies`
- Policy receives the authenticated User as the first parameter; the model instance for model-aware methods (view, update, delete, restore, forceDelete)
- Create methods receive only the user (no model exists yet)

---

## Performance Considerations

- Policy resolution: cached after first use — negligible overhead
- Auto-discovery scans the `Policies` directory once per request, then caches
- Policy methods execute on every authorized action — keep them lightweight

---

## Security Considerations

- **Server-Side Enforcement**: Policies are server-side only. Always pair with Blade `@can` for UI, but never rely on Blade alone.
- **Model Not Found**: If a model is not found in route-model binding, the policy is not called — the 404 takes precedence.
- **Guest Users**: By default, unauthenticated users fail all policies. Override with `before()` to allow guest-specific behavior.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not using authorizeResource() | Manual $this->authorize() in each method | Some actions may miss authorization | Use authorizeResource() for resource controllers |
| Putting business logic in policies | Policies unchecked | Policy becomes complex and hard to test | Delegate business logic to services/actions |
| Forgetting restore/forceDelete methods | Only implementing CRUD | Soft-delete actions not authorized | Add restore/forceDelete for soft-deletable models |
| Not handling guest users | Assuming authenticated user | Error on unauthenticated requests | Check user null or implement `before()` |

---

## Anti-Patterns

- **One monolithic policy for all models**: Creates tight coupling and makes testing hard
- **Policy performing database queries beyond the model**: Delegate data retrieval to repository/service
- **Throwing custom exceptions from policies**: Return `false` and let Laravel handle the 403 response

---

## Examples

**Policy definition:**
```php
// app/Policies/PostPolicy.php
class PostPolicy
{
    public function viewAny(?User $user): bool
    {
        return true; // Anyone can view post list
    }

    public function view(?User $user, Post $post): bool
    {
        return $post->is_published || $user?->id === $post->user_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('post:create');
    }

    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->isAdmin();
    }
}
```

**Using authorizeResource():**
```php
// PostController
public function __construct()
{
    $this->authorizeResource(Post::class, 'post');
}
```

**Custom controller authorization:**
```php
public function publish(Post $post)
{
    $this->authorize('update', $post);
    $post->publish();
}
```

---

## Related Topics

- Gates (closure-based authorization)
- Policy auto-discovery
- Super-admin bypass (Gate::before())
- Blade authorization directives
- Authorization middleware

---

## AI Agent Notes

- Policies are the standard for model authorization in Laravel. Check `app/Policies/` directory for existing policies.
- Auto-discovery works by convention — if a policy is not being found, check naming convention or manual registration in `AuthServiceProvider`.
- The most common gap: `restore` and `forceDelete` methods missing for soft-deletable models.

---

## Verification

- [ ] Policy class exists for each model requiring authorization
- [ ] Policy methods cover all CRUD actions (viewAny, view, create, update, delete)
- [ ] `restore` and `forceDelete` implemented for soft-deletable models
- [ ] `authorizeResource()` used in resource controllers
- [ ] `$this->authorize()` called for non-resource actions
- [ ] Auto-discovery working (or manual registration in AuthServiceProvider)
- [ ] Guest users handled (nullable user parameter or `before()` method)
- [ ] Policy methods return boolean (not thrown exceptions)
