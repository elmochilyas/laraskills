# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Blade Authorization Directives |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Blade authorization directives (`@can`, `@cannot`, `@canany`) provide conditional UI rendering based on authorization rules. They call the same Gate/Policy system used server-side but only control what is displayed — never prevent access. `@can('update', $post)` shows content if authorized. `@canany(['update', 'delete'], $post)` shows if any permission in the list is granted. `@cannot` is the inverse. These directives are presentation-only and MUST be paired with server-side `Gate::authorize()` or `$this->authorize()` in controllers.

---

## Core Concepts

- **`@can('ability', $model)`**: Shows content if the user has the specified ability for the optional model.
- **`@cannot('ability', $model)`**: Shows content if the user does NOT have the ability.
- **`@canany(['ability1', 'ability2'], $model)`**: Shows content if the user has ANY of the listed abilities.
- **`@else`**: Optional fallback for `@can`/`@canany` blocks.
- **`@endcan`**, **`@endcannot`**, **`@endcanany`**: Closing directives.
- **Server-Side Enforcement Required**: Blade directives are UX-only — they hide UI elements but do not prevent direct URL access. Server-side authorization (Gate/Policy) is mandatory.

---

## When To Use

- Showing/hiding UI elements based on permissions (edit buttons, delete links, admin menus)
- Conditional form display (show publish button only if user has permission)
- Filtering lists to show editable items

## When NOT To Use

- As a replacement for server-side authorization — Blade only hides UI, does not protect routes
- Complex authorization logic (use Blade components or PHP conditionals instead)
- For actions that should never be displayed to unauthorized users — still need server-side check

---

## Best Practices

- **Always Pair with Server-Side Checks**: `@can` in Blade + `$this->authorize()` in controller. Blade is UX-only.
- **Use Permission Names, Not Role Names**: `@can('edit-articles')`, not `@role('editor')`. Permission-centric.
- **Use `@canany` for Multiple Permissions**: Clearer than multiple `@if(Auth::user()->can(...))` conditions.
- **Avoid Complex Logic in Directives**: If the condition is more than a simple `@can`, extract to a Blade component or computed property.

---

## Architecture Guidelines

- `@can('update', $post)` → resolves `PostPolicy@update` or named gate
- Arguments match Gate::authorize() signature: ability name + model (if applicable)
- No additional database queries — reuses the same Gate/Policy resolution as server-side
- Can be used in layouts for menu display (link visibility based on permissions)

---

## Performance Considerations

- Directive resolution adds negligible overhead — same cached Gate/Policy system
- No additional database queries unless the Policy method performs them
- Multiple `@can` calls in a single view reuse the same resolved policies

---

## Security Considerations

- **Not a Security Measure**: Directives are presentation-only. They do NOT prevent a user from navigating to a URL directly or sending a cURL request.
- **Never Rely Solely on Blade Directives**: Any action behind a Blade directive must also be protected server-side.
- **Information Leakage**: Hiding UI elements does not prevent users from knowing the route exists. Server-side authorization still blocks the action.
- **Super-Admin Visibility**: `Gate::before()` super-admin bypass also affects Blade directives — super-admins see everything.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only using @can for security | Assuming @can prevents access | Direct URL access bypasses hidden UI controls | Always add `$this->authorize()` in controller |
| Using role names in @can | `@can('admin')` instead of permission | Role name changes break visibility | Use permission names |
| Complex PHP logic in Blade | `@if(Auth::user()->can('x') || Auth::user()->can('y'))` | Unreadable templates | Use `@canany(['x', 'y'])` |
| Forgetting model argument | `@can('update')` without model | Only checks gate-level ability, not model-specific | Include the model: `@can('update', $post)` |

---

## Anti-Patterns

- **`@if(Auth::check())` instead of `@can`**: Use `@can` for permission-based rendering, not auth-only checks
- **Using Blade directives to hide routes that still exist**: If the route is registered, it must have server-side authorization
- **Nesting multiple `@can` directives deeply**: Extracts to Blade components

---

## Examples

**Basic usage:**
```blade
@can('update', $post)
    <a href="{{ route('posts.edit', $post) }}">Edit Post</a>
@else
    <span>You cannot edit this post</span>
@endcan
```

**Multiple permissions:**
```blade
@canany(['edit-articles', 'delete-articles'])
    <div class="admin-actions">
        <button>Manage Articles</button>
    </div>
@endcanany
```

**Inverse check:**
```blade
@cannot('delete', $post)
    <p class="text-muted">This post cannot be deleted</p>
@endcannot
```

**With layout navigation:**
```blade
@can('view-dashboard')
    <li><a href="/dashboard">Dashboard</a></li>
@endcan
@can('manage-users')
    <li><a href="/users">User Management</a></li>
@endcan
```

---

## Related Topics

- Gates (closure-based authorization)
- Policies (model-centric authorization)
- Spatie laravel-permission (permission directives)
- Authorization middleware

---

## AI Agent Notes

- Blade directives are often mistaken for security. Verify that server-side authorization exists for every authenticated route.
- If a project uses `@can` without corresponding server-side `$this->authorize()`, flag as a security gap.
- Permission names in `@can` should match Gate/Policy names exactly.

---

## Verification

- [ ] Every `@can` in Blade has corresponding `$this->authorize()` or `Gate::authorize()` in the controller
- [ ] Directives use permission names, not role names
- [ ] `@canany` used for multiple permission checks (not chained `@if`)
- [ ] Model argument passed for model-specific checks: `@can('update', $post)`
- [ ] No complex authorization logic inside Blade directives
- [ ] Super-admin bypass also affects directive visibility (expected behavior)
- [ ] Navigation menus use `@can` for conditional route display
